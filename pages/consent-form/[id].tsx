// pages/consent-form/[id].tsx
import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import { Check, Signature, Calendar, User, Trash2, CheckCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface ConsentFormData {
  _id: string;
  formName: string;
  description: string;
  language: string;
  version: string;
  enableDigitalSignature: boolean;
  requireNameConfirmation: boolean;
}

interface PatientData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  appointmentId?: string;
}

const ConsentFormPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consentForm, setConsentForm] = useState<ConsentFormData | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [todayDate, setTodayDate] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(false);
  const [understandResults, setUnderstandResults] = useState(false);
  const [error, setError] = useState("");
  const [signatureData, setSignatureData] = useState<string>("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [appointmentId, setAppointmentId] = useState<string>("");
  
  const signatureRef = useRef<SignatureCanvas>(null);

  // Get today's date in formatted way
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    setTodayDate(formattedDate);
  }, []);

  // Fetch consent form and patient data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch consent form details
        const consentRes = await axios.get(`/api/public/consent/${id}`);
        if (consentRes.data.success) {
          setConsentForm(consentRes.data.consent);
        } else {
          setError("Consent form not found");
        }

        // Fetch patient data from URL query params or sessionStorage
        let patientFullName = "";
        const patientDataFromUrl = router.query.patient;
        
        if (patientDataFromUrl && typeof patientDataFromUrl === 'string') {
          try {
            const decoded = JSON.parse(decodeURIComponent(patientDataFromUrl)) as PatientData;
            console.log('Decoded patient data:', decoded);
            setPatient(decoded);
            setAppointmentId(decoded.appointmentId || "");
            sessionStorage.setItem(`patient_${id}`, JSON.stringify(decoded));
            patientFullName = `${decoded.firstName || ""} ${decoded.lastName || ""}`.trim();
          } catch (e) {
            console.error("Error parsing patient data:", e);
          }
        } else {
          const savedPatientData = sessionStorage.getItem(`patient_${id}`);
          console.log('Saved patient data from sessionStorage:', savedPatientData);
          if (savedPatientData) {
            const decoded = JSON.parse(savedPatientData) as PatientData;
            setPatient(decoded);
            setAppointmentId(decoded.appointmentId || "");
            patientFullName = `${decoded.firstName || ""} ${decoded.lastName || ""}`.trim();
          }
        }
        
        // Check if this patient already has a signature for this consent form
        if (patientFullName && typeof id === 'string') {
          await fetchExistingSignature(id, patientFullName);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err?.response?.data?.message || "Failed to load consent form");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router.query.patient]);

  // Function to fetch existing signature
  const fetchExistingSignature = async (consentFormId: string, patientName: string) => {
    try {
      const response = await axios.get("/api/public/consent-signature-exists", {
        params: { consentFormId, patientName },
      });

      if (response.data.success && response.data.signature) {
        const sig = response.data.signature;
        
        // Load signature into canvas
        setSignatureData(sig.signature);
        
        // Set checkbox states
        setAgreedToTerms(sig.agreedToTerms || false);
        setQuestionsAnswered(sig.questionsAnswered || false);
        setUnderstandResults(sig.understandResults || false);
        setNameConfirmed(sig.nameConfirmed || "");
        
        // Mark canvas as not empty
        setIsEmpty(false);
        
        console.log('Loaded existing signature:', sig);
      }
    } catch (err: any) {
      console.error("Error fetching existing signature:", err);
      // Silently fail - user can just sign again
    }
  };

  const handleSignatureBegin = () => {
    setIsEmpty(false);
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      const dataURL = signatureRef.current.toDataURL('image/png');
      setSignatureData(dataURL);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData("");
      setIsEmpty(true);
    }
  };

  const handleSubmit = async () => {
    if (!consentForm) return;

    // Validation
    if (consentForm.requireNameConfirmation && !nameConfirmed.trim()) {
      alert("Please type your full name to confirm");
      return;
    }

    if (consentForm.enableDigitalSignature && !signatureData) {
      alert("Please provide your signature");
      return;
    }

    if (!agreedToTerms || !questionsAnswered || !understandResults) {
      alert("Please confirm all acknowledgment checkboxes");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        consentFormId: id,
        patientName: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim(),
        patientFirstName: patient?.firstName,
        patientLastName: patient?.lastName,
        date: todayDate,
        signature: signatureData,
        nameConfirmed: nameConfirmed,
        agreedToTerms: !!agreedToTerms,
        questionsAnswered: !!questionsAnswered,
        understandResults: !!understandResults,
        ipAddress: "", // Can add IP tracking if needed
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
        appointmentId: appointmentId || null,
      };

      const { data } = await axios.post("/api/public/consent-signature", payload);
      
      if (data.success) {
        alert("Thank you! Your consent has been recorded successfully.");
        // Optionally redirect or show success message
        router.push("/consent-success");
      } else {
        alert(data.message || "Failed to submit consent");
      }
    } catch (err: any) {
      console.error("Error submitting consent:", err);
      alert(err?.response?.data?.message || "Failed to submit consent");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading consent form...</p>
        </div>
      </div>
    );
  }

  if (error || !consentForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Form</h2>
          <p className="text-gray-600 mb-6">{error || "Consent form not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{consentForm.formName} | Zeva360</title>
        <meta name="description" content="Patient consent form" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{consentForm.formName}</h1>
                <p className="text-sm text-gray-500 mt-1">Zeva Healthcare Clinic</p>
                {consentForm.description && (
                  <p className="text-sm text-gray-600 mt-2">{consentForm.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Patient Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                  {patient 
                    ? `${patient.firstName} ${patient.lastName}`.trim()
                    : "Enter your full name below"}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-blue-600" />
                  {todayDate}
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Information - This would come from the consent form content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Treatment Information</h2>
            <div className="prose prose-sm text-gray-700 space-y-4">
              <p>
                I hereby authorize and consent to the administration of Botulinum Toxin Type A (Botox) 
                injections to be performed by the medical professionals at Zeva Healthcare Clinic. 
                I understand that this treatment is intended for cosmetic purposes to reduce the 
                appearance of facial wrinkles and fine lines.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-4">Risks and Complications</h3>
              <p>I have been informed of the possible risks and complications associated with Botox injections, which may include but are not limited to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Temporary bruising, swelling, or redness at injection sites</li>
                <li>Headache or flu-like symptoms</li>
                <li>Temporary muscle weakness or drooping in the treated area</li>
                <li>Allergic reactions (rare)</li>
                <li>Asymmetry or undesired cosmetic result</li>
              </ul>
            </div>
          </div>

          {/* Digital Signature */}
          {consentForm.enableDigitalSignature && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Signature size={18} className="text-blue-600" />
                Digital Signature
              </h2>
              
              <div className="border-2 border-blue-300 bg-white rounded-xl overflow-hidden">
                {/* Show signature image if already signed, otherwise show canvas */}
                {signatureData && !isEmpty ? (
                  // Display existing signature as static image
                  <div className="bg-green-50 p-4">
                    <img
                      src={signatureData}
                      alt="Patient Signature"
                      className="w-full h-[200px] object-contain border-2 border-green-300 rounded-lg bg-white"
                    />
                    <div className="mt-3 flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <p className="text-sm font-medium">Signature already provided</p>
                    </div>
                  </div>
                ) : (
                  // Show signature canvas for new signature
                  <div className="bg-blue-50 p-4">
                    <SignatureCanvas
                      ref={signatureRef}
                      onBegin={handleSignatureBegin}
                      onEnd={handleSignatureEnd}
                      canvasProps={{
                        width: 600,
                        height: 200,
                        className: 'signature-canvas w-full h-[200px] border-2 border-dashed border-blue-300 rounded-lg bg-white',
                        style: { touchAction: 'none' }
                      }}
                    />
                  </div>
                )}
                
                {/* Status/Action Bar */}
                {!signatureData || isEmpty ? (
                  <div className="p-4 flex items-center justify-between bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      {isEmpty ? "Sign in the box above" : ""}
                    </p>
                    {signatureData && !isEmpty && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} />
                        Clear Signature
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {signatureData && !isEmpty
                  ? "This signature has been saved and will be stored in your medical records"
                  : "Use your mouse or finger to sign above"}
              </p>
            </div>
          )}

          {/* Patient Acknowledgment */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Acknowledgment</h2>
            
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${agreedToTerms ? "bg-green-50 border-green-300" : "border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="checkbox"
                  checked={!!agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 accent-green-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I confirm that I have read and understood all the information provided about this treatment
                </span>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${questionsAnswered ? "bg-green-50 border-green-300" : "border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="checkbox"
                  checked={!!questionsAnswered}
                  onChange={(e) => setQuestionsAnswered(e.target.checked)}
                  className="w-5 h-5 accent-green-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I have had the opportunity to ask questions and all my questions have been answered satisfactorily
                </span>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${understandResults ? "bg-green-50 border-green-300" : "border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="checkbox"
                  checked={!!understandResults}
                  onChange={(e) => setUnderstandResults(e.target.checked)}
                  className="w-5 h-5 accent-green-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I understand that results may vary and are not guaranteed
                </span>
              </label>
            </div>
          </div>

          {/* Name Confirmation */}
          {consentForm.requireNameConfirmation && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Name Confirmation</h2>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type your full name to confirm
              </label>
              <input
                type="text"
                value={nameConfirmed}
                onChange={(e) => setNameConfirmed(e.target.value)}
                placeholder={`${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()}
                className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
              />
              {(signatureData && !isEmpty) && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Name confirmation already provided
                </p>
              )}
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Important Notice:</h3>
            <p className="text-xs text-amber-800">
              This consent form will be electronically signed by the patient before their treatment. 
              A copy will be stored in their medical records and available for download at any time.
            </p>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Submit Consent Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

(ConsentFormPage as any).getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default ConsentFormPage;

// Add some custom styles for the signature canvas
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .signature-canvas {
      touch-action: none;
      cursor: crosshair;
    }
    .signature-canvas:focus {
      outline: none;
    }
  `;
  if (!document.getElementById('signature-canvas-styles')) {
    style.id = 'signature-canvas-styles';
    document.head.appendChild(style);
  }
}
