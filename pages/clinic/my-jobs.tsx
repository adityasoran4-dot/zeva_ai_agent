import React from 'react';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import JobManagement from "../../components/all-posted-jobs";
import type { NextPageWithLayout } from "../_app";

const MyJobs = () => {
  const clinicConfig = {
    title: 'My Job Postings',
    subtitle: 'Manage and review all your job listings posted as a clinic',
    tokenKey: 'clinicToken',
    primaryColor: '#10B981', // Different color for clinic (e.g., green)
    emptyStateTitle: 'No Job Postings Yet',
    emptyStateDescription: 'Start posting job opportunities to find new candidates.',
    emptyStateButtonText: 'Post a New Job'
  };

  return (
    <JobManagement 
      role="clinic" 
      config={clinicConfig}
    />
  );
};

MyJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply clinic authentication wrapper
const ProtectedClinicJobs: NextPageWithLayout = withClinicAuth(MyJobs);

// Assign layout for proper rendering
ProtectedClinicJobs.getLayout = MyJobs.getLayout;

export default ProtectedClinicJobs;
