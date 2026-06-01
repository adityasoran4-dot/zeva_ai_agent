import React from "react";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';

function ClinicPatientInformation() {
  const router = useRouter();
  
  // Redirect to patient-registration page with information tab
  React.useEffect(() => {
    router.replace('/clinic/patient-registration');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D9AA5]"></div>
    </div>
  );
}

ClinicPatientInformation.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicPatientInformation = withClinicAuth(ClinicPatientInformation);
ProtectedClinicPatientInformation.getLayout = ClinicPatientInformation.getLayout;

export default ProtectedClinicPatientInformation;

