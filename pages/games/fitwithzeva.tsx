import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Play, Pause, RotateCcw, Timer, Trophy, Heart, RefreshCw } from 'lucide-react';

// Type definitions
interface UserProfile {
  name: string;
  age: string;
  weight: string;
  gender: string;
}

interface Exercise {
  name: string;
  duration: number;
  image: string;
  calories: number;
  description: string;
}

interface ExercisePlan {
  day: number;
  type: 'cardio' | 'strength' | 'flexibility';
  exercises: Exercise[];
  target: string;
}

interface ExerciseCategories {
  cardio: Exercise[];
  strength: Exercise[];
  flexibility: Exercise[];
}

type ScreenType = 'profile' | 'plan' | 'exercise' | 'complete';

function FitnessApp () {
  const [screen, setScreen] = useState<ScreenType>('profile');
  const [profile, setProfile] = useState<UserProfile>({ name: '', age: '', weight: '', gender: '' });
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan[]>([]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const exercises: ExerciseCategories = {
    cardio: [
      {
        name: 'Jumping Jacks',
        duration: 30,
        image: 'https://static.vecteezy.com/system/resources/previews/010/978/816/non_2x/jumping-jacks-exercise-woman-workout-fitness-aerobic-and-exercises-vector.jpg',
        calories: 8,
        description: 'Jump with legs apart, arms overhead'
      },
      {
        name: 'High Knees',
        duration: 20,
        image: 'https://liftmanual.com/wp-content/uploads/2023/04/high-knee-run.jpg',
        calories: 6,
        description: 'Run in place, lift knees to chest'
      },
      {
        name: 'Burpees',
        duration: 15,
        image: 'https://i.ytimg.com/vi/auBLPXO8Fww/hq720.jpg',
        calories: 12,
        description: 'Squat, jump back, push-up, jump forward'
      }
    ],
    strength: [
      {
        name: 'Push-ups',
        duration: 45,
        image: 'https://media.istockphoto.com/id/578104104/vector/step-to-instruction-in-push-up.jpg?s=612x612&w=0&k=20&c=AYSyhYJB-98AZL2Euig4fygTjdxliyE8TWHGfXNO6go=',
        calories: 10,
        description: 'Lower body to ground, push back up'
      },
      {
        name: 'Squats',
        duration: 60,
        image: 'https://spotebi.com/wp-content/uploads/2014/10/squat-exercise-illustration.jpg',
        calories: 8,
        description: 'Lower hips back and down, then stand'
      },
      {
        name: 'Plank',
        duration: 30,
        image: 'https://www.inspireusafoundation.org/file/2023/07/plank-benefits-1024x576.png',
        calories: 5,
        description: 'Hold body straight like a plank'
      }
    ],
    flexibility: [
      {
        name: 'Yoga Warrior',
        duration: 60,
        image: 'https://storage.googleapis.com/bitnami-cs96dkm0ag.appspot.com/offeringtree-client-dev/1653764092397/22.jpg',
        calories: 3,
        description: 'Hold warrior pose, breathe deeply'
      },
      {
        name: 'Full Body Stretch',
        duration: 45,
        image: 'https://static.vecteezy.com/system/resources/previews/017/582/369/non_2x/workout-man-set-man-doing-fitness-exercises-full-body-stretching-warming-up-and-stretch-flat-illustration-isolated-on-white-background-vector.jpg',
        calories: 4,
        description: 'Stretch arms, legs, and core muscles'
      }
    ]
  };

  // Safe localStorage operations with error handling
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail if localStorage is not available
      }
    },
    removeItem: (key: string): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail if localStorage is not available
      }
    }
  };

  // Load saved data on component mount
  useEffect(() => {
    try {
      const savedProfile = safeLocalStorage.getItem('zevaFitnessProfile');
      const savedCurrentDay = safeLocalStorage.getItem('zevaCurrentDay');
      const savedCompletedDays = safeLocalStorage.getItem('zevaCompletedDays');
      const savedExercisePlan = safeLocalStorage.getItem('zevaExercisePlan');

      const parsedProfile: UserProfile | null = savedProfile ? JSON.parse(savedProfile) : null;
      const parsedCurrentDay: number = savedCurrentDay ? parseInt(savedCurrentDay, 10) : 1;
      const parsedCompletedDays: number[] = savedCompletedDays ? JSON.parse(savedCompletedDays) : [];
      const parsedExercisePlan: ExercisePlan[] = savedExercisePlan ? JSON.parse(savedExercisePlan) : [];

      if (parsedProfile && parsedProfile.name) {
        setProfile(parsedProfile);
        setCurrentDay(parsedCurrentDay);
        setCompletedDays(parsedCompletedDays);
        setExercisePlan(parsedExercisePlan);
        setScreen('plan');
      }
    } catch (error) {
      console.log('No saved data found or error loading data:', error);
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (profile.name) {
      safeLocalStorage.setItem('zevaFitnessProfile', JSON.stringify(profile));
      safeLocalStorage.setItem('zevaCurrentDay', currentDay.toString());
      safeLocalStorage.setItem('zevaCompletedDays', JSON.stringify(completedDays));
      safeLocalStorage.setItem('zevaExercisePlan', JSON.stringify(exercisePlan));
    }
  }, [profile, currentDay, completedDays, exercisePlan]);

  const generatePlan = (userProfile: UserProfile): ExercisePlan[] => {
    const weight = parseInt(userProfile.weight, 10);
    const intensity: 'high' | 'medium' | 'low' = weight > 80 ? 'high' : weight > 60 ? 'medium' : 'low';
    const plan: ExercisePlan[] = [];

    for (let day = 1; day <= 30; day++) {
      const dayType: 'cardio' | 'strength' | 'flexibility' = 
        day % 3 === 1 ? 'cardio' : day % 3 === 2 ? 'strength' : 'flexibility';
      const exerciseCount = intensity === 'high' ? 3 : 2;

      plan.push({
        day: day,
        type: dayType,
        exercises: exercises[dayType].slice(0, exerciseCount),
        target: dayType === 'cardio' ? 'Fat Burn' : dayType === 'strength' ? 'Muscle Build' : 'Recovery'
      });
    }
    return plan;
  };

  const startProfile = (): void => {
    if (!profile.name || !profile.age || !profile.weight || !profile.gender) return;
    const plan = generatePlan(profile);
    setExercisePlan(plan);
    setScreen('plan');
  };

  const resetSession = (): void => {
    safeLocalStorage.removeItem('zevaFitnessProfile');
    safeLocalStorage.removeItem('zevaCurrentDay');
    safeLocalStorage.removeItem('zevaCompletedDays');
    safeLocalStorage.removeItem('zevaExercisePlan');
    setProfile({ name: '', age: '', weight: '', gender: '' });
    setCurrentDay(1);
    setCompletedDays([]);
    setExercisePlan([]);
    setScreen('profile');
  };

  const startDay = (day: number): void => {
    setCurrentDay(day);
    setCurrentExercise(0);
    const todayPlan = exercisePlan.find(p => p.day === day);
    if (todayPlan && todayPlan.exercises.length > 0) {
      setTimer(todayPlan.exercises[0].duration);
    }
    setScreen('exercise');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      const todayPlan = exercisePlan.find(p => p.day === currentDay);
      if (todayPlan && currentExercise < todayPlan.exercises.length - 1) {
        setTimeout(() => {
          const nextIndex = currentExercise + 1;
          setCurrentExercise(nextIndex);
          setTimer(todayPlan.exercises[nextIndex].duration);
        }, 1000);
      } else {
        if (!completedDays.includes(currentDay)) {
          setCompletedDays(prev => [...prev, currentDay]);
        }
        setScreen('complete');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timer, currentExercise, exercisePlan, currentDay, completedDays]);

  const handleProfileChange = (field: keyof UserProfile, value: string): void => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Profile Screen
  if (screen === 'profile') {
return (
  <>
    <Head>
      <title>Be Fit with Zeva – Fun Exercises to Boost Immunity & Strength</title>
      <meta
        name="description"
        content="Play Be Fit with Zeva, a fun and interactive fitness game that helps boost your immunity, build strength, and stay active. Enjoy free exercises anytime, anywhere, and improve your well-being."
      />
      <meta
        name="keywords"
        content="Be Fit with Zeva, fitness game, immunity booster exercises, strength building game, interactive fitness, fun health games, free fitness game online, home workout game, wellness exercises, active lifestyle game, exercise challenges, virtual fitness game, health and wellness game, boost strength and immunity, body fitness game"
      />
    </Head>
    <div className="min-h-screen bg-white p-4 flex items-center justify-center">
    <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-2xl">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ZEVA Fitness</h1>
        <p className="text-gray-700 font-medium text-sm mb-1">ZEVA cares for you and wants you to be fit</p>
        <p className="text-gray-600 text-sm">Create your personalized fitness journey</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={profile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              placeholder="25"
              value={profile.age}
              onChange={(e) => handleProfileChange('age', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              placeholder="70"
              value={profile.weight}
              onChange={(e) => handleProfileChange('weight', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={profile.gender}
            onChange={(e) => handleProfileChange('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={startProfile}
          disabled={!profile.name || !profile.age || !profile.weight || !profile.gender}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
        >
          Start My Fitness Journey
        </button>
      </div>
    </div>
  </div>
  </>
);
  }

  // Exercise Plan Screen
  if (screen === 'plan') {
    return (
      <>
        <Head>
          <title>Be Fit with Zeva – Fun Exercises to Boost Immunity & Strength</title>
          <meta
            name="description"
            content="Play Be Fit with Zeva, a fun and interactive fitness game that helps boost your immunity, build strength, and stay active. Enjoy free exercises anytime, anywhere, and improve your well-being."
          />
          <meta
            name="keywords"
            content="Be Fit with Zeva, fitness game, immunity booster exercises, strength building game, interactive fitness, fun health games, free fitness game online, home workout game, wellness exercises, active lifestyle game, exercise challenges, virtual fitness game, health and wellness game, boost strength and immunity, body fitness game"
          />
        </Head>
        <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {profile.name}!</h1>
                <p className="text-[#2D9AA5] font-semibold mb-1 text-lg">ZEVA cares for you and wants you to be fit</p>
                <p className="text-gray-600">Your Personalized 30-Day Fitness Journey</p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={resetSession}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset My Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2D9AA5]">{profile.age}</div>
                <div className="text-sm text-gray-600">Age</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2D9AA5]">{profile.weight}kg</div>
                <div className="text-sm text-gray-600">Weight</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2D9AA5]">30</div>
                <div className="text-sm text-gray-600">Days Plan</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2D9AA5]">{completedDays.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2D9AA5]">{currentDay}</div>
                <div className="text-sm text-gray-600">Current Day</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{completedDays.length}/30 days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-[#2D9AA5] to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(completedDays.length / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercisePlan.map((day) => (
              <div key={day.day} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-2 ${completedDays.includes(day.day) ? 'bg-green-500' :
                  day.day === currentDay ? 'bg-[#2D9AA5]' : 'bg-gray-200'
                  }`} />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Day {day.day}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${day.type === 'cardio' ? 'bg-red-100 text-red-700' :
                      day.type === 'strength' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {day.target}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <img
                          src={ex.image}
                          alt={ex.name}
                          className="w-12 h-12 rounded-lg object-cover shadow-md"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-800">{ex.name}</div>
                          <div className="text-xs text-gray-500">{ex.duration}s • {ex.calories} cal</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => startDay(day.day)}
                    disabled={day.day > currentDay}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${completedDays.includes(day.day)
                      ? 'bg-green-500 text-white cursor-default'
                      : day.day === currentDay
                        ? 'bg-[#2D9AA5] hover:bg-[#258993] text-white transform hover:scale-105'
                        : day.day < currentDay
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {completedDays.includes(day.day) ? '✓ Completed' :
                      day.day === currentDay ? 'Start Today' :
                        day.day < currentDay ? 'Available' : 'Locked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
    );
  }

  // Exercise Screen
  if (screen === 'exercise') {
    const todayPlan = exercisePlan.find(p => p.day === currentDay);
    if (!todayPlan || !todayPlan.exercises) return null;

    const exercise = todayPlan.exercises[currentExercise];
    if (!exercise) return null;

    return (
      <>
        <Head>
          <title>Be Fit with Zeva – Fun Exercises to Boost Immunity & Strength</title>
          <meta
            name="description"
            content="Play Be Fit with Zeva, a fun and interactive fitness game that helps boost your immunity, build strength, and stay active. Enjoy free exercises anytime, anywhere, and improve your well-being."
          />
          <meta
            name="keywords"
            content="Be Fit with Zeva, fitness game, immunity booster exercises, strength building game, interactive fitness, fun health games, free fitness game online, home workout game, wellness exercises, active lifestyle game, exercise challenges, virtual fitness game, health and wellness game, boost strength and immunity, body fitness game"
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-[#2D9AA5] to-blue-600 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header & Progress */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Day {currentDay} - {todayPlan.target}
                </h2>
                <p className="text-gray-600">
                  Exercise {currentExercise + 1} of {todayPlan.exercises.length}
                </p>
              </div>
              <button
                onClick={() => setScreen("plan")}
                className="p-3 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#2D9AA5] to-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentExercise + 1) / todayPlan.exercises.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Exercise + Timer Side by Side */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Left: Exercise */}
              <div className="relative h-64 lg:h-80 bg-black flex items-center justify-center rounded-2xl overflow-hidden">
                <img
                  src={exercise.image}
                  alt={exercise.name}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {exercise.name}
                  </h1>
                  <p className="text-lg opacity-90">{exercise.description}</p>
                </div>
              </div>

              {/* Right: Timer */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
                <div className="text-7xl lg:text-8xl font-bold text-[#2D9AA5] mb-4 font-mono">
                  {Math.floor(timer / 60)}:
                  {(timer % 60).toString().padStart(2, "0")}
                </div>
                <div className="flex items-center justify-center gap-6 text-gray-600 mb-8">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    <span>{exercise.duration}s duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <span>{exercise.calories} calories</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center gap-3 transform hover:scale-105 shadow-lg ${isActive
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-[#2D9AA5] hover:bg-[#258993] text-white"
                      }`}
                  >
                    {isActive ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                    {isActive ? "Pause" : "Start Exercise"}
                  </button>

                  {timer === 0 && (
                    <button
                      onClick={() => {
                        if (currentExercise < todayPlan.exercises.length - 1) {
                          const nextIndex = currentExercise + 1;
                          setCurrentExercise(nextIndex);
                          setTimer(todayPlan.exercises[nextIndex].duration);
                        } else {
                          if (!completedDays.includes(currentDay)) {
                            setCompletedDays((prev) => [...prev, currentDay]);
                          }
                          setScreen("complete");
                        }
                      }}
                      className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      {currentExercise < todayPlan.exercises.length - 1
                        ? "Next Exercise"
                        : "Complete Day"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Completion Screen
  if (screen === 'complete') {
    const todayPlan = exercisePlan.find(p => p.day === currentDay);
    const totalCalories = todayPlan ? todayPlan.exercises.reduce((sum, ex) => sum + ex.calories, 0) : 0;

    return (
      <>
        <Head>
          <title>Be Fit with Zeva – Fun Exercises to Boost Immunity & Strength</title>
          <meta
            name="description"
            content="Play Be Fit with Zeva, a fun and interactive fitness game that helps boost your immunity, build strength, and stay active. Enjoy free exercises anytime, anywhere, and improve your well-being."
          />
          <meta
            name="keywords"
            content="Be Fit with Zeva, fitness game, immunity booster exercises, strength building game, interactive fitness, fun health games, free fitness game online, home workout game, wellness exercises, active lifestyle game, exercise challenges, virtual fitness game, health and wellness game, boost strength and immunity, body fitness game"
          />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-lg w-full">
          <div className="relative mb-6">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
            <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">Day {currentDay} Complete!</h1>
          <p className="text-xl text-gray-600 mb-2">Excellent work, {profile.name}!</p>
          <p className="text-[#2D9AA5] font-semibold mb-6 text-lg">ZEVA is proud of your dedication</p>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-8">
            <div className="text-4xl font-bold text-[#2D9AA5] mb-2">{totalCalories}</div>
            <div className="text-gray-600">Calories Burned Today</div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                if (currentDay < 30 && !completedDays.includes(currentDay + 1)) {
                  setCurrentDay(prev => prev + 1);
                }
                setScreen('plan');
              }}
              className="flex-1 bg-[#2D9AA5] hover:bg-[#258993] text-white py-4 rounded-xl font-bold text-lg transition-colors"
            >
              {currentDay < 30 ? 'Continue Journey' : 'View All Days'}
            </button>
            <button
              onClick={() => setScreen('plan')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Back to Plan
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return null;
};

export default FitnessApp;

// FitnessApp.getLayout = function PageLayout(page: React.ReactNode) {
//   return page; // No layout
// }