import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const CreateAgentModal = ({ isOpen, onClose, onCreated, token, doctorToken, adminToken, defaultRole }) => {
  // Note: 'token' prop represents clinicToken (clinic users)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(defaultRole || 'agent'); // Default to passed role or 'agent'
  const [submitting, setSubmitting] = useState(false);

  // Update role when defaultRole changes (e.g., when user switches between Agents/Doctors tabs)
  useEffect(() => {
    if (defaultRole && defaultRole !== role) {
      setRole(defaultRole);
    }
  }, [defaultRole]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole(defaultRole || 'agent');
    }
  }, [isOpen, defaultRole]);

  // Lock body scroll and hide header when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine which token to use: priority should match the actual logged-in user context
  // Priority: clinic/agent token (token) > doctorToken > adminToken
  const authToken = token || doctorToken || adminToken || null;
  
  if (!authToken) {
    console.error('No authentication token provided');
    return null;
  }
  
  // Debug: Log which token is being used
  console.log('CreateAgentModal - Token used:', {
    hasClinicOrAgentToken: !!token,
    hasDoctorToken: !!doctorToken,
    hasAdminToken: !!adminToken,
    usingToken: token ? 'clinic/agent token' : doctorToken ? 'doctorToken' : 'adminToken'
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password || !role) return;
    
    // Validate phone number if provided
    if (phone && phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number or leave it empty");
      return;
    }
    
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        '/api/lead-ms/create-agent',
        { name, email, phone, password, role },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (data?.success) {
        setName(''); setEmail(''); setPhone(''); setPassword(''); setRole(defaultRole || 'agent');
        onCreated?.();
        onClose?.();
      } else {
        alert(data?.message || 'Failed to create user');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to create user');
      }
      console.error('Create user error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Show role selector if adminToken, clinicToken (token), or doctorToken is present
  // All these roles should be able to choose between agent and doctorStaff
  // token = clinicToken (clinic users), doctorToken = doctor users, adminToken = admin users
  const showRoleSelector = !!(adminToken || token || doctorToken);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Create {role === 'doctorStaff' ? 'Doctor Staff' : 'Agent'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" aria-label="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3">
            {showRoleSelector && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Role <span className="text-red-500">*</span></label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:border-gray-400 dark:focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="agent">Agent</option>
                  <option value="doctorStaff">Doctor Staff</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Full name <span className="text-red-500">*</span></label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder={role === 'doctorStaff' ? 'Staff name' : 'Agent name'} 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:border-gray-400 dark:focus:border-blue-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email address <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={role === 'doctorStaff' ? 'staff@example.com' : 'agent@example.com'} 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:border-gray-400 dark:focus:border-blue-500 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Phone number</label>
              <input 
                type="tel"
                value={phone} 
                onChange={(e) => {
                  // Only allow digits and limit to 10 digits
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }} 
                placeholder="Enter 10-digit phone number" 
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:border-gray-400 dark:focus:border-blue-500 outline-none transition-colors" 
              />
              {phone.length > 0 && phone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits</p>
              )}
              {phone.length === 10 && (
                <p className="text-xs text-green-600 mt-1">Valid phone number</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter password" 
                  required 
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:border-gray-400 dark:focus:border-blue-500 outline-none transition-colors" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-3.5 py-2 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentModal;


