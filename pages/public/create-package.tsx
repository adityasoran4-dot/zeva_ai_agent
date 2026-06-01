import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import type { ReactNode } from 'react';
import axios from 'axios';
import { Package, Check, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

interface SelectedTreatment {
  treatmentName: string;
  treatmentSlug: string;
  subcategoryName?: string;
  subcategoryIndex?: number;
  serviceId?: string;
  sessions: number;
  sessionPrice: number;
  allocatedPrice: number;
  isService?: boolean;
}

export default function CreatePackagePage() {
  const router = useRouter()
  const { clinicId, patientId, patientName, patientMobile } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  const [packageName, setPackageName] = useState('');
  const [duration, setDuration] = useState('3'); // months

  // Patient info states - initialize from URL params
  const [patientNameInput, setPatientNameInput] = useState('');
  const [patientMobileInput, setPatientMobileInput] = useState('');

  // Initialize patient info from URL on mount
  useEffect(() => {
    if (patientName) {
      setPatientNameInput(Array.isArray(patientName) ? patientName[0] : patientName);
    }
    if (patientMobile) {
      setPatientMobileInput(Array.isArray(patientMobile) ? patientMobile[0] : patientMobile);
    }
  }, [patientName, patientMobile]);

  useEffect(() => {
    if (clinicId) {
      fetchData();
    }
  }, [clinicId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/clinic/public-package?clinicId=${clinicId}&patientId=${patientId}`);
      if (response.data.success) {
        setServices(response.data.services || []);
        setTreatments(response.data.treatments || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentSelect = (treatment: any, subcategoryIndex: number = 0) => {
    const subcategory = treatment.subcategories?.[subcategoryIndex];
    const basePrice = subcategory?.price || 0;
    
    const exists = selectedTreatments.find(t => t.treatmentSlug === treatment.slug && t.subcategoryIndex === subcategoryIndex);
    if (exists) {
      setSelectedTreatments(selectedTreatments.filter(t => !(t.treatmentSlug === treatment.slug && t.subcategoryIndex === subcategoryIndex)));
    } else {
      setSelectedTreatments([
        ...selectedTreatments,
        {
          treatmentName: treatment.name,
          treatmentSlug: treatment.slug,
          subcategoryName: subcategory?.name || treatment.name,
          subcategoryIndex,
          sessions: 1,
          sessionPrice: basePrice,
          allocatedPrice: basePrice,
        }
      ]);
    }
  };

  const updateTreatmentSessions = (treatmentSlug: string, subcategoryIndex: number, sessions: number) => {
    setSelectedTreatments(selectedTreatments.map(t => {
      if (t.treatmentSlug === treatmentSlug && t.subcategoryIndex === subcategoryIndex) {
        return {
          ...t,
          sessions,
          allocatedPrice: t.sessionPrice * sessions,
        };
      }
      return t;
    }));
  };

  const handleServiceSelect = (service: any, price: number) => {
    const exists = selectedTreatments.find(t => t.treatmentSlug === service.serviceSlug && t.isService);
    if (exists) {
      setSelectedTreatments(selectedTreatments.filter(t => !(t.treatmentSlug === service.serviceSlug && t.isService)));
    } else {
      setSelectedTreatments([
        ...selectedTreatments,
        {
          treatmentName: service.name,
          treatmentSlug: service.serviceSlug,
          serviceId: service._id,
          sessions: 1,
          sessionPrice: price,
          allocatedPrice: price,
          isService: true,
        }
      ]);
    }
  };

  const handleServiceUpdate = (serviceSlug: string, sessions: number) => {
    setSelectedTreatments(selectedTreatments.map(t => {
      if (t.treatmentSlug === serviceSlug && t.isService) {
        return {
          ...t,
          sessions,
          allocatedPrice: t.sessionPrice * sessions,
        };
      }
      return t;
    }));
  };

  const calculateTotal = () => {
    return selectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0);
  };

  const calculateTotalSessions = () => {
    return selectedTreatments.reduce((sum, t) => sum + (t.sessions || 0), 0);
  };

  const handleSubmit = async () => {
    if (selectedTreatments.length === 0) {
      alert('Please select at least one treatment');
      return;
    }

    if (!patientNameInput.trim()) {
      alert('Please enter patient name');
      return;
    }

    if (!patientMobileInput.trim()) {
      alert('Please enter phone number');
      return;
    }

    try {
      setSubmitting(true);
      const totalSessions = calculateTotalSessions();
      const totalPrice = calculateTotal();
      const sessionPrice = totalSessions > 0 ? totalPrice / totalSessions : 0;

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(duration));

      const response = await axios.post('/api/clinic/public-package', {
        clinicId,
        patientId,
        patientName: patientNameInput,
        patientMobile: patientMobileInput,
        packageName: packageName || `Package for ${patientNameInput}`,
        totalPrice,
        totalSessions,
        sessionPrice,
        treatments: selectedTreatments,
        endDate: endDate.toISOString(),
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error: any) {
      console.error("Error creating package:", error);
      alert(error.response?.data?.message || 'Failed to create package');
    } finally {
      setSubmitting(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Created!</h2>
          <p className="text-gray-600 mb-6">
            Your package has been created successfully. The clinic will review and approve your package shortly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-colors"
          >
            Create Another Package
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
         
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Package</h2>
          <p className="text-gray-600 dark:text-gray-400">Select treatments to create a custom package</p>
        </div>

        {/* Patient Info Card */}
        {patientName && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={patientNameInput}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={patientMobileInput}
                  onChange={(e) => setPatientMobileInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Package Name Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Package Name</h2>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="e.g., Smile Design Package, Dental Care Plan, etc."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Give your package a name to easily identify it later</p>
        </div>

        {/* Services and Treatments Selection - 3 Column Grid */}
        <div className="mb-6">
          {/* Services Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Select Services
            </h2>
            
            {services.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No services available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service: any) => {
                  const isSelected = selectedTreatments.some(t => t.treatmentSlug === service.serviceSlug && t.serviceId);
                  const selectedTreatment = selectedTreatments.find(t => t.treatmentSlug === service.serviceSlug && t.serviceId);
                  const price = service.clinicPrice || service.price;
                  const sessionCount = selectedTreatment?.sessions || 1;
                  
                  return (
                    <div 
                      key={service._id || service.serviceSlug}
                      className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                        isSelected 
                          ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm'
                      }`}
                      onClick={() => handleServiceSelect(service, price)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{service.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {service.durationMinutes} min
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                            isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        
                        {isSelected && selectedTreatment ? (
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (sessionCount > 1) {
                                    handleServiceUpdate(service.serviceSlug, sessionCount - 1);
                                  }
                                }}
                                className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold transition-colors"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold w-6 text-center text-gray-900 dark:text-white">{sessionCount}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleServiceUpdate(service.serviceSlug, sessionCount + 1);
                                }}
                                className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                              AED {(price * sessionCount).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">AED {price}</span>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 opacity-10 rounded-bl-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Treatments Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
           
                      
            {treatments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No treatments available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treatments.map((treatment: any) => (
                  treatment.subcategories && treatment.subcategories.length > 0 &&
                  treatment.subcategories.map((subcat: any, idx: number) => {
                    const isSelected = selectedTreatments.some(t => t.treatmentSlug === treatment.slug && t.subcategoryIndex === idx);
                    const selectedTreatment = selectedTreatments.find(t => t.treatmentSlug === treatment.slug && t.subcategoryIndex === idx);
                              
                    return (
                      <div 
                        key={`${treatment.slug}-${idx}`}
                        className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                          isSelected 
                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 shadow-md' 
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm'
                        }`}
                        onClick={() => handleTreatmentSelect(treatment, idx)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{subcat.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{treatment.name}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                              isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Per session</p>
                                    
                          {(() => {
                            const sessionCount = selectedTreatment?.sessions || 1;
                            return isSelected && selectedTreatment ? (
                              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (sessionCount > 1) {
                                        updateTreatmentSessions(treatment.slug, idx, sessionCount - 1);
                                      }
                                    }}
                                    className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold w-6 text-center text-gray-900 dark:text-white">{sessionCount}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTreatmentSessions(treatment.slug, idx, sessionCount + 1);
                                    }}
                                    className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                  AED {(subcat.price * sessionCount).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">AED {subcat.price}</span>
                              </div>
                            );
                          })()}
                        </div>
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 opacity-10 rounded-bl-full"></div>
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Package Summary */}
        {selectedTreatments.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 rounded-2xl shadow-2xl p-6 mb-6 text-white border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              Package Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {selectedTreatments.map((t, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200 line-clamp-1">{t.treatmentName}</span>
                    <span className="text-xs bg-teal-500/30 px-2 py-1 rounded-full text-teal-200">x{t.sessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t.sessions} session(s)</span>
                    <span className="font-bold text-teal-300">AED {t.allocatedPrice?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-gray-300">Total Sessions</span>
                </div>
                <span className="font-bold text-2xl text-white">{calculateTotalSessions()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Per Session</span>
                </div>
                <span className="font-bold text-lg text-teal-300">AED {(calculateTotal() / calculateTotalSessions()).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-200">Total Price</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">AED {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Duration */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Package Duration (Months)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="1" className="bg-gray-800">1 Month</option>
                <option value="3" className="bg-gray-800">3 Months</option>
                <option value="6" className="bg-gray-800">6 Months</option>
                <option value="12" className="bg-gray-800">12 Months</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-4 px-6 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedTreatments.length === 0}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 text-white font-bold rounded-xl hover:from-teal-600 hover:via-teal-700 hover:to-teal-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating Package...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Package
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

(CreatePackagePage as any).getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};