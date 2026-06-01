// pages/prescription/[id].tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import axios from "axios";
import { FileText } from "lucide-react";

interface PrescriptionData {
  _id: string;
  patientName: string;
  doctorName: string;
  medicines: Array<{
    medicineName: string;
    dosage: string;
    duration: string;
    notes: string;
  }>;
  aftercareInstructions: string;
  pdfUrl: string;
  createdAt: string;
}

interface PrescriptionViewPageProps {
  getLayout?: (page: ReactElement) => ReactNode;
}

const PrescriptionViewPage: React.FC<PrescriptionViewPageProps> = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (!id) return;
    
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/public/prescription/${id}`);
        
        if (res.data.success) {
          setPrescription(res.data.prescription);
        } else {
          setError(res.data.message || "Prescription not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load prescription");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescription();
  }, [id]);

  const handleDownloadPdf = () => {
    if (prescription?.pdfUrl) {
      window.open(prescription.pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">No prescription found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Prescription - {prescription.patientName}</title>
        <meta name="description" content="View your prescription" />
      </Head>
      
      <div className="min-h-screen bg-white py-4 px-2">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-300 px-4 py-2 text-center">
            <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Prescription</h1>
          </div>
          
          {/* Patient Info */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Patient:</span>
              <span className="font-medium text-gray-800">{prescription.patientName}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Doctor:</span>
              <span className="font-medium text-gray-800">Dr. {prescription.doctorName}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Date:</span>
              <span className="font-medium text-gray-800">
                {new Date(prescription.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>

          {/* Medicines Table */}
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 mb-2">Prescribed Medicines</h3>
            {prescription.medicines && prescription.medicines.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 text-left font-semibold text-gray-500 w-8">#</th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-500">Medicine</th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-500 w-16">Dosage</th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-500 w-16">Duration</th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-500 w-20">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prescription.medicines.map((med, index) => (
                    <tr key={index}>
                      <td className="px-2 py-1 text-gray-500">{index + 1}</td>
                      <td className="px-2 py-1 font-medium text-gray-800">{med.medicineName}</td>
                      <td className="px-2 py-1 text-gray-600">{med.dosage || "—"}</td>
                      <td className="px-2 py-1 text-gray-600">{med.duration || "—"}</td>
                      <td className="px-2 py-1 text-gray-600">{med.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-xs text-center py-2">No medicines prescribed</p>
            )}
          </div>

          {/* Aftercare Instructions */}
          {prescription.aftercareInstructions && (
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 mb-1">Aftercare Instructions</h3>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{prescription.aftercareInstructions}</p>
            </div>
          )}

          {/* Download PDF Button */}
          {prescription.pdfUrl && (
            <div className="px-4 py-3 text-center">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-3 h-3" />
                View/Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PrescriptionViewPage;

// Override layout - return no layout for this page
(PrescriptionViewPage as any).getLayout = function getLayout(page: ReactElement) {
  return page;
};
