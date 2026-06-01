import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { Trophy, Star, Clock, Target, Zap, Award, RotateCcw, Home, Settings, Play, Brain, Activity, Eye, Cpu } from 'lucide-react';

const icons = {
  stethoscope: 'M19 14c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-8-2v2h4v6h2V12h4v-2H11z',
  pill: 'M4.22 11.29l7.07-7.07c.78-.78 2.05-.78 2.83 0l2.07 2.07c.78.78.78 2.05 0 2.83l-7.07 7.07c-.78.78-2.05.78-2.83 0L4.22 14.12c-.78-.78-.78-2.05 0-2.83z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  syringe: 'M6.83 19.24l1.77-1.77-2.83-2.83-1.77 1.77c-.78.78-.78 2.05 0 2.83.78.78 2.05.78 2.83 0zm15.66-15.66l-2.83-2.83c-.78-.78-2.05-.78-2.83 0l-8.49 8.49 2.83 2.83 8.49-8.49c.78-.78.78-2.05 0-2.83z',
  thermometer: 'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3-6c.55 0 1 .45 1 1v6.59c.58.35 1 .98 1 1.72 0 1.1-.9 2-2 2s-2-.9-2-2c0-.74.42-1.37 1-1.72V8c0-.55.45-1 1-1z',
  bandage: 'M20.73 7.31L16.69 3.27c-.39-.39-1.02-.39-1.41 0L7.31 11.24c-.39.39-.39 1.02 0 1.41l4.04 4.04c.39.39 1.02.39 1.41 0l7.97-7.97c.39-.39.39-1.02 0-1.41zM14 9c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-4 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
  ambulance: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM12 8.5h1.5v1.5H15v1.5h-1.5V13H12v-1.5h-1.5V10H12V8.5z',
  microscope: 'M9.5 11H7v3h2.5v-3zm4.5 0h-2.5v3H14v-3zM9 8h6V6H9v2zm6.5-8h-7C7.67 0 7 .67 7 1.5S7.67 3 8.5 3h7c.83 0 1.5-.67 1.5-1.5S16.33 0 15.5 0z',
  brain: 'M12 3C8.13 3 5 6.13 5 10c0 1.74.5 3.37 1.41 4.84.91 1.47 2.21 2.67 3.79 3.37.39.17.8.26 1.21.26s.82-.09 1.21-.26c1.58-.7 2.88-1.9 3.79-3.37C17.5 13.37 18 11.74 18 10c0-3.87-3.13-7-7-7zm2.5 9.5h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z',
  dna: 'M12 2l1.09 2.26L16 5.18l-1.64 1.64L15 10l-3-1-3 1 .64-3.18L8 5.18l2.91-0.92L12 2zm0 6l-1.5 4.5h3L12 8zm-6 10l2-6h1l-2 6H6zm12 0h-1l-2-6h1l2 6z',
  virus: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm-1 3v2.5L9.5 8 11 9.5V12h2V9.5L14.5 8 13 9.5V7h-2zm-3 7c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
  test: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h7l5-5V4c0-1.1-.9-2-2-2zm4 15l-3 3H6V4h8v5h4v8zm-6-1V9h4v7h-4zm1-6h2v5h-2V10z',
  vaccine: 'M6 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6-9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  medicine: 'M21 8h-2V6c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2h-2V6c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z'
};

const levels = [
  { pairs: 6, time: 90, desc: "Memory Warmup", difficulty: "Beginner", reward: 100 },
  { pairs: 8, time: 80, desc: "Focus Training", difficulty: "Beginner", reward: 150 },
  { pairs: 10, time: 75, desc: "Concentration Test", difficulty: "Intermediate", reward: 200 },
  { pairs: 12, time: 65, desc: "Mental Agility", difficulty: "Intermediate", reward: 250 },
  { pairs: 14, time: 55, desc: "Cognitive Challenge", difficulty: "Advanced", reward: 300 },
  { pairs: 16, time: 45, desc: "Expert Recall", difficulty: "Advanced", reward: 400 },
  { pairs: 18, time: 40, desc: "ZEVA Master", difficulty: "Expert", reward: 500 },
  { pairs: 20, time: 35, desc: "Memory Virtuoso", difficulty: "Expert", reward: 600 },
  { pairs: 24, time: 30, desc: "Ultimate ZEVA", difficulty: "Legendary", reward: 1000 }
];

interface GameCard {
  id: string;
  icon: string;
  flipped: boolean;
  matched: boolean;
  pulsing: boolean;
  hint: boolean;
}

interface GameStats {
  totalScore: number;
  gamesPlayed: number;
  bestTime: { [key: number]: number };
  perfectGames: number;
  streak: number;
  maxCombo: number;
  totalMatches: number;
}

interface GameState {
  level: number;
  unlocked: number;
  seed: string;
  matched: string[];
  selected: string[];
  attempts: number;
  started: number;
  stats: GameStats;
  soundEnabled: boolean;
  currentScore: number;
  multiplier: number;
  difficulty: 'normal' | 'hard' | 'extreme';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

function ZevaAdvancedMemoryGame() {
  const [state, setState] = useState<GameState>({
    level: 1,
    unlocked: 1,
    seed: '',
    matched: [],
    selected: [],
    attempts: 0,
    started: 0,
    stats: { totalScore: 0, gamesPlayed: 0, bestTime: {}, perfectGames: 0, streak: 0, maxCombo: 0, totalMatches: 0 },
    soundEnabled: true,
    currentScore: 0,
    multiplier: 1,
    difficulty: 'normal'
  });

  const [cards, setCards] = useState<GameCard[]>([]);
  const [time, setTime] = useState<number | null>(null);
  const [status, setStatus] = useState<'menu' | 'playing' | 'won' | 'lost' | 'stats' | 'settings'>('menu');
  const [showMismatch, setShowMismatch] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showHint, setShowHint] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const playSound = useCallback((soundType: 'flip' | 'match' | 'win' | 'lose' | 'combo') => {
    if (!state.soundEnabled) return;
    // Sound effects implementation would go here
    // Removed unused 'type' parameter error by renaming it to 'soundType' and using it
    console.log(`Playing sound: ${soundType}`);
  }, [state.soundEnabled]);

  const createParticles = useCallback((x: number, y: number, color: string = '#2D9AA5') => {
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 150,
      y: y + (Math.random() - 0.5) * 150,
      color
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1500);
  }, []);

  const save = useCallback((update: Partial<GameState>) => {
    const newState = { ...state, ...update };
    setState(newState);
  }, [state]);

  const generateBoard = useCallback((level: number, seed: string): GameCard[] => {
    const iconKeys = Object.keys(icons);
    let seedVal = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const rand = (max: number) => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return Math.floor((seedVal / 233280) * max);
    };

    const pairs = levels[level - 1].pairs;
    const selectedIcons = [];
    const available = [...iconKeys];

    for (let i = 0; i < pairs; i++) {
      const idx = rand(available.length);
      selectedIcons.push(available.splice(idx, 1)[0]);
    }

    const cardList: GameCard[] = selectedIcons.flatMap(icon => [
      { id: `${icon}-1`, icon, flipped: false, matched: false, pulsing: false, hint: false },
      { id: `${icon}-2`, icon, flipped: false, matched: false, pulsing: false, hint: false }
    ]);

    for (let i = cardList.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    return cardList;
  }, []);

  const startLevel = useCallback((level: number) => {
    if (level > state.unlocked) return;

    const seed = Date.now() + Math.random().toString();
    const newCards = generateBoard(level, seed);

    setCards(newCards);
    setStatus('playing');
    setTime(levels[level - 1].time);
    setComboCount(0);
    setShowHint(false);
    save({
      level,
      seed,
      matched: [],
      selected: [],
      attempts: 0,
      started: Date.now(),
      currentScore: 0,
      multiplier: 1
    });
  }, [state.unlocked, generateBoard, save]);

  const useHint = useCallback(() => {
    if (showHint) return;

    const unmatched = cards.filter(c => !c.matched && !c.flipped);
    if (unmatched.length < 2) return;

    const iconGroups: { [key: string]: GameCard[] } = {};
    unmatched.forEach(card => {
      if (!iconGroups[card.icon]) iconGroups[card.icon] = [];
      iconGroups[card.icon].push(card);
    });

    const availablePairs = Object.values(iconGroups).filter(group => group.length >= 2);
    if (availablePairs.length === 0) return;

    const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    const [card1, card2] = randomPair.slice(0, 2);

    setCards(prev => prev.map(c =>
      c.id === card1.id || c.id === card2.id ? { ...c, hint: true } : c
    ));

    setShowHint(true);
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, hint: false })));
      setShowHint(false);
    }, 2000);
  }, [cards, showHint]);

  const handleClick = useCallback((cardId: string) => {
    if (status !== 'playing' || showMismatch) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    playSound('flip');

    const newSelected = [...state.selected, cardId];
    setCards(prev =>
      prev.map(c =>
        c.id === cardId ? { ...c, flipped: true, pulsing: true } : c
      )
    );

    if (newSelected.length === 2) {
      const [first, second] = newSelected.map(id =>
        cards.find(c => c.id === id)
      );

      // ✅ Explicit type guard makes TS happy
      if (first && second && first.icon === second.icon) {
        playSound('match');
        const newCombo = comboCount + 1;
        setComboCount(newCombo);

        if (newCombo >= 3) {
          save({ multiplier: Math.min(state.multiplier + 0.5, 5) });
          playSound('combo');
        }

        // Create particles at card positions
        const cardElements = document.querySelectorAll(
          `[data-card-id="${first.id}"], [data-card-id="${second.id}"]`
        );
        cardElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            '#10B981'
          );
        });

        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              newSelected.includes(c.id)
                ? { ...c, matched: true, pulsing: false }
                : c
            )
          );

          const newMatched = [...state.matched, first.icon];
          save({ matched: newMatched });
        }, 600);
      } else {
        // mismatch case
        setShowMismatch(true);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              newSelected.includes(c.id)
                ? { ...c, flipped: false, pulsing: false }
                : c
            )
          );
          setShowMismatch(false);
          save({ attempts: state.attempts + 1, selected: [] });
        }, 1000);
      }
    } else {
      save({ selected: newSelected });
    }
  }, [status, showMismatch, cards, playSound, comboCount, state, createParticles, save]);


  const resetGame = useCallback(() => {
    setState({
      level: 1,
      unlocked: 1,
      seed: '',
      matched: [],
      selected: [],
      attempts: 0,
      started: 0,
      stats: { totalScore: 0, gamesPlayed: 0, bestTime: {}, perfectGames: 0, streak: 0, maxCombo: 0, totalMatches: 0 },
      soundEnabled: true,
      currentScore: 0,
      multiplier: 1,
      difficulty: 'normal'
    });
    setStatus('menu');
    setCards([]);
    setTime(null);
    setComboCount(0);
    setParticles([]);
  }, []);

  useEffect(() => {
    if (status === 'playing' && time !== null && time > 0) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (time === 0 && status === 'playing') {
      setStatus('lost');
      playSound('lose');
      save({ stats: { ...state.stats, streak: 0 } });
    }
  }, [time, status, playSound, save, state.stats]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'Advanced': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      case 'Expert': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'Legendary': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getGridCols = (cardCount: number) => {
    if (cardCount <= 8) return 'grid-cols-4';
    if (cardCount <= 12) return 'grid-cols-4 sm:grid-cols-6';
    if (cardCount <= 16) return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8';
    return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
  };

  const getRankTitle = (score: number) => {
    if (score >= 10000) return 'ZEVA Grandmaster';
    if (score >= 7500) return 'Memory Virtuoso';
    if (score >= 5000) return 'Cognitive Expert';
    if (score >= 2500) return 'Mental Athlete';
    if (score >= 1000) return 'Focus Specialist';
    return 'Memory Trainee';
  };

  // Statistics View
  if (status === 'stats') {
    return (
      <>
        <Head>
          <title>FitFlip Cards – Fun Exercise Game to Burn Calories Fast</title>
          <meta
            name="description"
            content="Play FitFlip Cards on Zeva to match exercises and burn calories quickly. Enjoy an interactive fitness game that boosts strength, improves health, and keeps you active."
          />
          <meta
            name="keywords"
            content="FitFlip Cards, exercise game, burn calories fast, interactive fitness game, fun workout game, calorie burning exercises, health and fitness game, home workout game, match exercises game, interactive health game, Zeva fitness game, boost strength and immunity, body fitness game"
          />
          
          {/* Schema Markup - FitFlip Cards WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "FitFlip Cards",
                "url": "https://zeva360.com/games/flipcards",
                "description": "FitFlip Cards by ZEVA is a fun fitness card game that helps users burn calories, improve fitness, and stay active through engaging physical challenges.",
                "isPartOf": {
                  "@type": "WebSite",
                  "name": "ZEVA",
                  "url": "https://zeva360.com"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "ZEVA",
                  "url": "https://zeva360.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://zeva360.com/logo.png"
                  }
                },
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": "FitFlip Cards",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An interactive fitness card game designed to improve physical activity, boost metabolism, and make exercise enjoyable through quick workout matches.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  }
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <span style={{ color: '#2D9AA5' }}>Z</span>
                  <span className="text-white">E</span>
                  <span style={{ color: '#2D9AA5' }}>V</span>
                  <span className="text-white">A</span>
                  <span className="ml-3 text-2xl text-gray-300">Analytics</span>
                </h2>
                <p className="text-lg text-[#2D9AA5] font-medium">{getRankTitle(state.stats.totalScore)}</p>
              </div>
              <button
                onClick={() => setStatus('menu')}
                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 self-start sm:self-auto"
              >
                <Home className="w-6 h-6" />
              </button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#2D9AA5]/20 to-blue-600/20 rounded-2xl p-6 border border-[#2D9AA5]/30 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Total Score</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{state.stats.totalScore.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Lifetime points earned</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-6 border border-green-400/30 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-8 h-8 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Perfect Games</h3>
                </div>
                <p className="text-3xl font-bold text-green-400">{state.stats.perfectGames}</p>
                <p className="text-xs text-gray-400 mt-1">Flawless victories</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl p-6 border border-orange-400/30 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-8 h-8 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Win Streak</h3>
                </div>
                <p className="text-3xl font-bold text-orange-400">{state.stats.streak}</p>
                <p className="text-xs text-gray-400 mt-1">Consecutive wins</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-6 border border-purple-400/30 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Max Combo</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400">{state.stats.maxCombo}x</p>
                <p className="text-xs text-gray-400 mt-1">Highest combo achieved</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-[#2D9AA5]" />
                  Best Times
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {levels.map((level, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Level {i + 1}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(level.difficulty)}`}>
                          {level.difficulty}
                        </span>
                      </div>
                      <span className="text-[#2D9AA5] font-bold">
                        {state.stats.bestTime[i + 1] ? `${state.stats.bestTime[i + 1]}s` : '--'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#2D9AA5]" />
                  Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Games Played</span>
                    <span className="text-white font-bold">{state.stats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Matches</span>
                    <span className="text-[#2D9AA5] font-bold">{state.stats.totalMatches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="text-green-400 font-bold">
                      {state.stats.gamesPlayed > 0 ? Math.round((state.stats.gamesPlayed / (state.stats.gamesPlayed + 1)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Avg. Score/Game</span>
                    <span className="text-yellow-400 font-bold">
                      {state.stats.gamesPlayed > 0 ? Math.round(state.stats.totalScore / state.stats.gamesPlayed).toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Gallery */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#2D9AA5]" />
                Achievement Gallery
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.stats.gamesPlayed >= 1 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Star className={`w-8 h-8 mb-2 ${state.stats.gamesPlayed >= 1 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.stats.gamesPlayed >= 1 ? 'text-white' : 'text-gray-400'}`}>First Victory</p>
                  <p className="text-xs text-gray-400">Complete your first level</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.stats.perfectGames >= 3 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Target className={`w-8 h-8 mb-2 ${state.stats.perfectGames >= 3 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.stats.perfectGames >= 3 ? 'text-white' : 'text-gray-400'}`}>Perfectionist</p>
                  <p className="text-xs text-gray-400">3 perfect games</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.unlocked >= 5 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Brain className={`w-8 h-8 mb-2 ${state.unlocked >= 5 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.unlocked >= 5 ? 'text-white' : 'text-gray-400'}`}>Memory Master</p>
                  <p className="text-xs text-gray-400">Unlock level 5</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.stats.maxCombo >= 5 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Zap className={`w-8 h-8 mb-2 ${state.stats.maxCombo >= 5 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.stats.maxCombo >= 5 ? 'text-white' : 'text-gray-400'}`}>Combo Master</p>
                  <p className="text-xs text-gray-400">5x combo streak</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.stats.totalScore >= 5000 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Trophy className={`w-8 h-8 mb-2 ${state.stats.totalScore >= 5000 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.stats.totalScore >= 5000 ? 'text-white' : 'text-gray-400'}`}>High Scorer</p>
                  <p className="text-xs text-gray-400">5000+ total points</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.unlocked >= 9 ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-700/50 border-gray-600/30'
                  }`}>
                  <Award className={`w-8 h-8 mb-2 ${state.unlocked >= 9 ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`font-bold ${state.unlocked >= 9 ? 'text-white' : 'text-gray-400'}`}>Ultimate ZEVA</p>
                  <p className="text-xs text-gray-400">Complete all levels</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Settings View
  if (status === 'settings') {
    return (
      <>
        <Head>
          <title>FitFlip Cards – Fun Exercise Game to Burn Calories Fast</title>
          <meta
            name="description"
            content="Play FitFlip Cards on Zeva to match exercises and burn calories quickly. Enjoy an interactive fitness game that boosts strength, improves health, and keeps you active."
          />
          <meta
            name="keywords"
            content="FitFlip Cards, exercise game, burn calories fast, interactive fitness game, fun workout game, calorie burning exercises, health and fitness game, home workout game, match exercises game, interactive health game, Zeva fitness game, boost strength and immunity, body fitness game"
          />
          
          {/* Schema Markup - FitFlip Cards WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "FitFlip Cards",
                "url": "https://zeva360.com/games/flipcards",
                "description": "FitFlip Cards by ZEVA is a fun fitness card game that helps users burn calories, improve fitness, and stay active through engaging physical challenges.",
                "isPartOf": {
                  "@type": "WebSite",
                  "name": "ZEVA",
                  "url": "https://zeva360.com"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "ZEVA",
                  "url": "https://zeva360.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://zeva360.com/logo.png"
                  }
                },
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": "FitFlip Cards",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An interactive fitness card game designed to improve physical activity, boost metabolism, and make exercise enjoyable through quick workout matches.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  }
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-[#2D9AA5]" />
                Game Settings
              </h2>
              <button
                onClick={() => setStatus('menu')}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
              >
                <Home className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Audio Settings */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Audio</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#2D9AA5] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Z</span>
                    </div>
                    <div>
                      <span className="text-lg font-medium text-white">Sound Effects</span>
                      <p className="text-sm text-gray-400">Card flips, matches, and victory sounds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => save({ soundEnabled: !state.soundEnabled })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${state.soundEnabled ? 'bg-[#2D9AA5]' : 'bg-gray-600'
                      }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${state.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              </div>

              {/* Difficulty Settings */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Difficulty Mode</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['normal', 'hard', 'extreme'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => save({ difficulty: diff as 'normal' | 'hard' | 'extreme' })}
                      className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${state.difficulty === diff
                          ? 'bg-[#2D9AA5]/20 border-[#2D9AA5]/50 text-[#2D9AA5]'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                    >
                      <div className="text-center">
                        <p className="font-bold capitalize">{diff}</p>
                        <p className="text-xs mt-1">
                          {diff === 'normal' ? '1x Score' : diff === 'hard' ? '1.5x Score' : '2x Score'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Progress */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Game Progress</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Levels Unlocked</span>
                    <span className="text-[#2D9AA5] font-bold">{state.unlocked}/{levels.length}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#2D9AA5] to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(state.unlocked / levels.length) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-400/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Main Menu
  if (status === 'menu') {
    return (
      <>
        <Head>
          <title>FitFlip Cards – Fun Exercise Game to Burn Calories Fast</title>
          <meta
            name="description"
            content="Play FitFlip Cards on Zeva to match exercises and burn calories quickly. Enjoy an interactive fitness game that boosts strength, improves health, and keeps you active."
          />
          <meta
            name="keywords"
            content="FitFlip Cards, exercise game, burn calories fast, interactive fitness game, fun workout game, calorie burning exercises, health and fitness game, home workout game, match exercises game, interactive health game, Zeva fitness game, boost strength and immunity, body fitness game"
          />
          
          {/* Schema Markup - FitFlip Cards WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "FitFlip Cards",
                "url": "https://zeva360.com/games/flipcards",
                "description": "FitFlip Cards by ZEVA is a fun fitness card game that helps users burn calories, improve fitness, and stay active through engaging physical challenges.",
                "isPartOf": {
                  "@type": "WebSite",
                  "name": "ZEVA",
                  "url": "https://zeva360.com"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "ZEVA",
                  "url": "https://zeva360.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://zeva360.com/logo.png"
                  }
                },
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": "FitFlip Cards",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An interactive fitness card game designed to improve physical activity, boost metabolism, and make exercise enjoyable through quick workout matches.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  }
                }
              })
            }}
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-8 sm:mb-12 relative">
            {/* Settings Button - Top Right */}
            <button
              onClick={() => setStatus('settings')}
              className="absolute top-0 right-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium transition-all duration-300 border border-white/20 flex items-center justify-center gap-2 hover:scale-105 backdrop-blur-sm"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2D9AA5] to-blue-600 blur-3xl opacity-30 animate-pulse" />
              <h1 className="relative text-4xl sm:text-5xl lg:text-7xl font-black tracking-wider mb-4">
                <span className="bg-gradient-to-r from-[#2D9AA5] via-blue-400 to-[#2D9AA5] bg-clip-text text-transparent animate-gradient">
                  ZEVA
                </span>
              </h1>
            </div>
            <p className="text-l sm:text-xl lg:text-2xl text-gray-300 font-light mb-6">
              Memory Challenge System
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:scale-105 transition-transform duration-300">
                <span className="text-[#2D9AA5] font-bold">Total Score: {state.stats.totalScore.toLocaleString()}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:scale-105 transition-transform duration-300">
                <span className="text-yellow-400 font-bold">Win Streak: {state.stats.streak}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:scale-105 transition-transform duration-300">
                <span className="text-purple-400 font-bold">{getRankTitle(state.stats.totalScore)}</span>
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Level Selection */}
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Choose Your Challenge</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>Difficulty: {state.difficulty}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {levels.map((cfg, i) => (
                    <button
                      key={i}
                      onClick={() => startLevel(i + 1)}
                      disabled={i + 1 > state.unlocked}
                      className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 ${i + 1 <= state.unlocked
                          ? 'bg-gradient-to-br from-[#2D9AA5]/20 to-blue-600/20 hover:from-[#2D9AA5]/30 hover:to-blue-600/30 border border-[#2D9AA5]/40 hover:border-[#2D9AA5]/60 text-white shadow-xl hover:shadow-2xl hover:shadow-[#2D9AA5]/20'
                          : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/50'
                        }`}
                    >
                      {/* Unlock indicator */}
                      {i + 1 <= state.unlocked && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        </div>
                      )}

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">Level {i + 1}</span>
                            {i + 1 <= state.unlocked && (
                              <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110" />
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(cfg.difficulty)}`}>
                            {cfg.difficulty}
                          </span>
                        </div>

                        <p className="text-sm opacity-90 mb-3 font-medium">{cfg.desc}</p>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <Cpu className="w-4 h-4" />
                            <span>{cfg.pairs * 2} cards</span>
                          </div>
                          {cfg.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{cfg.time}s</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold">+{cfg.reward}</span>
                          </div>
                        </div>

                        {/* Best time indicator */}
                        {state.stats.bestTime[i + 1] && (
                          <div className="mt-2 text-xs text-[#2D9AA5] font-medium">
                            Best: {state.stats.bestTime[i + 1]}s
                          </div>
                        )}
                      </div>

                      {/* Hover effect overlay */}
                      {i + 1 <= state.unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2D9AA5]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Player Stats Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-[#2D9AA5]" />
                  Player Profile
                </h3>
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2D9AA5] to-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[#2D9AA5] font-bold">{getRankTitle(state.stats.totalScore)}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Level Progress</span>
                      <span className="text-[#2D9AA5] font-bold">{state.unlocked}/{levels.length}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#2D9AA5] to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(state.unlocked / levels.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Perfect Games</span>
                      <span className="text-green-400 font-bold">{state.stats.perfectGames}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Current Streak</span>
                      <span className="text-orange-400 font-bold">{state.stats.streak}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setStatus('stats')}
                  className="w-full py-4 bg-gradient-to-r from-[#2D9AA5] to-blue-600 hover:from-[#2D9AA5]/80 hover:to-blue-600/80 text-white rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <Trophy className="w-5 h-5" />
                  View Full Statistics
                </button>

                {state.unlocked > 1 && (
                  <button
                    onClick={() => startLevel(state.unlocked)}
                    className="w-full py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 rounded-2xl font-medium transition-all duration-300 border border-purple-400/30 flex items-center justify-center gap-3 hover:scale-105"
                  >
                    <Zap className="w-5 h-5" />
                    Continue (Level {state.unlocked})
                  </button>
                )}
              </div>

              {/* Recent Achievements */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#2D9AA5]" />
                  Achievements
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${state.stats.gamesPlayed >= 1 ? 'bg-green-500/20 border border-green-400/30' : 'bg-gray-700/50 border border-gray-600/30'
                    }`}>
                    <Star className={`w-6 h-6 ${state.stats.gamesPlayed >= 1 ? 'text-yellow-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${state.stats.gamesPlayed >= 1 ? 'text-white' : 'text-gray-400'}`}>First Victory</p>
                      <p className="text-xs text-gray-400">Complete your first level</p>
                    </div>
                    {state.stats.gamesPlayed >= 1 && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${state.stats.perfectGames >= 3 ? 'bg-green-500/20 border border-green-400/30' : 'bg-gray-700/50 border border-gray-600/30'
                    }`}>
                    <Target className={`w-6 h-6 ${state.stats.perfectGames >= 3 ? 'text-yellow-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${state.stats.perfectGames >= 3 ? 'text-white' : 'text-gray-400'}`}>Perfectionist</p>
                      <p className="text-xs text-gray-400">Get 3 perfect games</p>
                    </div>
                    {state.stats.perfectGames >= 3 && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Game Playing View
  const config = levels[state.level - 1];

  return (
    <>
      <Head>
        <title>FitFlip Cards – Fun Exercise Game to Burn Calories Fast</title>
        <meta
          name="description"
          content="Play FitFlip Cards on Zeva to match exercises and burn calories quickly. Enjoy an interactive fitness game that boosts strength, improves health, and keeps you active."
        />
        <meta
          name="keywords"
          content="FitFlip Cards, exercise game, burn calories fast, interactive fitness game, fun workout game, calorie burning exercises, health and fitness game, home workout game, match exercises game, interactive health game, Zeva fitness game, boost strength and immunity, body fitness game"
        />
        
        {/* Schema Markup - FitFlip Cards WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "FitFlip Cards",
              "url": "https://zeva360.com/games/flipcards",
              "description": "FitFlip Cards by ZEVA is a fun fitness card game that helps users burn calories, improve fitness, and stay active through engaging physical challenges.",
              "isPartOf": {
                "@type": "WebSite",
                "name": "ZEVA",
                "url": "https://zeva360.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ZEVA",
                "url": "https://zeva360.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zeva360.com/logo.png"
                }
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": "FitFlip Cards",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "An interactive fitness card game designed to improve physical activity, boost metabolism, and make exercise enjoyable through quick workout matches.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8" ref={gameRef}>
      <div className="max-w-7xl mx-auto">
        {/* Floating Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="fixed w-3 h-3 rounded-full pointer-events-none z-50 animate-ping"
            style={{
              left: particle.x,
              top: particle.y,
              backgroundColor: particle.color,
              animation: 'particle-float 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          />
        ))}

        {/* Enhanced Game Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-4 sm:p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2D9AA5]/5 to-transparent" />

          <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="bg-gradient-to-r from-[#2D9AA5] to-blue-600 rounded-2xl p-4 shadow-lg">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">Z E V A</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
                  Level {state.level}
                  <span className="text-[#2D9AA5]">•</span>
                  <span className="text-lg text-gray-300">{config.desc}</span>
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(config.difficulty)}`}>
                    {config.difficulty}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">{state.difficulty} mode</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Enhanced Stats Display */}
              <div className="flex gap-4">
                {time !== null && (
                  <div className={`bg-white/10 rounded-2xl px-4 py-3 border border-white/20 min-w-[120px] text-center transition-all duration-300 ${time <= 10 ? 'bg-red-500/20 border-red-400/40 animate-pulse' : time <= 20 ? 'bg-yellow-500/20 border-yellow-400/40' : ''
                    }`}>
                    <Clock className={`w-5 h-5 mx-auto mb-1 ${time <= 10 ? 'text-red-400' : time <= 20 ? 'text-yellow-400' : 'text-[#2D9AA5]'}`} />
                    <div className={`text-xl font-bold ${time <= 10 ? 'text-red-400' : time <= 20 ? 'text-yellow-400' : 'text-white'}`}>
                      {time}s
                    </div>
                    <div className="text-xs text-gray-400">Time Left</div>
                  </div>
                )}

                <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20 min-w-[120px] text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-[#2D9AA5]" />
                  <div className="text-xl font-bold text-white">{state.attempts}</div>
                  <div className="text-xs text-gray-400">Attempts</div>
                </div>

                <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20 min-w-[120px] text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                  <div className="text-xl font-bold text-yellow-400">{state.currentScore.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>

                {comboCount > 0 && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl px-4 py-3 border border-purple-400/30 min-w-[120px] text-center animate-pulse">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                    <div className="text-xl font-bold text-purple-400">{comboCount}x</div>
                    <div className="text-xs text-purple-300">Combo</div>
                  </div>
                )}

                {state.multiplier > 1 && (
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl px-4 py-3 border border-orange-400/30 min-w-[120px] text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                    <div className="text-xl font-bold text-orange-400">{state.multiplier}x</div>
                    <div className="text-xs text-orange-300">Multiplier</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('menu')}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
                  title="Back to Menu"
                >
                  <Home className="w-5 h-5" />
                </button>

                <button
                  onClick={useHint}
                  disabled={showHint}
                  className="p-3 rounded-xl bg-[#2D9AA5]/20 hover:bg-[#2D9AA5]/30 text-[#2D9AA5] transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D9AA5]/30"
                  title="Show Hint (2s)"
                >
                  <Eye className="w-5 h-5" />
                </button>


              </div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D9AA5]/5 to-transparent" />

          <div className="relative">
            <div className={`grid gap-3 sm:gap-4 justify-center ${getGridCols(config.pairs * 2)}`}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  data-card-id={card.id}
                  onClick={() => handleClick(card.id)}
                  disabled={showMismatch || card.matched}
                  className={`group relative aspect-square w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl transition-all duration-500 transform hover:scale-110 hover:rotate-3 shadow-lg hover:shadow-2xl ${card.flipped || card.matched
                      ? card.matched
                        ? 'bg-gradient-to-br from-green-500/30 to-emerald-600/30 border-2 border-green-400/50 shadow-green-400/20'
                        : state.selected.includes(card.id) && showMismatch
                          ? 'bg-gradient-to-br from-red-500/30 to-rose-600/30 border-2 border-red-400/50 animate-shake'
                          : 'bg-gradient-to-br from-[#2D9AA5]/30 to-blue-600/30 border-2 border-[#2D9AA5]/50'
                      : 'bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/30 hover:border-[#2D9AA5]/50 hover:bg-[#2D9AA5]/10'
                    } ${card.pulsing ? 'animate-pulse' : ''} ${card.hint ? 'animate-bounce bg-yellow-400/30 border-yellow-400/50' : ''}`}
                >
                  {/* Card Glow Effect */}
                  <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${card.flipped || card.matched ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    } ${card.matched ? 'bg-gradient-to-br from-green-400/20 to-emerald-500/20' : 'bg-gradient-to-br from-[#2D9AA5]/20 to-blue-500/20'
                    }`} />

                  {/* Card Content */}
                  <div className="relative flex items-center justify-center h-full">
                    {card.flipped || card.matched ? (
                      <svg
                        className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 transition-all duration-300 ${card.matched ? 'text-white animate-pulse' : 'text-[#2D9AA5]'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d={icons[card.icon as keyof typeof icons]} />
                      </svg>
                    ) : (
                      <div className="text-center">
                        <div className="w-3 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white/30 rounded-full group-hover:bg-white/50 transition-all duration-300 mb-1" />
                        <div className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-[#2D9AA5] tracking-wider">
                          ZEVA
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Matched indicator */}
                  {card.matched && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white/20">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Win/Loss Screen */}
        {(status === 'won' || status === 'lost') && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full text-center relative overflow-hidden">
              <div className={`absolute inset-0 ${status === 'won' ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10' : 'bg-gradient-to-br from-red-500/10 to-rose-600/10'}`} />

              <div className="relative">
                <div className="mb-6">
                  {status === 'won' ? (
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                  ) : (
                    <Clock className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  )}
                  <h2 className={`text-4xl font-bold mb-2 ${status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                    {status === 'won' ? 'Level Complete!' : 'Time\'s Up!'}
                  </h2>
                  <p className="text-gray-300 text-lg">
                    {status === 'won' ? `Level ${state.level} conquered!` : 'Better luck next time'}
                  </p>
                </div>

                {status === 'won' && (
                  <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Score Earned</span>
                        <span className="text-yellow-400 font-bold text-xl">+{state.currentScore.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Attempts</span>
                        <span className="text-white font-bold">{state.attempts}</span>
                      </div>
                      {levels[state.level - 1].time && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Time Used</span>
                          <span className="text-[#2D9AA5] font-bold">{levels[state.level - 1].time! - (time || 0)}s</span>
                        </div>
                      )}
                      {state.attempts === levels[state.level - 1].pairs && (
                        <div className="text-center py-2">
                          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold text-lg">
                            🌟 PERFECT GAME! 🌟
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {status === 'won' && state.level < levels.length && state.level < state.unlocked && (
                    <button
                      onClick={() => startLevel(state.level + 1)}
                      className="flex-1 py-4 bg-gradient-to-r from-[#2D9AA5] to-blue-600 hover:from-[#2D9AA5]/80 hover:to-blue-600/80 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Next Level
                    </button>
                  )}
                  <button
                    onClick={() => startLevel(state.level)}
                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all duration-300 border border-white/20 hover:scale-105"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setStatus('menu')}
                    className="flex-1 py-4 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-2xl font-bold transition-all duration-300 border border-gray-500/30 hover:scale-105"
                  >
                    Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes particle-float {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
    </>
  );
};

export default ZevaAdvancedMemoryGame;

ZevaAdvancedMemoryGame.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};
