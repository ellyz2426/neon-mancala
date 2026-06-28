import {
  World,
  createSystem,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  UIKit,
  Follower,
  ScreenSpace,
  eq,
  Entity,
  InputComponent,
  BoxGeometry as IBoxGeometry,
  SphereGeometry as ISphereGeometry,
} from '@iwsdk/core';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  TorusGeometry,
  ConeGeometry,
  OctahedronGeometry,
  Group,
  Vector3,
  Color,
  PointLight,
  AmbientLight,
  DirectionalLight,
  FogExp2,
  GridHelper,
  LineBasicMaterial,
  AdditiveBlending,
  Raycaster,
  Vector2,
  Object3D,
  Plane,
  MathUtils,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  DoubleSide,
  RingGeometry,
  EdgesGeometry,
  LineSegments,
  BackSide,
  IcosahedronGeometry,
} from '@iwsdk/core';

// ========== TYPES & CONSTANTS ==========

interface Theme {
  name: string;
  grid: string; accent: string; bg: string; fog: string; wall: string;
  pit: string; seed: string; board: string; glow: string; mancala: string;
}

const THEMES: Theme[] = [
  { name: 'Neon Holodeck', grid: '#00ffff', accent: '#00ffff', bg: '#050510', fog: '#050510', wall: '#001a33', pit: '#003344', seed: '#00ffcc', board: '#001122', glow: '#00ffff', mancala: '#004466' },
  { name: 'Crimson Arena', grid: '#ff3344', accent: '#ff3344', bg: '#100505', fog: '#100505', wall: '#330011', pit: '#440011', seed: '#ff6644', board: '#220011', glow: '#ff3344', mancala: '#660022' },
  { name: 'Toxic Neon', grid: '#33ff33', accent: '#33ff33', bg: '#051005', fog: '#051005', wall: '#003300', pit: '#004400', seed: '#66ff33', board: '#002200', glow: '#33ff33', mancala: '#005500' },
  { name: 'Ultra Violet', grid: '#aa44ff', accent: '#aa44ff', bg: '#0a0510', fog: '#0a0510', wall: '#220044', pit: '#330055', seed: '#cc66ff', board: '#110022', glow: '#aa44ff', mancala: '#440066' },
  { name: 'Solar Blaze', grid: '#ff8800', accent: '#ff8800', bg: '#100800', fog: '#100800', wall: '#331a00', pit: '#442200', seed: '#ffaa33', board: '#221100', glow: '#ff8800', mancala: '#553300' },
];

interface SeedSkin {
  name: string; color: string; emissive: string; glowColor: string; unlock: string; unlockReq: number;
}

const SEED_SKINS: SeedSkin[] = [
  { name: 'Neon Cyan', color: '#00ddff', emissive: '#00aacc', glowColor: '#00ffff', unlock: 'default', unlockReq: 0 },
  { name: 'Solar Flare', color: '#ff6600', emissive: '#cc4400', glowColor: '#ff8833', unlock: 'sows', unlockReq: 50 },
  { name: 'Plasma Pink', color: '#ff44aa', emissive: '#cc2288', glowColor: '#ff66cc', unlock: 'score', unlockReq: 5000 },
  { name: 'Frost Blue', color: '#4488ff', emissive: '#2266cc', glowColor: '#66aaff', unlock: 'games', unlockReq: 10 },
  { name: 'Toxic Green', color: '#44ff44', emissive: '#22cc22', glowColor: '#66ff66', unlock: 'captures', unlockReq: 20 },
  { name: 'Royal Gold', color: '#ffcc00', emissive: '#ccaa00', glowColor: '#ffdd33', unlock: 'wins', unlockReq: 10 },
  { name: 'Void Purple', color: '#8844ff', emissive: '#6622cc', glowColor: '#aa66ff', unlock: 'extra_turns', unlockReq: 30 },
  { name: 'Inferno', color: '#ff2200', emissive: '#cc1100', glowColor: '#ff4433', unlock: 'all_modes', unlockReq: 1 },
];

interface Achievement {
  id: string; name: string; desc: string; check: (s: Stats) => boolean;
}

interface Stats {
  games: number; wins: number; losses: number; draws: number;
  totalSows: number; totalCaptures: number; totalSeeds: number;
  bestScore: number; extraTurns: number; perfectGames: number;
  fastWins: number; comebacks: number; modesPlayed: Set<string>;
  dailyDone: number; dailyStreak: number; lastDaily: string;
  longestWinStreak: number; currentWinStreak: number;
  totalPlayTime: number; skinsUsed: Set<string>; themesUsed: Set<string>;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_sow', name: 'First Sow', desc: 'Sow your first seeds', check: s => s.totalSows >= 1 },
  { id: 'ten_sows', name: 'Seed Spreader', desc: 'Sow 10 times', check: s => s.totalSows >= 10 },
  { id: 'fifty_sows', name: 'Field Worker', desc: 'Sow 50 times', check: s => s.totalSows >= 50 },
  { id: 'hundred_sows', name: 'Master Farmer', desc: 'Sow 100 times', check: s => s.totalSows >= 100 },
  { id: 'five_hundred_sows', name: 'Harvest Lord', desc: 'Sow 500 times', check: s => s.totalSows >= 500 },
  { id: 'first_capture', name: 'First Capture', desc: 'Capture seeds for the first time', check: s => s.totalCaptures >= 1 },
  { id: 'ten_captures', name: 'Raider', desc: 'Capture seeds 10 times', check: s => s.totalCaptures >= 10 },
  { id: 'fifty_captures', name: 'Warlord', desc: 'Capture seeds 50 times', check: s => s.totalCaptures >= 50 },
  { id: 'first_win', name: 'First Victory', desc: 'Win your first game', check: s => s.wins >= 1 },
  { id: 'five_wins', name: 'Rising Champion', desc: 'Win 5 games', check: s => s.wins >= 5 },
  { id: 'twenty_wins', name: 'Veteran', desc: 'Win 20 games', check: s => s.wins >= 20 },
  { id: 'fifty_wins', name: 'Grand Master', desc: 'Win 50 games', check: s => s.wins >= 50 },
  { id: 'first_extra', name: 'Go Again!', desc: 'Earn your first extra turn', check: s => s.extraTurns >= 1 },
  { id: 'ten_extras', name: 'Double Dipper', desc: 'Earn 10 extra turns', check: s => s.extraTurns >= 10 },
  { id: 'thirty_extras', name: 'Turn Master', desc: 'Earn 30 extra turns', check: s => s.extraTurns >= 30 },
  { id: 'score_100', name: 'Century', desc: 'Score 100+ seeds in one game', check: s => s.bestScore >= 100 },
  { id: 'score_200', name: 'Double Century', desc: 'Score 200+ seeds in one game', check: s => s.bestScore >= 200 },
  { id: 'win_streak_3', name: 'Hot Streak', desc: 'Win 3 games in a row', check: s => s.longestWinStreak >= 3 },
  { id: 'win_streak_5', name: 'On Fire', desc: 'Win 5 games in a row', check: s => s.longestWinStreak >= 5 },
  { id: 'win_streak_10', name: 'Unstoppable', desc: 'Win 10 games in a row', check: s => s.longestWinStreak >= 10 },
  { id: 'perfect_game', name: 'Perfect Game', desc: 'Win with all 48 seeds', check: s => s.perfectGames >= 1 },
  { id: 'fast_win', name: 'Speed Demon', desc: 'Win in under 60 seconds', check: s => s.fastWins >= 1 },
  { id: 'comeback', name: 'Comeback Kid', desc: 'Win after being behind by 10+', check: s => s.comebacks >= 1 },
  { id: 'games_10', name: 'Regular', desc: 'Play 10 games', check: s => s.games >= 10 },
  { id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', check: s => s.games >= 50 },
  { id: 'games_100', name: 'Obsessed', desc: 'Play 100 games', check: s => s.games >= 100 },
  { id: 'daily_done', name: 'Daily Player', desc: 'Complete a daily challenge', check: s => s.dailyDone >= 1 },
  { id: 'daily_3', name: 'Consistent', desc: '3-day daily streak', check: s => s.dailyStreak >= 3 },
  { id: 'daily_7', name: 'Weekly Warrior', desc: '7-day daily streak', check: s => s.dailyStreak >= 7 },
  { id: 'skin_unlock', name: 'Fashionista', desc: 'Unlock a seed skin', check: s => s.skinsUsed.size >= 2 },
  { id: 'theme_all', name: 'Theme Explorer', desc: 'Try all 5 themes', check: s => s.themesUsed.size >= 5 },
  { id: 'all_modes', name: 'Well Rounded', desc: 'Play all 8 game modes', check: s => s.modesPlayed.size >= 8 },
  { id: 'seeds_500', name: 'Seed Collector', desc: 'Collect 500 total seeds', check: s => s.totalSeeds >= 500 },
  { id: 'seeds_2000', name: 'Seed Hoarder', desc: 'Collect 2000 total seeds', check: s => s.totalSeeds >= 2000 },
  { id: 'seeds_10000', name: 'Seed Emperor', desc: 'Collect 10000 total seeds', check: s => s.totalSeeds >= 10000 },
  { id: 'capture_5_game', name: 'Ambush Master', desc: 'Make 5 captures in one game', check: s => s.totalCaptures >= 5 },
  { id: 'no_capture_win', name: 'Pacifist', desc: 'Win without any captures', check: s => s.wins >= 1 },
  { id: 'draw', name: 'Tie Game', desc: 'End a game in a draw', check: s => s.draws >= 1 },
  { id: 'sweep', name: 'Clean Sweep', desc: 'Empty all your pits in one sow chain', check: s => s.totalSows >= 1 },
  { id: 'play_time', name: 'Time Invested', desc: 'Play for 60+ minutes total', check: s => s.totalPlayTime >= 3600 },
];

type GameState = 'title' | 'mode_select' | 'difficulty' | 'playing' | 'paused' | 'gameover' | 'achievements' | 'settings' | 'help' | 'skins' | 'stats' | 'leaderboard' | 'countdown';

interface GameMode {
  id: string; name: string; desc: string;
}

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Classic', desc: 'Standard Mancala rules vs AI' },
  { id: 'speed', name: 'Speed', desc: 'Timed turns -- think fast!' },
  { id: 'capture', name: 'Capture', desc: 'Bonus points for captures' },
  { id: 'zen', name: 'Zen', desc: 'Relaxed play with hints' },
  { id: 'daily', name: 'Daily Challenge', desc: 'Date-seeded starting layout' },
  { id: 'practice', name: 'Practice', desc: 'Unlimited undo moves' },
  { id: 'marathon', name: 'Marathon', desc: 'Best of 5 series' },
  { id: 'avalanche', name: 'Avalanche', desc: 'Seeds keep sowing if landing in non-empty pit' },
];

// ========== GAME STATE MANAGER ==========

class GameStateManager {
  // Board: indices 0-5 = player pits (bottom, left to right), 6 = player mancala
  // 7-12 = opponent pits (top, right to left), 13 = opponent mancala
  board: number[] = [];
  currentPlayer: number = 0; // 0 = player, 1 = opponent
  gameState: GameState = 'title';
  selectedMode: string = 'classic';
  difficulty: number = 1; // 0=easy, 1=medium, 2=hard
  themeIndex: number = 0;
  skinIndex: number = 0;
  turnTimer: number = 0;
  turnTimeLimit: number = 0;
  gameStartTime: number = 0;
  gameCapturesThisGame: number = 0;
  wasBehindBy10: boolean = false;
  marathonPlayerWins: number = 0;
  marathonOpponentWins: number = 0;
  marathonGame: number = 0;
  moveHistory: number[][] = [];
  lastMoveWasCapture: boolean = false;
  lastMoveWasExtra: boolean = false;
  hintPit: number = -1;
  animating: boolean = false;
  countdownValue: number = 3;
  level: number = 1;
  xp: number = 0;

  stats: Stats = {
    games: 0, wins: 0, losses: 0, draws: 0,
    totalSows: 0, totalCaptures: 0, totalSeeds: 0,
    bestScore: 0, extraTurns: 0, perfectGames: 0,
    fastWins: 0, comebacks: 0, modesPlayed: new Set(),
    dailyDone: 0, dailyStreak: 0, lastDaily: '',
    longestWinStreak: 0, currentWinStreak: 0,
    totalPlayTime: 0, skinsUsed: new Set(['Neon Cyan']), themesUsed: new Set(['Neon Holodeck']),
  };

  unlockedAchievements: Set<string> = new Set();
  leaderboard: { score: number; mode: string; date: string }[] = [];

  constructor() {
    this.loadState();
  }

  initBoard(mode: string): void {
    if (mode === 'daily') {
      const seed = this.dailySeed();
      const rng = this.mulberry32(seed);
      this.board = new Array(14).fill(0);
      for (let i = 0; i < 6; i++) {
        this.board[i] = 2 + Math.floor(rng() * 5); // 2-6 seeds per pit
        this.board[i + 7] = 2 + Math.floor(rng() * 5);
      }
    } else {
      this.board = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    }
    this.currentPlayer = 0;
    this.gameCapturesThisGame = 0;
    this.wasBehindBy10 = false;
    this.moveHistory = [];
    this.lastMoveWasCapture = false;
    this.lastMoveWasExtra = false;
    this.hintPit = -1;
    this.gameStartTime = Date.now();
  }

  dailySeed(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  mulberry32(a: number): () => number {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  getValidMoves(player: number): number[] {
    const start = player === 0 ? 0 : 7;
    const moves: number[] = [];
    for (let i = start; i < start + 6; i++) {
      if (this.board[i] > 0) moves.push(i);
    }
    return moves;
  }

  isGameOver(): boolean {
    const p0empty = this.board.slice(0, 6).every(v => v === 0);
    const p1empty = this.board.slice(7, 13).every(v => v === 0);
    return p0empty || p1empty;
  }

  sow(pitIndex: number, isAvalanche: boolean = false): { extraTurn: boolean; captured: number; capturedPit: number } {
    const player = pitIndex < 7 ? 0 : 1;
    const myMancala = player === 0 ? 6 : 13;
    const oppMancala = player === 0 ? 13 : 6;

    let seeds = this.board[pitIndex];
    this.board[pitIndex] = 0;
    let idx = pitIndex;
    let lastIdx = pitIndex;

    while (seeds > 0) {
      idx = (idx + 1) % 14;
      if (idx === oppMancala) continue; // skip opponent's mancala
      this.board[idx]++;
      seeds--;
      lastIdx = idx;
    }

    // Check extra turn
    const extraTurn = lastIdx === myMancala;

    // Check capture
    let captured = 0;
    let capturedPit = -1;
    const myStart = player === 0 ? 0 : 7;
    const myEnd = player === 0 ? 5 : 12;
    if (lastIdx >= myStart && lastIdx <= myEnd && this.board[lastIdx] === 1) {
      const opposite = 12 - lastIdx;
      if (this.board[opposite] > 0) {
        captured = this.board[opposite] + 1;
        capturedPit = opposite;
        this.board[myMancala] += this.board[opposite] + 1;
        this.board[opposite] = 0;
        this.board[lastIdx] = 0;
      }
    }

    // Avalanche mode: if last seed lands in non-empty pit (not mancala), keep sowing
    if (isAvalanche && !extraTurn && lastIdx !== myMancala && this.board[lastIdx] > 1 &&
        lastIdx >= myStart && lastIdx <= myEnd) {
      const next = this.sow(lastIdx, true);
      return { extraTurn: next.extraTurn, captured: captured + next.captured, capturedPit: next.capturedPit !== -1 ? next.capturedPit : capturedPit };
    }

    return { extraTurn, captured, capturedPit };
  }

  finishGame(): void {
    // Collect remaining seeds
    for (let i = 0; i < 6; i++) {
      this.board[6] += this.board[i];
      this.board[i] = 0;
    }
    for (let i = 7; i < 13; i++) {
      this.board[13] += this.board[i];
      this.board[i] = 0;
    }
  }

  aiMove(): number {
    const moves = this.getValidMoves(1);
    if (moves.length === 0) return -1;

    if (this.difficulty === 0) {
      // Easy: random
      return moves[Math.floor(Math.random() * moves.length)];
    } else if (this.difficulty === 1) {
      // Medium: 1-ply, prefer extra turns + captures
      let bestScore = -Infinity;
      let bestMove = moves[0];
      for (const m of moves) {
        const backup = [...this.board];
        const result = this.sow(m, this.selectedMode === 'avalanche');
        let score = this.board[13] - backup[13]; // seeds gained
        if (result.extraTurn) score += 5;
        if (result.captured > 0) score += result.captured * 2;
        this.board = backup;
        if (score > bestScore) { bestScore = score; bestMove = m; }
      }
      return bestMove;
    } else {
      // Hard: minimax depth 6
      return this.minimaxRoot(6);
    }
  }

  minimaxRoot(depth: number): number {
    const moves = this.getValidMoves(1);
    let bestScore = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const backup = [...this.board];
      const result = this.sow(m, this.selectedMode === 'avalanche');
      const nextPlayer = result.extraTurn ? 1 : 0;
      const score = this.minimax(depth - 1, nextPlayer, -Infinity, Infinity);
      this.board = backup;
      if (score > bestScore) { bestScore = score; bestMove = m; }
    }
    return bestMove;
  }

  minimax(depth: number, player: number, alpha: number, beta: number): number {
    if (depth === 0 || this.isGameOver()) {
      return this.board[13] - this.board[6]; // AI advantage
    }
    const moves = this.getValidMoves(player);
    if (moves.length === 0) return this.board[13] - this.board[6];

    if (player === 1) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const backup = [...this.board];
        const result = this.sow(m, this.selectedMode === 'avalanche');
        const nextPlayer = result.extraTurn ? 1 : 0;
        const ev = this.minimax(depth - 1, nextPlayer, alpha, beta);
        this.board = backup;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const backup = [...this.board];
        const result = this.sow(m, this.selectedMode === 'avalanche');
        const nextPlayer = result.extraTurn ? 0 : 1;
        const ev = this.minimax(depth - 1, nextPlayer, alpha, beta);
        this.board = backup;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  computeHint(): number {
    // Use same logic as medium AI but for player
    const moves = this.getValidMoves(0);
    if (moves.length === 0) return -1;
    let bestScore = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const backup = [...this.board];
      const result = this.sow(m, this.selectedMode === 'avalanche');
      let score = this.board[6] - backup[6];
      if (result.extraTurn) score += 5;
      if (result.captured > 0) score += result.captured * 2;
      this.board = backup;
      if (score > bestScore) { bestScore = score; bestMove = m; }
    }
    return bestMove;
  }

  getXpForLevel(lv: number): number { return 100 + 50 * lv; }

  addXp(amount: number): void {
    this.xp += amount;
    while (this.xp >= this.getXpForLevel(this.level) && this.level < 50) {
      this.xp -= this.getXpForLevel(this.level);
      this.level++;
    }
  }

  saveState(): void {
    const data = {
      stats: {
        ...this.stats,
        modesPlayed: Array.from(this.stats.modesPlayed),
        skinsUsed: Array.from(this.stats.skinsUsed),
        themesUsed: Array.from(this.stats.themesUsed),
      },
      unlockedAchievements: Array.from(this.unlockedAchievements),
      leaderboard: this.leaderboard,
      themeIndex: this.themeIndex,
      skinIndex: this.skinIndex,
      level: this.level,
      xp: this.xp,
    };
    try { localStorage.setItem('neon-mancala', JSON.stringify(data)); } catch {}
  }

  loadState(): void {
    try {
      const raw = localStorage.getItem('neon-mancala');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.stats) {
        Object.assign(this.stats, data.stats);
        this.stats.modesPlayed = new Set(data.stats.modesPlayed || []);
        this.stats.skinsUsed = new Set(data.stats.skinsUsed || ['Neon Cyan']);
        this.stats.themesUsed = new Set(data.stats.themesUsed || ['Neon Holodeck']);
      }
      if (data.unlockedAchievements) this.unlockedAchievements = new Set(data.unlockedAchievements);
      if (data.leaderboard) this.leaderboard = data.leaderboard;
      if (data.themeIndex !== undefined) this.themeIndex = data.themeIndex;
      if (data.skinIndex !== undefined) this.skinIndex = data.skinIndex;
      if (data.level) this.level = data.level;
      if (data.xp !== undefined) this.xp = data.xp;
    } catch {}
  }
}

// ========== AUDIO MANAGER ==========

class AudioManager {
  ctx: AudioContext | null = null;
  masterVol: GainNode | null = null;
  sfxVol: GainNode | null = null;
  musicVol: GainNode | null = null;
  droneOsc1: OscillatorNode | null = null;
  droneOsc2: OscillatorNode | null = null;
  droneLfo: OscillatorNode | null = null;
  masterLevel = 0.7; sfxLevel = 0.8; musicLevel = 0.3;

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterVol = this.ctx.createGain();
    this.masterVol.gain.value = this.masterLevel;
    this.masterVol.connect(this.ctx.destination);
    this.sfxVol = this.ctx.createGain();
    this.sfxVol.gain.value = this.sfxLevel;
    this.sfxVol.connect(this.masterVol);
    this.musicVol = this.ctx.createGain();
    this.musicVol.gain.value = this.musicLevel;
    this.musicVol.connect(this.masterVol);
    this.startDrone();
  }

  startDrone(): void {
    if (!this.ctx || !this.musicVol) return;
    const c = this.ctx;
    this.droneOsc1 = c.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.value = 55;
    const g1 = c.createGain(); g1.gain.value = 0.12;
    this.droneOsc1.connect(g1).connect(this.musicVol);
    this.droneOsc1.start();

    this.droneOsc2 = c.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = 82.5;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const g2 = c.createGain(); g2.gain.value = 0.08;
    this.droneOsc2.connect(lp).connect(g2).connect(this.musicVol);
    this.droneOsc2.start();

    this.droneLfo = c.createOscillator();
    this.droneLfo.frequency.value = 0.15;
    const lfoG = c.createGain(); lfoG.gain.value = 0.03;
    this.droneLfo.connect(lfoG).connect(g1.gain);
    this.droneLfo.start();
  }

  private playTone(freq: number, type: OscillatorType, dur: number, vol: number = 0.15, pitch: number = 1): void {
    if (!this.ctx || !this.sfxVol) return;
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq * (0.95 + Math.random() * 0.1) * pitch;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(this.sfxVol);
    o.start(); o.stop(c.currentTime + dur);
  }

  playSow(): void { this.playTone(440, 'triangle', 0.15, 0.12); }
  playSeedDrop(): void { this.playTone(660 + Math.random() * 200, 'sine', 0.1, 0.08); }
  playCapture(): void {
    this.playTone(523, 'sine', 0.3, 0.2);
    setTimeout(() => this.playTone(659, 'sine', 0.3, 0.2), 80);
    setTimeout(() => this.playTone(784, 'sine', 0.3, 0.2), 160);
    setTimeout(() => this.playTone(1047, 'sine', 0.4, 0.2), 240);
  }
  playExtraTurn(): void {
    this.playTone(880, 'triangle', 0.2, 0.15);
    setTimeout(() => this.playTone(1100, 'triangle', 0.3, 0.15), 100);
  }
  playClick(): void { this.playTone(800, 'sine', 0.08, 0.1); this.playTone(1200, 'sine', 0.08, 0.06); }
  playGameStart(): void {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.15), i * 100));
  }
  playGameOver(): void {
    [784, 659, 523, 392].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.3, 0.15), i * 120));
  }
  playWin(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.4, 0.18), i * 100));
  }
  playAchievement(): void {
    [660, 880, 1100, 1320, 1540].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.3, 0.12), i * 80));
  }
  playCountdown(): void { this.playTone(600, 'sine', 0.15, 0.1); }
  playGo(): void { this.playTone(900, 'sine', 0.3, 0.15); }
  playInvalid(): void { this.playTone(200, 'sawtooth', 0.2, 0.1); this.playTone(180, 'sawtooth', 0.3, 0.08); }
  playHover(): void { this.playTone(1000, 'sine', 0.05, 0.04); }

  setMaster(v: number): void { this.masterLevel = v; if (this.masterVol) this.masterVol.gain.value = v; }
  setSfx(v: number): void { this.sfxLevel = v; if (this.sfxVol) this.sfxVol.gain.value = v; }
  setMusic(v: number): void { this.musicLevel = v; if (this.musicVol) this.musicVol.gain.value = v; }
}

// ========== PARTICLE SYSTEM ==========

class ParticlePool {
  particles: { mesh: Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number; active: boolean }[] = [];
  scene: Scene;

  constructor(scene: Scene, count: number = 150) {
    this.scene = scene;
    const geo = new SphereGeometry(0.012, 4, 4);
    for (let i = 0; i < count; i++) {
      const mat = new MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2, transparent: true });
      const m = new Mesh(geo, mat);
      m.visible = false;
      scene.add(m);
      this.particles.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, active: false });
    }
  }

  burst(x: number, y: number, z: number, count: number, color: string, speed: number = 2): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (spawned >= count) break;
      if (p.active) continue;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.3) * Math.PI;
      const s = speed * (0.5 + Math.random() * 0.5);
      p.vx = Math.cos(angle) * Math.cos(elev) * s;
      p.vy = Math.sin(elev) * s + 1;
      p.vz = Math.sin(angle) * Math.cos(elev) * s;
      p.life = 0;
      p.maxLife = 0.6 + Math.random() * 0.4;
      (p.mesh.material as MeshStandardMaterial).color.set(color);
      (p.mesh.material as MeshStandardMaterial).emissive.set(color);
      spawned++;
    }
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 4 * dt;
      (p.mesh.material as MeshStandardMaterial).opacity = 1 - p.life / p.maxLife;
    }
  }
}

// ========== MAIN ==========

const container = document.getElementById('app') as HTMLDivElement;
const gsm = new GameStateManager();
const audio = new AudioManager();

// Panel entities
let titleEntity: Entity | null = null;
let modeEntity: Entity | null = null;
let diffEntity: Entity | null = null;
let hudEntity: Entity | null = null;
let pauseEntity: Entity | null = null;
let gameoverEntity: Entity | null = null;
let achieveEntity: Entity | null = null;
let settingsEntity: Entity | null = null;
let helpEntity: Entity | null = null;
let skinsEntity: Entity | null = null;
let statsEntity: Entity | null = null;
let leaderEntity: Entity | null = null;
let toastEntity: Entity | null = null;
let countdownEntity: Entity | null = null;
let extraTurnEntity: Entity | null = null;

// 3D board objects
let boardGroup: Group;
let pitMeshes: Mesh[] = []; // 0-5 player pits, 6 player mancala, 7-12 opponent pits, 13 opponent mancala
let seedGroups: Group[] = []; // one group per pit
let pitHighlightMeshes: Mesh[] = [];
let particles: ParticlePool;

// Raycaster
const raycaster = new Raycaster();
const mouse = new Vector2();
let hoveredPit = -1;

// Toast queue
let toastQueue: string[] = [];
let toastTimer = 0;

// Countdown
let countdownTimer = 0;
let countdownCallback: (() => void) | null = null;

// AI turn delay
let aiTurnTimer = 0;
let aiPending = false;

// Sow animation
interface SowAnimation {
  seeds: Mesh[];
  pitSequence: number[];
  currentStep: number;
  timer: number;
  stepDuration: number;
  result: { extraTurn: boolean; captured: number; capturedPit: number };
  originalPit: number;
}
let sowAnim: SowAnimation | null = null;

// World ref
let worldRef: World | null = null;
let sceneRef: Scene | null = null;

function getTheme(): Theme { return THEMES[gsm.themeIndex]; }
function getSkin(): SeedSkin { return SEED_SKINS[gsm.skinIndex]; }

// ========== BUILD 3D BOARD ==========

function buildBoard(scene: Scene): void {
  if (boardGroup) scene.remove(boardGroup);
  boardGroup = new Group();
  scene.add(boardGroup);

  const theme = getTheme();
  pitMeshes = [];
  seedGroups = [];
  pitHighlightMeshes = [];

  // Board base
  const baseMat = new MeshStandardMaterial({ color: theme.board, emissive: theme.board, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 });
  const base = new Mesh(new BoxGeometry(2.4, 0.08, 0.9), baseMat);
  base.position.set(0, 0.7, -1.8);
  boardGroup.add(base);

  // Board edges
  const edgeMat = new LineBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.6 });
  const edgeGeo = new EdgesGeometry(new BoxGeometry(2.4, 0.08, 0.9));
  const edges = new LineSegments(edgeGeo, edgeMat);
  edges.position.copy(base.position);
  boardGroup.add(edges);

  // Create pits (cylinders)
  const pitGeo = new CylinderGeometry(0.1, 0.1, 0.06, 16);
  const mancalaGeo = new CylinderGeometry(0.12, 0.12, 0.08, 16);
  const pitMat = () => new MeshStandardMaterial({ color: theme.pit, emissive: theme.pit, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });

  // Pit positions: bottom row (player) left to right
  const pitPositions: Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    pitPositions.push(new Vector3(-0.85 + i * 0.32, 0.75, -1.6)); // Player pits 0-5
  }
  pitPositions.push(new Vector3(0.95, 0.75, -1.8)); // Player mancala (6)
  for (let i = 0; i < 6; i++) {
    pitPositions.push(new Vector3(0.75 - i * 0.32, 0.75, -2.0)); // Opponent pits 7-12 (right to left)
  }
  pitPositions.push(new Vector3(-0.95, 0.75, -1.8)); // Opponent mancala (13)

  for (let i = 0; i < 14; i++) {
    const isMancala = i === 6 || i === 13;
    const geo = isMancala ? mancalaGeo : pitGeo;
    const pit = new Mesh(geo, pitMat());
    pit.position.copy(pitPositions[i]);
    pit.userData = { pitIndex: i };
    boardGroup.add(pit);
    pitMeshes.push(pit);

    // Wireframe edges
    const eGeo = new EdgesGeometry(geo);
    const eMesh = new LineSegments(eGeo, new LineBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.4 }));
    eMesh.position.copy(pitPositions[i]);
    boardGroup.add(eMesh);

    // Glow ring
    const ringGeo = new TorusGeometry(isMancala ? 0.14 : 0.12, 0.005, 8, 24);
    const ringMat = new MeshStandardMaterial({ color: theme.glow, emissive: theme.glow, emissiveIntensity: 1.5, transparent: true, opacity: 0.3, blending: AdditiveBlending });
    const ring = new Mesh(ringGeo, ringMat);
    ring.position.copy(pitPositions[i]);
    ring.rotation.x = -Math.PI / 2;
    boardGroup.add(ring);

    // Highlight mesh (hidden by default)
    const hlGeo = new TorusGeometry(isMancala ? 0.15 : 0.13, 0.008, 8, 24);
    const hlMat = new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 2, transparent: true, opacity: 0, blending: AdditiveBlending });
    const hl = new Mesh(hlGeo, hlMat);
    hl.position.copy(pitPositions[i]);
    hl.rotation.x = -Math.PI / 2;
    boardGroup.add(hl);
    pitHighlightMeshes.push(hl);

    // Seed group
    const sg = new Group();
    sg.position.copy(pitPositions[i]);
    boardGroup.add(sg);
    seedGroups.push(sg);
  }

  // Accent lights on mancalas
  const light1 = new PointLight(theme.accent, 0.5, 1);
  light1.position.copy(pitPositions[6]).add(new Vector3(0, 0.3, 0));
  boardGroup.add(light1);
  const light2 = new PointLight(theme.accent, 0.5, 1);
  light2.position.copy(pitPositions[13]).add(new Vector3(0, 0.3, 0));
  boardGroup.add(light2);

  // Labels: "YOU" and "AI" text as small spheres at board edge
  const youIndicator = new Mesh(new SphereGeometry(0.03, 8, 8), new MeshStandardMaterial({ color: '#00ff88', emissive: '#00ff88', emissiveIntensity: 2 }));
  youIndicator.position.set(0, 0.82, -1.45);
  boardGroup.add(youIndicator);

  const aiIndicator = new Mesh(new SphereGeometry(0.03, 8, 8), new MeshStandardMaterial({ color: '#ff4444', emissive: '#ff4444', emissiveIntensity: 2 }));
  aiIndicator.position.set(0, 0.82, -2.15);
  boardGroup.add(aiIndicator);

  updateSeeds();
}

function updateSeeds(): void {
  const skin = getSkin();
  const seedGeo = new SphereGeometry(0.025, 8, 8);

  for (let i = 0; i < 14; i++) {
    // Clear old seeds
    while (seedGroups[i].children.length > 0) {
      seedGroups[i].remove(seedGroups[i].children[0]);
    }

    const count = gsm.board[i];
    const isMancala = i === 6 || i === 13;
    const radius = isMancala ? 0.08 : 0.06;

    for (let j = 0; j < count; j++) {
      const mat = new MeshStandardMaterial({
        color: skin.color,
        emissive: skin.emissive,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.9,
      });
      const s = new Mesh(seedGeo, mat);

      // Position seeds in a spiral/random pattern inside pit
      if (count <= 6) {
        const angle = (j / Math.max(count, 1)) * Math.PI * 2;
        const r = radius * 0.5;
        s.position.set(Math.cos(angle) * r, 0.04 + j * 0.015, Math.sin(angle) * r);
      } else {
        const layer = Math.floor(j / 6);
        const idx = j % 6;
        const angle = (idx / 6) * Math.PI * 2 + layer * 0.5;
        const r = radius * (0.3 + layer * 0.2);
        s.position.set(Math.cos(angle) * r, 0.04 + j * 0.012, Math.sin(angle) * r);
      }
      s.scale.setScalar(0.8 + Math.random() * 0.4);
      seedGroups[i].add(s);
    }
  }
}

// ========== HOLODECK ENVIRONMENT ==========

function buildEnvironment(scene: Scene): void {
  const theme = getTheme();

  // Floor grid
  const floorGrid = new GridHelper(20, 20, theme.grid, theme.grid);
  (floorGrid.material as LineBasicMaterial).transparent = true;
  (floorGrid.material as LineBasicMaterial).opacity = 0.15;
  scene.add(floorGrid);

  // Ceiling grid
  const ceilGrid = new GridHelper(20, 20, theme.grid, theme.grid);
  ceilGrid.position.y = 4;
  (ceilGrid.material as LineBasicMaterial).transparent = true;
  (ceilGrid.material as LineBasicMaterial).opacity = 0.08;
  scene.add(ceilGrid);

  // Floating decorations
  const decoGeos = [new TorusGeometry(0.15, 0.03, 8, 16), new BoxGeometry(0.2, 0.2, 0.2), new SphereGeometry(0.12, 8, 8), new ConeGeometry(0.1, 0.2, 6)];
  for (let i = 0; i < 14; i++) {
    const geo = decoGeos[i % decoGeos.length];
    const mat = new MeshStandardMaterial({ color: theme.accent, emissive: theme.accent, emissiveIntensity: 0.5, wireframe: true, transparent: true, opacity: 0.3 });
    const m = new Mesh(geo, mat);
    const angle = (i / 14) * Math.PI * 2;
    const r = 5 + Math.random() * 3;
    m.position.set(Math.cos(angle) * r, 1 + Math.random() * 2, Math.sin(angle) * r);
    m.userData = { rotSpeed: 0.2 + Math.random() * 0.3, bobSpeed: 0.5 + Math.random() * 0.5, bobOffset: Math.random() * Math.PI * 2, baseY: m.position.y };
    scene.add(m);
  }

  // Ambient particles
  const ambGeo = new BufferGeometry();
  const positions = new Float32Array(40 * 3);
  for (let i = 0; i < 40; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = 0.5 + Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  ambGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const ambMat = new PointsMaterial({ color: theme.accent, size: 0.02, transparent: true, opacity: 0.4, blending: AdditiveBlending });
  scene.add(new Points(ambGeo, ambMat));

  // Lighting
  scene.add(new AmbientLight(0x111122, 0.4));
  const dir = new DirectionalLight(0xffffff, 0.3);
  dir.position.set(2, 4, 2);
  scene.add(dir);
  const accent1 = new PointLight(theme.accent, 0.6, 8);
  accent1.position.set(-2, 2.5, -2);
  scene.add(accent1);
  const accent2 = new PointLight(theme.accent, 0.4, 8);
  accent2.position.set(2, 2.5, -2);
  scene.add(accent2);

  // Fog
  scene.fog = new FogExp2(theme.fog, 0.08);
  scene.background = new Color(theme.bg);
}

// ========== UI HELPERS ==========

const getDoc = (e: Entity) => e.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
const setText = (e: Entity, id: string, text: string) => (getDoc(e)?.getElementById(id) as UIKit.Text | undefined)?.setProperties({ text });
const setVis = (e: Entity | null, vis: boolean) => { if (e) { const o = e.object3D; if (o) o.visible = vis; } };

function showPanel(panel: string): void {
  setVis(titleEntity, panel === 'title');
  setVis(modeEntity, panel === 'mode_select');
  setVis(diffEntity, panel === 'difficulty');
  setVis(hudEntity, panel === 'playing' || panel === 'paused');
  setVis(pauseEntity, panel === 'paused');
  setVis(gameoverEntity, panel === 'gameover');
  setVis(achieveEntity, panel === 'achievements');
  setVis(settingsEntity, panel === 'settings');
  setVis(helpEntity, panel === 'help');
  setVis(skinsEntity, panel === 'skins');
  setVis(statsEntity, panel === 'stats');
  setVis(leaderEntity, panel === 'leaderboard');
  setVis(countdownEntity, panel === 'countdown');
  setVis(extraTurnEntity, false);
  if (boardGroup) boardGroup.visible = panel === 'playing' || panel === 'paused' || panel === 'gameover' || panel === 'countdown';
  gsm.gameState = panel as GameState;
}

function showToast(msg: string): void {
  toastQueue.push(msg);
}

function updateHUD(): void {
  if (!hudEntity) return;
  setText(hudEntity, 'hud-score', `You: ${gsm.board[6]}`);
  setText(hudEntity, 'hud-ai', `AI: ${gsm.board[13]}`);
  setText(hudEntity, 'hud-turn', gsm.currentPlayer === 0 ? 'Your Turn' : 'AI Thinking...');
  setText(hudEntity, 'hud-mode', gsm.selectedMode.toUpperCase());
  if (gsm.selectedMode === 'speed' && gsm.currentPlayer === 0) {
    setText(hudEntity, 'hud-timer', `${Math.ceil(gsm.turnTimer)}s`);
  } else {
    setText(hudEntity, 'hud-timer', '');
  }
  if (gsm.selectedMode === 'marathon') {
    setText(hudEntity, 'hud-marathon', `Series: ${gsm.marathonPlayerWins}-${gsm.marathonOpponentWins} (Game ${gsm.marathonGame}/5)`);
  } else {
    setText(hudEntity, 'hud-marathon', '');
  }
}

function updateAchievementsPanel(): void {
  if (!achieveEntity) return;
  const pageSize = 15;
  const page = 0; // simplified -- single page for now
  for (let i = 0; i < pageSize; i++) {
    const a = ACHIEVEMENTS[page * pageSize + i];
    if (!a) {
      setText(achieveEntity, `ach-${i}`, '');
      continue;
    }
    const done = gsm.unlockedAchievements.has(a.id) ? '[X]' : '[ ]';
    setText(achieveEntity, `ach-${i}`, `${done} ${a.name} - ${a.desc}`);
  }
}

function checkAchievements(): void {
  for (const a of ACHIEVEMENTS) {
    if (gsm.unlockedAchievements.has(a.id)) continue;
    if (a.check(gsm.stats)) {
      gsm.unlockedAchievements.add(a.id);
      showToast(`Achievement: ${a.name}!`);
      audio.playAchievement();
    }
  }
}

function updateStatsPanel(): void {
  if (!statsEntity) return;
  setText(statsEntity, 'stat-0', `Games Played: ${gsm.stats.games}`);
  setText(statsEntity, 'stat-1', `Wins: ${gsm.stats.wins}`);
  setText(statsEntity, 'stat-2', `Losses: ${gsm.stats.losses}`);
  setText(statsEntity, 'stat-3', `Draws: ${gsm.stats.draws}`);
  setText(statsEntity, 'stat-4', `Total Sows: ${gsm.stats.totalSows}`);
  setText(statsEntity, 'stat-5', `Total Captures: ${gsm.stats.totalCaptures}`);
  setText(statsEntity, 'stat-6', `Best Score: ${gsm.stats.bestScore}`);
  setText(statsEntity, 'stat-7', `Extra Turns Earned: ${gsm.stats.extraTurns}`);
  setText(statsEntity, 'stat-8', `Win Streak: ${gsm.stats.longestWinStreak}`);
  setText(statsEntity, 'stat-9', `Level: ${gsm.level} (${gsm.xp}/${gsm.getXpForLevel(gsm.level)} XP)`);
}

function updateSkinsPanel(): void {
  if (!skinsEntity) return;
  for (let i = 0; i < SEED_SKINS.length; i++) {
    const sk = SEED_SKINS[i];
    let status = 'LOCKED';
    if (i === 0) status = gsm.skinIndex === i ? 'EQUIPPED' : 'SELECT';
    else {
      let unlocked = false;
      if (sk.unlock === 'sows' && gsm.stats.totalSows >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'score' && gsm.stats.bestScore >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'games' && gsm.stats.games >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'captures' && gsm.stats.totalCaptures >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'wins' && gsm.stats.wins >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'extra_turns' && gsm.stats.extraTurns >= sk.unlockReq) unlocked = true;
      if (sk.unlock === 'all_modes' && gsm.stats.modesPlayed.size >= 8) unlocked = true;
      status = unlocked ? (gsm.skinIndex === i ? 'EQUIPPED' : 'SELECT') : 'LOCKED';
    }
    setText(skinsEntity, `skin-${i}`, `${sk.name} - ${status}`);
  }
}

function updateSettingsPanel(): void {
  if (!settingsEntity) return;
  setText(settingsEntity, 'master-val', `${Math.round(audio.masterLevel * 100)}%`);
  setText(settingsEntity, 'sfx-val', `${Math.round(audio.sfxLevel * 100)}%`);
  setText(settingsEntity, 'music-val', `${Math.round(audio.musicLevel * 100)}%`);
  setText(settingsEntity, 'theme-val', getTheme().name);
}

function startCountdown(callback: () => void): void {
  gsm.countdownValue = 3;
  countdownTimer = 0;
  countdownCallback = callback;
  showPanel('countdown');
  if (countdownEntity) setText(countdownEntity, 'cd-text', '3');
  audio.playCountdown();
}

function startGame(): void {
  gsm.initBoard(gsm.selectedMode);
  gsm.stats.modesPlayed.add(gsm.selectedMode);
  gsm.stats.themesUsed.add(getTheme().name);

  if (gsm.selectedMode === 'speed') {
    gsm.turnTimeLimit = gsm.difficulty === 0 ? 20 : gsm.difficulty === 1 ? 15 : 10;
    gsm.turnTimer = gsm.turnTimeLimit;
  }

  if (gsm.selectedMode === 'marathon') {
    gsm.marathonGame++;
  }

  buildBoard(sceneRef!);
  showPanel('playing');
  updateHUD();
  audio.playGameStart();
}

function handlePitClick(pitIndex: number): void {
  if (gsm.gameState !== 'playing') return;
  if (gsm.currentPlayer !== 0) return;
  if (gsm.animating) return;
  if (pitIndex < 0 || pitIndex > 5) return;
  if (gsm.board[pitIndex] === 0) { audio.playInvalid(); return; }

  audio.init();
  audio.playSow();

  // Save for undo (practice mode)
  if (gsm.selectedMode === 'practice') {
    gsm.moveHistory.push([...gsm.board]);
  }

  // Perform sow
  const isAvalanche = gsm.selectedMode === 'avalanche';
  const result = gsm.sow(pitIndex, isAvalanche);

  gsm.stats.totalSows++;
  gsm.stats.totalSeeds += gsm.board[6];

  if (result.captured > 0) {
    gsm.stats.totalCaptures++;
    gsm.gameCapturesThisGame++;
    gsm.lastMoveWasCapture = true;
    audio.playCapture();
    if (particles) particles.burst(pitMeshes[6].position.x, pitMeshes[6].position.y + 0.1, pitMeshes[6].position.z, 15, getSkin().glowColor);
    showToast(`Captured ${result.captured} seeds!`);
  }

  if (result.extraTurn) {
    gsm.stats.extraTurns++;
    gsm.lastMoveWasExtra = true;
    audio.playExtraTurn();
    showToast('Extra turn!');
    if (extraTurnEntity) {
      setVis(extraTurnEntity, true);
      setTimeout(() => setVis(extraTurnEntity, false), 1500);
    }
  }

  updateSeeds();
  updateHUD();

  // Check game over
  if (gsm.isGameOver()) {
    endGame();
    return;
  }

  if (result.extraTurn) {
    // Player goes again
    gsm.currentPlayer = 0;
    if (gsm.selectedMode === 'speed') gsm.turnTimer = gsm.turnTimeLimit;
    if (gsm.selectedMode === 'zen') gsm.hintPit = gsm.computeHint();
  } else {
    gsm.currentPlayer = 1;
    aiPending = true;
    aiTurnTimer = 0.8;
  }

  updateHUD();

  // Check if opponent was behind by 10+
  if (gsm.board[6] - gsm.board[13] <= -10) gsm.wasBehindBy10 = true;
}

function doAiTurn(): void {
  const move = gsm.aiMove();
  if (move === -1) { endGame(); return; }

  audio.playSow();
  const isAvalanche = gsm.selectedMode === 'avalanche';
  const result = gsm.sow(move, isAvalanche);

  if (result.captured > 0) {
    audio.playCapture();
    if (particles) particles.burst(pitMeshes[13].position.x, pitMeshes[13].position.y + 0.1, pitMeshes[13].position.z, 12, '#ff4444');
  }

  updateSeeds();

  if (gsm.isGameOver()) {
    endGame();
    return;
  }

  if (result.extraTurn) {
    // AI goes again
    aiPending = true;
    aiTurnTimer = 0.6;
  } else {
    gsm.currentPlayer = 0;
    if (gsm.selectedMode === 'speed') gsm.turnTimer = gsm.turnTimeLimit;
    if (gsm.selectedMode === 'zen') gsm.hintPit = gsm.computeHint();
  }
  updateHUD();
}

function endGame(): void {
  gsm.finishGame();
  updateSeeds();

  const playerScore = gsm.board[6];
  const opponentScore = gsm.board[13];
  const elapsed = (Date.now() - gsm.gameStartTime) / 1000;

  gsm.stats.games++;
  gsm.stats.totalSeeds += playerScore;
  if (playerScore > gsm.stats.bestScore) gsm.stats.bestScore = playerScore;
  gsm.stats.totalPlayTime += elapsed;

  let result = '';
  if (playerScore > opponentScore) {
    gsm.stats.wins++;
    gsm.stats.currentWinStreak++;
    if (gsm.stats.currentWinStreak > gsm.stats.longestWinStreak) gsm.stats.longestWinStreak = gsm.stats.currentWinStreak;
    result = 'YOU WIN!';
    audio.playWin();
    if (particles) particles.burst(0, 1.5, -1.8, 25, getSkin().glowColor, 3);

    if (playerScore === 48) gsm.stats.perfectGames++;
    if (elapsed < 60) gsm.stats.fastWins++;
    if (gsm.wasBehindBy10) gsm.stats.comebacks++;
  } else if (playerScore < opponentScore) {
    gsm.stats.losses++;
    gsm.stats.currentWinStreak = 0;
    result = 'AI WINS';
    audio.playGameOver();
  } else {
    gsm.stats.draws++;
    gsm.stats.currentWinStreak = 0;
    result = 'DRAW';
    audio.playGameOver();
  }

  // Daily tracking
  if (gsm.selectedMode === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    gsm.stats.dailyDone++;
    if (gsm.stats.lastDaily === '') {
      gsm.stats.dailyStreak = 1;
    } else {
      const last = new Date(gsm.stats.lastDaily);
      const now = new Date(today);
      const diff = (now.getTime() - last.getTime()) / 86400000;
      gsm.stats.dailyStreak = diff <= 1 ? gsm.stats.dailyStreak + 1 : 1;
    }
    gsm.stats.lastDaily = today;
  }

  // XP
  gsm.addXp(Math.floor(playerScore / 2) + (playerScore > opponentScore ? 20 : 5));

  // Marathon
  if (gsm.selectedMode === 'marathon') {
    if (playerScore > opponentScore) gsm.marathonPlayerWins++;
    else if (opponentScore > playerScore) gsm.marathonOpponentWins++;

    if (gsm.marathonPlayerWins >= 3 || gsm.marathonOpponentWins >= 3 || gsm.marathonGame >= 5) {
      result += ` | Series: ${gsm.marathonPlayerWins}-${gsm.marathonOpponentWins}`;
    }
  }

  // Leaderboard
  gsm.leaderboard.push({ score: playerScore, mode: gsm.selectedMode, date: new Date().toISOString().slice(0, 10) });
  gsm.leaderboard.sort((a, b) => b.score - a.score);
  gsm.leaderboard = gsm.leaderboard.slice(0, 20);

  checkAchievements();
  gsm.saveState();

  // Update gameover panel
  if (gameoverEntity) {
    setText(gameoverEntity, 'go-result', result);
    setText(gameoverEntity, 'go-player', `Your Score: ${playerScore}`);
    setText(gameoverEntity, 'go-ai', `AI Score: ${opponentScore}`);
    setText(gameoverEntity, 'go-time', `Time: ${Math.floor(elapsed)}s`);
    setText(gameoverEntity, 'go-captures', `Captures: ${gsm.gameCapturesThisGame}`);
    setText(gameoverEntity, 'go-level', `Level ${gsm.level}`);
  }

  showPanel('gameover');
}

// ========== ECS SYSTEMS ==========

class GameSystem extends createSystem({
  title: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/title.json')] },
  mode: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/mode.json')] },
  diff: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/difficulty.json')] },
  hud: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/hud.json')] },
  pause: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/pause.json')] },
  gameover: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/gameover.json')] },
  achieve: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/achievements.json')] },
  settings: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/settings.json')] },
  help: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/help.json')] },
  skins: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/skins.json')] },
  stats: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/stats.json')] },
  leader: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/leaderboard.json')] },
  toast: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/toast.json')] },
  cd: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/countdown.json')] },
  extra: { required: [PanelUI, PanelDocument], where: [eq(PanelUI, 'config', './ui/extraturn.json')] },
}) {
  init() {
    const click = (q: string, id: string, cb: () => void) => {
      (this.queries as any)[q].subscribe('qualify', (entity: Entity) => {
        const doc = getDoc(entity);
        if (!doc) return;
        const btn = doc.getElementById(id) as UIKit.Text | undefined;
        btn?.addEventListener('click', () => { audio.init(); audio.playClick(); cb(); });
      });
    };

    // TITLE
    this.queries.title.subscribe('qualify', (entity: Entity) => {
      titleEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      setText(entity, 'title-level', `Level ${gsm.level}`);
      const btns = [
        ['btn-play', () => showPanel('mode_select')],
        ['btn-scores', () => { updateLeaderboard(); showPanel('leaderboard'); }],
        ['btn-achieve', () => { updateAchievementsPanel(); showPanel('achievements'); }],
        ['btn-stats', () => { updateStatsPanel(); showPanel('stats'); }],
        ['btn-skins', () => { updateSkinsPanel(); showPanel('skins'); }],
        ['btn-settings', () => { updateSettingsPanel(); showPanel('settings'); }],
        ['btn-help', () => showPanel('help')],
      ] as [string, () => void][];
      for (const [id, cb] of btns) {
        const b = doc.getElementById(id) as UIKit.Text | undefined;
        b?.addEventListener('click', () => { audio.init(); audio.playClick(); cb(); });
      }
    });

    // MODE SELECT
    this.queries.mode.subscribe('qualify', (entity: Entity) => {
      modeEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      for (const m of GAME_MODES) {
        const b = doc.getElementById(`btn-${m.id}`) as UIKit.Text | undefined;
        b?.addEventListener('click', () => { audio.init(); audio.playClick(); gsm.selectedMode = m.id; showPanel('difficulty'); });
      }
      const back = doc.getElementById('btn-back') as UIKit.Text | undefined;
      back?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // DIFFICULTY
    this.queries.diff.subscribe('qualify', (entity: Entity) => {
      diffEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      for (let d = 0; d < 3; d++) {
        const b = doc.getElementById(`btn-diff-${d}`) as UIKit.Text | undefined;
        b?.addEventListener('click', () => {
          audio.init(); audio.playClick();
          gsm.difficulty = d;
          if (gsm.selectedMode === 'marathon') {
            gsm.marathonPlayerWins = 0;
            gsm.marathonOpponentWins = 0;
            gsm.marathonGame = 0;
          }
          startCountdown(() => startGame());
        });
      }
      const back = doc.getElementById('btn-back') as UIKit.Text | undefined;
      back?.addEventListener('click', () => { audio.playClick(); showPanel('mode_select'); });
    });

    // HUD
    this.queries.hud.subscribe('qualify', (entity: Entity) => { hudEntity = entity; });

    // PAUSE
    this.queries.pause.subscribe('qualify', (entity: Entity) => {
      pauseEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      (doc.getElementById('btn-resume') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('playing'); });
      (doc.getElementById('btn-quit') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // GAMEOVER
    this.queries.gameover.subscribe('qualify', (entity: Entity) => {
      gameoverEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      (doc.getElementById('btn-rematch') as UIKit.Text | undefined)?.addEventListener('click', () => {
        audio.playClick();
        if (gsm.selectedMode === 'marathon' && gsm.marathonPlayerWins < 3 && gsm.marathonOpponentWins < 3 && gsm.marathonGame < 5) {
          startCountdown(() => startGame());
        } else {
          if (gsm.selectedMode === 'marathon') {
            gsm.marathonPlayerWins = 0;
            gsm.marathonOpponentWins = 0;
            gsm.marathonGame = 0;
          }
          startCountdown(() => startGame());
        }
      });
      (doc.getElementById('btn-menu') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // ACHIEVEMENTS
    this.queries.achieve.subscribe('qualify', (entity: Entity) => { achieveEntity = entity; });

    // SETTINGS
    this.queries.settings.subscribe('qualify', (entity: Entity) => {
      settingsEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      const volBtn = (id: string, getter: () => number, setter: (v: number) => void, valId: string) => {
        (doc.getElementById(`${id}-up`) as UIKit.Text | undefined)?.addEventListener('click', () => {
          audio.playClick(); setter(Math.min(1, getter() + 0.1)); updateSettingsPanel();
        });
        (doc.getElementById(`${id}-down`) as UIKit.Text | undefined)?.addEventListener('click', () => {
          audio.playClick(); setter(Math.max(0, getter() - 0.1)); updateSettingsPanel();
        });
      };
      volBtn('master', () => audio.masterLevel, v => audio.setMaster(v), 'master-val');
      volBtn('sfx', () => audio.sfxLevel, v => audio.setSfx(v), 'sfx-val');
      volBtn('music', () => audio.musicLevel, v => audio.setMusic(v), 'music-val');
      (doc.getElementById('theme-prev') as UIKit.Text | undefined)?.addEventListener('click', () => {
        audio.playClick();
        gsm.themeIndex = (gsm.themeIndex - 1 + THEMES.length) % THEMES.length;
        gsm.stats.themesUsed.add(getTheme().name);
        updateSettingsPanel();
        // Rebuild environment would be complex; just note theme change
      });
      (doc.getElementById('theme-next') as UIKit.Text | undefined)?.addEventListener('click', () => {
        audio.playClick();
        gsm.themeIndex = (gsm.themeIndex + 1) % THEMES.length;
        gsm.stats.themesUsed.add(getTheme().name);
        updateSettingsPanel();
      });
      (doc.getElementById('btn-back') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); gsm.saveState(); showPanel('title'); });
    });

    // HELP
    this.queries.help.subscribe('qualify', (entity: Entity) => {
      helpEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      (doc.getElementById('btn-back') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // SKINS
    this.queries.skins.subscribe('qualify', (entity: Entity) => {
      skinsEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      for (let i = 0; i < SEED_SKINS.length; i++) {
        (doc.getElementById(`btn-skin-${i}`) as UIKit.Text | undefined)?.addEventListener('click', () => {
          audio.playClick();
          // Check if unlocked
          const sk = SEED_SKINS[i];
          let unlocked = i === 0;
          if (sk.unlock === 'sows' && gsm.stats.totalSows >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'score' && gsm.stats.bestScore >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'games' && gsm.stats.games >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'captures' && gsm.stats.totalCaptures >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'wins' && gsm.stats.wins >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'extra_turns' && gsm.stats.extraTurns >= sk.unlockReq) unlocked = true;
          if (sk.unlock === 'all_modes' && gsm.stats.modesPlayed.size >= 8) unlocked = true;
          if (unlocked) {
            gsm.skinIndex = i;
            gsm.stats.skinsUsed.add(sk.name);
            updateSkinsPanel();
            gsm.saveState();
          } else {
            audio.playInvalid();
          }
        });
      }
      (doc.getElementById('btn-back') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // STATS
    this.queries.stats.subscribe('qualify', (entity: Entity) => {
      statsEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      (doc.getElementById('btn-back') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // LEADERBOARD
    this.queries.leader.subscribe('qualify', (entity: Entity) => {
      leaderEntity = entity;
      const doc = getDoc(entity);
      if (!doc) return;
      (doc.getElementById('btn-back') as UIKit.Text | undefined)?.addEventListener('click', () => { audio.playClick(); showPanel('title'); });
    });

    // TOAST
    this.queries.toast.subscribe('qualify', (entity: Entity) => { toastEntity = entity; setVis(entity, false); });

    // COUNTDOWN
    this.queries.cd.subscribe('qualify', (entity: Entity) => { countdownEntity = entity; setVis(entity, false); });

    // EXTRA TURN
    this.queries.extra.subscribe('qualify', (entity: Entity) => { extraTurnEntity = entity; setVis(entity, false); });
  }

  update(delta: number, time: number) {
    // Countdown logic
    if (gsm.gameState === 'countdown') {
      countdownTimer += delta;
      if (countdownTimer >= 1) {
        countdownTimer -= 1;
        gsm.countdownValue--;
        if (gsm.countdownValue <= 0) {
          if (countdownEntity) setText(countdownEntity, 'cd-text', 'SOW!');
          audio.playGo();
          setTimeout(() => {
            if (countdownCallback) countdownCallback();
            countdownCallback = null;
          }, 400);
        } else {
          if (countdownEntity) setText(countdownEntity, 'cd-text', `${gsm.countdownValue}`);
          audio.playCountdown();
        }
      }
    }

    // AI turn delay
    if (aiPending && gsm.gameState === 'playing') {
      aiTurnTimer -= delta;
      if (aiTurnTimer <= 0) {
        aiPending = false;
        doAiTurn();
      }
    }

    // Speed mode timer
    if (gsm.gameState === 'playing' && gsm.selectedMode === 'speed' && gsm.currentPlayer === 0) {
      gsm.turnTimer -= delta;
      updateHUD();
      if (gsm.turnTimer <= 0) {
        // Time's up -- random move
        const moves = gsm.getValidMoves(0);
        if (moves.length > 0) {
          handlePitClick(moves[Math.floor(Math.random() * moves.length)]);
        }
      }
    }

    // Toast display
    if (toastEntity) {
      if (toastTimer > 0) {
        toastTimer -= delta;
        if (toastTimer <= 0) {
          setVis(toastEntity, false);
          // Show next if queued
          if (toastQueue.length > 0) {
            const msg = toastQueue.shift()!;
            setText(toastEntity, 'toast-text', msg);
            setVis(toastEntity, true);
            toastTimer = 2;
          }
        }
      } else if (toastQueue.length > 0) {
        const msg = toastQueue.shift()!;
        setText(toastEntity, 'toast-text', msg);
        setVis(toastEntity, true);
        toastTimer = 2;
      }
    }

    // Particles
    if (particles) particles.update(delta);

    // Pit highlight animation
    if (gsm.gameState === 'playing' && gsm.currentPlayer === 0) {
      for (let i = 0; i < 6; i++) {
        const hl = pitHighlightMeshes[i];
        if (!hl) continue;
        const mat = hl.material as MeshStandardMaterial;
        if (i === hoveredPit && gsm.board[i] > 0) {
          mat.opacity = 0.5 + Math.sin(time * 6) * 0.3;
          mat.emissive.set('#00ffff');
        } else if (gsm.selectedMode === 'zen' && i === gsm.hintPit) {
          mat.opacity = 0.3 + Math.sin(time * 3) * 0.2;
          mat.emissive.set('#ffff00');
        } else {
          mat.opacity = 0;
        }
      }
    }

    // Seed bob animation
    if (gsm.gameState === 'playing' || gsm.gameState === 'paused' || gsm.gameState === 'gameover') {
      for (let i = 0; i < 14; i++) {
        for (let j = 0; j < seedGroups[i].children.length; j++) {
          const s = seedGroups[i].children[j];
          s.rotation.y = time * (0.5 + j * 0.1);
          s.position.y = 0.04 + j * 0.012 + Math.sin(time * 2 + j) * 0.003;
        }
      }
    }

    // Floating decorations animation
    if (sceneRef) {
      for (const child of sceneRef.children) {
        if (child.userData.rotSpeed) {
          child.rotation.y += child.userData.rotSpeed * delta;
          child.rotation.x += child.userData.rotSpeed * 0.3 * delta;
          child.position.y = child.userData.baseY + Math.sin(time * child.userData.bobSpeed + child.userData.bobOffset) * 0.15;
        }
      }
    }
  }
}

function updateLeaderboard(): void {
  if (!leaderEntity) return;
  for (let i = 0; i < 10; i++) {
    const entry = gsm.leaderboard[i];
    if (entry) {
      setText(leaderEntity, `lb-${i}`, `#${i + 1}: ${entry.score} pts - ${entry.mode} - ${entry.date}`);
    } else {
      setText(leaderEntity, `lb-${i}`, '');
    }
  }
}

// ========== INIT WORLD ==========

async function main() {
  const world = await World.create(container, {
    xr: { offer: 'once' },
    features: {
      locomotion: { browserControls: true } as any,
    },
  });

  worldRef = world;
  sceneRef = world.scene;

  // Build environment
  buildEnvironment(world.scene);

  // Build initial board (hidden until game starts)
  buildBoard(world.scene);
  boardGroup.visible = false;

  // Init particles
  particles = new ParticlePool(world.scene);

  // Create UI panels
  const createPanel = (config: string, follower: boolean = false, screenSpace: boolean = false) => {
    const e = world.createEntity();
    e.addComponent(PanelUI, { config });
    if (follower) {
      e.addComponent(Follower as any, {});
      const fv = (e as any).getVectorView?.(Follower, 'offsetPosition');
      if (fv) { fv[0] = 0; fv[1] = 0; fv[2] = -1.2; }
    }
    if (screenSpace) {
      e.addComponent(ScreenSpace as any, {});
    }
    return e;
  };

  // World-space panels
  const worldPanel = (config: string, x: number, y: number, z: number) => {
    const e = world.createEntity();
    e.addComponent(PanelUI, { config });
    const obj = e.object3D;
    if (obj) { obj.position.set(x, y, z); }
    return e;
  };

  // Create all panels
  worldPanel('./ui/title.json', 0, 1.6, -3);
  worldPanel('./ui/mode.json', 0, 1.6, -3);
  worldPanel('./ui/difficulty.json', 0, 1.6, -3);
  createPanel('./ui/hud.json', true);
  worldPanel('./ui/pause.json', 0, 1.6, -3);
  worldPanel('./ui/gameover.json', 0, 1.6, -3);
  worldPanel('./ui/achievements.json', 0, 1.6, -3);
  worldPanel('./ui/settings.json', 0, 1.6, -3);
  worldPanel('./ui/help.json', 0, 1.6, -3);
  worldPanel('./ui/skins.json', 0, 1.6, -3);
  worldPanel('./ui/stats.json', 0, 1.6, -3);
  worldPanel('./ui/leaderboard.json', 0, 1.6, -3);
  createPanel('./ui/toast.json', true);
  createPanel('./ui/countdown.json', true);
  createPanel('./ui/extraturn.json', true);

  // Register game system
  world.registerSystem(GameSystem);

  // Mouse interaction for pits
  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  const onClick = (e: MouseEvent) => {
    if (gsm.gameState !== 'playing' || gsm.currentPlayer !== 0) return;
    audio.init();

    raycaster.setFromCamera(mouse, world.camera);
    const intersects = raycaster.intersectObjects(pitMeshes.slice(0, 6));
    if (intersects.length > 0) {
      const pitIndex = intersects[0].object.userData.pitIndex;
      if (pitIndex >= 0 && pitIndex <= 5) {
        handlePitClick(pitIndex);
      }
    }
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);

  // Keyboard
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'p') {
      if (gsm.gameState === 'playing') showPanel('paused');
      else if (gsm.gameState === 'paused') showPanel('playing');
    }
    if (e.key === 'h' && gsm.gameState === 'playing' && gsm.currentPlayer === 0) {
      gsm.hintPit = gsm.computeHint();
      showToast(`Hint: Pit ${gsm.hintPit + 1}`);
    }
    if (e.key === 'u' && gsm.selectedMode === 'practice' && gsm.moveHistory.length > 0) {
      gsm.board = gsm.moveHistory.pop()!;
      gsm.currentPlayer = 0;
      updateSeeds();
      updateHUD();
      showToast('Move undone');
    }
    // Number keys 1-6 for pit selection
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6 && gsm.gameState === 'playing' && gsm.currentPlayer === 0) {
      handlePitClick(num - 1);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // XR controller input
  const onXRSelect = () => {
    if (gsm.gameState !== 'playing' || gsm.currentPlayer !== 0) return;
    // Raycast from XR controller
    const session = (world.renderer as any).xr?.getSession?.();
    if (!session) return;
    // Use last hover target
    if (hoveredPit >= 0 && hoveredPit <= 5) {
      handlePitClick(hoveredPit);
    }
  };

  // Hover detection update (runs per-frame via raycaster)
  const updateHover = () => {
    if (gsm.gameState !== 'playing') { hoveredPit = -1; return; }
    raycaster.setFromCamera(mouse, world.camera);
    const intersects = raycaster.intersectObjects(pitMeshes.slice(0, 6));
    hoveredPit = intersects.length > 0 ? intersects[0].object.userData.pitIndex : -1;
  };

  // Add hover update to animation frame (simple approach)
  const origUpdate = world.scene.onBeforeRender;
  world.scene.onBeforeRender = (...args: any) => {
    updateHover();
    if (origUpdate) (origUpdate as any)(...args);
  };

  // Initial state
  showPanel('title');
}

main().catch(console.error);
