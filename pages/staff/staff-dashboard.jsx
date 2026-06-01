import React from 'react';
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import StaffStats from '../../components/StaffStats';
import { jwtDecode } from "jwt-decode";


const ClinicDashboard = () => {
  let storedUser = {};
  const token = localStorage.getItem('userToken');
  if (token) {
    try {
      storedUser = jwtDecode(token);
    } catch (err) {
      console.error("Invalid token", err);
      storedUser = {};
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 lg:p-10 border border-gray-100">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Hii {storedUser.name || 'Staff User'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            Welcome to your Dashboard
          </p>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100">
          <StaffStats />
        </div>
      </div>
    </div>
  );
};

// Define layout function
ClinicDashboard.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// Apply HOC
const ProtectedDashboard = withClinicAuth(ClinicDashboard);

// Reassign layout
ProtectedDashboard.getLayout = ClinicDashboard.getLayout;

export default ProtectedDashboard;