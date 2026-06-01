import { useState, FormEvent } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth'; 
import type { NextPageWithLayout } from '../_app';

const RegisterClinic = () => {
  const [clinicName, setClinicName] = useState('');
  const [location, setLocation] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Clinic Registered:', { clinicName, location });
    setSuccess('Clinic registered successfully!');
    setClinicName('');
    setLocation('');
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <>
      <Head>
        <title>Register Clinic - Placement Institute</title>
      </Head>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Register New Clinic</h1>
        <p className="text-gray-600">Fill in the form below to register a new clinic.</p>

        {success && (
          <div className="rounded-md bg-green-100 p-4 text-green-700 shadow">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md max-w-lg">
          <div>
            <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
              Clinic Name
            </label>
            <input
              id="clinicName"
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Register Clinic
          </button>
        </form>
      </div>
    </>
  );
};

RegisterClinic.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withAdminAuth(RegisterClinic);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = RegisterClinic.getLayout;

export default ProtectedDashboard;
