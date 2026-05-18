import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Search, Package, Clock, CheckCircle, Calendar,
  DollarSign, User, AlertCircle, TrendingUp, Eye, X
} from 'lucide-react';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app';
import { getCurrencySymbol } from '@/lib/currencyHelper';

const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) {
      console.log('Found token in', key, ':', value.substring(0, 20) + '...');
      return value;
    }
  }
  console.warn('No token found in localStorage or sessionStorage');
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  if (!token) {
    console.error('No authentication token found');
    return {};
  }
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    console.log('Decoded token - clinicId:', decoded.clinicId);
  } catch (e) {
    console.error('Error decoding token:', e);
  }
  
  return { Authorization: `Bearer ${token}` };
};

interface UserPackage {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    emrNumber?: string;
  };
  packageName: string;
  totalPrice: number;
  totalSessions: number;
  remainingSessions: number;
  sessionPrice: number;
  treatments: Array<{
    treatmentName: string;
    treatmentSlug: string;
    allocatedPrice: number;
    sessions: number;
    usedSessions: number;
    sessionPrice: number;
  }>;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'paid' | 'pending' | 'partial';
  createdAt: string;
}

const UserPackagesPage: NextPageWithLayout = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPackages, setPendingPackages] = useState<UserPackage[]>([]);
  const [approvedPackages, setApprovedPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetchPackages();
  }, [activeTab, searchQuery]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders || typeof authHeaders !== 'object' || Object.keys(authHeaders).length === 0) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers: authHeaders });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'pending' ? 'pending' : 'approved';
      const params = new URLSearchParams({ status });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      console.log('Fetching packages with status:', status, 'search:', searchQuery);
      
      const response = await axios.get(`/api/clinic/user-packages?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        if (activeTab === 'pending') {
          setPendingPackages(response.data.packages);
          console.log('Set pending packages:', response.data.packages.length);
        } else {
          setApprovedPackages(response.data.packages);
          console.log('Set approved packages:', response.data.packages.length);
        }
      } else {
        console.error('API returned success: false');
        setError('API returned error');
      }
    } catch (err: any) {
      console.error('Error fetching packages:', err);
      console.error('Error details:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };



  const handleViewDetails = (pkg: UserPackage) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
  };

  const getPatientName = (patient: any) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'partial':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const currentPackages = activeTab === 'pending' ? pendingPackages : approvedPackages;

  return (
    <>
      <Head>
        <title>User Packages | Zeva360</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-green-200">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                <span>User Created Packages</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and review patient-created treatment packages</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <div className="bg-emerald-100 text-emerald-700 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
                Pending: {pendingPackages.length}
              </div>
              <div className="bg-green-100 text-green-700 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm">
                Approved: {approvedPackages.length}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by patient name or EMR number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-green-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>
      </div>

      {/* Two Slider Tabs */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-6 border border-green-100">
          <div className="flex border-b border-green-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 text-center font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                activeTab === 'pending'
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                  : 'bg-white text-gray-500 hover:bg-green-50 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Pending Approval</span>
              <span className="sm:hidden">Pending</span>
              {pendingPackages.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-sm">
                  {pendingPackages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 text-center font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                activeTab === 'approved'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'bg-white text-gray-500 hover:bg-green-50 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Approved Packages</span>
              <span className="sm:hidden">Approved</span>
              {approvedPackages.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-sm">
                  {approvedPackages.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-gray-600">Loading packages...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : currentPackages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No {activeTab} packages found
                </p>
                {searchQuery && (
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPackages.map((pkg) => (
                  <div
                    key={pkg._id}
                    className="bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3">
                      <h3 className="text-sm font-bold text-white mb-0.5">
                        {pkg.packageName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-white/90 text-xs">
                          <User className="w-3.5 h-3.5" />
                          <span>{getPatientName(pkg.patientId)}</span>
                        </div>
                        {pkg.patientId?.emrNumber && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">
                            EMR: {pkg.patientId.emrNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Price & Sessions */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                          <div className="flex items-center gap-1.5 text-green-700 text-xs mb-0.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Total Price</span>
                          </div>
                          <p className="text-base font-bold text-green-900">
                            {getCurrencySymbol(currency)}{pkg.totalPrice.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                          <div className="flex items-center gap-1.5 text-green-700 text-xs mb-0.5">
                            <Package className="w-3.5 h-3.5" />
                            <span>Sessions</span>
                          </div>
                          <p className="text-base font-bold text-green-900">
                            {pkg.remainingSessions}/{pkg.totalSessions}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(pkg.status)}`}>
                          {pkg.status.toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getPaymentStatusColor(pkg.paymentStatus)}`}>
                          {pkg.paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-green-700">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Start: {formatDate(pkg.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-700">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>End: {formatDate(pkg.endDate)}</span>
                        </div>
                      </div>

                      {/* Treatments */}
                      {pkg.treatments && pkg.treatments.length > 0 && (
                        <div className="border-t border-green-200 pt-3">
                          <h4 className="text-xs font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Treatments ({pkg.treatments.length})
                          </h4>
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {pkg.treatments.map((treatment, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-800 font-medium truncate">
                                    {treatment.treatmentName}
                                  </span>
                                  <span className="text-green-600 text-[10px]">
                                    {treatment.usedSessions}/{treatment.sessions} sessions
                                  </span>
                                </div>
                                <div className="text-[10px] text-green-600">
                                  {getCurrencySymbol(currency)}{treatment.allocatedPrice.toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {activeTab === 'pending' && (
                        <div className="border-t border-green-200 pt-3">
                          <button
                            onClick={() => handleViewDetails(pkg)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </div>
                      )}

                      {activeTab === 'approved' && (
                        <div className="border-t border-green-200 pt-3">
                          <button
                            onClick={() => handleViewDetails(pkg)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Details Modal */}
      {showModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-green-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPackage.packageName}</h2>
                <p className="text-emerald-100 text-sm mt-1">Package Details</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Name</p>
                    <p className="font-medium text-green-900">{getPatientName(selectedPackage.patientId)}</p>
                  </div>
                  {selectedPackage.patientId?.emrNumber && (
                    <div>
                      <p className="text-sm text-green-700">EMR Number</p>
                      <p className="font-medium text-green-900">{selectedPackage.patientId.emrNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Package Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Price</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">{getCurrencySymbol(currency)}{selectedPackage.totalPrice.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="text-sm font-medium">Sessions</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{selectedPackage.remainingSessions}/{selectedPackage.totalSessions}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-green-100 p-4 rounded-lg border border-teal-100">
                  <div className="flex items-center gap-2 text-teal-700 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Duration</span>
                  </div>
                  <p className="text-sm font-bold text-teal-900">
                    {formatDate(selectedPackage.startDate)} - {formatDate(selectedPackage.endDate)}
                  </p>
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-2">Package Status</p>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedPackage.status)}`}>
                    {selectedPackage.status.toUpperCase()}
                  </span>
                </div>
                <div className="border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-2">Payment Status</p>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedPackage.paymentStatus)}`}>
                    {selectedPackage.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Treatments */}
              {selectedPackage.treatments && selectedPackage.treatments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Treatments Included ({selectedPackage.treatments.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedPackage.treatments.map((treatment, idx) => (
                      <div key={idx} className="bg-white border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-green-900">{treatment.treatmentName}</h4>
                            <p className="text-sm text-green-700">Treatment Slug: {treatment.treatmentSlug}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-900">{getCurrencySymbol(currency)}{treatment.allocatedPrice.toLocaleString()}</p>
                            <p className="text-sm text-green-700">{treatment.usedSessions}/{treatment.sessions} sessions used</p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-green-700 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((treatment.usedSessions / treatment.sessions) * 100)}%</span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(treatment.usedSessions / treatment.sessions) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Created At</p>
                    <p className="font-medium text-green-900">{formatDate(selectedPackage.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Session Price</p>
                    <p className="font-medium text-green-900">{getCurrencySymbol(currency)}{selectedPackage.sessionPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────

UserPackagesPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export const UserPackagesPageBase = UserPackagesPage;

const ProtectedUserPackagesPage: NextPageWithLayout = withClinicAuth(UserPackagesPage);
ProtectedUserPackagesPage.getLayout = UserPackagesPage.getLayout;

export default ProtectedUserPackagesPage;
