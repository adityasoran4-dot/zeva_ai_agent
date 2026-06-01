// components/AuthModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgotPassword'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const { login, register } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    age: ''
  });
  const [ageInputMethod, setAgeInputMethod] = useState<'dob' | 'age'>('dob');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Calculate age from DOB if DOB is provided
    if (name === 'dateOfBirth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData({
        ...formData,
        [name]: value,
        age: age > 0 ? age.toString() : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        // Calculate age from DOB if DOB is provided, otherwise use direct age input
        let finalAge = null;
        let finalDateOfBirth = null;
        
        if (ageInputMethod === 'dob' && formData.dateOfBirth) {
          finalDateOfBirth = formData.dateOfBirth;
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          finalAge = age > 0 ? age : null;
        } else if (ageInputMethod === 'age' && formData.age) {
          finalAge = parseInt(formData.age);
        }
        
        await register(
          formData.name, 
          formData.email, 
          formData.password, 
          formData.phone,
          formData.gender || undefined,
          finalDateOfBirth || undefined,
          finalAge || undefined
        );
      }
      setFormData({ name: '', email: '', password: '', phone: '', gender: '', dateOfBirth: '', age: '' });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setForgotPasswordMessage('');
    setFormData({ name: '', email: '', password: '', phone: '', gender: '', dateOfBirth: '', age: '' });
    setAgeInputMethod('dob');
    setForgotPasswordEmail('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMessage('');
    setLoading(true);

    if (!forgotPasswordEmail.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      // Get base URL dynamically - use current origin (localhost in dev, production URL in prod)
      const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      };

      const baseUrl = getBaseUrl();

      const actionCodeSettings = {
        url: `${baseUrl}/auth/reset-password?email=${encodeURIComponent(forgotPasswordEmail)}`,
        handleCodeInApp: true,
      };

      // Check if email exists (for regular users)
      try {
        const checkResponse = await axios.post('/api/auth/check-email', { email: forgotPasswordEmail });
        
        if (checkResponse.status === 200) {
          // Email exists, proceed with Firebase verification
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          
          await sendSignInLinkToEmail(auth, forgotPasswordEmail, actionCodeSettings);
          window.localStorage.setItem('userEmailForReset', forgotPasswordEmail);
          
          setForgotPasswordMessage('Verification email sent! Check your inbox.');
          toast.success('Verification email sent! Check your inbox.');
        }
      } catch (checkError: any) {
        if (axios.isAxiosError(checkError) && checkError.response?.status === 404) {
          setError('Email not found. Please check your email address.');
        } else {
          throw checkError;
        }
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setForgotPasswordMessage('');
    setFormData({ name: '', email: '', password: '', phone: '', gender: '', dateOfBirth: '', age: '' });
    setAgeInputMethod('dob');
    setForgotPasswordEmail('');
    setMode(initialMode);
    onClose();
  };

  const handleCloseButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4 transition-opacity duration-300 overflow-hidden ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      style={{ touchAction: 'none' }}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg md:max-w-2xl transform transition-all duration-300 max-h-[90vh] overflow-hidden flex flex-col ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Always visible */}
        <button
          type="button"
          onClick={handleCloseButtonClick}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-50"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Header - Responsive padding */}
        <div className={`px-4 sm:px-6 md:px-8 ${mode === 'register' ? 'pt-6 sm:pt-7 pb-2' : mode === 'forgotPassword' ? 'pt-6 sm:pt-7 pb-2' : 'pt-8 pb-4'} text-center flex-shrink-0`}>
          <div className="flex justify-center mb-2 animate-fade-in">
            <div className="bg-gray-100 rounded-full p-2 sm:p-3 transition-transform duration-300 hover:scale-110">
              <span className="text-xl sm:text-2xl">⚕️</span>
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 animate-slide-down">
            {mode === 'login' ? 'Sign in to Zeva360' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm animate-slide-down" style={{ animationDelay: '0.1s' }}>
            {mode === 'login' ? 'Secure access to your healthcare management platform.' : mode === 'register' ? 'Join us today' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }

          .animate-slide-down {
            animation: slide-down 0.5s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 0.5s ease-out;
          }
        `}</style>

        {/* Form - Scrollable content area */}
        <div className={`px-4 sm:px-6 md:px-8 ${mode === 'register' ? 'pt-1 pb-3' : mode === 'forgotPassword' ? 'pt-1 pb-3' : 'pt-2 pb-4'} overflow-y-auto flex-1`}>
          {mode === 'forgotPassword' ? (
            <form onSubmit={handleForgotPassword} className="space-y-2.5">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-gray-600" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setError('');
                      setForgotPasswordMessage('');
                    }}
                    required
                    className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm animate-slide-up">
                  {error}
                </div>
              )}

              {forgotPasswordMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2.5 rounded-lg text-sm animate-slide-up">
                  {forgotPasswordMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
                style={{ animationDelay: '0.2s' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Verification Link'
                )}
              </button>

              <div className="mt-4 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setForgotPasswordMessage('');
                    setForgotPasswordEmail('');
                  }}
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className={mode === 'register' ? 'space-y-2.5 sm:space-y-3' : 'space-y-2.5'}>
            {mode === 'register' && (
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-gray-600" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div
              className="animate-slide-up"
              style={{ animationDelay: mode === 'register' ? '0.2s' : '0.1s' }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-gray-600" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-gray-600" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                
                <div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age Input Method</label>
                  <div className="flex gap-2 sm:gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setAgeInputMethod('dob')}
                      className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                        ageInputMethod === 'dob'
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Date of Birth
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeInputMethod('age')}
                      className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                        ageInputMethod === 'age'
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Direct Age
                    </button>
                  </div>
                  
                  {ageInputMethod === 'dob' ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                    />
                  ) : (
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="120"
                      className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                      placeholder="Enter your age"
                    />
                  )}
                </div>
              </>
            )}

            <div
              className="animate-slide-up"
              style={{ animationDelay: mode === 'register' ? '0.4s' : '0.2s' }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="text-black w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none hover:border-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgotPassword');
                      setError('');
                      setForgotPasswordEmail(formData.email);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm animate-slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
              style={{ animationDelay: mode === 'register' ? '0.5s' : '0.3s' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          )}

          {mode !== 'forgotPassword' && (
          <div
            className={`${mode === 'register' ? 'mt-3 sm:mt-4' : 'mt-5'} text-center animate-slide-up flex-shrink-0`}
            style={{ animationDelay: mode === 'register' ? '0.6s' : '0.4s' }}
          >
            <p className="text-xs sm:text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-1 text-gray-900 hover:text-gray-700 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
          )}

          {/* Trust Badge - Reduced spacing for register mode */}
          <div
            className={`${mode === 'register' ? 'mt-3 pt-3' : 'mt-5 pt-5'} border-t border-gray-200 flex items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500 animate-slide-up flex-shrink-0 pb-3 sm:pb-4`}
            style={{ animationDelay: mode === 'register' ? '0.7s' : '0.5s' }}
          >
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span className="text-[10px] sm:text-xs">Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚕️</span>
              <span className="text-[10px] sm:text-xs">HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;