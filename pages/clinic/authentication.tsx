// // pages/clinic/authentication.tsx
// import React, { useEffect, useState } from "react";
// import withClinicAuth from "../../components/withClinicAuth";
// import ClinicLayout from "../../components/ClinicLayout";
// import type { NextPageWithLayout } from "../_app";
// import { 
//   Shield, 
//   Mail, 
//   Phone, 
//   Users, 
//   Save, 
//   CheckCircle, 
//   AlertCircle,
//   Smartphone,
//   Globe,
//   Settings,
//   UserCheck,
//   UserX,
//   RefreshCw
// } from "lucide-react";

// function AuthSettingsPage() {
//   const [_loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [otpWhatsAppNumber, setOtpWhatsAppNumber] = useState("");
//   const [otpEmail, setOtpEmail] = useState("");
//   const [staff, setStaff] = useState<any[]>([]);
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [phoneError, setPhoneError] = useState("");
//   const [emailError, setEmailError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState<"all" | "agent" | "doctorStaff">("all");

//   // Token retrieval
//   const getAuthToken = () => {
//     if (typeof window === "undefined") return null;
//     return (
//       localStorage.getItem("clinicToken") ||
//       sessionStorage.getItem("clinicToken") ||
//       localStorage.getItem("agentToken") ||
//       sessionStorage.getItem("agentToken") ||
//       localStorage.getItem("userToken") ||
//       sessionStorage.getItem("userToken") ||
//       localStorage.getItem("adminToken") ||
//       sessionStorage.getItem("adminToken")
//     );
//   };

//   const getAuthHeaders = (): HeadersInit => {
//     const t = getAuthToken();
//     return t ? { Authorization: `Bearer ${t}` } : {};
//   };

//   const headersWithJson = (): HeadersInit => {
//     const base: Record<string, string> = { "Content-Type": "application/json" };
//     const auth = getAuthHeaders() as Record<string, string>;
//     return { ...base, ...auth };
//   };
//   const updateStaffOtp = async (email: string, enabled: boolean) => {
//     try {
//       const res = await fetch("/api/clinic/auth-settings", { 
//         method: "POST", 
//         headers: headersWithJson(), 
//         body: JSON.stringify({ staffOtp: [{ email, enabled }] }),
//         credentials: "include"
//       });
//       const json = await res.json();
//       if (!json.success) {
//         throw new Error(json.message || "Failed to update staff OTP");
//       }
//     } catch (e: any) {
//       setError(e.message || "Failed to update staff OTP");
//     }
//   };

//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await fetch("/api/clinic/auth-settings", { 
//         headers: getAuthHeaders(),
//         credentials: "include"
//       });
      
//       const json = await res.json();
      
//       if (!json.success) {
//         throw new Error(json.message || "Failed to load settings");
//       }
      
//       setOtpWhatsAppNumber(json.settings?.otpWhatsAppNumber || "");
//       setOtpEmail(json.settings?.otpEmail || "");
//       setStaff(json.staff || []);
//       setSaved(false);
//       setPhoneError("");
//       setEmailError("");
//     } catch (e: any) {
//       setError(e.message || "Failed to load settings");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { 
//     loadData(); 
//   }, []);

//   const validatePhone = (phone: string): boolean => {
//     if (!phone) return true;
//     const digitsOnly = phone.replace(/\D/g, "");
//     return /^\+[1-9] \d{1,14}$/.test(phone) || /^\d{10}$/.test(digitsOnly);
//   };

//   const validateEmail = (email: string): boolean => {
//     if (!email) return true;
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   };

//   const save = async () => {
//     // Validate
//     const phoneValid = validatePhone(otpWhatsAppNumber);
//     const emailValid = validateEmail(otpEmail);
    
//     setPhoneError(phoneValid ? "" : "Enter valid WhatsApp number format (e.g., +91 XXXXXXXXXX)");
//     setEmailError(emailValid ? "" : "Enter valid email address");
    
//     if (!phoneValid || !emailValid) return;

//     setSaving(true);
//     setError("");
    
//     try {
//       const digitsOnly = (otpWhatsAppNumber || "").replace(/\D/g, "");
//       const normalizedPhone = /^\d{10}$/.test(digitsOnly) ? `+91${digitsOnly}` : otpWhatsAppNumber.trim();
//       const payload = {
//         otpWhatsAppNumber: normalizedPhone,
//         otpEmail: otpEmail.trim(),
//         staffOtp: staff.map(s => ({ email: s.email, enabled: !!s.otpEnabled }))
//       };
      
//       const res = await fetch("/api/clinic/auth-settings", { 
//         method: "POST", 
//         headers: headersWithJson(), 
//         body: JSON.stringify(payload),
//         credentials: "include"
//       });
      
//       const json = await res.json();
      
//       if (!json.success) {
//         throw new Error(json.message || "Failed to save settings");
//       }
      
//       setSaved(true);
//       setTimeout(() => setSaved(false), 3000);
//     } catch (e: any) {
//       setError(e.message || "Failed to save settings");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const filteredStaff = staff.filter(s => {
//     const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          s.email?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesRole = roleFilter === "all" || s.role === roleFilter;
//     return matchesSearch && matchesRole;
//   });

//   const stats = {
//     total: staff.length,
//     enabled: staff.filter(s => s.otpEnabled).length,
//     agents: staff.filter(s => s.role === "agent").length,
//     doctors: staff.filter(s => s.role === "doctorStaff").length
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
//               <Shield className="h-6 w-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Authentication Settings</h1>
//               <p className="text-sm text-gray-500">Configure OTP delivery channels and staff permissions</p>
//             </div>
//           </div>
          
//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
//             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">Total Staff</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
//                 </div>
//                 <div className="p-2 bg-blue-50 rounded-lg">
//                   <Users className="h-5 w-5 text-blue-600" />
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">OTP Enabled</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stats.enabled}</p>
//                 </div>
//                 <div className="p-2 bg-green-50 rounded-lg">
//                   <UserCheck className="h-5 w-5 text-green-600" />
//                 </div>
//               </div>
//               <p className="text-xs text-gray-500 mt-2">
//                 {Math.round((stats.enabled / stats.total) * 100 || 0)}% of staff
//               </p>
//             </div>
            
//             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">Agents</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stats.agents}</p>
//                 </div>
//                 <div className="p-2 bg-purple-50 rounded-lg">
//                   <Users className="h-5 w-5 text-purple-600" />
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">Doctor Staff</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stats.doctors}</p>
//                 </div>
//                 <div className="p-2 bg-amber-50 rounded-lg">
//                   <Users className="h-5 w-5 text-amber-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Column - OTP Settings */}
//           <div className="lg:col-span-1 space-y-6">
//             {/* Delivery Channels Card */}
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
//                 <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                   <Settings className="h-4 w-4 text-gray-500" />
//                   OTP Delivery Channels
//                 </h2>
//                 <p className="text-xs text-gray-500 mt-1">Configure where OTPs will be sent</p>
//               </div>
              
//               <div className="p-5 space-y-5">
//                 {/* WhatsApp Number */}
//                 <div>
//                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
//                     <div className="flex items-center gap-1.5">
//                       <Phone className="h-3.5 w-3.5" />
//                       WhatsApp Number
//                     </div>
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Smartphone className="h-4 w-4 text-gray-400" />
//                     </div>
//                     <input
//                       type="text"
//                       value={otpWhatsAppNumber}
//                       onChange={(e) => {
//                         setOtpWhatsAppNumber(e.target.value);
//                         setPhoneError("");
//                         setSaved(false);
//                       }}
//                       placeholder="+15551234567"
//                       className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
//                         phoneError 
//                           ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
//                           : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
//                       }`}
//                     />
//                   </div>
//                   {phoneError && (
//                     <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
//                       <AlertCircle className="h-3 w-3" />
//                       {phoneError}
//                     </p>
//                   )}
//                   <p className="mt-1.5 text-xs text-gray-400">
//                     Enter 10-digit WhatsApp number (e.g., +91XXXXXXXXXX)
//                   </p>
//                 </div>

//                 {/* Email Address */}
//                 <div>
//                   <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
//                     <div className="flex items-center gap-1.5">
//                       <Mail className="h-3.5 w-3.5" />
//                       Email Address
//                     </div>
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Mail className="h-4 w-4 text-gray-400" />
//                     </div>
//                     <input
//                       type="email"
//                       value={otpEmail}
//                       onChange={(e) => {
//                         setOtpEmail(e.target.value);
//                         setEmailError("");
//                         setSaved(false);
//                       }}
//                       placeholder="clinic@example.com"
//                       className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
//                         emailError 
//                           ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
//                           : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
//                       }`}
//                     />
//                   </div>
//                   {emailError && (
//                     <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
//                       <AlertCircle className="h-3 w-3" />
//                       {emailError}
//                     </p>
//                   )}
//                 </div>

//                 {/* Save Button */}
//                 <div className="pt-3">
//                   <button
//                     onClick={save}
//                     disabled={saving}
//                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
//                   >
//                     {saving ? (
//                       <>
//                         <RefreshCw className="h-4 w-4 animate-spin" />
//                         Saving...
//                       </>
//                     ) : saved ? (
//                       <>
//                         <CheckCircle className="h-4 w-4" />
//                         Saved!
//                       </>
//                     ) : (
//                       <>
//                         <Save className="h-4 w-4" />
//                         Save Changes
//                       </>
//                     )}
//                   </button>
//                 </div>

//                 {/* Status Messages */}
//                 {error && (
//                   <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
//                     <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
//                     <p className="text-xs text-red-700">{error}</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Staff Management */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                   <div>
//                     <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//                       <Users className="h-4 w-4 text-gray-500" />
//                       Staff OTP Permissions
//                     </h2>
//                     <p className="text-xs text-gray-500 mt-1">Enable or disable OTP for individual staff members</p>
//                   </div>
                  
//                   {/* Search and Filter */}
//                   <div className="flex gap-2">
//                     <div className="relative">
//                       <input
//                         type="text"
//                         placeholder="Search staff..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
//                       />
//                       <Users className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
//                     </div>
//                     <select
//                       value={roleFilter}
//                       onChange={(e) => setRoleFilter(e.target.value as any)}
//                       className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
//                     >
//                       <option value="all">All Roles</option>
//                       <option value="agent">Agents</option>
//                       <option value="doctorStaff">Doctor Staff</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Staff Table */}
//               <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50 sticky top-0 z-10">
//                     <tr>
//                       <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
//                       <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//                       <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                       <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OTP Status</th>
//                       <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {filteredStaff.map((s, idx) => (
//                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
//                         <td className="px-5 py-4">
//                           <div className="flex items-center gap-3">
//                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
//                               s.role === 'agent' 
//                                 ? 'bg-purple-100 text-purple-700' 
//                                 : 'bg-amber-100 text-amber-700'
//                             }`}>
//                               {s.name?.charAt(0) || '?'}
//                             </div>
//                             <div>
//                               <p className="text-sm font-medium text-gray-900">{s.name}</p>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-5 py-4">
//                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                             s.role === 'agent' 
//                               ? 'bg-purple-100 text-purple-800' 
//                               : 'bg-amber-100 text-amber-800'
//                           }`}>
//                             {s.role === 'agent' ? 'Agent' : 'Doctor Staff'}
//                           </span>
//                         </td>
//                         <td className="px-5 py-4">
//                           <p className="text-sm text-gray-600">{s.email}</p>
//                         </td>
//                         <td className="px-5 py-4">
//                           <span className={`inline-flex items-center gap-1.5 ${
//                             s.otpEnabled ? 'text-green-600' : 'text-gray-400'
//                           }`}>
//                             {s.otpEnabled ? (
//                               <>
//                                 <CheckCircle className="h-4 w-4" />
//                                 <span className="text-sm">Enabled</span>
//                               </>
//                             ) : (
//                               <>
//                                 <UserX className="h-4 w-4" />
//                                 <span className="text-sm">Disabled</span>
//                               </>
//                             )}
//                           </span>
//                         </td>
//                         <td className="px-5 py-4 text-right">
//                           <label className="inline-flex items-center cursor-pointer">
//                             <span className="mr-3 text-sm text-gray-600">
//                               {s.otpEnabled ? 'Disable' : 'Enable'}
//                             </span>
//                             <div className="relative">
//                               <input
//                                 type="checkbox"
//                                 className="sr-only peer"
//                                 checked={!!s.otpEnabled}
//                                 onChange={(e) => {
//                                   const v = e.target.checked;
//                                   setStaff(prev => prev.map((x) =>
//                                     x.email === s.email ? { ...x, otpEnabled: v } : x
//                                   ));
//                                   setSaved(false);
//                                   updateStaffOtp(s.email, v);
//                                 }}
//                               />
//                               <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                             </div>
//                           </label>
//                         </td>
//                       </tr>
//                     ))}
                    
//                     {filteredStaff.length === 0 && (
//                       <tr>
//                         <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
//                           <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
//                           <p className="text-sm">No staff members found</p>
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Footer */}
//               <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
//                 <p className="text-xs text-gray-500">
//                   Showing {filteredStaff.length} of {staff.length} staff members
//                   {filteredStaff.length !== staff.length && ` (filtered)`}
//                 </p>
//               </div>
//             </div>           
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Layout
// AuthSettingsPage.getLayout = function PageLayout(page: React.ReactNode) {
//   return <ClinicLayout>{page}</ClinicLayout>;
// };

// // Export with authentication wrapper
// const ProtectedAuthSettingsPage: NextPageWithLayout = withClinicAuth(AuthSettingsPage);
// ProtectedAuthSettingsPage.getLayout = AuthSettingsPage.getLayout;

// export default ProtectedAuthSettingsPage;
// pages/clinic/authentication.tsx
import React, { useEffect, useState } from "react";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import type { NextPageWithLayout } from "../_app";
import { 
  Shield, 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  RefreshCw,
  Clock,
  Key,
  Lock,
  UserCheck,
  XCircle
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import axios from "axios";

// Helper function to get stored token
const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("agentToken") ||
    sessionStorage.getItem("agentToken") ||
    localStorage.getItem("userToken") ||
    sessionStorage.getItem("userToken") ||
    localStorage.getItem("staffToken") ||
    sessionStorage.getItem("staffToken") ||
    localStorage.getItem("clinicToken") ||
    sessionStorage.getItem("clinicToken") ||
    localStorage.getItem("doctorToken") ||
    sessionStorage.getItem("doctorToken") ||
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken")
  );
};

// Token priority for user info extraction
const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

function AuthSettingsPage() {
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otpWhatsAppNumber, setOtpWhatsAppNumber] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "agent" | "doctorStaff">("all");
  const [showPhoneFormatHint, setShowPhoneFormatHint] = useState(false);
  const [_copied, setCopied] = useState(false);
  const WhatsAppIcon = FaWhatsapp;
  
  // Permissions state for two-level permission system
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

  // Token retrieval
  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("clinicToken") ||
      sessionStorage.getItem("clinicToken") ||
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken")
    );
  };

  const getAuthHeaders = (): HeadersInit => {
    const t = getAuthToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const headersWithJson = (): HeadersInit => {
    const base: Record<string, string> = { "Content-Type": "application/json" };
    const auth = getAuthHeaders() as Record<string, string>;
    return { ...base, ...auth };
  };

  const updateStaffOtp = async (email: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/clinic/auth-settings", { 
        method: "POST", 
        headers: headersWithJson(), 
        body: JSON.stringify({ staffOtp: [{ email, enabled }] }),
        credentials: "include"
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to update staff OTP");
      }
    } catch (e: any) {
      setError(e.message || "Failed to update staff OTP");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clinic/auth-settings", { 
        headers: getAuthHeaders(),
        credentials: "include"
      });
      
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || "Failed to load settings");
      }
      
      setOtpWhatsAppNumber(json.settings?.otpWhatsAppNumber || "");
      setOtpEmail(json.settings?.otpEmail || "");
      setStaff(json.staff || []);
      setSaved(false);
      setPhoneError("");
      setEmailError("");
    } catch (e: any) {
      setError(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  // Detect agent route and token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname || "";
    if (currentPath.startsWith("/agent/")) {
      setIsAgentRoute(true);
    } else {
      setIsAgentRoute(false);
    }
  }, []);

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      for (const key of TOKEN_PRIORITY) {
        const token =
          window.localStorage.getItem(key) ||
          window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
            );
            const decoded = JSON.parse(jsonPayload);
            return {
              role: decoded.role || decoded.userRole || null,
              id: decoded.userId || decoded.id || null,
            };
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  };


  // Helper function to get user role from token
  const getUserRole = (): string | null => {
    return getUserInfo().role;
  };

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? "clinic_authentication" : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;


  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;

    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;


    // Check which token type is being used
    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken")
        : null;

    const userRole = getUserRole();
    const authToken =
      clinicToken || doctorToken || agentToken || staffToken || userToken;


    // For admin role, grant full access (bypass permission checks)
    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return;
    }

    // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_authentication module
              const modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_authentication module variations
                if (p.module === "clinic_authentication") return true;
                if (p.module === "clinic_Authentication") return true;
                if (p.module === "authentication") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};


                // Check if "all" is true, which grants all permissions
                const moduleAll =
                  actions.all === true ||
                  actions.all === "true" ||
                  String(actions.all).toLowerCase() === "true";
                const moduleCreate =
                  actions.create === true ||
                  actions.create === "true" ||
                  String(actions.create).toLowerCase() === "true";
                const moduleRead =
                  actions.read === true ||
                  actions.read === "true" ||
                  String(actions.read).toLowerCase() === "true";
                const moduleUpdate =
                  actions.update === true ||
                  actions.update === "true" ||
                  String(actions.update).toLowerCase() === "true";
                const moduleDelete =
                  actions.delete === true ||
                  actions.delete === "true" ||
                  String(actions.delete).toLowerCase() === "true";

                setPermissions({
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canRead: true, // Clinic/doctor can always read their own data
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            // API response doesn't have permissions, default to full access (backward compatibility)
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err: any) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };


      fetchClinicPermissions();
      return;
    }

    // For agent/doctorStaff tokens (when not on agent route), check permissions
    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log(
            "Fetching Agent/Staff Permissions for clinic_authentication...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_authentication" },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          // Default to true if module not found in permissions (matches backend logic)
          if (
            !data?.permissions &&
            data?.error?.includes("not found in agent permissions")
          ) {
            console.log(
              "Module not found in permissions, granting full access by default",
            );
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          const actions =
            data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val: any) =>
            val === true ||
            val === "true" ||
            String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };

          console.log("Final Agent/Staff Permissions:", newPerms);
          setPermissions(newPerms);
        } catch (err: any) {
          console.error("Error fetching agent permissions:", err);
          // Swallow agent permission errors; they will just result in no extra access
          setPermissions({
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };


      fetchPermissions();
    } else {
      // Unknown token type - default to full access (likely clinic/doctor)
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isAgentRoute]);

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const digitsOnly = phone.replace(/\D/g, "");
    return /^\+[1-9]\d{1,14}$/.test(phone) || /^\d{10}$/.test(digitsOnly);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    // Validate
    const phoneValid = validatePhone(otpWhatsAppNumber);
    const emailValid = validateEmail(otpEmail);
    
    setPhoneError(phoneValid ? "" : "Enter valid WhatsApp number format");
    setEmailError(emailValid ? "" : "Enter valid email address");
    
    if (!phoneValid || !emailValid) return;

    setSaving(true);
    setError("");
    
    try {
      const digitsOnly = (otpWhatsAppNumber || "").replace(/\D/g, "");
      const normalizedPhone = /^\d{10}$/.test(digitsOnly) ? `+91${digitsOnly}` : otpWhatsAppNumber.trim();
      const payload = {
        otpWhatsAppNumber: normalizedPhone,
        otpEmail: otpEmail.trim(),
        staffOtp: staff.map(s => ({ email: s.email, enabled: !!s.otpEnabled }))
      };
      
      const res = await fetch("/api/clinic/auth-settings", { 
        method: "POST", 
        headers: headersWithJson(), 
        body: JSON.stringify(payload),
        credentials: "include"
      });
      
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || "Failed to save settings");
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: staff.length,
    enabled: staff.filter(s => s.otpEnabled).length,
    agents: staff.filter(s => s.role === "agent").length,
    doctors: staff.filter(s => s.role === "doctorStaff").length
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Access Denied Screen - Show when canRead is false */}
      {!permissionsLoaded ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Permissions...</h2>
            <p className="text-gray-500">Please wait while we verify your access.</p>
          </div>
        </div>
      ) : !permissions.canRead ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 max-w-md">
              You do not have permission to view authentication settings. Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      ) : (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header with Gradient */}
          <div className="mb-8 animate-slideIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Authentication Settings</h1>
                  <p className="text-sm text-gray-500 mt-1">Configure OTP delivery channels and staff permissions</p>
                </div>
              </div>
              
              {/* Last Updated Badge */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                <span>Last updated: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
            
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Staff</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">OTP Enabled</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.enabled}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      style={{ width: `${(stats.enabled / stats.total) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Agents</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.agents}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Doctor Staff</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.doctors}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - OTP Settings - Enhanced to match OTP modal */}
            <div className="lg:col-span-1 space-y-6">
              {/* Delivery Channels Card - Now matches OTP modal styling */}
              <div className="bg-white/80 mt-10 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideIn ">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">OTP Delivery Channels</h2>
                      <p className="text-xs text-gray-500">Configure where OTPs will be sent</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* WhatsApp Number - Enhanced with WhatsApp icon */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <WhatsAppIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <span>WhatsApp Number</span>
                      </div>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={otpWhatsAppNumber}
                        onChange={(e) => {
                          setOtpWhatsAppNumber(e.target.value);
                          setPhoneError("");
                          setSaved(false);
                        }}
                        onFocus={() => setShowPhoneFormatHint(true)}
                        onBlur={() => setShowPhoneFormatHint(false)}
                        placeholder="+91 98765 43210"
                        disabled={!permissions.canUpdate}
                        readOnly={!permissions.canUpdate}
                        className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                          !permissions.canUpdate
                            ? "bg-gray-100 cursor-not-allowed"
                            : phoneError 
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                            : "border-gray-200 focus:ring-green-200 focus:border-green-400"
                        }`}
                      />
                      {otpWhatsAppNumber && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(otpWhatsAppNumber)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                        </button>
                      )}
                    </div>
                    
                    {/* Format Hint - Matches OTP modal styling */}
                    {showPhoneFormatHint && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-slideIn">
                        <p className="text-xs text-green-700 flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Enter 10-digit WhatsApp number (e.g., +919876543210)
                        </p>
                      </div>
                    )}
                    
                    {phoneError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {phoneError}
                      </p>
                    )}
                    
                    {/* Current Number Display - Like in OTP modal */}
                    {otpWhatsAppNumber && !phoneError && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        Current: {formatPhoneNumber(otpWhatsAppNumber)}
                      </p>
                    )}
                  </div>

                  {/* Email Address - Enhanced */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <span>Email Address</span>
                      </div>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => {
                          setOtpEmail(e.target.value);
                          setEmailError("");
                          setSaved(false);
                        }}
                        placeholder="clinic@example.com"
                        disabled={!permissions.canUpdate}
                        readOnly={!permissions.canUpdate}
                        className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                          !permissions.canUpdate
                            ? "bg-gray-100 cursor-not-allowed"
                            : emailError 
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                            : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                        }`}
                      />
                      {otpEmail && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(otpEmail)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                        </button>
                      )}
                    </div>
                    
                    {emailError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Save Button - Enhanced gradient */}
                  {permissions.canUpdate && (
                  <div className="pt-4">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Saving Changes...
                        </>
                      ) : saved ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Changes Saved!
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Staff Management - Enhanced */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slideIn">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Staff OTP Permissions</h2>
                        <p className="text-xs text-gray-500">Enable or disable OTP for individual staff members</p>
                      </div>
                    </div>
                    
                    {/* Search and Filter - Enhanced */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search staff..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-48 pl-8 pr-3 py-2 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                        />
                        <Users className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="w-full sm:w-32 border-2 border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      >
                        <option value="all">All Roles</option>
                        <option value="agent">Agents</option>
                        <option value="doctorStaff">Doctor Staff</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Staff Table - Enhanced with better mobile responsiveness and scrollable container */}
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OTP Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredStaff.map((s, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                                    s.role === 'agent' 
                                      ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700' 
                                      : 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700'
                                  }`}>
                                    {s.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                    <p className="text-xs text-gray-500 md:hidden">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  s.role === 'agent' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {s.role === 'agent' ? 'Agent' : 'Doctor Staff'}
                                </span>
                              </td>
                              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                <p className="text-sm text-gray-600">{s.email}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-2 w-2 rounded-full mr-2 ${
                                    s.otpEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                                  }`}></div>
                                  <span className={`text-xs font-medium ${
                                    s.otpEnabled ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {s.otpEnabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <label className="inline-flex items-center cursor-pointer">
                                  <span className="mr-3 text-xs text-gray-600 hidden sm:inline">
                                    {s.otpEnabled ? 'Disable' : 'Enable'}
                                  </span>
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={!!s.otpEnabled}
                                      disabled={!permissions.canUpdate}
                                      onChange={(e) => {
                                        const v = e.target.checked;
                                        setStaff(prev => prev.map((x) =>
                                          x.email === s.email ? { ...x, otpEnabled: v } : x
                                        ));
                                        setSaved(false);
                                        updateStaffOtp(s.email, v);
                                      }}
                                    />
                                    <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-600 ${!permissions.canUpdate ? 'cursor-not-allowed opacity-50' : ''}`}></div>
                                  </div>
                                </label>
                              </td>
                            </tr>
                          ))}
                          
                          {filteredStaff.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                                    <Users className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500 font-medium">No staff members found</p>
                                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Showing <span className="font-medium">{filteredStaff.length}</span> of{' '}
                      <span className="font-medium">{staff.length}</span> staff members
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {Math.round((filteredStaff.length / staff.length) * 100) || 0}% of total
                      </span>
                    </div>
                  </div>
                </div>
              </div>            
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

// Layout
AuthSettingsPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Export with authentication wrapper
const ProtectedAuthSettingsPage: NextPageWithLayout = withClinicAuth(AuthSettingsPage);
ProtectedAuthSettingsPage.getLayout = AuthSettingsPage.getLayout;

export default ProtectedAuthSettingsPage;