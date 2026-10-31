import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Award,
  Zap,
  Brain,
  Cpu,
} from 'lucide-react';
import { AI_TUTOR_ROLES, type AiTutorRole } from '../utils/learningEngine';
import { speakKannadaPhrase } from '../utils/speech';

export type GeminiChatModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-4-argon';

interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelBadge?: string;
}

interface GeminiChatTutorProps {
  showScript: boolean;
  onAwardXp: (xpAmount: number, reason: string) => void;
}

const MODEL_OPTIONS: {
  id: GeminiChatModelId;
  label: string;
  subtitle: string;
  icon: typeof Zap;
}[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    subtitle: 'Balanced Everyday Kannada Tutor (Default)',
    icon: Sparkles,
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    subtitle: 'Fast Instant Phrase Translations & Drills',
    icon: Zap,
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    subtitle: 'Complex Grammar, Suffixes & Deep Nuance',
    icon: Brain,
  },
];

const QUICK_PROMPTS_BY_ROLE: Record<AiTutorRole['id'], string[]> = {
  auto_driver: [
    'How do I ask an auto driver to go to Cubbon Park by meter?',
    'Anna, Indiranagar-ge bartheera? Meter haaki.',
    'What does "Munde left thagoli, alli nilisi" mean?',
  ],
  darshini_host: [
    'How do I order one Masala Dosa and a filter coffee without sugar?',
    'Anna, ondu strong by-two coffee kodi!',
    'How do I ask for the bill and pay by UPI in Kannada?',
  ],
  grammar_guru: [
    'Explain the difference between -ge, -alli, and -inda suffixes.',
    'Why do people add -ri or -avare at the end of Kannada words?',
    'Break down "Naanu swalpa swalpa Kannada kalithiddini" word by word.',
  ],
  office_colleague: [
    'How do I greet my Bengaluru teammates at lunch ("Oota aaytha")?',
    'How do I tell my landlord that the water supply has not come today?',
    'Teach me 3 friendly Kannada phrases to break the ice at work.',
  ],
};

export function GeminiChatTutor({ showScript, onAwardXp }: GeminiChatTutorProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<AiTutorRole['id']>('auto_driver');
  const [selectedModel, setSelectedModel] = useState<GeminiChatModelId>('gemini-3.8-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [xpAwardedCount, setXpAwardedCount] = useState(0);

  const activeRole =
    AI_TUTOR_ROLES.find((r) => r.id === selectedRoleId) || AI_TUTOR_ROLES[0];

  const createInitialTurn = (role: AiTutorRole): ChatTurn => ({
    id: `init-${role.id}`,
    role: 'model',
    text: `${role.defaultGreetingKanglish}${
      showScript ? `\n(${role.defaultGreetingScript})` : ''
    }\n\nMeaning: "${role.defaultGreetingEnglish}"`,
    timestamp: 'Just now',
    modelBadge: selectedModel,
  });

  const [messages, setMessages] = useState<ChatTurn[]>(() => [
    createInitialTurn(AI_TUTOR_ROLES[0]),
  ]);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isSending]);

  const handleSelectRole = (role: AiTutorRole) => {
    setSelectedRoleId(role.id);
    setApiNotice(null);
    setMessages([createInitialTurn(role)]);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? inputMessage).trim();
    if (!prompt || isSending) return;

    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userTurn];
    setMessages(updatedHistory);
    if (!textOverride) {
      setInputMessage('');
    }
    setIsSending(true);
    setApiNotice(null);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          model: selectedModel,
          roleId: selectedRoleId,
          history: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        'Namaskara! Try saying: "Naanu Kannada kalithiddini" (I am learning Kannada).';

      if (data.apiNotice) {
        setApiNotice(data.apiNotice);
      }

      const modelTurn: ChatTurn = {
        id: `mdl-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelBadge: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, modelTurn]);

      // Award +15 XP on the user's first two interactive practice turns per session
      if (xpAwardedCount < 2) {
        setXpAwardedCount((c) => c + 1);
        onAwardXp(15, `Practiced Kannada with ${activeRole.name}`);
      }
    } catch {
      const fallbackTurn: ChatTurn = {
        id: `mdl-${Date.now()}`,
        role: 'model',
        text: `Namaskara! "${activeRole.defaultGreetingKanglish}" — Try asking me how to negotiate auto fares or order filter coffee in Kannada!`,
        timestamp: 'Just now',
        modelBadge: selectedModel,
      };
      setMessages((prev) => [...prev, fallbackTurn]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Model Selector Card */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800">
              <Cpu className="w-4 h-4" />
              <span>Multi-Turn Gemini Kannada Coach · Role-Based System Instructions</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 mt-1">
              AI Kannada Conversation &amp; Grammar Chatbot
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Choose a local Bengaluru persona and switch between fast, general, or deep-reasoning Gemini models.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shrink-0">
            <Award className="w-4 h-4 text-amber-700" />
            <span>+15 XP per practice turn</span>
          </div>
        </div>

        {/* 3-Tier Gemini Model Selector */}
        <div>
          <p className="text-xs font-semibold text-stone-700 mb-2">
            Select Gemini Engine for Your Task:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Select Gemini Model">
            {MODEL_OPTIONS.map((m) => {
              const Icon = m.icon;
              const active = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-[#FAF8F5] text-stone-800 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-amber-700'}`} />
                      <span>{m.label}</span>
                    </span>
                    <span
                      className={`font-mono-tabular text-[10px] ${
                        active ? 'text-amber-300' : 'text-stone-500'
                      }`}
                    >
                      {m.id}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${active ? 'text-stone-300' : 'text-stone-600'}`}>
                    {m.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Persona System Instruction Selector */}
        <div>
          <p className="text-xs font-semibold text-stone-700 mb-2">
            Select Chatbot Role &amp; System Instruction Persona:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AI_TUTOR_ROLES.map((role) => {
              const selected = role.id === selectedRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-amber-50 border-amber-600 text-stone-900'
                      : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <p className="font-display text-xs font-bold text-stone-900">{role.name}</p>
                  <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                    {role.personaTitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scrollable Multi-Turn Conversation Thread */}
      <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Active Persona Top Bar */}
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-700 text-white font-display text-xs font-bold flex items-center justify-center shrink-0">
              {activeRole.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">
                {activeRole.name} · <span className="font-normal text-stone-600">{activeRole.personaTitle}</span>
              </p>
              <p className="text-[11px] text-stone-500 font-mono-tabular">
                Active Model: {selectedModel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMessages([createInitialTurn(activeRole)])}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Thread</span>
          </button>
        </div>

        {/* Scrollable Messages */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
          aria-live="polite"
        >
          {messages.map((turn) => {
            const isUser = turn.role === 'user';
            return (
              <div
                key={turn.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-br-xs'
                      : 'bg-[#FAF8F5] border border-stone-200 text-stone-900 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{turn.text}</div>

                  <div
                    className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-3 text-[11px] ${
                      isUser ? 'border-stone-700 text-stone-400' : 'border-stone-200/80 text-stone-500'
                    }`}
                  >
                    <span>
                      {turn.timestamp}
                      {turn.modelBadge ? ` · ${turn.modelBadge}` : ''}
                    </span>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakKannadaPhrase(turn.text.slice(0, 140))}
                        className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-stone-500 pl-2">
              <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
              <span>{activeRole.name} is composing a Kannada response ({selectedModel})...</span>
            </div>
          )}

          {apiNotice && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              {apiNotice}
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Quick Starter Prompts */}
        <div className="px-5 py-2.5 bg-[#FAF8F5] border-t border-stone-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-stone-500 shrink-0">Try asking:</span>
          {QUICK_PROMPTS_BY_ROLE[selectedRoleId].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSendMessage(q)}
              disabled={isSending}
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-600 text-xs text-stone-700 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-white border-t border-stone-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${activeRole.name} in English or Kanglish...`}
            className="flex-1 min-h-[44px] px-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
          />
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
