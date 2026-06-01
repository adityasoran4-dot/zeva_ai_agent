import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building2, Calendar, Edit2, Camera, Save, X, Shield, Stethoscope, Award, Briefcase, GraduationCap, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  profileImage?: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  qualifications?: string[];
  achievements?: string[];
}

interface ClinicProfile {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  email: string;
  establishedYear?: number;
  description?: string;
  timings?: {
    openingTime: string;
    closingTime: string;
    days: string[];
  };
  facilities?: string[];
}

const ViewProfile: NextPageWithLayout = () => {
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'clinic'>('personal');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    specialization: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch user profile
      const userResponse = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (userResponse.data.success) {
        setUserProfile(userResponse.data.user);
        setEditForm({
          name: userResponse.data.user.name || '',
          phone: userResponse.data.user.phone || '',
          bio: userResponse.data.user.bio || '',
          specialization: userResponse.data.user.specialization || '',
        });
      }

      // Fetch clinic profile if user is clinic owner
      if (authUser?.role === 'clinic') {
        const clinicResponse = await axios.get('/api/clinic/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (clinicResponse.data.success) {
          setClinicProfile(clinicResponse.data.clinic);
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSuccess('');
      setError('');
      
      const response = await axios.put(
        '/api/auth/profile',
        editForm,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        fetchProfileData();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        specialization: userProfile.specialization || '',
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-lg">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {userProfile?.name || 'User'}
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
                  <Briefcase className="w-4 h-4" />
                  {userProfile?.role === 'clinic' ? 'Clinic Owner' : userProfile?.role || 'User'}
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-md"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                <Calendar className="w-5 h-6 md:w-6 md:h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">2024</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                <Star className="w-5 h-6 md:w-6 md:h-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Rating</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">4.8/5</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                <CheckCircle className="w-5 h-6 md:w-6 md:h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Yes</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 text-center">
                <Award className="w-5 h-6 md:w-6 md:h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Achievements</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          Personal Information
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white break-words max-w-full">{userProfile?.name || 'N/A'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail className="w-4 h-4 text-gray-500" />
              <p>{userProfile?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Phone className="w-4 h-4 text-gray-500" />
                <p>{userProfile?.phone || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <p className="text-gray-900 dark:text-white">{userProfile?.gender || 'Not specified'}</p>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Specialization
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Cardiologist"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                <p>{userProfile?.specialization || 'Not specified'}</p>
              </div>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Experience
            </label>
            <p className="text-gray-900 dark:text-white">{userProfile?.experience || 0} years</p>
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-900 dark:text-white break-words max-w-full">{userProfile?.bio || 'No bio added'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Qualifications & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Qualifications
          </h2>
          <ul className="space-y-2">
            {userProfile?.qualifications?.map((qual, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <GraduationCap className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                <span className="break-words max-w-full">{qual}</span>
              </li>
            )) || (
              <li className="text-gray-500 dark:text-gray-400">No qualifications added</li>
            )}
          </ul>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Achievements
          </h2>
          <ul className="space-y-2">
            {userProfile?.achievements?.map((achievement, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <Award className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                <span className="break-words max-w-full">{achievement}</span>
              </li>
            )) || (
              <li className="text-gray-500 dark:text-gray-400">No achievements added</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderClinicInfo = () => (
    <div className="space-y-6">
      {/* Clinic Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg">
            <Building2 className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {clinicProfile?.name || 'Clinic Name'}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4" />
              {clinicProfile?.city}, {clinicProfile?.state}
            </p>
          </div>
        </div>
      </div>

      {/* Clinic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          Clinic Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Clinic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clinic Name
            </label>
            <p className="text-gray-900 dark:text-white">{clinicProfile?.name || 'N/A'}</p>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Number
            </label>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Phone className="w-4 h-4 text-gray-500" />
              <p>{clinicProfile?.contactNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail className="w-4 h-4 text-gray-500" />
              <p>{clinicProfile?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Established Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Established Year
            </label>
            <p className="text-gray-900 dark:text-white">{clinicProfile?.establishedYear || 'N/A'}</p>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <div className="flex items-start gap-2 text-gray-900 dark:text-white">
              <MapPin className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
              <p className="break-words max-w-full">
                {clinicProfile?.address || 'N/A'}, {clinicProfile?.city || ''},{' '}
                {clinicProfile?.state || ''} - {clinicProfile?.pincode || 'N/A'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <p className="text-gray-900 dark:text-white break-words max-w-full">
              {clinicProfile?.description || 'No description available'}
            </p>
          </div>
        </div>
      </div>

      {/* Facilities & Timings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facilities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Facilities
          </h2>
          <ul className="space-y-2">
            {clinicProfile?.facilities?.map((facility, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="break-words max-w-full">{facility}</span>
              </li>
            )) || (
              <li className="text-gray-500 dark:text-gray-400">No facilities listed</li>
            )}
          </ul>
        </div>

        {/* Timings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Operating Hours
          </h2>
          {clinicProfile?.timings ? (
            <div className="space-y-2">
              {Array.isArray(clinicProfile.timings) ? (
                // New weekly schedule schema
                (clinicProfile.timings as any[]).map((t: any) => (
                  <div key={t.day} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-28">{t.day}</span>
                    {t.isOpen ? (
                      <span className="text-gray-600 dark:text-gray-400">
                        {t.openingTime} &ndash; {t.closingTime}
                        {t.breakStart && t.breakEnd ? ` (Break: ${t.breakStart} - ${t.breakEnd})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Closed</span>
                    )}
                  </div>
                ))
              ) : (
                // Legacy string format
                <p className="text-gray-700 dark:text-gray-300">{clinicProfile.timings as any}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No timings specified</p>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Profile
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            View and manage your personal and clinic information
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="flex gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base whitespace-nowrap transition-all border-b-2 ${
                activeTab === 'personal'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Personal Information
            </button>
            {authUser?.role === 'clinic' && (
              <button
                onClick={() => setActiveTab('clinic')}
                className={`px-4 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'clinic'
                    ? 'border-green-600 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Clinic Information
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'personal' ? renderPersonalInfo() : renderClinicInfo()}
        </div>
      </div>
    </div>
  );
};

ViewProfile.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export default withClinicAuth(ViewProfile);
