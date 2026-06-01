import React, { useState } from 'react'
import Head from 'next/head'
import { Trash2 } from 'lucide-react';

interface Food {
  name: string;
  portion: number;
}

interface ConsumedFood extends Food {
  calories: number;
  id: number;
}

function CalorieCounter() {
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [consumedFoods, setConsumedFoods] = useState<ConsumedFood[]>([]);

  const uaeFoods: Record<string, { calories: number; emoji: string; category: string }> = {
    // Traditional UAE/Middle Eastern
    'Hummus (100g)': { calories: 166, emoji: '🧄', category: 'Traditional' },
    'Shawarma Chicken': { calories: 300, emoji: '🌯', category: 'Traditional' },
    'Shawarma Lamb': { calories: 400, emoji: '🥙', category: 'Traditional' },
    'Falafel (5 pieces)': { calories: 333, emoji: '🧆', category: 'Traditional' },
    'Kabsa (1 cup)': { calories: 350, emoji: '🍛', category: 'Traditional' },
    'Machboos (1 cup)': { calories: 380, emoji: '🍚', category: 'Traditional' },
    'Manakish Zaatar': { calories: 280, emoji: '🫓', category: 'Traditional' },
    'Luqaimat (5 pieces)': { calories: 250, emoji: '🍯', category: 'Traditional' },
    'Arabic Bread': { calories: 80, emoji: '🥖', category: 'Traditional' },
    'Khubz': { calories: 75, emoji: '🍞', category: 'Traditional' },
    'Mandi Chicken': { calories: 420, emoji: '🍗', category: 'Traditional' },
    'Ouzi (1 serving)': { calories: 480, emoji: '🍖', category: 'Traditional' },
    'Stuffed Grape Leaves': { calories: 150, emoji: '🍃', category: 'Traditional' },
    'Tabbouleh (1 cup)': { calories: 120, emoji: '🥗', category: 'Traditional' },
    'Fattoush (1 cup)': { calories: 140, emoji: '🥙', category: 'Traditional' },
    'Baba Ganoush (100g)': { calories: 130, emoji: '🍆', category: 'Traditional' },
    'Knafeh (1 piece)': { calories: 350, emoji: '🧀', category: 'Traditional' },
    'Baklava (1 piece)': { calories: 245, emoji: '🥮', category: 'Traditional' },
    'Maamoul (3 pieces)': { calories: 180, emoji: '🍪', category: 'Traditional' },
    
    // Popular in UAE/Dubai
    'Biryani (1 cup)': { calories: 400, emoji: '🍛', category: 'Popular' },
    'Curry Chicken': { calories: 320, emoji: '🍛', category: 'Popular' },
    'Dal (1 cup)': { calories: 230, emoji: '🟡', category: 'Popular' },
    'Naan Bread': { calories: 260, emoji: '🫓', category: 'Popular' },
    'Samosa (1 piece)': { calories: 91, emoji: '🥟', category: 'Popular' },
    'Tikka Masala': { calories: 350, emoji: '🍖', category: 'Popular' },
    'Butter Chicken': { calories: 380, emoji: '🍗', category: 'Popular' },
    'Tandoori Chicken': { calories: 280, emoji: '🍗', category: 'Popular' },
    'Roti (1 piece)': { calories: 120, emoji: '🫓', category: 'Popular' },
    'Fish Curry': { calories: 290, emoji: '🐟', category: 'Popular' },
    'Mutton Curry': { calories: 450, emoji: '🍖', category: 'Popular' },
    'Palak Paneer': { calories: 320, emoji: '🟢', category: 'Popular' },
    'Rajma (1 cup)': { calories: 270, emoji: '🫘', category: 'Popular' },
    'Chole (1 cup)': { calories: 290, emoji: '🫛', category: 'Popular' },
    'Paratha (1 piece)': { calories: 300, emoji: '🫓', category: 'Popular' },
    'Lassi (1 glass)': { calories: 180, emoji: '🥛', category: 'Beverages' },
    
    // Beverages
    'Arabic Coffee': { calories: 5, emoji: '☕', category: 'Beverages' },
    'Karak Tea': { calories: 120, emoji: '🍵', category: 'Beverages' },
    'Fresh Orange Juice': { calories: 110, emoji: '🍊', category: 'Beverages' },
    'Laban': { calories: 150, emoji: '🥛', category: 'Beverages' },
    'Date Milkshake': { calories: 280, emoji: '🥤', category: 'Beverages' },
    'Mango Lassi': { calories: 200, emoji: '🥭', category: 'Beverages' },
    'Coffee (Black)': { calories: 5, emoji: '☕', category: 'Beverages' },
    'Cappuccino': { calories: 120, emoji: '☕', category: 'Beverages' },
    'Latte': { calories: 190, emoji: '☕', category: 'Beverages' },
    'Coca Cola (12oz)': { calories: 140, emoji: '🥤', category: 'Beverages' },
    'Fresh Lime Soda': { calories: 80, emoji: '🍋', category: 'Beverages' },
    'Smoothie (Berry)': { calories: 180, emoji: '🫐', category: 'Beverages' },
    'Green Tea': { calories: 2, emoji: '🍵', category: 'Beverages' },
    'Iced Tea': { calories: 70, emoji: '🧊', category: 'Beverages' },
    
    // Fruits & Snacks
    'Dates (5 pieces)': { calories: 100, emoji: '🟫', category: 'Snacks' },
    'Banana': { calories: 105, emoji: '🍌', category: 'Snacks' },
    'Apple': { calories: 80, emoji: '🍎', category: 'Snacks' },
    'Mango': { calories: 135, emoji: '🥭', category: 'Snacks' },
    'Pomegranate': { calories: 134, emoji: '🔴', category: 'Snacks' },
    'Orange': { calories: 65, emoji: '🍊', category: 'Snacks' },
    'Grapes (1 cup)': { calories: 104, emoji: '🍇', category: 'Snacks' },
    'Watermelon (1 cup)': { calories: 46, emoji: '🍉', category: 'Snacks' },
    'Pineapple (1 cup)': { calories: 82, emoji: '🍍', category: 'Snacks' },
    'Almonds (10 pieces)': { calories: 70, emoji: '🥜', category: 'Snacks' },
    'Cashews (10 pieces)': { calories: 90, emoji: '🥜', category: 'Snacks' },
    'Pistachios (10 pieces)': { calories: 40, emoji: '🥜', category: 'Snacks' },
    'Mixed Nuts (1 oz)': { calories: 170, emoji: '🥜', category: 'Snacks' },
    'Popcorn (1 cup)': { calories: 31, emoji: '🍿', category: 'Snacks' },
    'Chips (1 oz)': { calories: 150, emoji: '🥔', category: 'Snacks' },
    
    // International
    'Pizza Slice': { calories: 285, emoji: '🍕', category: 'International' },
    'Burger': { calories: 540, emoji: '🍔', category: 'International' },
    'Pasta (1 cup)': { calories: 220, emoji: '🍝', category: 'International' },
    'Sushi Roll (8 pieces)': { calories: 300, emoji: '🍣', category: 'International' },
    'Fried Rice': { calories: 380, emoji: '🍚', category: 'International' },
    'Pad Thai': { calories: 400, emoji: '🍜', category: 'International' },
    'Tacos (2 pieces)': { calories: 380, emoji: '🌮', category: 'International' },
    'French Fries (Medium)': { calories: 365, emoji: '🍟', category: 'International' },
  };

  const addFood = (): void => {
    if (selectedFoods.length > 0) {
      const newFoods: ConsumedFood[] = selectedFoods.map((food: Food, index: number) => ({
        name: food.name,
        portion: food.portion,
        calories: Math.round(uaeFoods[food.name].calories * food.portion),
        id: Date.now() + index
      }));
      setConsumedFoods((prev: ConsumedFood[]) => [...prev, ...newFoods]);
      setSelectedFoods([]);
    }
  };

  const toggleFood = (foodName: string): void => {
    const exists = selectedFoods.find((f: Food) => f.name === foodName);
    if (exists) {
      setSelectedFoods((prev: Food[]) => prev.filter((f: Food) => f.name !== foodName));
    } else {
      setSelectedFoods((prev: Food[]) => [...prev, { name: foodName, portion: 1 }]);
    }
  };

  const updatePortion = (foodName: string, portionValue: string): void => {
    const portion = parseFloat(portionValue) || 1;
    setSelectedFoods((prev: Food[]) => prev.map((f: Food) => 
      f.name === foodName ? { ...f, portion } : f
    ));
  };

  const removeFood = (id: number): void => {
    setConsumedFoods((prev: ConsumedFood[]) => prev.filter((food: ConsumedFood) => food.id !== id));
  };

  const filteredFoods: string[] = Object.keys(uaeFoods).filter((food: string) =>
    food.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalories: number = consumedFoods.reduce((sum: number, food: ConsumedFood) => sum + food.calories, 0);

  // Group foods by category for better organization
  const groupedFoods = filteredFoods.reduce((acc, food) => {
    const category = uaeFoods[food].category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(food);
    return acc;
  }, {} as Record<string, string[]>);

  const getCalorieStatus = (calories: number) => {
    if (calories < 500) return { status: 'Light', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (calories < 1500) return { status: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (calories < 2500) return { status: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'Very High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const calorieStatus = getCalorieStatus(totalCalories);

return (
  <>
    <Head>
      <title>Calorie Count Calculator | Track Daily Calories – ZEVA</title>
      <meta
        name="description"
        content="Use ZEVA's free Calorie Count Calculator to track daily calorie intake, manage diet goals, and maintain a healthy, balanced lifestyle."
      />
      <meta
        name="keywords"
        content="Calorie Count Calculator, calorie intake tracker, daily calorie calculator, diet calorie calculator, food calorie tracker, nutrition calculator, healthy diet tool, weight management calculator, ZEVA calorie tool"
      />
      <meta property="og:title" content="Calorie Count Calculator | Track Daily Calories – ZEVA" />
      <meta
        property="og:description"
        content="Use ZEVA's free Calorie Count Calculator to track daily calorie intake, manage diet goals, and maintain a healthy, balanced lifestyle."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Calorie Count Calculator | Track Daily Calories – ZEVA" />
      <meta
        name="twitter:description"
        content="Use ZEVA's free Calorie Count Calculator to track daily calorie intake, manage diet goals, and maintain a healthy, balanced lifestyle."
      />
      {/* Schema Markup - Calorie Count Calculator WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Calorie Count Calculator",
            "url": "https://zeva360.com/calculator/calorie-counter",
            "description": "Track your daily calorie intake and maintain a healthy diet with ZEVA's Calorie Count Calculator. A free and easy tool to monitor nutrition, manage weight goals, and support a balanced lifestyle.",
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
            "about": {
              "@type": "MedicalCondition",
              "name": "Nutrition & Weight Management",
              "description": "Calorie intake monitoring to support healthy eating habits and weight control."
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Calorie Count Calculator",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web",
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
    <div className="min-h-screen bg-white">
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calorie Counter</h1>
        <p className="text-gray-600">Track your daily nutrition intake</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalCalories}</div>
          <div className="text-sm text-gray-600">Total Calories</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">{consumedFoods.length}</div>
          <div className="text-sm text-gray-600">Foods Logged</div>
        </div>
        <div className={`border rounded-lg p-6 ${calorieStatus.bgColor}`}>
          <div className={`text-2xl font-bold mb-1 ${calorieStatus.color}`}>{calorieStatus.status}</div>
          <div className="text-sm text-gray-600">Intake Level</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side - Food Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Foods</h2>
          
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-4"
          />

          {/* Food Categories */}
          <div className="max-h-96 overflow-y-auto space-y-4 mb-4">
            {Object.entries(groupedFoods).map(([category, foods]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide px-2">{category}</h3>
                {foods.map((food) => {
                  const isSelected = selectedFoods.find((f) => f.name === food);
                  return (
                    <div key={food} className={`p-4 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-gray-900 text-white border-2 border-gray-900' 
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => toggleFood(food)}
                          className="flex-1"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{uaeFoods[food].emoji}</span>
                            <div>
                              <div className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>{food}</div>
                              <div className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>{uaeFoods[food].calories} cal</div>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={isSelected.portion}
                            onChange={(e) => updatePortion(food, e.target.value)}
                            className="w-16 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            onClick={addFood}
            disabled={selectedFoods.length === 0}
            className="w-full bg-gray-900 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-all hover:bg-gray-800 disabled:cursor-not-allowed"
          >
            Add Selected ({selectedFoods.length})
          </button>
        </div>

        {/* Right Side - Consumed Foods */}
        <div className="space-y-6">
          {/* Total Calories Card */}
          <div className="bg-gray-900 rounded-lg p-8 text-center text-white">
            <div className="text-xl font-semibold mb-2">Daily Total</div>
            <div className="text-5xl font-bold mb-2">{totalCalories}</div>
            <div className="text-gray-300">calories consumed</div>
          </div>

          {/* Consumed Foods List */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Intake</h3>

            {consumedFoods.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {consumedFoods.map((food) => (
                  <div key={food.id} className="group bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{uaeFoods[food.name].emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{food.name}</div>
                          <div className="text-sm text-gray-600">
                            {food.portion}× portion • <span className="font-semibold">{food.calories} cal</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFood(food.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <div className="text-gray-600 font-medium mb-2">No foods logged yet</div>
                <div className="text-gray-500 text-sm">Start adding foods to track your calories</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  </>
);
}

export default CalorieCounter;

// CalorieCounter.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; 
// }