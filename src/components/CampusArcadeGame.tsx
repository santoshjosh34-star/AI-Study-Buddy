/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, ArrowLeft, Trophy, Zap, Sparkles } from 'lucide-react';

interface CampusArcadeGameProps {
  onBackToNotes?: () => void;
}

type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'CHECKPOINT' | 'GAME_OVER';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

interface Orb {
  x: number;
  y: number;
  radius: number;
  type: 'A_PLUS' | 'COFFEE' | 'ALGO' | 'BOOK';
  points: number;
  color: string;
  glow: string;
  label: string;
  collected: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'PHONE' | 'SLEEP' | 'BUG';
  label: string;
  color: string;
}

const CHECKPOINT_QUESTIONS = [
  {
    q: 'In Time Complexity, what is the average lookup time of a Hash Table?',
    options: ['O(1)', 'O(n)', 'O(log n)'],
    answer: 0,
    hint: 'Constant time access on average!',
  },
  {
    q: 'Which layer of the OSI model handles end-to-end communication and TCP/UDP?',
    options: ['Network Layer', 'Transport Layer', 'Data Link Layer'],
    answer: 1,
    hint: 'Layer 4 ensures reliable delivery.',
  },
  {
    q: 'In relational databases, what does the "A" in ACID stand for?',
    options: ['Asynchronous', 'Atomicity', 'Allocation'],
    answer: 1,
    hint: 'All-or-nothing transaction execution!',
  },
  {
    q: 'Which HTTP status code signifies "Unauthorized access"?',
    options: ['404', '401', '500'],
    answer: 1,
    hint: 'Requires valid authentication credentials.',
  },
];

export const CampusArcadeGame: React.FC<CampusArcadeGameProps> = ({ onBackToNotes }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('ai_study_buddy_hiscore') || 0);
  });
  const [streak, setStreak] = useState(0);
  const [coffeeEnergy, setCoffeeEnergy] = useState(100);
  const [activeQuestion, setActiveQuestion] = useState<(typeof CHECKPOINT_QUESTIONS)[0] | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game loop internal refs (decoupled from React render loop for 60fps)
  const gameLoopRef = useRef<number | null>(null);
  const stateRef = useRef<{
    gameState: GameState;
    score: number;
    streak: number;
    energy: number;
    isMuted: boolean;
    distance: number;
    speed: number;
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
      vy: number;
      isJumping: boolean;
      groundY: number;
    };
    keys: {
      jump: boolean;
      slide: boolean;
    };
    orbs: Orb[];
    obstacles: Obstacle[];
    particles: Particle[];
    nextCheckpointAt: number;
  }>({
    gameState: 'START',
    score: 0,
    streak: 0,
    energy: 100,
    isMuted: false,
    distance: 0,
    speed: 5.5,
    player: {
      x: 90,
      y: 0,
      width: 44,
      height: 60,
      vy: 0,
      isJumping: false,
      groundY: 0,
    },
    keys: { jump: false, slide: false },
    orbs: [],
    obstacles: [],
    particles: [],
    nextCheckpointAt: 500,
  });

  // Sound Synthesizer via Web Audio API
  const playSound = (type: 'jump' | 'collect' | 'hit' | 'boost' | 'gameover') => {
    if (stateRef.current.isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'jump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'collect') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'boost') {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.01, now + (idx + 1) * 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + (idx + 1) * 0.06);
        });
      } else if (type === 'gameover') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // AudioContext can be blocked until user gesture
    }
  };

  // Particle burst helper
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * 4 + 2;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 20,
      });
    }
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const groundY = canvas.height - 80;
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      streak: 0,
      energy: 100,
      isMuted,
      distance: 0,
      speed: 6.0,
      player: {
        x: 90,
        y: groundY - 60,
        width: 42,
        height: 60,
        vy: 0,
        isJumping: false,
        groundY,
      },
      keys: { jump: false, slide: false },
      orbs: [],
      obstacles: [],
      particles: [],
      nextCheckpointAt: 400,
    };

    setScore(0);
    setStreak(0);
    setCoffeeEnergy(100);
    setGameState('PLAYING');
    playSound('boost');
  };

  const jump = () => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING') return;
    if (!s.player.isJumping) {
      s.player.vy = -14.5;
      s.player.isJumping = true;
      playSound('jump');
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      } else if (e.code === 'KeyP') {
        togglePause();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePause = () => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.gameState = 'PAUSED';
      setGameState('PAUSED');
    } else if (stateRef.current.gameState === 'PAUSED') {
      stateRef.current.gameState = 'PLAYING';
      setGameState('PLAYING');
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      stateRef.current.isMuted = next;
      return next;
    });
  };

  const handleCheckpointAnswer = (selectedIdx: number) => {
    if (!activeQuestion) return;
    if (selectedIdx === activeQuestion.answer) {
      // Correct! GPA Boost + Energy Restore
      stateRef.current.energy = Math.min(100, stateRef.current.energy + 35);
      stateRef.current.score += 250;
      stateRef.current.streak += 1;
      setScore(stateRef.current.score);
      setStreak(stateRef.current.streak);
      setCoffeeEnergy(stateRef.current.energy);
      playSound('boost');
    } else {
      playSound('hit');
    }
    stateRef.current.gameState = 'PLAYING';
    setGameState('PLAYING');
    setActiveQuestion(null);
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Auto resize canvas to container size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        stateRef.current.player.groundY = canvas.height - 80;
        if (stateRef.current.gameState === 'START') {
          stateRef.current.player.y = canvas.height - 140;
        }
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;

    const render = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const groundY = H - 80;
      s.player.groundY = groundY;

      // Clear Frame
      ctx.clearRect(0, 0, W, H);

      // 1. Draw Campus Background (Skyline, Library & Stars/Clouds)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0f172a'); // Slate 900
      grad.addColorStop(0.65, '#1e1b4b'); // Indigo 950
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Stars in sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const starX = ((i * 73 - (s.distance * 0.1)) % W + W) % W;
        const starY = (i * 37) % (groundY - 120);
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Distant Campus Library & Quad silhouette
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      for (let i = 0; i < 6; i++) {
        const bX = ((i * 240 - (s.distance * 0.3)) % (W + 240)) - 100;
        const bW = 140;
        const bH = 120 + (i % 3) * 40;
        ctx.fillRect(bX, groundY - bH, bW, bH);
        // Campus Clock tower on #2
        if (i % 3 === 1) {
          ctx.beginPath();
          ctx.moveTo(bX + 30, groundY - bH);
          ctx.lineTo(bX + 70, groundY - bH - 45);
          ctx.lineTo(bX + 110, groundY - bH);
          ctx.fill();
        }
      }

      // 2. Draw Quad Pathway / Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, groundY, W, 80);

      // Campus brick pavement lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      const offset = (s.distance * s.speed) % 40;
      for (let x = -offset; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 20, H);
        ctx.stroke();
      }

      // Sidewalk curb glow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // 3. Game Logic Update if PLAYING
      if (s.gameState === 'PLAYING') {
        s.distance += 1;
        s.score += 1;

        // Energy slowly depletes unless refilled
        s.energy = Math.max(0, s.energy - 0.035);

        // Physics: Player gravity
        s.player.vy += 0.72; // Gravity
        s.player.y += s.player.vy;

        if (s.player.y >= groundY - s.player.height) {
          s.player.y = groundY - s.player.height;
          s.player.vy = 0;
          s.player.isJumping = false;
        }

        // Speed ramp up slowly
        s.speed = Math.min(10.5, 6.0 + s.distance * 0.001);

        // Spawn Collectible Orbs
        if (Math.random() < 0.024 && s.orbs.length < 5) {
          const types: Orb['type'][] = ['A_PLUS', 'COFFEE', 'ALGO', 'BOOK'];
          const t = types[Math.floor(Math.random() * types.length)];
          const orbMeta = {
            A_PLUS: { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)', label: 'A+', pts: 100 },
            COFFEE: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', label: '☕', pts: 50 },
            ALGO: { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', label: 'λ', pts: 80 },
            BOOK: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', label: '📖', pts: 70 },
          }[t];

          const orbY = groundY - 40 - Math.random() * 85;
          s.orbs.push({
            x: W + 50,
            y: orbY,
            radius: 16,
            type: t,
            points: orbMeta.pts,
            color: orbMeta.color,
            glow: orbMeta.glow,
            label: orbMeta.label,
            collected: false,
          });
        }

        // Spawn Obstacles (Distractions)
        if (Math.random() < 0.012 && s.obstacles.length < 3) {
          const obsTypes: Obstacle['type'][] = ['PHONE', 'SLEEP', 'BUG'];
          const t = obsTypes[Math.floor(Math.random() * obsTypes.length)];
          const meta = {
            PHONE: { label: 'Doomscroll 📱', color: '#ef4444', w: 38, h: 48 },
            SLEEP: { label: 'Coma Nap 💤', color: '#6366f1', w: 45, h: 35 },
            BUG: { label: 'Bug 404 🐛', color: '#ec4899', w: 36, h: 42 },
          }[t];

          s.obstacles.push({
            x: W + 60,
            y: groundY - meta.h,
            width: meta.w,
            height: meta.h,
            type: t,
            label: meta.label,
            color: meta.color,
          });
        }

        // Update Orbs & Collision
        for (let i = s.orbs.length - 1; i >= 0; i--) {
          const orb = s.orbs[i];
          orb.x -= s.speed;

          // Check collision with player
          const dx = orb.x - (s.player.x + s.player.width / 2);
          const dy = orb.y - (s.player.y + s.player.height / 2);
          const dist = Math.hypot(dx, dy);

          if (dist < orb.radius + s.player.width / 2 && !orb.collected) {
            orb.collected = true;
            s.score += orb.points;
            s.streak += 1;
            if (orb.type === 'COFFEE') {
              s.energy = Math.min(100, s.energy + 20);
            }
            spawnParticles(orb.x, orb.y, orb.color, 14);
            playSound('collect');
            s.orbs.splice(i, 1);
            continue;
          }

          if (orb.x < -40) {
            s.orbs.splice(i, 1);
          }
        }

        // Update Obstacles & Collision
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Box collision
          const px = s.player.x;
          const py = s.player.y;
          const pw = s.player.width;
          const ph = s.player.height;

          if (
            px < obs.x + obs.width &&
            px + pw > obs.x &&
            py < obs.y + obs.height &&
            py + ph > obs.y
          ) {
            // Collision with distraction!
            s.energy -= 28;
            s.streak = 0;
            spawnParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color, 16);
            playSound('hit');
            s.obstacles.splice(i, 1);

            if (s.energy <= 0) {
              // Game Over
              s.gameState = 'GAME_OVER';
              setGameState('GAME_OVER');
              playSound('gameover');
              const finalScore = s.score;
              if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem('ai_study_buddy_hiscore', String(finalScore));
              }
            }
            continue;
          }

          if (obs.x + obs.width < -40) {
            s.obstacles.splice(i, 1);
          }
        }

        // Checkpoint Study Trigger every 500 score
        if (s.score >= s.nextCheckpointAt) {
          s.nextCheckpointAt += 550;
          s.gameState = 'CHECKPOINT';
          setGameState('CHECKPOINT');
          const q = CHECKPOINT_QUESTIONS[Math.floor(Math.random() * CHECKPOINT_QUESTIONS.length)];
          setActiveQuestion(q);
        }

        // Energy Runout check
        if (s.energy <= 0 && s.gameState === 'PLAYING') {
          s.gameState = 'GAME_OVER';
          setGameState('GAME_OVER');
          playSound('gameover');
          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem('ai_study_buddy_hiscore', String(s.score));
          }
        }

        // Sync React HUD state periodically
        setScore(s.score);
        setStreak(s.streak);
        setCoffeeEnergy(Math.round(s.energy));
      }

      // 4. Draw Orbs
      s.orbs.forEach((orb) => {
        ctx.save();
        ctx.shadowColor = orb.glow;
        ctx.shadowBlur = 12;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(orb.label, orb.x, orb.y);
        ctx.restore();
      });

      // 5. Draw Obstacles (Distractions)
      s.obstacles.forEach((obs) => {
        ctx.save();
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y - 6);
        ctx.restore();
      });

      // 6. Draw Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // 7. Draw Student Runner Character (Low Poly / Clean Silhouette with Backpack & Graduation Cap)
      const p = s.player;
      ctx.save();
      // Body
      ctx.fillStyle = '#38bdf8'; // Blue college hoodie
      ctx.beginPath();
      ctx.roundRect(p.x + 8, p.y + 18, p.width - 16, 26, 4);
      ctx.fill();

      // Backpack
      ctx.fillStyle = '#f59e0b'; // Amber backpack
      ctx.fillRect(p.x, p.y + 20, 10, 20);

      // Head
      ctx.fillStyle = '#fed7aa'; // Peach skin
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2 + 2, p.y + 12, 11, 0, Math.PI * 2);
      ctx.fill();

      // Graduation Cap / Mortarboard
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2 - 14, p.y + 4);
      ctx.lineTo(p.x + p.width / 2 + 18, p.y + 2);
      ctx.lineTo(p.x + p.width / 2 + 12, p.y - 3);
      ctx.lineTo(p.x + p.width / 2 - 18, p.y - 1);
      ctx.closePath();
      ctx.fill();
      // Tassel
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width / 2 + 14, p.y + 8);
      ctx.stroke();

      // Running legs (animating with distance)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      const legCycle = Math.sin(s.distance * 0.35);
      // Left leg
      ctx.beginPath();
      ctx.moveTo(p.x + 14, p.y + 44);
      ctx.lineTo(p.x + 14 + (p.isJumping ? 8 : legCycle * 12), p.y + p.height);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(p.x + 28, p.y + 44);
      ctx.lineTo(p.x + 28 + (p.isJumping ? -8 : -legCycle * 12), p.y + p.height);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Canvas Element for 60fps Game Render */}
      <canvas
        ref={canvasRef}
        onClick={jump}
        className="w-full h-full cursor-pointer touch-none block"
      />

      {/* Low-Occlusion HUD Overlay (<15% screen space) */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Left: Score & Streak */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-white pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-sm font-bold text-amber-300">{score}</span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-xs font-semibold text-sky-300">{streak}x streak</span>
          </div>
        </div>

        {/* Center: Coffee Stamina Bar */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 pointer-events-auto">
          <span className="text-xs font-semibold text-amber-200 flex items-center gap-1">
            ☕ Energy
          </span>
          <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                coffeeEnergy > 40
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse'
              }`}
              style={{ width: `${coffeeEnergy}%` }}
            />
          </div>
          <span className="font-mono text-xs text-slate-300">{coffeeEnergy}%</span>
        </div>

        {/* Right: Controls & Audio Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBackToNotes && (
            <button
              onClick={onBackToNotes}
              className="px-2.5 py-1.5 bg-slate-900/80 backdrop-blur-md text-xs font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Notes
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-1.5 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {gameState === 'PLAYING' && (
            <button
              onClick={togglePause}
              className="p-1.5 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
              title="Pause Game (P)"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* START SCREEN MODAL */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            {/* SVG Title Lockup */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4">
              <Zap className="w-9 h-9 text-white animate-bounce" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
              BRAIN DASH: CAMPUS SPRINT
            </h1>
            <p className="text-sm text-slate-400 mb-5">
              Dodge finals-week distractions, collect Knowledge Orbs, and power through exam week at 60 FPS!
            </p>

            <div className="grid grid-cols-2 gap-2.5 w-full text-xs text-left mb-6">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="font-semibold text-amber-400 block mb-1">🎯 Objectives</span>
                <span className="text-slate-300">Collect A+ Orbs & Coffee to keep your exam stamina high.</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="font-semibold text-rose-400 block mb-1">⚠️ Distractions</span>
                <span className="text-slate-300">Jump over Doomscrolling feeds, snooze naps & code bugs!</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" /> START EXAM SPRINT
            </button>

            <p className="text-[11px] text-slate-500 mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Space</kbd> or Tap Screen to Jump • <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">P</kbd> to Pause
            </p>
          </div>
        </div>
      )}

      {/* CHECKPOINT FLASHCARD MODAL */}
      {gameState === 'CHECKPOINT' && activeQuestion && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Study Boost Checkpoint
            </div>
            <h3 className="text-base font-bold text-white mb-2">{activeQuestion.q}</h3>
            <p className="text-xs text-slate-400 mb-4">{activeQuestion.hint}</p>

            <div className="space-y-2">
              {activeQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCheckpointAnswer(idx)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/60 text-sm font-medium text-slate-200 hover:text-white transition"
                >
                  <span className="font-mono text-amber-400 mr-2">[{idx + 1}]</span> {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Game Paused</h2>
            <p className="text-xs text-slate-400 mb-4">Taking a quick campus coffee break.</p>
            <button
              onClick={togglePause}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Sprint
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="max-w-sm w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Sprint Concluded!</h2>
            <p className="text-xs text-slate-400 mb-4">You pushed through late-night finals week.</p>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 mb-5 flex justify-around">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Final Score</span>
                <span className="text-lg font-mono font-bold text-amber-300">{score}</span>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Campus Best</span>
                <span className="text-lg font-mono font-bold text-sky-300">{highScore}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              {onBackToNotes && (
                <button
                  onClick={onBackToNotes}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition"
                >
                  Return to Study Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch Jump Bar at Bottom */}
      <div className="sm:hidden absolute bottom-2 left-4 right-4 z-10 pointer-events-auto">
        <button
          onClick={jump}
          className="w-full py-3 bg-sky-500/80 active:bg-sky-400 backdrop-blur-md rounded-xl text-white font-bold text-sm shadow-lg border border-sky-400/40"
        >
          TAP TO JUMP 🦘
        </button>
      </div>
    </div>
  );
};
