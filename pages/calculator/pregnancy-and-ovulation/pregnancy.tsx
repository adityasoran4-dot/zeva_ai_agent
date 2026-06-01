import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, Heart, Baby, Download, User, Stethoscope, Home, Plus, Trash2, AlertCircle, Clock, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import L1 from '../../../components/Layout';

// Define jsPDF type properly to avoid TypeScript errors
interface JSPDF {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  save: (filename: string) => void;
  text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  setFont: (font: string, style: string) => void;
  addPage: () => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  setDrawColor: (r: number, g?: number, b?: number) => void;
  setLineWidth: (width: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
}

// Remove problematic NextPage import and define our own type that allows getLayout
interface PageWithLayout extends React.FC {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
}

interface CycleData {
  id: string;
  startDate: string;
  cycleLength: number;
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
  estimatedDueDate: string;
}

interface UserProfile {
  name: string;
  age: number;
}

interface CalculationResult {
  estimatedDueDate: string;
  currentWeek: number;
  daysPregnant: number;
  fertileWindow: {
    start: string;
    end: string;
    ovulation: string;
  };
  progressPercentage: number;
}

const ZevaPregnancyCalculator: PageWithLayout = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', age: 0 });
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  // Additional calculation modes (non-breaking: defaults to LMP)
  const [calcMode, setCalcMode] = useState<'lmp' | 'conception' | 'due' | 'ultrasound' | 'ivf'>('lmp');
  const [conceptionDate, setConceptionDate] = useState('');
  const [knownDueDate, setKnownDueDate] = useState('');
  const [ultrasoundDate, setUltrasoundDate] = useState('');
  const [ultrasoundGAWeeks, setUltrasoundGAWeeks] = useState(8);
  const [ultrasoundGADays, setUltrasoundGADays] = useState(0);
  const [ivfTransferDate, setIvfTransferDate] = useState('');
  const [ivfEmbryoDay, setIvfEmbryoDay] = useState<3 | 5>(5);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calculatorRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load data from memory-based storage on component mount
    // Note: We can't use localStorage in Claude.ai artifacts, so we'll use component state instead
    const savedProfile = { name: '', age: 0 }; // In a real app, this would be localStorage.getItem('zeva-user-profile')
    const savedCycles: CycleData[] = []; // In a real app, this would be localStorage.getItem('zeva-cycles')
    
    if (savedProfile) {
      setUserProfile(savedProfile);
    }
    if (savedCycles) {
      setCycles(savedCycles);
    }
  }, []);

  useEffect(() => {
    if (result && activeTab === 'calculator') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result, activeTab]);

  const saveToMemory = (profile: UserProfile, cycleData: CycleData[]) => {
    // In a real Next.js app, you would use:
    // localStorage.setItem('zeva-user-profile', JSON.stringify(profile));
    // localStorage.setItem('zeva-cycles', JSON.stringify(cycleData));
    
    // For this demo, we'll just keep it in component state
    console.log('Saving profile and cycle data:', { profile, cycleData });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!userProfile.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (userProfile.age < 16 || userProfile.age > 50) {
      newErrors.age = 'Age must be between 16 and 50';
    }
    // Validate per selected calculation mode
    if (calcMode === 'lmp') {
      if (!lastPeriodDate) newErrors.lastPeriodDate = 'Last period date is required';
    }
    if (calcMode === 'conception') {
      if (!conceptionDate) newErrors.conceptionDate = 'Conception date is required';
    }
    if (calcMode === 'due') {
      if (!knownDueDate) newErrors.knownDueDate = 'Due date is required';
    }
    if (calcMode === 'ultrasound') {
      if (!ultrasoundDate) newErrors.ultrasoundDate = 'Ultrasound date is required';
      if (ultrasoundGAWeeks < 4 || ultrasoundGAWeeks > 20) newErrors.ultrasoundGA = 'GA weeks must be 4-20';
      if (ultrasoundGADays < 0 || ultrasoundGADays > 6) newErrors.ultrasoundGA = 'GA days must be 0-6';
    }
    if (calcMode === 'ivf') {
      if (!ivfTransferDate) newErrors.ivfTransferDate = 'Transfer date is required';
      if (![3,5].includes(ivfEmbryoDay)) newErrors.ivfEmbryoDay = 'Embryo day must be 3 or 5';
    }
    if (cycleLength < 21 || cycleLength > 35) {
      newErrors.cycleLength = 'Cycle length must be between 21 and 35 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDates = (lmpDate: string, cycleLen: number) => {
    const lmp = new Date(lmpDate);
    const today = new Date();
    
    // Calculate ovulation (typically cycle length - 14 days)
    const ovulationDate = new Date(lmp);
    ovulationDate.setDate(lmp.getDate() + cycleLen - 14);
    
    // Fertile window (5 days before ovulation to 1 day after)
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(ovulationDate.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(ovulationDate.getDate() + 1);
    
    // Estimated due date (LMP + 280 days)
    const dueDate = new Date(lmp);
    dueDate.setDate(lmp.getDate() + 280);
    
    // Current pregnancy stats
    const daysPregnant = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysPregnant / 7);
    const progressPercentage = Math.min((currentWeek / 40) * 100, 100);

    return {
      ovulationDate: ovulationDate.toISOString().split('T')[0],
      fertileStart: fertileStart.toISOString().split('T')[0],
      fertileEnd: fertileEnd.toISOString().split('T')[0],
      estimatedDueDate: dueDate.toISOString().split('T')[0],
      daysPregnant,
      currentWeek,
      progressPercentage
    };
  };

  // Derive LMP from alternate modes so downstream logic stays unchanged
  const computeLmpFromMode = (): string | null => {
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    if (calcMode === 'lmp') {
      return lastPeriodDate || null;
    }
    if (calcMode === 'conception') {
      if (!conceptionDate) return null;
      const c = new Date(conceptionDate);
      const lmp = new Date(c);
      lmp.setDate(c.getDate() - (cycleLength - 14));
      return toISO(lmp);
    }
    if (calcMode === 'due') {
      if (!knownDueDate) return null;
      const due = new Date(knownDueDate);
      const lmp = new Date(due);
      lmp.setDate(due.getDate() - 280);
      return toISO(lmp);
    }
    if (calcMode === 'ultrasound') {
      if (!ultrasoundDate) return null;
      const us = new Date(ultrasoundDate);
      const gaDays = ultrasoundGAWeeks * 7 + ultrasoundGADays;
      const edd = new Date(us);
      edd.setDate(us.getDate() + (280 - gaDays));
      const lmp = new Date(edd);
      lmp.setDate(edd.getDate() - 280);
      return toISO(lmp);
    }
    if (calcMode === 'ivf') {
      if (!ivfTransferDate) return null;
      const tr = new Date(ivfTransferDate);
      const edd = new Date(tr);
      // Standard IVF rule: EDD = transfer + (266 - embryoDay)
      edd.setDate(tr.getDate() + (266 - ivfEmbryoDay));
      const lmp = new Date(edd);
      lmp.setDate(edd.getDate() - 280);
      return toISO(lmp);
    }
    return null;
  };

  const handleCalculate = () => {
    if (!validateForm()) return;
    const derivedLmp = computeLmpFromMode();
    if (!derivedLmp) return;
    const calculations = calculateDates(derivedLmp, cycleLength);
    
    const newCycle: CycleData = {
      id: Date.now().toString(),
      startDate: lastPeriodDate,
      cycleLength,
      ovulationDate: calculations.ovulationDate,
      fertileStart: calculations.fertileStart,
      fertileEnd: calculations.fertileEnd,
      estimatedDueDate: calculations.estimatedDueDate
    };

    const updatedCycles = [newCycle, ...cycles];
    setCycles(updatedCycles);
    
    const calculationResult: CalculationResult = {
      estimatedDueDate: calculations.estimatedDueDate,
      currentWeek: calculations.currentWeek,
      daysPregnant: calculations.daysPregnant,
      fertileWindow: {
        start: calculations.fertileStart,
        end: calculations.fertileEnd,
        ovulation: calculations.ovulationDate
      },
      progressPercentage: calculations.progressPercentage
    };

    setResult(calculationResult);
    saveToMemory(userProfile, updatedCycles);
  };

  const deleteCycle = (id: string) => {
    const updatedCycles = cycles.filter(cycle => cycle.id !== id);
    setCycles(updatedCycles);
    saveToMemory(userProfile, updatedCycles);
  };

  const clearAllData = () => {
    // In a real Next.js app:
    // localStorage.removeItem('zeva-user-profile');
    // localStorage.removeItem('zeva-cycles');
    setUserProfile({ name: '', age: 0 });
    setCycles([]);
    setResult(null);
    setLastPeriodDate('');
    setCycleLength(28);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generatePDFReport = async () => {
    try {
      // Dynamic import with proper typing
      const jsPdfModule = await import('jspdf');
      const jsPDFConstructor = (jsPdfModule as { default: new () => JSPDF }).default;
      const doc = new jsPDFConstructor();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let cursorY = 18;

      const writeHeading = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(text, margin, cursorY);
        cursorY += 8;
      };

      const writeSubheading = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(text, margin, cursorY);
        cursorY += 6;
      };

      const writeParagraph = (text: string) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        doc.text(lines, margin, cursorY);
        cursorY += lines.length * 6 + 2;
      };

      const addDivider = () => {
        doc.setDrawColor(45, 154, 165);
        doc.setLineWidth(0.5);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 6;
      };

      const ensureSpace = (needed = 20) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (cursorY + needed > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
      };

      // Title
      writeHeading('ZEVA Pregnancy & Ovulation Report');
      doc.setTextColor(45, 154, 165);
      doc.setFontSize(11);
      doc.text(new Date().toLocaleString(), pageWidth - margin, 18, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      addDivider();

      // User Profile
      writeSubheading('User Profile');
      writeParagraph(`Name: ${userProfile.name || '—'}`);
      writeParagraph(`Age: ${userProfile.age ? String(userProfile.age) : '—'}`);
      addDivider();

      // Results summary (if present)
      if (result) {
        writeSubheading('Your Beautiful Results');
        writeParagraph(`Estimated Due Date: ${formatDate(result.estimatedDueDate)}`);
        writeParagraph(`Current Week: Week ${result.currentWeek} (${result.daysPregnant} days pregnant)`);
        writeParagraph(`Fertile Window: ${formatDate(result.fertileWindow.start)} to ${formatDate(result.fertileWindow.end)}`);
        writeParagraph(`Progress: ${result.progressPercentage.toFixed(1)}% of 40 weeks`);
        addDivider();
      }

      // Recent cycles (up to 5)
      ensureSpace();
      writeSubheading('Recent Cycles');
      if (cycles.length === 0) {
        writeParagraph('No cycle data available.');
      } else {
        cycles.slice(0, 5).forEach((cycle, index) => {
          ensureSpace(30);
          writeParagraph(
            `#${cycles.length - index} — Start: ${formatDate(cycle.startDate)}, ` +
            `Length: ${cycle.cycleLength} days, ` +
            `Ovulation: ${formatDate(cycle.ovulationDate)}, ` +
            `Fertile: ${formatDate(cycle.fertileStart)} → ${formatDate(cycle.fertileEnd)}, ` +
            `Est. Due: ${formatDate(cycle.estimatedDueDate)}`
          );
        });
      }

      // Footer note
      ensureSpace(30);
      addDivider();
      doc.setFontSize(9);
      doc.setTextColor(120);
      writeParagraph('Disclaimer: This report is for informational purposes only and does not replace professional medical advice. Consult your healthcare provider for personalized guidance.');

      const filename = `ZEVA-Pregnancy-Report-${userProfile.name || 'User'}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to JSON download if jsPDF is not available
      const reportData = {
        userProfile,
        result,
        cycles: cycles.slice(0, 5),
        generatedDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZEVA-Pregnancy-Report-${userProfile.name || 'User'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Calendar functionality
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateSelected = (day: number) => {
    if (!lastPeriodDate) return false;
    const selectedDate = new Date(lastPeriodDate);
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setLastPeriodDate(selectedDate.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.ReactElement[] = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all hover:bg-pink-100 ${
            isDateSelected(day)
              ? 'bg-gradient-to-r from-[#2D9AA5] to-pink-500 text-white'
              : 'text-gray-900 hover:text-pink-600'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#2D9AA5] via-pink-500 to-purple-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-20 h-20 bg-pink-300 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300 rounded-full"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-teal-300 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-8">
            {/* Pregnancy & Motherhood Illustration */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
              <Heart className="w-16 h-16 mx-auto mt-4 text-white drop-shadow-lg" />
              <Baby className="w-8 h-8 absolute -bottom-1 -right-1 text-pink-200" />
            </div>
            
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
              ZEVA Pregnancy & Ovulation Calculator
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Your trusted companion for tracking fertile days, pregnancy weeks, and due dates with scientific precision and loving care
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                setActiveTab('calculator');
                setTimeout(() => calculatorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-white text-[#2D9AA5] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-pink-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => {
                setActiveTab('education');
                setTimeout(() => educationRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-pink-500/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-pink-500/30 transform hover:scale-105 transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-pink-100 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'calculator', label: 'Calculator', icon: Target, color: 'text-[#2D9AA5]' },
              { id: 'history', label: 'Cycle History', icon: Clock, color: 'text-pink-600' },
              { id: 'education', label: 'Learn More', icon: Heart, color: 'text-purple-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-3 font-semibold text-sm flex items-center space-x-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-pink-500 ${tab.color} bg-gradient-to-t from-pink-50 to-transparent`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={calculatorRef} className="container mx-auto px-4 py-12">
        {activeTab === 'calculator' && (
          <div className="max-w-5xl mx-auto">
            {/* Beautiful Pregnancy Banner */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative z-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-4">
                    <Baby className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Pregnancy Journey</h2>
                  <p className="text-gray-700 max-w-2xl mx-auto">Track your cycles with precision and get personalized insights for your unique journey to motherhood</p>
                </div>
              </div>
            </div>

            {/* Calculator Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-pink-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#2D9AA5] to-pink-500 rounded-xl mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h2>
                <p className="text-gray-700">Please provide your details for accurate calculations</p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-pink-500" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-pink-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 ${
                        errors.name ? 'border-red-400' : 'border-gray-200'
                      }`}
                      placeholder="Enter your beautiful name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2 text-purple-500" />
                      Your Age
                    </label>
                    <input
                      type="number"
                      value={userProfile.age || ''}
                      onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value) || 0})}
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-purple-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 ${
                        errors.age ? 'border-red-400' : 'border-gray-200'
                      }`}
                      placeholder="Your age (16-50)"
                      min="16"
                      max="50"
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.age}</p>}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Mode selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                      Calculation Mode
                    </label>
                    <select
                      value={calcMode}
                      onChange={(e) => setCalcMode(e.target.value as 'lmp' | 'conception' | 'due' | 'ultrasound' | 'ivf')}
                      className="w-full p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    >
                      <option value="lmp">Last Period</option>
                      <option value="conception">Conception Date</option>
                      <option value="due">Due Date</option>
                      <option value="ultrasound">Ultrasound Date</option>
                      <option value="ivf">IVF Transfer Date</option>
                    </select>
                  </div>

                  {/* Conditional inputs based on mode */}
                  {calcMode === 'lmp' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                        Last Period Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={lastPeriodDate}
                          onChange={(e) => setLastPeriodDate(e.target.value)}
                          className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${
                            errors.lastPeriodDate ? 'border-red-400' : 'border-gray-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2D9AA5] hover:text-teal-700"
                        >
                        </button>
                      </div>
                      
                      {/* Custom Calendar */}
                      {showCalendar && (
                        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-80">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => navigateMonth('prev')}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-900" />
                            </button>
                            <h3 className="font-semibold text-gray-900">
                              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                              onClick={() => navigateMonth('next')}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 text-gray-900" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                          </div>
                        </div>
                      )}
                      
                      {errors.lastPeriodDate && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.lastPeriodDate}</p>}
                    </div>
                  )}

                  {calcMode === 'conception' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                        Conception Date
                      </label>
                      <input
                        type="date"
                        value={conceptionDate}
                        onChange={(e) => setConceptionDate(e.target.value)}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.conceptionDate ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.conceptionDate && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.conceptionDate}</p>}
                    </div>
                  )}

                  {calcMode === 'due' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={knownDueDate}
                        onChange={(e) => setKnownDueDate(e.target.value)}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.knownDueDate ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors.knownDueDate && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.knownDueDate}</p>}
                    </div>
                  )}

                  {calcMode === 'ultrasound' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                        Ultrasound Date and GA
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="date"
                          value={ultrasoundDate}
                          onChange={(e) => setUltrasoundDate(e.target.value)}
                          className={`p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.ultrasoundDate ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <input
                          type="number"
                          min={4}
                          max={20}
                          value={ultrasoundGAWeeks}
                          onChange={(e) => setUltrasoundGAWeeks(parseInt(e.target.value) || 8)}
                          className={`p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.ultrasoundGA ? 'border-red-400' : 'border-gray-200'}`}
                          placeholder="Weeks"
                        />
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={ultrasoundGADays}
                          onChange={(e) => setUltrasoundGADays(parseInt(e.target.value) || 0)}
                          className={`p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.ultrasoundGA ? 'border-red-400' : 'border-gray-200'}`}
                          placeholder="Days"
                        />
                      </div>
                      {(errors.ultrasoundDate || errors.ultrasoundGA) && (
                        <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />Provide ultrasound date and GA (weeks, days)</p>
                      )}
                    </div>
                  )}

                  {calcMode === 'ivf' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2 text-[#2D9AA5]" />
                        IVF Transfer Date and Embryo Day
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={ivfTransferDate}
                          onChange={(e) => setIvfTransferDate(e.target.value)}
                          className={`p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.ivfTransferDate ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <select
                          value={ivfEmbryoDay}
                          onChange={(e) => setIvfEmbryoDay(parseInt(e.target.value) as 3 | 5)}
                          className={`p-4 border-2 rounded-xl focus:outline-none focus:border-[#2D9AA5] transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${errors.ivfEmbryoDay ? 'border-red-400' : 'border-gray-200'}`}
                        >
                          <option value={3}>Day 3 Embryo</option>
                          <option value={5}>Day 5 Embryo</option>
                        </select>
                      </div>
                      {(errors.ivfTransferDate || errors.ivfEmbryoDay) && (
                        <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />Provide transfer date and embryo day (3 or 5)</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <Target className="w-4 h-4 inline mr-2 text-pink-500" />
                      Average Cycle Length (Days)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cycleLength}
                        onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:border-pink-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900 ${
                          errors.cycleLength ? 'border-red-400' : 'border-gray-200'
                        }`}
                        min="21"
                        max="35"
                      />
                    </div>
                    {errors.cycleLength && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.cycleLength}</p>}
                    <p className="text-xs text-gray-600 mt-1">Typically between 21-35 days (28 is average)</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleCalculate}
                  className="bg-gradient-to-r from-[#2D9AA5] via-pink-500 to-purple-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-teal-600 hover:via-pink-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  Calculate My Journey
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div ref={resultsRef} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-4">
                    <Baby className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Beautiful Results</h2>
                  <p className="text-gray-700">Here&apos;s your personalized pregnancy and fertility information</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-[#2D9AA5] to-teal-500 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Baby className="w-10 h-10" />
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Due Date</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Estimated Due Date</h3>
                    <p className="text-2xl font-bold">{formatDate(result.estimatedDueDate)}</p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="w-10 h-10" />
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Week</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Current Week</h3>
                    <p className="text-2xl font-bold">Week {result.currentWeek}</p>
                    <p className="text-sm opacity-90">{result.daysPregnant} days pregnant</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all md:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="w-10 h-10" />
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Fertile</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fertile Window</h3>
                    <p className="text-sm font-medium">{formatDate(result.fertileWindow.start)}</p>
                    <p className="text-sm opacity-90">to {formatDate(result.fertileWindow.end)}</p>
                  </div>
                </div>

                {/* Pregnancy Progress */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Pregnancy Progress</h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-900">Week {result.currentWeek} of 40</span>
                    <span className="text-sm font-semibold text-pink-600">{result.progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#2D9AA5] via-pink-500 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${Math.min(result.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">Your beautiful journey to motherhood</p>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={generatePDFReport}
                    className="bg-gradient-to-r from-[#2D9AA5] to-teal-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-600 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Report</span>
                  </button>
                  
                  <Link href="/doctor/search" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-rose-600 hover:to-rose-600 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Stethoscope className="w-5 h-5" />
                    <span>Consult Doctor</span>
                  </Link>
                  
                  <Link href="/" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-600 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Home className="w-5 h-5" />
                    <span>Healthcare</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Cycle History</h2>
                  <p className="text-gray-700">Track your menstrual cycles and fertility patterns</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generatePDFReport}
                    className="bg-gradient-to-r from-[#2D9AA5] to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-600 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={clearAllData}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Data</span>
                  </button>
                </div>
              </div>

              {cycles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Cycle Data Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">Start tracking your cycles to see beautiful insights and patterns here</p>
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="bg-gradient-to-r from-[#2D9AA5] to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Calculate Your First Cycle
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {cycles.map((cycle, index) => (
                    <div key={cycle.id} className="bg-gradient-to-r from-white to-pink-50 border border-pink-200 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#2D9AA5] to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Calendar className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Cycle #{cycles.length - index}</h3>
                            <p className="text-gray-700">Started {formatDate(cycle.startDate)}</p>
                            <div className="flex items-center mt-1">
                              <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                              <span className="text-sm text-gray-600">{cycle.cycleLength} day cycle</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCycle(cycle.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-[#2D9AA5] rounded-full mr-2"></div>
                            <p className="font-semibold text-gray-900 text-sm">Ovulation Date</p>
                          </div>
                          <p className="text-[#2D9AA5] font-bold">{formatDate(cycle.ovulationDate)}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <p className="font-semibold text-gray-900 text-sm">Fertile Window</p>
                          </div>
                          <p className="text-green-600 font-bold text-xs">{formatDate(cycle.fertileStart)}</p>
                          <p className="text-green-600 font-bold text-xs">to {formatDate(cycle.fertileEnd)}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                            <p className="font-semibold text-gray-900 text-sm">Est. Due Date</p>
                          </div>
                          <p className="text-pink-600 font-bold text-xs">{formatDate(cycle.estimatedDueDate)}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <p className="font-semibold text-gray-900 text-sm">Cycle Length</p>
                          </div>
                          <p className="text-purple-600 font-bold">{cycle.cycleLength} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div ref={educationRef} className="max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Understanding Your Journey</h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">Everything you need to know about your menstrual cycle, fertility, and pregnancy</p>
              </div>
              
              {/* Educational Images Section */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-200">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Baby className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pregnancy Stages</h3>
                    <p className="text-gray-700 text-sm">Track your baby&apos;s development week by week</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#2D9AA5] to-teal-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ovulation Tracking</h3>
                    <p className="text-gray-700 text-sm">Understand your fertile window and timing</p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-[#2D9AA5] mb-6 flex items-center">
                    <Target className="w-8 h-8 mr-3 text-pink-500" />
                    How Our Calculator Works
                  </h3>
                  <div className="bg-gradient-to-r from-teal-50 to-pink-50 rounded-2xl p-6 mb-6">
                    <p className="text-gray-900 leading-relaxed text-lg">
                      Our ZEVA Pregnancy & Ovulation Calculator uses scientifically proven methods to estimate your fertile window and pregnancy timeline. The calculator is based on the standard 280-day pregnancy duration from your last menstrual period (LMP), combined with your unique cycle length for personalized accuracy.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 border-l-4 border-pink-500 p-6 rounded-r-2xl mb-8">
                    <div className="flex items-start">
                      <AlertCircle className="w-6 h-6 text-pink-500 mt-1 mr-4 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900 font-semibold mb-2">Important Medical Note</p>
                        <p className="text-gray-800">
                          These calculations provide estimates based on average cycle lengths. Individual variations are completely normal, and you should always consult with your healthcare provider for personalized medical advice and monitoring.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-pink-500 mb-6 flex items-center">
                    <Heart className="w-8 h-8 mr-3 text-purple-500" />
                    Understanding Your Menstrual Cycle
                  </h3>
                  <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-6 mb-6 border border-pink-200">
                    <p className="text-gray-900 leading-relaxed mb-6 text-lg">
                      A typical menstrual cycle lasts between 21-35 days, with 28 days being the average. Your cycle is a beautiful, complex process that consists of several phases:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                          <div>
                            <h4 className="font-bold text-gray-900">Menstrual Phase (Days 1-5)</h4>
                            <p className="text-gray-700 text-sm">Your period begins, marking day 1 of your cycle. The uterine lining sheds.</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                          <div>
                            <h4 className="font-bold text-gray-900">Follicular Phase (Days 1-13)</h4>
                            <p className="text-gray-700 text-sm">Your body prepares to release an egg. Hormones stimulate follicle development.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                          <div>
                            <h4 className="font-bold text-gray-900">Ovulation (Around Day 14)</h4>
                            <p className="text-gray-700 text-sm">An egg is released from the ovary. This is your most fertile time.</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                          <div>
                            <h4 className="font-bold text-gray-900">Luteal Phase (Days 15-28)</h4>
                            <p className="text-gray-700 text-sm">The uterine lining thickens in preparation for potential pregnancy.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-purple-500 mb-6 flex items-center">
                    <Calendar className="w-8 h-8 mr-3 text-[#2D9AA5]" />
                    Your Fertile Window
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 mb-6 border border-green-200">
                    <p className="text-gray-900 leading-relaxed mb-6 text-lg">
                      Your fertile window is the magical time when pregnancy is most likely to occur. Understanding this timing can be crucial for family planning:
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-green-300">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-white font-bold">5</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">5 Days Before</h4>
                        <p className="text-gray-700 text-sm">Sperm can survive and wait for ovulation</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-green-400">
                        <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">Ovulation Day</h4>
                        <p className="text-gray-700 text-sm">Peak fertility - egg is released</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-green-300">
                        <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-white font-bold">1</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">1 Day After</h4>
                        <p className="text-gray-700 text-sm">Egg remains viable for fertilization</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-gray-900 text-sm">
                        <strong>Scientific Fact:</strong> Sperm can survive in the female reproductive tract for up to 5 days, while an egg can be fertilized for about 12-24 hours after ovulation. This creates your 6-day fertile window.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-[#2D9AA5] mb-6 flex items-center">
                    <Baby className="w-8 h-8 mr-3 text-pink-500" />
                    Pregnancy Trimesters
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl p-6 border-2 border-pink-200 transform hover:scale-105 transition-all">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">1</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">First Trimester</h4>
                        <p className="text-gray-700 font-medium">Weeks 1-12</p>
                      </div>
                      <p className="text-gray-700 text-sm text-center">Major organ development occurs. Your baby grows from a tiny cluster of cells to a recognizable human form.</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 border-2 border-purple-200 transform hover:scale-105 transition-all">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">2</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Second Trimester</h4>
                        <p className="text-gray-700 font-medium">Weeks 13-26</p>
                      </div>
                      <p className="text-gray-700 text-sm text-center">Often called the &quot;golden period&quot; - most comfortable phase with visible baby bump and first movements.</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl p-6 border-2 border-teal-200 transform hover:scale-105 transition-all">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2D9AA5] to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">3</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Third Trimester</h4>
                        <p className="text-gray-700 font-medium">Weeks 27-40</p>
                      </div>
                      <p className="text-gray-700 text-sm text-center">Final development phase. Your baby gains weight and prepares for birth. You prepare for delivery.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-pink-500 mb-8 flex items-center">
                    <AlertCircle className="w-8 h-8 mr-3 text-purple-500" />
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        question: "How accurate are these calculations?",
                        answer: "Our calculations are based on standard medical formulas and provide reliable estimates for women with regular cycles. Individual variations are normal, and accuracy improves with consistent cycle tracking.",
                        color: "from-blue-500 to-cyan-500"
                      },
                      {
                        question: "Can I use this if I have irregular periods?",
                        answer: "Yes, but the accuracy may be reduced. We recommend tracking multiple cycles to identify your personal patterns. Consider consulting a healthcare provider for irregular cycles lasting longer than 6 months.",
                        color: "from-pink-500 to-rose-500"
                      },
                      {
                        question: "When should I see a doctor?",
                        answer: "Consult your healthcare provider for any concerns about your cycle, fertility, suspected pregnancy, or if you're trying to conceive for over a year (or 6 months if you're over 35).",
                        color: "from-purple-500 to-indigo-500"
                      },
                      {
                        question: "What factors can affect my cycle?",
                        answer: "Stress, weight changes, exercise, medications, medical conditions, and life changes can all impact your menstrual cycle. Tracking helps identify these patterns.",
                        color: "from-green-500 to-teal-500"
                      }
                    ].map((faq, index) => (
                      <div key={index} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${faq.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold text-lg">?</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h4>
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-2xl p-8 border-2 border-pink-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Medical Disclaimer</h3>
                    <p className="text-gray-800 leading-relaxed max-w-3xl mx-auto">
                      This calculator is designed for informational and educational purposes only and should never replace professional medical advice, diagnosis, or treatment. The results are estimates based on average cycle lengths and may not reflect your individual situation. Every woman&apos;s body is unique, and cycles can vary significantly. Always consult with a qualified healthcare provider, gynecologist, or fertility specialist for personalized medical advice, especially if you&apos;re trying to conceive, have irregular cycles, or any health concerns. ZEVA and its affiliates are not responsible for any decisions made based on the information provided by this calculator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZevaPregnancyCalculator;

ZevaPregnancyCalculator.getLayout = function PageLayout(page: React.ReactNode) {
  return <L1>{page}</L1>; 
};