import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {Timer, RotateCcw, Target, Flame, Star } from 'lucide-react';

interface FoodItem {
  name: string;
  label: string;
  calories: number;
  nutrition?: number;
  rarity?: 'common' | 'rare' | 'legendary';
}

interface GridFood extends FoodItem {
  id: number;
  isHealthy: boolean;
  selected: boolean;
  nutrition: number;
  rarity: 'common' | 'rare' | 'legendary';
}

type GameState = 'menu' | 'playing' | 'gameOver';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

function HealthyFoodPickerGame() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [gameGrid, setGameGrid] = useState<GridFood[]>([]);
  const [caloriesSaved, setCaloriesSaved] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [nutritionBonus, setNutritionBonus] = useState<number>(0);
  const [perfectStreak, setPerfectStreak] = useState<number>(0);

  const foodItems: { healthy: FoodItem[]; junk: FoodItem[] } = {
    healthy: [
      { name: '🥕', label: 'Carrot', calories: 25, nutrition: 8, rarity: 'common' },
      { name: '🥦', label: 'Broccoli', calories: 55, nutrition: 9, rarity: 'common' },
      { name: '🍎', label: 'Apple', calories: 80, nutrition: 7, rarity: 'common' },
      { name: '🍌', label: 'Banana', calories: 105, nutrition: 6, rarity: 'common' },
      { name: '🥬', label: 'Lettuce', calories: 10, nutrition: 5, rarity: 'common' },
      { name: '🍇', label: 'Grapes', calories: 60, nutrition: 6, rarity: 'common' },
      { name: '🥒', label: 'Cucumber', calories: 15, nutrition: 4, rarity: 'common' },
      { name: '🍊', label: 'Orange', calories: 65, nutrition: 8, rarity: 'common' },
      { name: '🍅', label: 'Tomato', calories: 18, nutrition: 6, rarity: 'common' },
      { name: '🥝', label: 'Kiwi', calories: 42, nutrition: 7, rarity: 'common' },
      { name: '🫐', label: 'Blueberries', calories: 40, nutrition: 10, rarity: 'rare' },
      { name: '🥑', label: 'Avocado', calories: 120, nutrition: 12, rarity: 'rare' },
      { name: '🍑', label: 'Cherry', calories: 50, nutrition: 8, rarity: 'rare' },
      { name: '🍓', label: 'Strawberry', calories: 32, nutrition: 9, rarity: 'rare' },
      { name: '🥭', label: 'Mango', calories: 60, nutrition: 9, rarity: 'rare' },
      { name: '🍍', label: 'Pineapple', calories: 50, nutrition: 8, rarity: 'rare' },
      { name: '🥜', label: 'Almonds', calories: 85, nutrition: 11, rarity: 'rare' },
      { name: '🌰', label: 'Chestnuts', calories: 56, nutrition: 7, rarity: 'rare' },
      { name: '🫒', label: 'Olives', calories: 15, nutrition: 8, rarity: 'rare' },
      { name: '🥙', label: 'Quinoa Wrap', calories: 180, nutrition: 15, rarity: 'legendary' },
      { name: '🥗', label: 'Superfood Salad', calories: 150, nutrition: 18, rarity: 'legendary' },
      { name: '🧆', label: 'Baked Falafel', calories: 120, nutrition: 14, rarity: 'legendary' },
      { name: '🐟', label: 'Grilled Salmon', calories: 180, nutrition: 20, rarity: 'legendary' },
      { name: '🦐', label: 'Grilled Shrimp', calories: 85, nutrition: 16, rarity: 'legendary' },
      { name: '🌾', label: 'Ancient Grain Bowl', calories: 120, nutrition: 17, rarity: 'legendary' },
      { name: '🫘', label: 'Protein Beans', calories: 90, nutrition: 13, rarity: 'legendary' }
    ],
    junk: [
      { name: '🍕', label: 'Pizza', calories: 300, nutrition: 0, rarity: 'common' },
      { name: '🍔', label: 'Burger', calories: 540, nutrition: 0, rarity: 'common' },
      { name: '🍟', label: 'Fries', calories: 365, nutrition: 0, rarity: 'common' },
      { name: '🌭', label: 'Hot Dog', calories: 290, nutrition: 0, rarity: 'common' },
      { name: '🍩', label: 'Donut', calories: 250, nutrition: 0, rarity: 'common' },
      { name: '🍪', label: 'Cookie', calories: 150, nutrition: 0, rarity: 'common' },
      { name: '🥤', label: 'Soda', calories: 140, nutrition: 0, rarity: 'common' },
      { name: '🍿', label: 'Buttery Popcorn', calories: 110, nutrition: 0, rarity: 'common' },
      { name: '🧁', label: 'Cupcake', calories: 200, nutrition: 0, rarity: 'rare' },
      { name: '🍫', label: 'Chocolate Bar', calories: 235, nutrition: 0, rarity: 'rare' },
      { name: '🍰', label: 'Cheesecake', calories: 320, nutrition: 0, rarity: 'rare' },
      { name: '🍦', label: 'Ice Cream', calories: 207, nutrition: 0, rarity: 'rare' },
      { name: '🥛', label: 'Milkshake', calories: 350, nutrition: 0, rarity: 'rare' },
      { name: '🥨', label: 'Soft Pretzel', calories: 380, nutrition: 0, rarity: 'rare' },
      { name: '🧇', label: 'Gold Waffle', calories: 290, nutrition: 0, rarity: 'legendary' },
      { name: '🌯', label: 'Loaded Shawarma', calories: 450, nutrition: 0, rarity: 'legendary' },
      { name: '🫓', label: 'Cheese Bomb Manakish', calories: 380, nutrition: 0, rarity: 'legendary' },
      { name: '🍜', label: 'Luxury Ramen', calories: 380, nutrition: 0, rarity: 'legendary' },
      { name: '🍝', label: 'Truffle Pasta', calories: 420, nutrition: 0, rarity: 'legendary' },
      { name: '🥟', label: 'Diamond Dumplings', calories: 280, nutrition: 0, rarity: 'legendary' }
    ]
  };

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return { 
          gridSize: 12, 
          timeLimit: 60, 
          healthyRatio: 0.7, 
          pointMultiplier: 1, 
          penaltyMultiplier: 0.5,
          rareFoodChance: 0.1,
          legendaryFoodChance: 0.02
        };
      case 'medium':
        return { 
          gridSize: 16, 
          timeLimit: 45, 
          healthyRatio: 0.6, 
          pointMultiplier: 1.2, 
          penaltyMultiplier: 1,
          rareFoodChance: 0.15,
          legendaryFoodChance: 0.05
        };
      case 'hard':
        return { 
          gridSize: 20, 
          timeLimit: 35, 
          healthyRatio: 0.5, 
          pointMultiplier: 1.5, 
          penaltyMultiplier: 1.5,
          rareFoodChance: 0.2,
          legendaryFoodChance: 0.08
        };
      case 'expert':
        return { 
          gridSize: 25, 
          timeLimit: 30, 
          healthyRatio: 0.4, 
          pointMultiplier: 2, 
          penaltyMultiplier: 2,
          rareFoodChance: 0.25,
          legendaryFoodChance: 0.12
        };
    }
  };

  const generateGrid = useCallback(() => {
    const grid: GridFood[] = [];
    const settings = getDifficultySettings(difficulty);
    
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const selectFoodByRarity = (foods: FoodItem[]) => {
      const rand = Math.random();
      let targetRarity: 'common' | 'rare' | 'legendary';
      
      if (rand < settings.legendaryFoodChance) {
        targetRarity = 'legendary';
      } else if (rand < settings.rareFoodChance) {
        targetRarity = 'rare';
      } else {
        targetRarity = 'common';
      }
      
      const rarityFoods = foods.filter(f => (f.rarity || 'common') === targetRarity);
      if (rarityFoods.length === 0) {
        return foods[Math.floor(Math.random() * foods.length)];
      }
      
      return rarityFoods[Math.floor(Math.random() * rarityFoods.length)];
    };
    
    for (let i = 0; i < settings.gridSize; i++) {
      const shouldBeHealthy = Math.random() < settings.healthyRatio;
      const foodPool = shouldBeHealthy ? foodItems.healthy : foodItems.junk;
      const selectedFood = selectFoodByRarity(foodPool);
      
      grid.push({
        id: i,
        ...selectedFood,
        nutrition: selectedFood.nutrition || 0,
        rarity: selectedFood.rarity || 'common',
        isHealthy: shouldBeHealthy,
        selected: false
      });
    }
    
    return shuffleArray(grid).map((item, index) => ({
      ...item,
      id: index
    }));
  }, [difficulty, foodItems.healthy, foodItems.junk]);

  const calculatePoints = (food: GridFood, isCorrect: boolean): number => {
    const settings = getDifficultySettings(difficulty);
    const basePoints = isCorrect ? 10 : -8;
    const rarityMultiplier = food.rarity === 'legendary' ? 3 : food.rarity === 'rare' ? 2 : 1;
    const comboMultiplier = Math.min(combo * 0.1 + 1, 3);
    const nutritionMultiplier = isCorrect && food.isHealthy ? (1 + food.nutrition * 0.05) : 1;
    
    return Math.round(basePoints * settings.pointMultiplier * rarityMultiplier * comboMultiplier * nutritionMultiplier);
  };

  const startGame = () => {
    const settings = getDifficultySettings(difficulty);
    setGameState('playing');
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setSelectedFoods(new Set());
    setCaloriesSaved(0);
    setHealthScore(100);
    setCombo(0);
    setMaxCombo(0);
    setLevel(1);
    setNutritionBonus(0);
    setPerfectStreak(0);
    setGameGrid(generateGrid());
  };

  const selectFood = (foodId: number) => {
    if (gameState !== 'playing' || selectedFoods.has(foodId)) return;

    const food = gameGrid.find(f => f.id === foodId);
    if (!food) return;

    const newSelectedFoods = new Set(selectedFoods);
    newSelectedFoods.add(foodId);
    setSelectedFoods(newSelectedFoods);

    const isCorrect = food.isHealthy;
    const points = calculatePoints(food, isCorrect);

    if (isCorrect) {
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, combo + 1));
      setCaloriesSaved(prev => prev + (400 - food.calories));
      setHealthScore(prev => Math.min(100, prev + 3));
      setNutritionBonus(prev => prev + food.nutrition);
      setPerfectStreak(prev => prev + 1);
      
      if ((perfectStreak + 1) % 10 === 0) {
        setLevel(prev => prev + 1);
      }
    } else {
      const settings = getDifficultySettings(difficulty);
      setScore(prev => Math.max(0, prev + Math.round(points * settings.penaltyMultiplier)));
      setCombo(0);
      setHealthScore(prev => Math.max(0, prev - 15));
      setPerfectStreak(0);
      
      if (difficulty === 'hard' || difficulty === 'expert') {
        setTimeLeft(prev => Math.max(0, prev - 2));
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [gameState, timeLeft]);

  const healthySelected = gameGrid.filter(food => 
    selectedFoods.has(food.id) && food.isHealthy
  ).length;
  
  const totalHealthy = gameGrid.filter(food => food.isHealthy).length;
  const accuracy = totalHealthy > 0 ? Math.round((healthySelected / totalHealthy) * 100) : 0;
  
  const legendaryFound = gameGrid.filter(food => 
    selectedFoods.has(food.id) && food.rarity === 'legendary' && food.isHealthy
  ).length;

  const getPerformanceMessage = (score: number, accuracy: number, maxCombo: number, level: number) => {
    const totalScore = score + (accuracy * 2) + (maxCombo * 5) + (level * 10);
    
    if (totalScore < 50) {
      return {
        title: "Learning Phase",
        message: "Keep practicing! Focus on colorful fruits and vegetables.",
        emoji: "📚"
      };
    } else if (totalScore < 150) {
      return {
        title: "Health Enthusiast",
        message: "Good progress! You're starting to recognize healthy foods.",
        emoji: "🌟"
      };
    } else if (totalScore < 300) {
      return {
        title: "Nutrition Detective",
        message: "Great work! You clearly understand healthy eating.",
        emoji: "🎯"
      };
    } else if (totalScore < 500) {
      return {
        title: "Health Champion",
        message: "Excellent! You're a master of nutrition.",
        emoji: "⭐"
      };
    } else if (totalScore < 750) {
      return {
        title: "Superfood Master",
        message: "Outstanding performance! You've achieved nutritional enlightenment.",
        emoji: "🔥"
      };
    } else {
      return {
        title: "Legendary Nutritionist",
        message: "INCREDIBLE! You've reached legendary status!",
        emoji: "💎"
      };
    }
  };

  const performanceData = getPerformanceMessage(score, accuracy, maxCombo, level);

  if (gameState === 'menu') {
    return (
      <>
        <Head>
          <title>Healthy Food Picker Game – Smash Junk & Choose Greens</title>
          <meta
            name="description"
            content="Play the Healthy Food Picker Game on Zeva to beat the clock, smash junk food, and pick healthy greens. Have fun while learning nutrition and building healthy eating habits."
          />
          <meta
            name="keywords"
            content="Healthy Food Picker Game, nutrition game, healthy eating game, smash junk food, interactive health game, pick healthy greens, fun health game, diet and nutrition game, online wellness game, Zeva health game, food choices game, healthy habits game, interactive nutrition game, beat the clock game, educational health game"
          />
          
          {/* Schema Markup - Healthy Food Picker Game WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Healthy Food Picker Game",
                "url": "https://zeva360.com/games/HealthyFood",
                "description": "Healthy Food Picker Game by ZEVA is a fun and educational nutrition game where users smash junk food, grab healthy greens, and learn smart eating habits while racing against the clock.",
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
                  "name": "Healthy Food Picker Game",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An interactive nutrition-based game that promotes healthy eating habits by encouraging players to choose nutritious foods and avoid junk food through fast-paced challenges.",
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthy Food Picker</h1>
            <p className="text-gray-600">Test your nutrition knowledge</p>
          </div>
                      
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Choose Difficulty</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    difficulty === diff
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
                      
          <div className="mb-6 space-y-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
            <p>🌟 Build combos for bonus points</p>
            <p>💎 Find legendary superfoods</p>
            <p>🎯 Click healthy foods only</p>
          </div>
                      
          <button
            onClick={startGame}
            className="w-full bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all"
          >
            Start Game
          </button>
        </div>
      </div>
      </>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <>
        <Head>
          <title>Healthy Food Picker Game – Smash Junk & Choose Greens</title>
          <meta
            name="description"
            content="Play the Healthy Food Picker Game on Zeva to beat the clock, smash junk food, and pick healthy greens. Have fun while learning nutrition and building healthy eating habits."
          />
          <meta
            name="keywords"
            content="Healthy Food Picker Game, nutrition game, healthy eating game, smash junk food, interactive health game, pick healthy greens, fun health game, diet and nutrition game, online wellness game, Zeva health game, food choices game, healthy habits game, interactive nutrition game, beat the clock game, educational health game"
          />
          
          {/* Schema Markup - Healthy Food Picker Game WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Healthy Food Picker Game",
                "url": "https://zeva360.com/games/HealthyFood",
                "description": "Healthy Food Picker Game by ZEVA is a fun and educational nutrition game where users smash junk food, grab healthy greens, and learn smart eating habits while racing against the clock.",
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
                  "name": "Healthy Food Picker Game",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An interactive nutrition-based game that promotes healthy eating habits by encouraging players to choose nutritious foods and avoid junk food through fast-paced challenges.",
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center w-full max-w-md">
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Complete!</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-4xl mb-2">{performanceData.emoji}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {performanceData.title}
            </h3>
            <p className="text-sm text-gray-600">
              {performanceData.message}
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{score} Points</p>
              <p className="text-sm text-gray-600">Final Score • Level {level}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xl font-bold text-gray-900">{maxCombo}x</p>
                <p className="text-sm text-gray-600">Max Combo</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xl font-bold text-gray-900">{nutritionBonus}</p>
                <p className="text-sm text-gray-600">Nutrition</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-lg font-bold text-gray-900">{accuracy}%</p>
                <p className="text-xs text-gray-600">Accuracy</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-lg font-bold text-gray-900">{legendaryFound}</p>
                <p className="text-xs text-gray-600">Legendary</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-lg font-bold text-gray-900">{caloriesSaved}</p>
                <p className="text-xs text-gray-600">Cal Saved</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Healthy Food Picker Game – Smash Junk & Choose Greens</title>
        <meta
          name="description"
          content="Play the Healthy Food Picker Game on Zeva to beat the clock, smash junk food, and pick healthy greens. Have fun while learning nutrition and building healthy eating habits."
        />
        <meta
          name="keywords"
          content="Healthy Food Picker Game, nutrition game, healthy eating game, smash junk food, interactive health game, pick healthy greens, fun health game, diet and nutrition game, online wellness game, Zeva health game, food choices game, healthy habits game, interactive nutrition game, beat the clock game, educational health game"
        />
        
        {/* Schema Markup - Healthy Food Picker Game WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Healthy Food Picker Game",
              "url": "https://zeva360.com/games/HealthyFood",
              "description": "Healthy Food Picker Game by ZEVA is a fun and educational nutrition game where users smash junk food, grab healthy greens, and learn smart eating habits while racing against the clock.",
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
                "name": "Healthy Food Picker Game",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "description": "An interactive nutrition-based game that promotes healthy eating habits by encouraging players to choose nutritious foods and avoid junk food through fast-paced challenges.",
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
      <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3 text-center">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Timer className="w-5 h-5 mx-auto mb-1 text-gray-700" />
              <p className="text-xl font-bold text-gray-900">{timeLeft}s</p>
              <p className="text-xs text-gray-600">Time</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Star className="w-5 h-5 mx-auto mb-1 text-gray-700" />
              <p className="text-xl font-bold text-gray-900">{score}</p>
              <p className="text-xs text-gray-600">Score</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Flame className="w-5 h-5 mx-auto mb-1 text-gray-700" />
              <p className="text-xl font-bold text-gray-900">{combo}x</p>
              <p className="text-xs text-gray-600">Combo</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Target className="w-5 h-5 mx-auto mb-1 text-gray-700" />
              <p className="text-xl font-bold text-gray-900">{level}</p>
              <p className="text-xs text-gray-600">Level</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-700 mx-auto mb-1">❤️</div>
              <p className="text-xl font-bold text-gray-900">{healthScore}</p>
              <p className="text-xs text-gray-600">Health</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-700 mx-auto mb-1">🔥</div>
              <p className="text-xl font-bold text-gray-900">{caloriesSaved}</p>
              <p className="text-xs text-gray-600">Cal Saved</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-700 mx-auto mb-1">⚡</div>
              <p className="text-xl font-bold text-gray-900">{nutritionBonus}</p>
              <p className="text-xs text-gray-600">Nutrition</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center border border-gray-200">
          <p className="text-sm text-gray-700">
            🎯 Click on <span className="font-bold text-gray-900">HEALTHY FOODS</span> to earn points! Avoid junk food.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div 
            className="grid gap-2 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8"
          >
            {gameGrid.map((food) => {
              const isSelected = selectedFoods.has(food.id);
              const rarityBorder = food.rarity === 'legendary' ? 'border-2 border-gray-900' :
                                 food.rarity === 'rare' ? 'border-2 border-gray-600' :
                                 'border border-gray-300';
              
              const selectionStyle = isSelected 
                ? food.isHealthy 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
                : 'bg-white hover:bg-gray-50';

              return (
                <button
                  key={food.id}
                  onClick={() => selectFood(food.id)}
                  disabled={isSelected}
                  className={`
                    flex flex-col items-center justify-center
                    p-2 rounded-lg relative
                    min-h-[80px]
                    text-xs
                    transition-all
                    ${rarityBorder} ${selectionStyle}
                    ${isSelected ? 'cursor-not-allowed opacity-70' : 'hover:shadow-md'}
                  `}
                >
                  {food.rarity === 'legendary' && (
                    <div className="absolute top-1 right-1 text-xs bg-gray-900 text-white px-1 rounded font-bold">
                      ⭐
                    </div>
                  )}
                  {food.rarity === 'rare' && (
                    <div className="absolute top-1 right-1 text-xs bg-gray-600 text-white px-1 rounded font-bold">
                      💎
                    </div>
                  )}
                  
                  <span className="text-2xl mb-1">{food.name}</span>
                  <span className="truncate w-full text-center font-medium text-gray-900">{food.label}</span>
                  <span className="text-xs text-gray-500">{food.calories} cal</span>
                  
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded-lg">
                      <span className="text-3xl">
                        {food.isHealthy ? '✅' : '❌'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {selectedFoods.size} / {gameGrid.length} selected
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-900 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(selectedFoods.size / gameGrid.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default HealthyFoodPickerGame;