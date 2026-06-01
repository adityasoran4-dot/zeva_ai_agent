import React from 'react';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import ApplicationsDashboard from "../../components/job-applicants";
import type { NextPageWithLayout } from "../_app";

function ClinicApplications() {
  return <ApplicationsDashboard tokenKey="clinicToken" />;
}

ClinicApplications.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicApplications: NextPageWithLayout = withClinicAuth(ClinicApplications);
ProtectedClinicApplications.getLayout = ClinicApplications.getLayout;

export default ProtectedClinicApplications;