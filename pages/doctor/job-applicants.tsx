import React from 'react';
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import ApplicationsDashboard from "../../components/job-applicants";
import type { NextPageWithLayout } from "../_app";

function DoctorDashboard() {
  return (
    <ApplicationsDashboard
      tokenKey="doctorToken"
      apiEndpoint="/api/job-postings/job-applications"
      updateStatusEndpoint="/api/job-postings/application-status"
      deleteEndpoint="/api/job-postings/delete-application"
    />
  );
}

DoctorDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorDashboard: NextPageWithLayout = withDoctorAuth(DoctorDashboard);
ProtectedDoctorDashboard.getLayout = DoctorDashboard.getLayout;

export default ProtectedDoctorDashboard;