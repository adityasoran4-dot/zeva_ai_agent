// pages/doctor/lead/dashboard.jsx
import React from 'react';
import DoctorLayout from '../../../components/DoctorLayout';

function ClinicDashboard() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold">Hi, Doctor!</h1>
        <p className="mt-3 text-sm text-gray-600">Welcome to your doctor dashboard.</p>

        {/* quick stats / placeholder */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            Patients
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
          <div className="p-4 border rounded">
            Appointments
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
          <div className="p-4 border rounded">
            Messages
            <br />
            <span className="text-xl font-semibold">--</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with layout
ClinicDashboard.getLayout = function PageLayout(page) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

export default ClinicDashboard;

