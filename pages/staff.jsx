// //pages/staff.jsx
// "use client";
// import React, { useState } from "react";
// import axios from "axios";
// import { useRouter } from "next/router";
// import { Mail, Lock, LogIn, Shield, User, Sparkles, Eye, EyeOff } from "lucide-react";

// export default function StaffDoctorLogin() {
//   const router = useRouter();
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [otpStage, setOtpStage] = useState(false);
//   const [otpCode, setOtpCode] = useState("");
//   const [phoneOtp, setPhoneOtp] = useState("");
//   const [emailOtp, setEmailOtp] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const check = await axios.get("/api/auth/check-otp", { params: { email: form.email } }).catch(() => null);
//       const otpEnabled = !!check?.data?.otpEnabled;
//       if (otpEnabled) {
//         const req = await axios.post("/api/auth/request-otp", form);
//         if (!req.data?.success) throw new Error(req.data?.message || "OTP request failed");
//         setOtpStage(true);
//         if (req.data?.debugPhoneOtp || req.data?.debugEmailOtp) {
//           setPhoneOtp(req.data.debugPhoneOtp || "");
//           setEmailOtp(req.data.debugEmailOtp || "");
//           setError(`Phone OTP: ${req.data.debugPhoneOtp || "-"} • Email OTP: ${req.data.debugEmailOtp || "-"}`);
//         } else {
//           setError("OTP sent to clinic contacts");
//         }
//         setLoading(false);
//         return;
//       }
//       const res = await axios.post("/api/staff/login", form);
//       const { token, user, tokenKey } = res.data;

//       if (tokenKey === "agentToken") {
//         localStorage.setItem("agentToken", token);
//         localStorage.setItem("agentUser", JSON.stringify(user)); // Store user info for header
//         localStorage.removeItem("userToken");
//         // Clear form after successful login
//         setForm({ email: "", password: "" });
//         router.push("/staff/dashboard");
//       } else {
//         // doctorStaff (userToken) should also land on the staff dashboard
//         localStorage.setItem("userToken", token);
//         localStorage.setItem("agentUser", JSON.stringify(user)); // Store user info for header
//         localStorage.removeItem("agentToken");
//         // Clear form after successful login
//         setForm({ email: "", password: "" });
//         router.push("/staff/dashboard");
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     try {
//       const chosenOtp = phoneOtp?.trim() || emailOtp?.trim() || otpCode?.trim();
//       const res = await axios.post("/api/auth/verify-otp", { email: form.email, otp: chosenOtp });
//       if (!res.data?.success) throw new Error(res.data?.message || "Invalid OTP");
//       const { token, user, tokenKey } = res.data;
//       if (tokenKey === "agentToken") {
//         localStorage.setItem("agentToken", token);
//         localStorage.setItem("agentUser", JSON.stringify(user));
//         localStorage.removeItem("userToken");
//       } else {
//         localStorage.setItem("userToken", token);
//         localStorage.setItem("agentUser", JSON.stringify(user));
//         localStorage.removeItem("agentToken");
//       }
//       setForm({ email: "", password: "" });
//       setOtpCode("");
//       setPhoneOtp("");
//       setEmailOtp("");
//       setOtpStage(false);
//       router.push("/staff/dashboard");
//     } catch (err) {
//       setError(err.response?.data?.message || "OTP verification failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <style dangerouslySetInnerHTML={{__html: `
//         @keyframes blob {
//           0%, 100% {
//             transform: translate(0, 0) scale(1);
//           }
//           33% {
//             transform: translate(30px, -50px) scale(1.1);
//           }
//           66% {
//             transform: translate(-20px, 20px) scale(0.9);
//           }
//         }
//         @keyframes shake {
//           0%, 100% { transform: translateX(0); }
//           10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
//           20%, 40%, 60%, 80% { transform: translateX(5px); }
//         }
//         .animate-blob {
//           animation: blob 7s infinite;
//         }
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
//         .animation-delay-4000 {
//           animation-delay: 4s;
//         }
//         .animate-shake {
//           animation: shake 0.5s;
//         }
//       `}} />
//       <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">

//       <div className="w-full max-w-md relative z-10">
//         {/* Enhanced Header */}
//         <div className="text-center mb-10">
//           {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300"> */}
//             {/* <User className="w-10 h-10 text-white" /> */}
//           {/* </div> */}
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <h2 className="text-4xl font-bold mt-3 text-gray-900">Welcome Back</h2>
//           </div>
//           <p className="text-gray-500 mt-2 text-base">Enter your credentials to continue to your workspace</p>
//         </div>

//         {/* Enhanced Form Card */}
//         <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Email Input - Enhanced */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                 <Mail className="w-4 h-4 text-gray-500" />
//                 Email Address
//               </label>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                   <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
//                 </div>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   placeholder="you@example.com"
//                   value={form.email}
//                   onChange={handleChange}
//                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Password Input - Enhanced with Eye Icon */}
//             <div>
//               <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                 <Lock className="w-4 h-4 text-gray-500" />
//                 Password
//               </label>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
//                 </div>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   name="password"
//                   placeholder="••••••••"
//                   value={form.password}
//                   onChange={handleChange}
//                   className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5" />
//                   ) : (
//                     <Eye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Enhanced Error Message */}
//             {error && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start animate-shake">
//                 <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//                 <p className="text-sm text-red-700 font-medium">{error}</p>
//               </div>
//             )}

//             {/* Enhanced Submit Button - Smaller & Subtle */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   <span>Signing in...</span>
//                 </span>
//               ) : (
//                 <>
//                   <LogIn className="w-4 h-4" />
//                   <span>Sign In</span>
//                 </>
//               )}
//             </button>
//           </form>
          
//           {otpStage && (
//             <form onSubmit={handleVerifyOtp} className="space-y-6 mt-6">
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Number OTP</label>
//                   <input
//                     type="text"
//                     placeholder="Enter OTP received on WhatsApp"
//                     value={phoneOtp}
//                     onChange={(e) => setPhoneOtp(e.target.value)}
//                     className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Email OTP</label>
//                   <input
//                     type="text"
//                     placeholder="Enter OTP received on Email"
//                     value={emailOtp}
//                     onChange={(e) => setEmailOtp(e.target.value)}
//                     className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 >
//                   {loading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       <span>Verify OTP</span>
//                     </span>
//                   ) : (
//                     <>
//                       <LogIn className="w-4 h-4" />
//                       <span>Verify OTP</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           )}
//         </div>

//         {/* Enhanced Security Badge */}
//         <div className="mt-6 text-center">
//           <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
//             <Shield className="w-4 h-4 text-gray-500" />
//             <p className="text-xs text-gray-500 font-medium">
//               Secure login protected by encryption
//             </p>
//           </div>
//         </div>
//       </div>
//       </div>
//     </>
//   );
// }

// StaffDoctorLogin.getLayout = function PageLayout(page) {
//   return <>{page}</>;
// };
// pages/staff.jsx
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Mail, Lock, LogIn, Shield, Eye, EyeOff } from "lucide-react";

export default function StaffDoctorLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // OTP Timer
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const check = await axios.get("/api/auth/check-otp", { params: { email: form.email } }).catch(() => null);
      const otpEnabled = !!check?.data?.otpEnabled;
      
      if (otpEnabled) {
        const req = await axios.post("/api/auth/request-otp", form);
        if (!req.data?.success) throw new Error(req.data?.message || "OTP request failed");
        
        setUserEmail(form.email);
        setOtpStage(true);
        setOtpTimer(300); // 5 minutes
        
        setError("");
        setLoading(false);
        return;
      }
      
      const res = await axios.post("/api/staff/login", form);
      const { token, user, tokenKey } = res.data;

      if (tokenKey === "agentToken") {
        localStorage.setItem("agentToken", token);
        localStorage.setItem("agentUser", JSON.stringify(user));
        localStorage.removeItem("userToken");
        setForm({ email: "", password: "" });
        router.push("/staff/dashboard");
      } else {
        localStorage.setItem("userToken", token);
        localStorage.setItem("agentUser", JSON.stringify(user));
        localStorage.removeItem("agentToken");
        setForm({ email: "", password: "" });
        router.push("/staff/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const chosenOtp = emailOtp?.trim() || otpCode?.trim();
      if (!chosenOtp) {
        throw new Error("Please enter OTP");
      }
      
      const res = await axios.post("/api/auth/verify-otp", { email: userEmail, otp: chosenOtp });
      if (!res.data?.success) throw new Error(res.data?.message || "Invalid OTP");
      
      const { token, user, tokenKey } = res.data;
      if (tokenKey === "agentToken") {
        localStorage.setItem("agentToken", token);
        localStorage.setItem("agentUser", JSON.stringify(user));
        localStorage.removeItem("userToken");
      } else {
        localStorage.setItem("userToken", token);
        localStorage.setItem("agentUser", JSON.stringify(user));
        localStorage.removeItem("agentToken");
      }
      
      setForm({ email: "", password: "" });
      setOtpCode("");
      setPhoneOtp("");
      setEmailOtp("");
      setOtpStage(false);
      router.push("/staff/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError("");
    
    try {
      const req = await axios.post("/api/auth/request-otp", { 
        email: userEmail, 
        password: form.password 
      });
      
      if (!req.data?.success) throw new Error(req.data?.message || "Failed to resend OTP");
      
      setOtpTimer(300);
      setCanResend(false);
      
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}} />
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-4xl font-bold mt-3 text-gray-900">Welcome Back</h2>
            </div>
            <p className="text-gray-500 mt-2 text-base">
              {otpStage ? "Enter the OTP sent to clinic contacts" : "Enter your credentials to continue to your workspace"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100">
            {/* Login Form */}
            {!otpStage ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start animate-shake">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* Timer */}
                {otpTimer > 0 && (
                  <div className="text-center text-sm text-gray-600">
                    OTP expires in {formatTime(otpTimer)}
                  </div>
                )}

                {/* OTP Input Field (Email only) */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email OTP</label>
                    <input
                      type="text"
                      placeholder="Enter OTP from Email"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start animate-shake">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || !emailOtp}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>

                {/* Resend and Back Links */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStage(false);
                      setError("");
                      setPhoneOtp("");
                      setEmailOtp("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to login
                  </button>
                  
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    otpTimer > 0 && (
                      <span className="text-gray-400">Resend in {formatTime(otpTimer)}</span>
                    )
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Security Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">
                Secure login protected by encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

StaffDoctorLogin.getLayout = function PageLayout(page) {
  return <>{page}</>;
};
