import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip} from 'recharts';
import { CheckCircle, XCircle, Trophy, Brain, Heart, Star, MapPin, Stethoscope, Lock, Unlock, ArrowRight, Award, TrendingUp } from 'lucide-react';

type Question = { q: string; o: string[]; c: number[] };
type QuizLevel = {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questions: Question[];
  questionCount: number;
  questionTimeLimit: number; // seconds per question
};

// Fisher-Yates shuffle
// function shuffleArray<T>(array: T[]): T[] {
//   const arr = [...array];
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// }

interface ChartData {
  level: string;
  score: number;
  percentage: number;
  total: number;
}

const QUIZ_DATA: Record<number, QuizLevel> = {
  1: {
    name: "Health Basics",
    description: "Essential health knowledge for daily life",
    icon: <Heart className="w-6 h-6" />,
    color: "#10B981",
    questionCount: 30,
    questionTimeLimit: 30, // 30 seconds per question
    questions: [
      { q: "How many glasses of water should an adult drink daily?", o: ["2-3", "4-6", "8-10", "12-15"], c: [2] },
      { q: "Which vitamin is produced by sunlight?", o: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], c: [2] },
      { q: "Adults need how many hours of sleep?", o: ["4-5", "6-7", "7-9", "10-12"], c: [2] },
      { q: "Which is a healthy protein source?", o: ["Eggs", "Fish", "Beans", "Candy"], c: [0,1,2] },
      { q: "Brushing teeth frequency?", o: ["Once a day", "Twice daily", "Weekly", "Monthly"], c: [1] },
      { q: "Best food for fiber?", o: ["White rice", "Fruits", "Vegetables", "Whole grains"], c: [1,2,3] },
      { q: "Best drink for hydration?", o: ["Soda", "Energy drink", "Water", "Coffee"], c: [2] },
      { q: "Which activity helps fitness?", o: ["Walking", "Swimming", "Dancing", "All above"], c: [3] },
      { q: "Which food is rich in Vitamin C?", o: ["Milk", "Oranges", "Bread", "Rice"], c: [1] },
      { q: "Warning sign of dehydration?", o: ["Dark urine", "Headache", "Fatigue", "All above"], c: [3] },
      { q: "Which vitamin supports eye health?", o: ["Vitamin A", "Vitamin D", "Vitamin E", "Vitamin K"], c: [0] },
      { q: "Exercise benefits?", o: ["Heart health", "Mental health", "Weight control", "All above"], c: [3] },
      { q: "Which organ pumps blood?", o: ["Kidney", "Liver", "Heart", "Lungs"], c: [2] },
      { q: "Which food has calcium?", o: ["Milk", "Fish", "Cheese", "All above"], c: [3] },
      { q: "Where does digestion start?", o: ["Mouth", "Stomach", "Small intestine", "Large intestine"], c: [0] },
      { q: "How often should nails be trimmed?", o: ["Daily", "Weekly", "Monthly", "Never"], c: [1] },
      { q: "Good posture prevents?", o: ["Back pain", "Neck pain", "Fatigue", "All above"], c: [3] },
      { q: "Which nutrient provides energy?", o: ["Carbs", "Proteins", "Fats", "All above"], c: [3] },
      { q: "What boosts immunity?", o: ["Garlic", "Citrus fruits", "Exercise", "All above"], c: [3] },
      { q: "Which organ removes toxins?", o: ["Liver", "Kidney", "Lungs", "All above"], c: [3] },
      { q: "Which vitamin helps wound healing?", o: ["Vitamin C", "Vitamin D", "Vitamin A", "Vitamin K"], c: [0] },
      { q: "Which exercise strengthens the heart?", o: ["Cardio", "Yoga", "Stretching", "Weight lifting"], c: [0] },
      { q: "Daily recommended fruit servings?", o: ["1-2", "2-3", "4-5", "6-7"], c: [1] },
      { q: "Which is a whole grain?", o: ["White bread", "Brown rice", "Oats", "Quinoa"], c: [1,2,3] },
      { q: "Best healthy fat source?", o: ["Olive oil", "Butter", "Processed meat", "Candy"], c: [0] },
      { q: "Stress can be reduced by?", o: ["Smoking", "Exercise", "Meditation", "All except smoking"], c: [3] },
      { q: "Protein helps with?", o: ["Energy", "Tissue repair", "Muscle growth", "All above"], c: [3] },
      { q: "How many teeth in adults?", o: ["28", "30", "32", "34"], c: [2] },
      { q: "Which nutrient supports strong bones?", o: ["Calcium", "Iron", "Vitamin C", "Iodine"], c: [0] },
      { q: "What is BMI used for?", o: ["Heart rate", "Body fat status", "Sleep quality", "Vision test"], c: [1] }
    ]
  },

  2: {
    name: "Nutrition Focus",
    description: "Understanding nutrition and healthy eating",
    icon: <Star className="w-6 h-6" />,
    color: "#3B82F6",
    questionCount: 25,
    questionTimeLimit: 35, // 35 seconds per question
    questions: [
      { q: "Ideal BMI range?", o: ["15-18", "18.5-24.9", "25-30", "30-35"], c: [1] },
      { q: "Which nutrients are antioxidants?", o: ["Vitamin C", "Vitamin E", "Beta-carotene", "All above"], c: [3] },
      { q: "Which vitamins are fat-soluble?", o: ["A, D, E, K", "B, C", "Only A", "Only K"], c: [0] },
      { q: "Which foods contain probiotics?", o: ["Yogurt", "Kefir", "Sauerkraut", "All above"], c: [3] },
      { q: "Deficiency of Vitamin D causes?", o: ["Rickets", "Scurvy", "Anemia", "Blindness"], c: [0] },
      { q: "Best dietary source of potassium?", o: ["Bananas", "Bread", "Milk", "Rice"], c: [0] },
      { q: "Which nutrient repairs tissues?", o: ["Protein", "Carbs", "Fat", "Water"], c: [0] },
      { q: "Role of iron?", o: ["Oxygen transport", "Bone growth", "Digestion", "Hormones"], c: [0] },
      { q: "Daily fiber requirement?", o: ["10g", "25-35g", "50g", "75g"], c: [1] },
      { q: "Best source of Omega-3?", o: ["Fish", "Apples", "Cheese", "Rice"], c: [0] },
      { q: "Excess sodium causes?", o: ["Low BP", "Hypertension", "Anemia", "Rickets"], c: [1] },
      { q: "Vitamin A deficiency leads to?", o: ["Blindness", "Scurvy", "Rickets", "Diabetes"], c: [0] },
      { q: "Macronutrients include?", o: ["Carbs", "Proteins", "Fats", "All above"], c: [3] },
      { q: "Most calorie-dense nutrient?", o: ["Carbs", "Protein", "Fat", "Fiber"], c: [2] },
      { q: "Vitamin K helps in?", o: ["Blood clotting", "Bone strength", "Wound healing", "All above"], c: [0] },
      { q: "Examples of complex carbs?", o: ["Brown rice", "Quinoa", "Oats", "All above"], c: [3] },
      { q: "Vitamin B12 is mainly in?", o: ["Meat", "Fish", "Eggs", "All above"], c: [3] },
      { q: "Glycemic index measures?", o: ["Effect on blood sugar", "Protein content", "Fat content", "Fiber content"], c: [0] },
      { q: "Minerals for bones?", o: ["Calcium", "Phosphorus", "Magnesium", "All above"], c: [3] },
      { q: "Which food boosts immunity?", o: ["Garlic", "Turmeric", "Citrus fruits", "All above"], c: [3] },
      { q: "What affects cholesterol?", o: ["Trans fats", "Saturated fats", "Exercise", "All above"], c: [3] },
      { q: "Best fiber source?", o: ["Whole grains", "Meat", "Rice", "Milk"], c: [0] },
      { q: "Omega-6 found in?", o: ["Vegetable oils", "Fish", "Fruits", "Eggs"], c: [0] },
      { q: "Which vitamin prevents scurvy?", o: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], c: [1] },
      { q: "High sugar diet increases risk of?", o: ["Diabetes", "Obesity", "Tooth decay", "All above"], c: [3] }
    ]
  },

  3: {
    name: "Advanced Wellness",
    description: "Deep understanding of health mechanisms",
    icon: <Brain className="w-6 h-6" />,
    color: "#8B5CF6",
    questionCount: 20,
    questionTimeLimit: 40, // 40 seconds per question
    questions: [
      { q: "Mechanism of insulin resistance?", o: ["Cell receptor dysfunction", "Pancreas failure", "Liver malfunction", "All above"], c: [0] },
      { q: "Appetite regulated by?", o: ["Leptin", "Ghrelin", "Both", "Neither"], c: [2] },
      { q: "Autophagy is?", o: ["Cell recycling", "Cell division", "Cell death", "Mutation"], c: [0] },
      { q: "Factors affecting circadian rhythm?", o: ["Light exposure", "Meal timing", "Temperature", "All above"], c: [3] },
      { q: "Mitochondria role in aging?", o: ["Energy production", "Oxidative stress", "Both", "Neither"], c: [2] },
      { q: "Hormesis means?", o: ["Beneficial stress", "Harmful stress", "No stress", "Chronic stress"], c: [0] },
      { q: "Longevity genes?", o: ["FOXO", "SIRT1", "Both", "Neither"], c: [2] },
      { q: "Gut-brain axis includes?", o: ["Neural link", "Hormonal link", "Immune link", "All above"], c: [3] },
      { q: "Telomere length affected by?", o: ["Stress", "Diet", "Exercise", "All above"], c: [3] },
      { q: "Main stress hormone?", o: ["Cortisol", "Insulin", "Glucagon", "Adrenaline"], c: [0] },
      { q: "Which improves neuroplasticity?", o: ["Exercise", "Learning", "Meditation", "All above"], c: [3] },
      { q: "Oxidative stress caused by?", o: ["Excess free radicals", "High oxygen", "Cell death", "Low vitamins"], c: [0] },
      { q: "Inflammation is?", o: ["Immune response", "Always harmful", "Unrelated to health", "Caused by stress only"], c: [0] },
      { q: "Collagen boosted by?", o: ["Vitamin C", "Copper", "Protein", "All above"], c: [3] },
      { q: "Melatonin secreted by?", o: ["Thyroid", "Pineal gland", "Adrenal gland", "Pituitary"], c: [1] },
      { q: "Endorphins relate to?", o: ["Happiness", "Pain relief", "Exercise", "All above"], c: [3] },
      { q: "Visceral fat leads to?", o: ["Diabetes", "Heart disease", "Hypertension", "All above"], c: [3] },
      { q: "Microbiome mainly in?", o: ["Intestine", "Stomach", "Liver", "Kidneys"], c: [0] },
      { q: "Brain memory center?", o: ["Hippocampus", "Cerebellum", "Amygdala", "Cortex"], c: [0] },
      { q: "Neurotransmitter for mood?", o: ["Serotonin", "Insulin", "Dopamine", "Both serotonin & dopamine"], c: [3] }
    ]
  },

  4: {
    name: "Expert Knowledge",
    description: "Professional-level health expertise",
    icon: <Award className="w-6 h-6" />,
    color: "#F59E0B",
    questionCount: 15,
    questionTimeLimit: 45, // 45 seconds per question
    questions: [
      { q: "AMPK is?", o: ["Energy sensor", "mTOR inhibitor", "Autophagy activator", "All above"], c: [3] },
      { q: "Pathways regulating lifespan?", o: ["IGF-1/mTOR", "FOXO/SIRT", "AMPK/PGC-1α", "All above"], c: [3] },
      { q: "Free radical theory limitation?", o: ["Antioxidant paradox", "Hormesis", "Both", "Neither"], c: [2] },
      { q: "NAD+ precursors?", o: ["NR", "NMN", "Both", "Neither"], c: [2] },
      { q: "Caloric restriction mimetics are?", o: ["Drugs mimicking CR", "Direct fasting", "Vitamins", "Protein"], c: [0] },
      { q: "Prevents protein aggregation?", o: ["Chaperones", "Autophagy", "Heat shock proteins", "All above"], c: [3] },
      { q: "Hallmarks of aging?", o: ["Telomere attrition", "Epigenetic changes", "Genomic instability", "All above"], c: [3] },
      { q: "Geroprotectors?", o: ["Metformin", "Rapamycin", "Both", "Neither"], c: [2] },
      { q: "Accelerates atherosclerosis?", o: ["High LDL", "Inflammation", "Smoking", "All above"], c: [3] },
      { q: "Apoptosis is?", o: ["Programmed cell death", "Cell repair", "DNA mutation", "Cancer growth"], c: [0] },
      { q: "Alzheimer's brain plaques?", o: ["Beta-amyloid", "Tau tangles", "Both", "Neither"], c: [2] },
      { q: "Role of SIRT1?", o: ["Gene regulation", "DNA repair", "Stress resistance", "All above"], c: [3] },
      { q: "Excess uric acid causes?", o: ["Arthritis", "Gout", "Rickets", "Diabetes"], c: [1] },
      { q: "Which lowers inflammation?", o: ["Exercise", "Turmeric", "Omega-3", "All above"], c: [3] },
      { q: "Accelerates cancer risk?", o: ["Smoking", "Obesity", "Alcohol", "All above"], c: [3] }
    ]
  },

  5: {
    name: "Health Master",
    description: "Mastery of cutting-edge health science",
    icon: <Trophy className="w-6 h-6" />,
    color: "#EF4444",
    questionCount: 10,
    questionTimeLimit: 60, // 60 seconds per question
    questions: [
      { q: "The unified theory of aging suggests:", o: ["Multiple mechanisms", "Single pathway", "Random damage only", "Genetic programming only"], c: [0] },
      { q: "Most promising longevity targets include:", o: ["Senescence", "Mitochondria", "Stem cells", "All above"], c: [3] },
      { q: "What is the maximum human lifespan debate about?", o: ["Fixed limit", "Plastic limit", "Both theories valid", "No consensus"], c: [3] },
      { q: "Epigenetic modifications affecting aging include:", o: ["DNA methylation", "Histone modification", "microRNA", "All above"], c: [3] },
      { q: "The antagonistic pleiotropy theory means:", o: ["Beneficial genes later cause harm", "Age-related trade-offs", "Both", "Neither"], c: [2] },
      { q: "Emerging longevity biomarkers include:", o: ["Epigenetic clocks", "Proteomic signatures", "Metabolomic profiles", "All above"], c: [3] },
      { q: "Senolytic drugs target:", o: ["Stem cells", "Senescent cells", "Mitochondria", "Telomeres"], c: [1] },
      { q: "Which concept explains aging as energy trade-offs?", o: ["Disposable soma theory", "Telomere theory", "Mitochondrial theory", "Rate of living"], c: [0] },
      { q: "Which intervention consistently extends lifespan in animals?", o: ["High protein diet", "Caloric restriction", "Excess exercise", "Antioxidant supplements"], c: [1] },
      { q: "Which hallmarks are considered primary drivers of aging?", o: ["Genomic instability", "Telomere attrition", "Epigenetic drift", "All above"], c: [3] }
    ]
  }
};

function HealthQuiz() {
  // Initialize state with localStorage persistence
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zevaQuiz_currentLevel');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [levelScores, setLevelScores] = useState<Record<number, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zevaQuiz_levelScores');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [unlockedLevels, setUnlockedLevels] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zevaQuiz_unlockedLevels');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const shuffle = (array: Question[]): Question[] => [...array].sort(() => Math.random() - 0.5);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zevaQuiz_currentLevel', currentLevel.toString());
      localStorage.setItem('zevaQuiz_levelScores', JSON.stringify(levelScores));
      localStorage.setItem('zevaQuiz_unlockedLevels', unlockedLevels.toString());
    }
  }, [currentLevel, levelScores, unlockedLevels]);

  // Clear all progress from localStorage
  const clearProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zevaQuiz_currentLevel');
      localStorage.removeItem('zevaQuiz_levelScores');
      localStorage.removeItem('zevaQuiz_unlockedLevels');
    }
  };

  const startQuestionTimer = useCallback(() => {
    const levelData = QUIZ_DATA[currentLevel];
    setTimeLeft(levelData.questionTimeLimit);
    setTimerActive(true);
  }, [currentLevel]);

  const handleTimeUp = useCallback(() => {
    setTimerActive(false);
    // Mark as wrong since no answer was selected or time ran out
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected([]);
      // Start timer for next question
      setTimeout(() => startQuestionTimer(), 500);
    } else {
      // Last question, show results
      setLevelScores(prev => ({ ...prev, [currentLevel]: score }));
      setShowResult(true);
    }
  }, [currentQ, questions.length, startQuestionTimer, currentLevel, score]);

  useEffect(() => {
    const levelData = QUIZ_DATA[currentLevel];
    const shuffled = shuffle(levelData.questions);
    const questionCount = levelData.questionCount;
    setQuestions(shuffled.slice(0, questionCount));
    setCurrentQ(0);
    setScore(0);
    setSelected([]);
    setShowResult(false);
    // Start timer for first question
    setTimeout(() => startQuestionTimer(), 100);
  }, [currentLevel, startQuestionTimer]);

  // Timer effect - per question
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && !showResult && !showLevelSelect) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive && !showResult) {
      // Time's up for this question - auto move to next
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, showResult, showLevelSelect, handleTimeUp]);

  const handleAnswer = (optionIndex: number): void => {
    const isMultipleChoice = questions[currentQ]?.c.length > 1;
    if (isMultipleChoice) {
      if (selected.includes(optionIndex)) {
        setSelected(selected.filter((i: number) => i !== optionIndex));
      } else {
        setSelected([...selected, optionIndex]);
      }
    } else {
      setSelected([optionIndex]);
    }
  };

  const quitQuiz = (): void => {
    setCurrentLevel(1);
    setLevelScores({});
    setUnlockedLevels(1);
    setGameComplete(false);
    setShowLevelSelect(true);
    setCurrentQ(0);
    setScore(0);
    setSelected([]);
    setTimeLeft(60);
    setTimerActive(false);
    clearProgress(); // Clear localStorage
  };

  // Reset just the current level - retry functionality
  const retryLevel = (): void => {
    setCurrentQ(0);
    setScore(0);
    setSelected([]);
    setShowResult(false);
    setShowLevelSelect(false); // Stay in quiz mode, don't go to level select
    // Questions will be reshuffled by useEffect when showResult changes
  };

  const checkAnswer = (): void => {
    setTimerActive(false); // Stop the timer
    const correct: number[] = questions[currentQ].c;
    const isCorrect: boolean = correct.length === selected.length && correct.every((c: number) => selected.includes(c));
    if (isCorrect) setScore(score + 1);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected([]);
      // Start timer for next question
      setTimeout(() => startQuestionTimer(), 500);
    } else {
      const finalScore: number = isCorrect ? score + 1 : score;
      setLevelScores(prev => ({ ...prev, [currentLevel]: finalScore }));
      setShowResult(true);
    }
  };

  const handleLevelComplete = (): void => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 70) {
      if (currentLevel < 5) {
        setUnlockedLevels(Math.max(unlockedLevels, currentLevel + 1));
        setShowLevelSelect(true); // Go back to level select to choose next level
      } else {
        setGameComplete(true);
      }
    } else {
      setShowLevelSelect(true);
    }
  };

  // Save progress whenever key state changes
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  const getChartData = (): ChartData[] => {
    return Object.entries(levelScores).map(([level, score]: [string, number]) => {
      const levelData = QUIZ_DATA[parseInt(level)];
      const total = levelData.questionCount;
      return {
        level: `Level ${level}`,
        score: score,
        percentage: Math.round((score / total) * 100),
        total: total
      };
    });
  };

  const getOverallPerformance = () => {
    const totalQuestions = Object.keys(levelScores).reduce((sum, level) => {
      return sum + QUIZ_DATA[parseInt(level)].questionCount;
    }, 0);
    const totalCorrect = Object.values(levelScores).reduce((sum, score) => sum + score, 0);
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  };

  if (showLevelSelect) {
    return (
      <>
        <Head>
          <title>Health Quiz Challenge – Test Your Health Knowledge Online</title>
          <meta
            name="description"
            content="Take the Health Quiz Challenge on Zeva to test and improve your health knowledge. Enjoy fun, interactive quizzes that teach wellness tips, fitness, nutrition, and healthy habits."
          />
          <meta
            name="keywords"
            content="Health Quiz Challenge, health quizzes, test health knowledge, interactive wellness quizzes, online health quiz, fitness quiz, nutrition quiz, wellness quiz, fun health quizzes, learn healthy habits, free health quiz, interactive health game, Zeva health quiz, health knowledge test, healthy lifestyle quiz"
          />
          
          {/* Schema Markup - Health Quiz Challenge WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Health Quiz Challenge",
                "url": "https://zeva360.com/games/quiz",
                "description": "Health Quiz Challenge by ZEVA is an interactive wellness quiz that helps users test their health knowledge, learn healthy habits, and improve lifestyle awareness.",
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
                  "name": "Health Quiz Challenge",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An engaging health quiz game that educates users about fitness, nutrition, mental wellness, and healthy lifestyle practices through fun challenges.",
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white p-3 rounded-full shadow-lg mr-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Zeva Health Quiz</h1>
                <p className="text-gray-600 mt-2">Test your health knowledge across 5 progressive levels</p>
              </div>
            </div>
          </div>

          {/* Level Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map(level => {
              const isUnlocked = level <= unlockedLevels;
              const isCompleted = levelScores[level] !== undefined;
              const levelData = QUIZ_DATA[level];

              return (
                <div
                  key={level}
                  className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all duration-300 ${isUnlocked
                      ? 'hover:shadow-xl hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-200'
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                  onClick={() => {
                    if (isUnlocked) {
                      setCurrentLevel(level);
                      setShowLevelSelect(false);
                    }
                  }}
                >
                  {!isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="flex items-center mb-4">
                    <div
                      className="p-3 rounded-full text-white mr-4"
                      style={{ backgroundColor: levelData.color }}
                    >
                      {levelData.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">Level {level}</h3>
                      <p className="text-sm text-gray-500">{levelData.name}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{levelData.description}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {levelData.questionCount} questions • {levelData.questionTimeLimit}s per question
                  </p>

                  {isCompleted && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-semibold flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round((levelScores[level] / levelData.questionCount) * 100)}%
                      </span>
                    </div>
                  )}

                  {isUnlocked && !isCompleted && (
                    <div className="flex items-center text-blue-600">
                      <Unlock className="w-4 h-4 mr-1" />
                      <span className="font-medium">Start Level</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Overview */}
          {Object.keys(levelScores).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Your Progress
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(levelScores).length}</div>
                  <div className="text-gray-600">Levels Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getOverallPerformance()}%</div>
                  <div className="text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{unlockedLevels}</div>
                  <div className="text-gray-600">Levels Unlocked</div>
                </div>
              </div>
            </div>
          )}

          {/* Quit Quiz Button */}
          {Object.keys(levelScores).length > 0 && (
            <div className="text-center">
              <button
                onClick={quitQuiz}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Quit Quiz & Reset Progress
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will reset all your progress and return you to Level 1
              </p>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  if (gameComplete) {
    const overallScore = getOverallPerformance();

    return (
      <>
        <Head>
          <title>Health Quiz Challenge – Test Your Health Knowledge Online</title>
          <meta
            name="description"
            content="Take the Health Quiz Challenge on Zeva to test and improve your health knowledge. Enjoy fun, interactive quizzes that teach wellness tips, fitness, nutrition, and healthy habits."
          />
          <meta
            name="keywords"
            content="Health Quiz Challenge, health quizzes, test health knowledge, interactive wellness quizzes, online health quiz, fitness quiz, nutrition quiz, wellness quiz, fun health quizzes, learn healthy habits, free health quiz, interactive health game, Zeva health quiz, health knowledge test, healthy lifestyle quiz"
          />
          
          {/* Schema Markup - Health Quiz Challenge WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Health Quiz Challenge",
                "url": "https://zeva360.com/games/quiz",
                "description": "Health Quiz Challenge by ZEVA is an interactive wellness quiz that helps users test their health knowledge, learn healthy habits, and improve lifestyle awareness.",
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
                  "name": "Health Quiz Challenge",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An engaging health quiz game that educates users about fitness, nutrition, mental wellness, and healthy lifestyle practices through fun challenges.",
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Congratulations Header */}
          <div className="text-center mb-12">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Congratulations!</h1>
            <p className="text-xl text-gray-600 mb-2">You&apos;ve completed all 5 levels of the Zeva Health Quiz!</p>
            <div className="text-3xl font-bold text-purple-600 mb-4">Overall Score: {overallScore}%</div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">Your Health Knowledge Journey</h3>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="level" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Area type="monotone" dataKey="percentage" stroke="#8884d8" fillOpacity={1} fill="url(#colorGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Level breakdown */}
            <div className="grid md:grid-cols-5 gap-4">
              {getChartData().map((data, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-lg font-bold text-gray-800">{data.level}</div>
                  <div className="text-2xl font-bold" style={{ color: QUIZ_DATA[index + 1].color }}>
                    {data.score}/{data.total}
                  </div>
                  <div className="text-sm text-gray-600">{data.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Zeva Branding & Healthcare Services */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
            <div className="text-center mb-8">
              <Heart className="w-12 h-12 mx-auto mb-4 text-pink-200" />
              <h2 className="text-3xl font-bold mb-2">Zeva Cares for Your Health</h2>
              <p className="text-blue-100 text-lg">
                Great job on completing your health knowledge journey! We&apos;re here to support your wellness every step of the way.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-6 h-6 mr-3 text-green-300" />
                  <h3 className="text-xl font-bold">Find Nearby Clinics</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  Locate the best healthcare clinics in your area for regular check-ups and preventive care.
                </p>
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
                >
                  Find Clinics <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Stethoscope className="w-6 h-6 mr-3 text-green-300" />
                  <h3 className="text-xl font-bold">Connect with Doctors</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  Find experienced doctors and specialists for personalized healthcare consultations.
                </p>
                <button
                  onClick={() => window.open('/doctor/search', '_blank')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
                >
                  Search Doctors <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={() => setShowLevelSelect(true)}
              className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors mr-4"
            >
              Back to Levels
            </button>
            
            <button
              onClick={quitQuiz}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-semibold transition-colors"
            >
              Quit Quiz
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;
    const levelData = QUIZ_DATA[currentLevel];

    return (
      <>
        <Head>
          <title>Health Quiz Challenge – Test Your Health Knowledge Online</title>
          <meta
            name="description"
            content="Take the Health Quiz Challenge on Zeva to test and improve your health knowledge. Enjoy fun, interactive quizzes that teach wellness tips, fitness, nutrition, and healthy habits."
          />
          <meta
            name="keywords"
            content="Health Quiz Challenge, health quizzes, test health knowledge, interactive wellness quizzes, online health quiz, fitness quiz, nutrition quiz, wellness quiz, fun health quizzes, learn healthy habits, free health quiz, interactive health game, Zeva health quiz, health knowledge test, healthy lifestyle quiz"
          />
          
          {/* Schema Markup - Health Quiz Challenge WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Health Quiz Challenge",
                "url": "https://zeva360.com/games/quiz",
                "description": "Health Quiz Challenge by ZEVA is an interactive wellness quiz that helps users test their health knowledge, learn healthy habits, and improve lifestyle awareness.",
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
                  "name": "Health Quiz Challenge",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An engaging health quiz game that educates users about fitness, nutrition, mental wellness, and healthy lifestyle practices through fun challenges.",
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Result Icon */}
            <div className="mb-6">
              {passed ?
                <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div> :
                <div className="bg-red-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              }
            </div>

            {/* Result Text */}
            <h2 className="text-3xl font-bold mb-2" style={{ color: levelData.color }}>
              Level {currentLevel} {passed ? 'Completed!' : 'Not Passed'}
            </h2>
            <h3 className="text-xl text-gray-600 mb-6">{levelData.name}</h3>

            {/* Score Display */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold mb-2" style={{ color: levelData.color }}>
                {score}/{questions.length}
              </div>
              <div className="text-2xl text-gray-700 mb-2">{percentage}%</div>
              <div className="text-gray-500">
                {passed ? 'Great job! You can proceed to the next level.' : 'You need 80% to unlock the next level.'}
              </div>
            </div>

            {/* Progress Chart */}
            <div className="h-64 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ level: `Level ${currentLevel}`, score: percentage }]}>
                  <XAxis dataKey="level" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} fill={levelData.color} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Zeva Care Message */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6 mb-6">
              <Heart className="w-8 h-8 mx-auto mb-3 text-pink-200" />
              <h3 className="text-xl font-bold mb-2">Zeva Cares About Your Health Journey</h3>
              <p className="text-pink-100">
                {passed
                  ? "Congratulations on expanding your health knowledge! Keep learning and growing stronger."
                  : "Don&apos;t worry! Learning is a journey. Review the topics and try again when you&apos;re ready."
                }
              </p>

              {/* Quick Health Tips */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Clinics Nearby
                </button>
                <button
                  onClick={() => window.open('/doctor/search', '_blank')}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Consult a Doctor
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {passed && currentLevel < 5 ? (
                <button
                  onClick={handleLevelComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Continue to Next Level <ArrowRight className="w-5 h-5 ml-2 inline" />
                </button>
              ) : passed && currentLevel === 5 ? (
                <button
                  onClick={handleLevelComplete}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  View Final Results <Trophy className="w-5 h-5 ml-2 inline" />
                </button>
              ) : (
                <button
                  onClick={retryLevel}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Try Again
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLevelSelect(true)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Levels
                </button>
                
                <button
                  onClick={quitQuiz}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-semibold transition-colors"
                >
                  Quit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Head>
          <title>Health Quiz Challenge – Test Your Health Knowledge Online</title>
          <meta
            name="description"
            content="Take the Health Quiz Challenge on Zeva to test and improve your health knowledge. Enjoy fun, interactive quizzes that teach wellness tips, fitness, nutrition, and healthy habits."
          />
          <meta
            name="keywords"
            content="Health Quiz Challenge, health quizzes, test health knowledge, interactive wellness quizzes, online health quiz, fitness quiz, nutrition quiz, wellness quiz, fun health quizzes, learn healthy habits, free health quiz, interactive health game, Zeva health quiz, health knowledge test, healthy lifestyle quiz"
          />
          
          {/* Schema Markup - Health Quiz Challenge WebPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Health Quiz Challenge",
                "url": "https://zeva360.com/games/quiz",
                "description": "Health Quiz Challenge by ZEVA is an interactive wellness quiz that helps users test their health knowledge, learn healthy habits, and improve lifestyle awareness.",
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
                  "name": "Health Quiz Challenge",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "An engaging health quiz game that educates users about fitness, nutrition, mental wellness, and healthy lifestyle practices through fun challenges.",
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
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health quiz...</p>
        </div>
      </div>
      </>
    );
  }

  const currentQuestion: Question = questions[currentQ];
  const levelData = QUIZ_DATA[currentLevel];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <>
      <Head>
        <title>Health Quiz Challenge – Test Your Health Knowledge Online</title>
        <meta
          name="description"
          content="Take the Health Quiz Challenge on Zeva to test and improve your health knowledge. Enjoy fun, interactive quizzes that teach wellness tips, fitness, nutrition, and healthy habits."
        />
        <meta
          name="keywords"
          content="Health Quiz Challenge, health quizzes, test health knowledge, interactive wellness quizzes, online health quiz, fitness quiz, nutrition quiz, wellness quiz, fun health quizzes, learn healthy habits, free health quiz, interactive health game, Zeva health quiz, health knowledge test, healthy lifestyle quiz"
        />
      </Head>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <div className="h-full flex flex-col max-w-6xl mx-auto p-3">
        
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="p-2 rounded-lg text-white mr-3 flex-shrink-0"
                style={{ backgroundColor: levelData.color }}
              >
                {React.cloneElement(levelData.icon as React.ReactElement, {})}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Level {currentLevel}</h1>
                <p className="text-sm text-gray-600">{levelData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer - Prominent Display */}
              <div className="text-center">
                <div className="text-xs text-gray-500">Time Left</div>
                <div 
                  className={`text-2xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : timeLeft <= 20 ? 'text-orange-500' : ''}`}
                  style={timeLeft > 20 ? { color: levelData.color } : {}}
                >
                  {timeLeft}s
                </div>
              </div>
              
              {/* Question Progress */}
              <div className="text-center">
                <div className="text-xs text-gray-500">Question</div>
                <div className="text-lg font-bold" style={{ color: levelData.color }}>
                  {currentQ + 1}/{questions.length}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: levelData.color
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Content - Takes remaining space */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-4 mb-3 flex flex-col min-h-0">
          
          {/* Question Text */}
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 leading-snug line-clamp-3">
              {currentQuestion.q}
            </h2>
            
            {/* Multiple choice indicator */}
            {currentQuestion.c.length > 1 && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mt-3 rounded-r">
                <p className="text-blue-800 font-medium text-xs flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Multiple answers may be correct
                </p>
              </div>
            )}
          </div>

          {/* Options Grid - Flexible */}
          <div className="flex-1 grid grid-cols-1 gap-2 content-center">
            {currentQuestion.o.map((option: string, idx: number) => {
              const isMultipleChoice = currentQuestion.c.length > 1;
              const isSelected = selected.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`p-3 text-left rounded-lg border-2 transition-all duration-150 hover:scale-[1.01] ${isSelected
                      ? 'border-opacity-100 text-white shadow-md'
                      : 'border-gray-200 hover:border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'
                    }`}
                  style={isSelected ? {
                    backgroundColor: levelData.color,
                    borderColor: levelData.color,
                  } : {}}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 mr-3 border-2 flex items-center justify-center flex-shrink-0 ${isMultipleChoice ? 'rounded' : 'rounded-full'
                      } ${isSelected ? 'bg-white border-white' : 'border-gray-400'
                      }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelData.color }}></div>
                      )}
                    </div>
                    <span className="font-medium text-sm leading-tight">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions - Fixed */}
        <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-3">
          <div className="text-center">
            <button
              onClick={checkAnswer}
              disabled={selected.length === 0}
              className={`px-8 py-3 text-white font-bold rounded-lg shadow-md transition-all duration-200 ${selected.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'hover:shadow-lg transform hover:scale-105'
                }`}
              style={selected.length > 0 ? { backgroundColor: levelData.color } : {}}
            >
              {currentQ === questions.length - 1 ? 'Complete Level' : 'Next Question'}
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </button>

            {/* Selection Status */}
            <div className="mt-2 flex items-center justify-center text-xs text-gray-600 gap-4">
              {currentQuestion.c.length > 1 && (
                <span>{selected.length} selected</span>
              )}
              <span className="flex items-center">
                <Heart className="w-3 h-3 mr-1 text-red-400" />
                Zeva Health
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default HealthQuiz;

// HealthQuiz.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; // No layout
// };