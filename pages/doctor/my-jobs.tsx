// pages/doctor/my-jobs.js
import React from 'react';
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import JobManagement from "../../components/all-posted-jobs";
import type { NextPageWithLayout } from "../_app";

const MyJobs = () => {
  const doctorConfig = {
    title: 'My Job Applications',
    subtitle: 'Track your job applications and manage opportunities',
    tokenKey: 'doctorToken',
    primaryColor: '#3B82F6', // Different color for doctor
    emptyStateTitle: 'No Job Applications Yet',
    emptyStateDescription: 'Browse available positions and start applying to find your next opportunity.',
    emptyStateButtonText: 'Browse Available Jobs'
  };

  return (
    <JobManagement 
      role="doctor" 
      config={doctorConfig}
    />
  );
};

MyJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

// Apply HOC and assign correct type
const ProtectedDoctorJobs: NextPageWithLayout = withDoctorAuth(MyJobs);

// Reassign layout (TS-safe now)
ProtectedDoctorJobs.getLayout = MyJobs.getLayout;

export default ProtectedDoctorJobs;