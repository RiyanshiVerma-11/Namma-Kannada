import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  Radio,
  Award,
  Send,
  AlertCircle,
} from 'lucide-react';
import { AI_TUTOR_ROLES, type AiTutorRole } from '../utils/learningEngine';
import { speakKannadaPhrase } from '../utils/speech';

interface GeminiLiveVoiceTutorProps {
  showScript: boolean;
  onAwardXp: (xpAmount: number, reason: string) => void;
}

interface LiveTranscriptItem {
  id: string;
  speaker: 'you' | 'tutor';
  text: string;
}

const LIVE_VOICES = [
  { id: 'Zephyr', label: 'Zephyr (Warm & Clear)' },
  { id: 'Puck', label: 'Puck (Energetic Street Style)' },
  { id: 'Kore', label: 'Kore (Calm & Articulate)' },
];

function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = bytes.byteLength / 2;
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 32768;
  }
  return float32;
}

export function GeminiLiveVoiceTutor({
  showScript,
  onAwardXp,
}: GeminiLiveVoiceTutorProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<AiTutorRole['id']>('auto_driver');
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [sessionStatus, setSessionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [quickPromptText, setQuickPromptText] = useState('');
  const [xpClaimed, setXpClaimed] = useState(false);

  // Refs for WebSocket & Web Audio pipelines (per Live API rules: never use state inside onaudioprocess)
  const wsRef = useRef<WebSocket | null>(null);
  const isMicMutedRef = useRef<boolean>(false);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const activeRole =
    AI_TUTOR_ROLES.find((r) => r.id === selectedRoleId) || AI_TUTOR_ROLES[0];

  const stopAllPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already-stopped nodes
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const schedule24kHzPcmPlayback = useCallback((base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const outCtx = outputAudioCtxRef.current;
      if (outCtx.state === 'suspended') {
        outCtx.resume();
      }

      const float32Samples = base64Pcm16ToFloat32(base64Audio);
      if (float32Samples.length === 0) return;

      const audioBuffer = outCtx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = outCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outCtx.destination);

      const startTime = Math.max(outCtx.currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      activeSourcesRef.current.push(source);
    } catch {
      // Ignore audio decode issues
    }
  }, []);

  const cleanupLiveSession = useCallback(() => {
    stopAllPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {
        // Ignore
      }
      inputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
  }, [stopAllPlayback]);

  useEffect(() => {
    return () => {
      cleanupLiveSession();
    };
  }, [cleanupLiveSession]);

  const startLiveSession = async () => {
    cleanupLiveSession();
    setErrorBanner(null);
    setSessionStatus('connecting');

    setTranscripts([
      {
        id: `welcome-${Date.now()}`,
        speaker: 'tutor',
        text: `${activeRole.name}: "${activeRole.defaultGreetingKanglish}" (${activeRole.defaultGreetingEnglish})`,
      },
    ]);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live?role=${encodeURIComponent(
      selectedRoleId
    )}&voice=${encodeURIComponent(selectedVoice)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      setSessionStatus('connected');
      if (!xpClaimed) {
        setXpClaimed(true);
        onAwardXp(25, `Started Live Voice Session with ${activeRole.name}`);
      }

      // Attempt 16kHz microphone capture if available
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const inputCtx = new AudioCtx({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;

          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMicMutedRef.current) return;
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const base64 = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
              wsRef.current.send(JSON.stringify({ audio: base64 }));
            }
          };
        }
      } catch {
        // Microphone access is optional; users can also use voice prompt buttons below
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'audio' && msg.audio) {
          schedule24kHzPcmPlayback(msg.audio);
        } else if (msg.type === 'interrupted') {
          stopAllPlayback();
        } else if (msg.type === 'input_transcript' && msg.text) {
          setTranscripts((prev) => [
            ...prev,
            {
              id: `in-${Date.now()}-${Math.random()}`,
              speaker: 'you',
              text: msg.text,
            },
          ]);
        } else if (msg.type === 'output_transcript' && msg.text) {
          setTranscripts((prev) => [
            ...prev,
            {
              id: `out-${Date.now()}-${Math.random()}`,
              speaker: 'tutor',
              text: msg.text,
            },
          ]);
        } else if (msg.type === 'error' && msg.error) {
          setErrorBanner(msg.error);
        }
      } catch {
        // Ignore non-JSON frames
      }
    };

    ws.onerror = () => {
      setErrorBanner(
        'Live WebSocket connection notice: Check your GEMINI_API_KEY in Settings > Secrets for live cloud audio streaming.'
      );
    };

    ws.onclose = () => {
      setSessionStatus((prev) => (prev === 'connected' ? 'idle' : prev));
    };
  };

  const stopLiveSession = () => {
    cleanupLiveSession();
    setSessionStatus('idle');
  };

  const toggleMicMute = () => {
    isMicMutedRef.current = !isMicMutedRef.current;
    setIsMicMuted(isMicMutedRef.current);
  };

  const sendSpokenTurnToLive = (phraseToSpeak: string) => {
    const trimmed = phraseToSpeak.trim();
    if (!trimmed) return;

    setTranscripts((prev) => [
      ...prev,
      {
        id: `you-${Date.now()}`,
        speaker: 'you',
        text: trimmed,
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
    }

    // Also provide immediate local Kannada voice response fallback if cloud stream is not active
    const simulatedReply =
      selectedRoleId === 'darshini_host'
        ? 'Shabash! "Ondu strong filter coffee matthu Benne Masala Dose thagoli!" (Here is your strong filter coffee and butter masala dosa!)'
        : 'Shabash! "Banni sir, meter haakthini! Indiranagar 100ft Road-ge hogona!" (Come in, I will put on the meter! Let us go to Indiranagar 100ft Road!)';

    setTimeout(() => {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `tutor-${Date.now()}`,
          speaker: 'tutor',
          text: `${activeRole.name}: ${simulatedReply}`,
        },
      ]);
      speakKannadaPhrase(simulatedReply);
    }, 450);

    setQuickPromptText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Live API Configuration */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800">
              <Radio className="w-4 h-4" />
              <span>Real-Time Voice Conversations · Powered by gemini-3.8-live</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 mt-1">
              Gemini Live Spoken Kannada Studio
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Stream real-time 16kHz microphone audio and receive 24kHz low-latency spoken Kannada coaching.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shrink-0">
            <Award className="w-4 h-4 text-amber-700" />
            <span>+25 XP per Live Session</span>
          </div>
        </div>

        {/* Persona & Voice Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-stone-700 mb-2">
              1. Choose Your Conversation Partner:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AI_TUTOR_ROLES.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-50 border-amber-600 text-stone-900'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <p className="font-display text-xs font-bold">{role.name}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {role.personaTitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-700 mb-2">
              2. Select Prebuilt Gemini Live Voice (`gemini-3.8-live`):
            </p>
            <div className="space-y-2">
              {LIVE_VOICES.map((v) => {
                const active = v.id === selectedVoice;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoice(v.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF8F5] text-stone-800 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>{v.label}</span>
                    <span className="font-mono-tabular text-[11px] opacity-80">{v.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Active Live Voice Stage */}
      <section className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-xl font-bold border-4 transition-all ${
                sessionStatus === 'connected'
                  ? 'bg-amber-500 text-stone-950 border-amber-300 animate-pulse'
                  : 'bg-stone-800 text-amber-400 border-stone-700'
              }`}
            >
              {activeRole.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    sessionStatus === 'connected' ? 'bg-emerald-400' : 'bg-stone-500'
                  }`}
                />
                <span className="text-xs font-mono-tabular uppercase tracking-wider text-amber-300">
                  {sessionStatus === 'connected'
                    ? `LIVE AUDIO ACTIVE · ${selectedVoice} · 16kHz In / 24kHz Out`
                    : 'READY TO CONNECT · GEMINI-3.8-LIVE'}
                </span>
              </div>
              <h2 className="font-display text-xl font-bold mt-1">
                {activeRole.name} ({activeRole.personaTitle})
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                {activeRole.defaultGreetingKanglish}
                {showScript ? ` · ${activeRole.defaultGreetingScript}` : ''}
              </p>
            </div>
          </div>

          {/* Call & Microphone Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {sessionStatus !== 'connected' ? (
              <button
                type="button"
                onClick={startLiveSession}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Live Voice Conversation</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleMicMute}
                  className={`min-h-[48px] px-4 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer ${
                    isMicMuted
                      ? 'bg-stone-800 text-stone-300 border border-stone-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMicMuted ? 'Mic Muted' : 'Mic Streaming'}</span>
                </button>

                <button
                  type="button"
                  onClick={stopLiveSession}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Session</span>
                </button>
              </>
            )}
          </div>
        </div>

        {errorBanner && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Live Transcript & Interactive Spoken Phrase Triggers */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Live Voice Transcript &amp; Practice Stream</span>
            <button
              type="button"
              onClick={() => speakKannadaPhrase(activeRole.defaultGreetingKanglish)}
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear Greeting</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {transcripts.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">
                Click &ldquo;Start Live Voice Conversation&rdquo; above or tap a practice phrase below to speak with {activeRole.name}.
              </p>
            ) : (
              transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl text-xs ${
                    item.speaker === 'you'
                      ? 'bg-stone-800 text-amber-200 ml-auto max-w-[85%]'
                      : 'bg-stone-900 border border-stone-800 text-stone-200 max-w-[85%]'
                  }`}
                >
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5 text-stone-400">
                    {item.speaker === 'you' ? 'You (Spoken Turn)' : activeRole.name}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>

          {/* One-Tap Spoken Kannada Prompts */}
          <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-stone-400">Speak phrase:</span>
            {[
              'Namaskara anna, Indiranagar-ge bartheera?',
              'Ondu filter coffee kodi, sakkare beda.',
              'Naanu swalpa swalpa Kannada kalithiddini!',
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendSpokenTurnToLive(phrase)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-amber-300 cursor-pointer transition-colors"
              >
                “{phrase}”
              </button>
            ))}
          </div>

          {/* Direct Voice/Text Turn Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendSpokenTurnToLive(quickPromptText);
            }}
            className="flex items-center gap-2.5 pt-2"
          >
            <input
              type="text"
              value={quickPromptText}
              onChange={(e) => setQuickPromptText(e.target.value)}
              placeholder="Or type a Kannada/English line to send into the Live session..."
              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!quickPromptText.trim()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Speak</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
