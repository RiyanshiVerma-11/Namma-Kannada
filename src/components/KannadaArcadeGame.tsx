import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ARCADE_CHALLENGE_WAVES,
  scoreArcadeGateHit,
  type ArcadeWaveChallenge,
} from '../utils/learningEngine';
import { speakKannadaPhrase } from '../utils/speech';

interface KannadaArcadeGameProps {
  showScript: boolean;
  onCompleteGame: (xpEarned: number, finalScore: number) => void;
  onExitGame: () => void;
}

type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

interface PhraseGate {
  lane: 0 | 1 | 2;
  y: number;
  text: string;
  scriptText?: string;
  isCorrect: boolean;
  resolved: boolean;
}

interface RoadHazard {
  lane: 0 | 1 | 2;
  y: number;
  windupTimer: number;
  resolved: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function KannadaArcadeGame({
  showScript,
  onCompleteGame,
  onExitGame,
}: KannadaArcadeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React state only for low-frequency HUD & overlay modals (never re-mounts canvas)
  const [gameState, setGameState] = useState<GameState>('title');
  const [hudScore, setHudScore] = useState(0);
  const [hudCombo, setHudCombo] = useState(0);
  const [hudHull, setHudHull] = useState(3);
  const [hudWaveIdx, setHudWaveIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    text: string;
    isPositive: boolean;
  } | null>(null);

  const gameStateRef = useRef<GameState>('title');
  const isMutedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Mutable simulation state inside ref for 60fps loop
  const simRef = useRef({
    score: 0,
    combo: 0,
    hull: 3,
    waveIndex: 0,
    playerLane: 1 as 0 | 1 | 2,
    playerVisualX: 0,
    squashX: 1,
    squashY: 1,
    boostTimer: 0,
    hitstopTimer: 0,
    shakeMagnitude: 0,
    hitFlashAlpha: 0,
    roadScrollY: 0,
    spawnTimer: 0,
    hazardTimer: 2.2,
    gates: [] as PhraseGate[],
    hazards: [] as RoadHazard[],
    particles: [] as Particle[],
    heldKeys: new Set<string>(),
    justPressedKeys: new Set<string>(),
  });

  // Procedural Web Audio Synthesizer for game feel
  const playSynthSound = useCallback(
    (type: 'correct' | 'hit' | 'lane' | 'boost' | 'victory') => {
      if (isMutedRef.current) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;

        if (type === 'lane') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(390, now + 0.065);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === 'boost') {
          // Auto horn double-beep
          [0, 0.09].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now + offset);
            osc.frequency.setValueAtTime(510, now + offset + 0.03);
            gain.gain.setValueAtTime(0.07, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.075);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.08);
          });
        } else if (type === 'correct') {
          // Warm Mysore-gold triad arpeggio
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.055);
            gain.gain.setValueAtTime(0.12, now + idx * 0.055);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.055);
            osc.stop(now + idx * 0.055 + 0.24);
          });
        } else if (type === 'hit') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'victory') {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.36);
          });
        }
      } catch {
        // Ignore audio errors if blocked by browser autoplay policy
      }
    },
    []
  );

  const spawnWaveGates = useCallback((waveIdx: number) => {
    const wave: ArcadeWaveChallenge =
      ARCADE_CHALLENGE_WAVES[waveIdx % ARCADE_CHALLENGE_WAVES.length];
    // Deterministic or varied lane placement per wave
    const correctLane = (waveIdx % 3) as 0 | 1 | 2;
    const otherLanes = ([0, 1, 2] as (0 | 1 | 2)[]).filter((l) => l !== correctLane);

    simRef.current.gates = [
      {
        lane: correctLane,
        y: -140,
        text: wave.correctKanglish,
        scriptText: wave.correctScript,
        isCorrect: true,
        resolved: false,
      },
      {
        lane: otherLanes[0],
        y: -140,
        text: wave.decoyLeft,
        isCorrect: false,
        resolved: false,
      },
      {
        lane: otherLanes[1],
        y: -140,
        text: wave.decoyRight,
        isCorrect: false,
        resolved: false,
      },
    ];
  }, []);

  const startNewRun = useCallback(() => {
    simRef.current = {
      score: 0,
      combo: 0,
      hull: 3,
      waveIndex: 0,
      playerLane: 1,
      playerVisualX: 0,
      squashX: 1,
      squashY: 1,
      boostTimer: 0,
      hitstopTimer: 0,
      shakeMagnitude: 0,
      hitFlashAlpha: 0,
      roadScrollY: 0,
      spawnTimer: 0,
      hazardTimer: 1.8,
      gates: [],
      hazards: [],
      particles: [],
      heldKeys: new Set<string>(),
      justPressedKeys: new Set<string>(),
    };
    spawnWaveGates(0);
    setHudScore(0);
    setHudCombo(0);
    setHudHull(3);
    setHudWaveIdx(0);
    setLastFeedback({
      text: 'Steer into the matching Kannada phrase gate!',
      isPositive: true,
    });
    gameStateRef.current = 'playing';
    setGameState('playing');
    playSynthSound('boost');
  }, [playSynthSound, spawnWaveGates]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused';
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      gameStateRef.current = 'playing';
      setGameState('playing');
    }
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  }, []);

  const switchLaneByDelta = useCallback(
    (delta: -1 | 1) => {
      if (gameStateRef.current !== 'playing') return;
      const next = Math.max(0, Math.min(2, simRef.current.playerLane + delta)) as 0 | 1 | 2;
      if (next !== simRef.current.playerLane) {
        simRef.current.playerLane = next;
        simRef.current.squashX = 1.18;
        simRef.current.squashY = 0.86;
        playSynthSound('lane');
      }
    },
    [playSynthSound]
  );

  const triggerHornBoost = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    simRef.current.boostTimer = 0.45;
    simRef.current.squashX = 0.88;
    simRef.current.squashY = 1.22;
    playSynthSound('boost');
  }, [playSynthSound]);

  // Keyboard & Blur Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (!simRef.current.heldKeys.has(code)) {
        simRef.current.justPressedKeys.add(code);
      }
      simRef.current.heldKeys.add(code);

      if (code === 'KeyM') {
        e.preventDefault();
        toggleMute();
        return;
      }

      if (gameStateRef.current === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startNewRun();
        }
        return;
      }

      if (code === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (gameStateRef.current === 'playing') {
        if (code === 'ArrowLeft' || code === 'KeyA') {
          e.preventDefault();
          switchLaneByDelta(-1);
        } else if (code === 'ArrowRight' || code === 'KeyD') {
          e.preventDefault();
          switchLaneByDelta(1);
        } else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
          e.preventDefault();
          triggerHornBoost();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      simRef.current.heldKeys.delete(e.code);
    };

    const handleBlur = () => {
      simRef.current.heldKeys.clear();
      simRef.current.justPressedKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [startNewRun, switchLaneByDelta, toggleMute, togglePause, triggerHornBoost]);

  // Main 60fps Canvas Loop (isolated from React re-renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 90 + Math.random() * 190;
        simRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.25,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    };

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      // Clamp frame delta time to prevent spiral of death on tab switch
      const dt = Math.min(rawDt, 0.05);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const sim = simRef.current;

      // Road geometry (centered 3-lane Bengaluru boulevard)
      const roadWidth = Math.min(680, Math.max(330, width * 0.62));
      const roadLeft = (width - roadWidth) / 2;
      const laneWidth = roadWidth / 3;
      const getLaneCenterX = (lane: 0 | 1 | 2) => roadLeft + laneWidth * (lane + 0.5);
      const playerY = height - 145;

      if (sim.playerVisualX === 0) {
        sim.playerVisualX = getLaneCenterX(sim.playerLane);
      }

      // Hitstop freeze handling
      let simDt = dt;
      if (sim.hitstopTimer > 0) {
        sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
        simDt = 0;
      }

      // Update camera shake & hit flash
      if (sim.shakeMagnitude > 0) {
        sim.shakeMagnitude = Math.max(0, sim.shakeMagnitude - dt * 28);
      }
      if (sim.hitFlashAlpha > 0) {
        sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.4);
      }

      // Smooth squash & stretch recovery
      sim.squashX += (1 - sim.squashX) * Math.min(1, dt * 14);
      sim.squashY += (1 - sim.squashY) * Math.min(1, dt * 14);

      if (sim.boostTimer > 0) {
        sim.boostTimer = Math.max(0, sim.boostTimer - simDt);
      }

      const baseSpeed = gameStateRef.current === 'playing' ? 195 + sim.waveIndex * 18 : 95;
      const scrollSpeed = sim.boostTimer > 0 ? baseSpeed * 1.45 : baseSpeed;

      if (gameStateRef.current === 'title' || gameStateRef.current === 'playing') {
        sim.roadScrollY = (sim.roadScrollY + scrollSpeed * simDt) % 80;
      }

      const targetX = getLaneCenterX(sim.playerLane);
      sim.playerVisualX += (targetX - sim.playerVisualX) * Math.min(1, dt * 16);

      // Update gameplay entities when playing
      if (gameStateRef.current === 'playing' && simDt > 0) {
        // Spawn rain-puddle / barricade hazard with windup telegraph
        sim.hazardTimer -= simDt;
        if (sim.hazardTimer <= 0) {
          sim.hazardTimer = 3.2;
          const hazardLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          sim.hazards.push({
            lane: hazardLane,
            y: -60,
            windupTimer: 0.55,
            resolved: false,
          });
        }

        // Move hazards
        for (const hz of sim.hazards) {
          if (hz.windupTimer > 0) {
            hz.windupTimer = Math.max(0, hz.windupTimer - simDt);
          } else {
            hz.y += scrollSpeed * 1.05 * simDt;
          }

          if (
            !hz.resolved &&
            hz.lane === sim.playerLane &&
            Math.abs(hz.y - playerY) < 42
          ) {
            hz.resolved = true;
            sim.hitstopTimer = 0.06;
            sim.shakeMagnitude = 9;
            sim.hitFlashAlpha = 0.35;
            sim.squashX = 1.28;
            sim.squashY = 0.74;
            playSynthSound('hit');
            spawnParticles(sim.playerVisualX, playerY - 10, '#EF4444', 14);
            setLastFeedback({
              text: 'Road pothole splash! Keep your auto steady!',
              isPositive: false,
            });
          }
        }
        sim.hazards = sim.hazards.filter((h) => h.y < height + 100 && !h.resolved);

        // Move phrase gates
        let waveResolved = false;
        for (const gate of sim.gates) {
          gate.y += scrollSpeed * 0.82 * simDt;

          if (!gate.resolved && Math.abs(gate.y - playerY) < 46) {
            if (gate.lane === sim.playerLane) {
              gate.resolved = true;
              waveResolved = true;

              const scored = scoreArcadeGateHit(
                sim.score,
                sim.combo,
                sim.hull,
                gate.isCorrect
              );
              sim.score = scored.nextScore;
              sim.combo = scored.nextCombo;
              sim.hull = scored.nextHull;
              setHudScore(sim.score);
              setHudCombo(sim.combo);
              setHudHull(sim.hull);

              if (gate.isCorrect) {
                sim.squashX = 0.86;
                sim.squashY = 1.24;
                playSynthSound('correct');
                if (!isMutedRef.current) {
                  speakKannadaPhrase(gate.text);
                }
                spawnParticles(sim.playerVisualX, playerY - 20, '#F59E0B', 22);
                setLastFeedback({
                  text: `Shabash! +${scored.pointsDelta} pts · "${gate.text}"`,
                  isPositive: true,
                });

                const nextWave = sim.waveIndex + 1;
                if (nextWave >= ARCADE_CHALLENGE_WAVES.length) {
                  gameStateRef.current = 'victory';
                  setGameState('victory');
                  playSynthSound('victory');
                } else {
                  sim.waveIndex = nextWave;
                  setHudWaveIdx(nextWave);
                  spawnWaveGates(nextWave);
                }
              } else {
                // Hit decoy phrase
                sim.hitstopTimer = 0.07;
                sim.shakeMagnitude = 12;
                sim.hitFlashAlpha = 0.45;
                sim.squashX = 1.3;
                sim.squashY = 0.72;
                playSynthSound('hit');
                spawnParticles(sim.playerVisualX, playerY - 20, '#EF4444', 18);
                setLastFeedback({
                  text: `Wrong phrase ("${gate.text}")! Hull -1`,
                  isPositive: false,
                });

                if (sim.hull <= 0) {
                  gameStateRef.current = 'gameover';
                  setGameState('gameover');
                } else {
                  spawnWaveGates(sim.waveIndex);
                }
              }
              break;
            }
          }
        }

        // If gates passed past bottom without being collected, respawn wave
        if (!waveResolved && sim.gates.length > 0 && sim.gates[0].y > height + 90) {
          spawnWaveGates(sim.waveIndex);
        }
      }

      // Update pooled particles
      for (const p of sim.particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      sim.particles = sim.particles.filter((p) => p.life < p.maxLife);

      // Clear frame
      ctx.save();
      if (sim.shakeMagnitude > 0) {
        const dx = (Math.random() - 0.5) * sim.shakeMagnitude * 2;
        const dy = (Math.random() - 0.5) * sim.shakeMagnitude * 2;
        ctx.translate(dx, dy);
      }

      // Evening Bengaluru sky & tree-lined roadside shoulders
      ctx.fillStyle = '#0D1714';
      ctx.fillRect(0, 0, width, height);

      // Roadside Cubbon / Indiranagar canopy foliage strips
      ctx.fillStyle = '#13261F';
      ctx.fillRect(0, 0, roadLeft, height);
      ctx.fillRect(roadLeft + roadWidth, 0, width - (roadLeft + roadWidth), height);

      // Asphalt 3-lane boulevard
      ctx.fillStyle = '#1C222B';
      ctx.fillRect(roadLeft, 0, roadWidth, height);

      // Yellow & black Bengaluru curb stones
      for (let y = -80 + sim.roadScrollY; y < height + 80; y += 80) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(roadLeft - 10, y, 10, 40);
        ctx.fillRect(roadLeft + roadWidth, y, 10, 40);
        ctx.fillStyle = '#111827';
        ctx.fillRect(roadLeft - 10, y + 40, 10, 40);
        ctx.fillRect(roadLeft + roadWidth, y + 40, 10, 40);
      }

      // Dashed lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 3;
      ctx.setLineDash([28, 28]);
      ctx.lineDashOffset = -sim.roadScrollY * 2;
      for (let i = 1; i <= 2; i++) {
        const dividerX = roadLeft + laneWidth * i;
        ctx.beginPath();
        ctx.moveTo(dividerX, 0);
        ctx.lineTo(dividerX, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Render road hazards with windup telegraph
      for (const hz of sim.hazards) {
        const hx = getLaneCenterX(hz.lane);
        if (hz.windupTimer > 0) {
          // Telegraph warning marker at top of lane
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.beginPath();
          ctx.arc(hx, 155, 22 + Math.sin(now * 0.02) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FCA5A5';
          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('POTHOLE!', hx, 159);
        } else {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.ellipse(hx, hz.y, 34, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#BAE6FD';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Render incoming Kannada Phrase Gates
      if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
        for (const gate of sim.gates) {
          if (gate.resolved) continue;
          const gx = getLaneCenterX(gate.lane);
          const gw = laneWidth - 18;
          const gh = showScript && gate.scriptText ? 74 : 58;

          ctx.fillStyle = '#111827';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(gx - gw / 2, gate.y - gh / 2, gw, gh, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FEF3C7';
          ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(gate.text, gx, gate.y - (showScript && gate.scriptText ? 4 : -4), gw - 14);

          if (showScript && gate.scriptText) {
            ctx.fillStyle = '#FCD34D';
            ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(gate.scriptText, gx, gate.y + 18, gw - 14);
          }
        }
      }

      // Render Player Bengaluru Yellow & Green Auto Rickshaw
      ctx.save();
      ctx.translate(sim.playerVisualX, playerY);
      ctx.scale(sim.squashX, sim.squashY);

      // Headlight warm beam
      const beamGrad = ctx.createLinearGradient(0, -25, 0, -135);
      beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.36)');
      beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-18, -28);
      ctx.lineTo(-48, -135);
      ctx.lineTo(48, -135);
      ctx.lineTo(18, -28);
      ctx.closePath();
      ctx.fill();

      // Auto rickshaw body (Green lower chassis + Golden-Yellow canopy)
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.roundRect(-26, -34, 52, 68, 14);
      ctx.fill();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(-23, -24, 46, 46, 11);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(-18, -30, 36, 10, 4);
      ctx.fill();

      // Kannada emblem on roof ("ಕ")
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 16px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ಕ', 0, 5);

      ctx.restore();

      // Render pooled particles
      for (const p of sim.particles) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Hit flash overlay
      if (sim.hitFlashAlpha > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${sim.hitFlashAlpha})`;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
      sim.justPressedKeys.clear();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [playSynthSound, showScript, spawnWaveGates]);

  const currentWave: ArcadeWaveChallenge =
    ARCADE_CHALLENGE_WAVES[hudWaveIdx % ARCADE_CHALLENGE_WAVES.length];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1714] select-none overflow-hidden"
      role="application"
      aria-label="Auto Rickshaw Phrase Dash Kannada Arcade Game"
    >
      {/* Isolated 60fps Canvas Container */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Low-Occlusion Perimeter HUD (pointer-events-none wrapper, no backdrop-filter over canvas) */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* Top Perimeter Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left Cluster: Hull Hearts & Wave */}
            <div className="flex items-center gap-3 bg-[#111827]/90 border border-amber-500/40 rounded-xl px-3.5 py-2 text-amber-100">
              <div className="flex items-center gap-1" aria-label={`Hull integrity: ${hudHull} of 3`}>
                {[0, 1, 2].map((idx) => (
                  <svg
                    key={idx}
                    className={`w-4 h-4 ${
                      idx < hudHull ? 'text-amber-400 fill-amber-400' : 'text-stone-600 fill-stone-700'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-mono-tabular font-bold text-amber-300">
                WAVE {hudWaveIdx + 1}/{ARCADE_CHALLENGE_WAVES.length}
              </span>
            </div>

            {/* Center Target Prompt Banner */}
            <div className="bg-[#111827]/95 border-2 border-amber-500 rounded-2xl px-5 py-2.5 text-center max-w-md shadow-lg">
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                Drive Into the Matching Kannada Phrase
              </p>
              <p className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
                “{currentWave.englishPrompt}”
              </p>
            </div>

            {/* Right Cluster: Score, Combo & Controls */}
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <div className="bg-[#111827]/90 border border-amber-500/40 rounded-xl px-3.5 py-2 text-right">
                <span className="text-xs text-stone-400 mr-2">SCORE</span>
                <span className="font-mono-tabular font-bold text-sm text-amber-300">
                  {hudScore}
                </span>
                {hudCombo > 1 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-mono-tabular text-[11px] font-bold">
                    {Math.min(4, hudCombo)}x
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-[#111827]/90 border border-stone-700 text-xs font-semibold text-stone-200 hover:border-amber-400 cursor-pointer"
              >
                {isMuted ? 'Muted (M)' : 'Audio ON (M)'}
              </button>

              <button
                type="button"
                onClick={togglePause}
                aria-label="Pause game"
                className="min-h-[40px] px-3 py-2 rounded-xl bg-[#111827]/90 border border-stone-700 text-xs font-semibold text-stone-200 hover:border-amber-400 cursor-pointer"
              >
                Pause (Esc)
              </button>
            </div>
          </div>

          {/* Bottom Feedback Toast & Mobile Touch Controls */}
          <div className="flex flex-col items-center gap-3">
            {lastFeedback && (
              <div
                className={`px-4 py-1.5 rounded-xl border text-xs font-semibold ${
                  lastFeedback.isPositive
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/90 border-red-500/50 text-red-200'
                }`}
              >
                {lastFeedback.text}
              </div>
            )}

            {/* Touch-friendly Lane & Horn Controls for Mobile */}
            <div className="flex items-center gap-3 pointer-events-auto sm:hidden">
              <button
                type="button"
                onClick={() => switchLaneByDelta(-1)}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer"
              >
                ← Left Lane
              </button>
              <button
                type="button"
                onClick={triggerHornBoost}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-stone-800 border border-amber-500/50 text-amber-300 font-bold text-xs cursor-pointer"
              >
                Horn Boost
              </button>
              <button
                type="button"
                onClick={() => switchLaneByDelta(1)}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer"
              >
                Right Lane →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TITLE SCREEN OVERLAY */}
      {gameState === 'title' && (
        <div className="fixed inset-0 flex flex-col items-center justify-between p-6 sm:p-12 text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-mono-tabular uppercase tracking-widest text-amber-400">
              Namma Kannada Arcade Mode
            </span>
            <button
              type="button"
              onClick={onExitGame}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-900/90 border border-stone-700 text-xs font-semibold text-stone-200 hover:border-amber-400 cursor-pointer"
            >
              Exit to Dashboard
            </button>
          </div>

          {/* Bespoke Inline SVG Title Lockup over 35%+ negative space */}
          <div className="my-auto max-w-xl space-y-6">
            <svg
              viewBox="0 0 520 110"
              className="w-full max-w-md mx-auto overflow-visible"
              aria-hidden="true"
            >
              <rect
                x="14"
                y="10"
                width="492"
                height="90"
                rx="22"
                fill="#111827"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              <circle cx="62" cy="55" r="26" fill="#F59E0B" />
              <text
                x="62"
                y="64"
                textAnchor="middle"
                fill="#111827"
                fontSize="28"
                fontWeight="800"
                fontFamily="Bricolage Grotesque, sans-serif"
              >
                ಕ
              </text>
              <text
                x="280"
                y="50"
                textAnchor="middle"
                fill="#FEF3C7"
                fontSize="24"
                fontWeight="800"
                fontFamily="Bricolage Grotesque, sans-serif"
              >
                AUTO PHRASE DASH
              </text>
              <text
                x="280"
                y="76"
                textAnchor="middle"
                fill="#FBBF24"
                fontSize="13"
                fontWeight="700"
                letterSpacing="3"
                fontFamily="JetBrains Mono, monospace"
              >
                INDIRANAGAR 100FT ROAD RUN
              </text>
            </svg>

            <p className="text-sm sm:text-base text-stone-200 max-w-md mx-auto leading-relaxed">
              Steer your Bengaluru auto rickshaw into the lane carrying the spoken Kannada translation
              for each real-world prompt. Dodge rain potholes and build a 4x streak multiplier!
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={startNewRun}
                className="min-h-[52px] px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display text-base font-bold tracking-tight cursor-pointer transition-transform active:scale-98 shadow-lg"
              >
                Start Indiranagar Run (+60 XP)
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <p className="text-xs font-mono-tabular text-stone-300 tracking-wide">
            A / D or Arrow Keys Switch Lanes · Space Horn Boost · M Mute · Esc Pause
          </p>
        </div>
      )}

      {/* PAUSE / VICTORY / GAME OVER MODAL */}
      {(gameState === 'paused' || gameState === 'victory' || gameState === 'gameover') && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111827] border-2 border-amber-500 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 text-white">
            <p className="text-xs font-mono-tabular uppercase tracking-widest text-amber-400">
              {gameState === 'victory'
                ? 'Run Complete · Shabash!'
                : gameState === 'gameover'
                  ? 'Auto Stalled · Try Again'
                  : 'Game Paused'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              {gameState === 'victory'
                ? 'You Mastered All 6 Street Waves!'
                : gameState === 'gameover'
                  ? 'Traffic Jam on 100ft Road!'
                  : 'Indiranagar Run Paused'}
            </h2>

            <div className="grid grid-cols-2 gap-3 bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div>
                <p className="text-xs text-stone-400">Final Score</p>
                <p className="font-display text-2xl font-bold text-amber-400 font-mono-tabular mt-0.5">
                  {hudScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">XP Reward Earned</p>
                <p className="font-display text-2xl font-bold text-emerald-400 font-mono-tabular mt-0.5">
                  +{gameState === 'victory' ? 60 : Math.max(20, Math.round(hudScore / 15))} XP
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {gameState === 'paused' ? (
                <button
                  type="button"
                  onClick={togglePause}
                  className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
                >
                  Resume Run
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onCompleteGame(
                      gameState === 'victory' ? 60 : Math.max(20, Math.round(hudScore / 15)),
                      hudScore
                    )
                  }
                  className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs cursor-pointer"
                >
                  Claim XP &amp; Return to Dashboard
                </button>
              )}

              <button
                type="button"
                onClick={startNewRun}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs cursor-pointer"
              >
                Play Again
              </button>

              <button
                type="button"
                onClick={onExitGame}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-xs cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
