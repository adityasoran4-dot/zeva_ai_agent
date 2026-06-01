import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';

interface CalculatorBackButtonProps {
  className?: string;
}

const CalculatorBackButton: React.FC<CalculatorBackButtonProps> = ({ className = "" }) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/calculator/allcalc')}
      className={`absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg ${className}`}
      aria-label="Go back to all calculators"
    >
      <ArrowLeft size={20} className="text-[#2D9AA5]" />
    </button>
  );
};

export default CalculatorBackButton; 