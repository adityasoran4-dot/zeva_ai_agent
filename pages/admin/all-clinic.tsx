import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { useSearch } from '../../context/SearchContext';
import withAdminAuth from '../../components/withAdminAuth'; 
import type { NextPageWithLayout } from '../_app';

const allClinics = [
  { id: 1, name: 'Green Leaf Ayurveda', description: 'Specialized in herbal treatments.' },
  { id: 2, name: 'Holistic Health Hub', description: 'Focus on holistic body healing.' },
  { id: 3, name: 'Nature Cure Center', description: 'Natural therapies and detox.' },
];

const AllClinics = () => {
  const { searchTerm } = useSearch();

  const filtered = allClinics.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>All Clinics - Placement Institute</title>
      </Head>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">All Clinics</h1>
        <p className="text-gray-600">View a list of all registered clinics.</p>

        {searchTerm && (
          <div
            className={`p-3 rounded-md text-sm font-medium ${
              filtered.length > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {filtered.length > 0
              ? `${filtered.length} result(s) found for "${searchTerm}" in All Clinics.`
              : `No results found for "${searchTerm}" in All Clinics.`}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Clinic Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="px-6 py-4 text-gray-800">{clinic.name}</td>
                  <td className="px-6 py-4 text-gray-600">{clinic.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

AllClinics.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AllClinics);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = AllClinics.getLayout;

export default ProtectedDashboard;


