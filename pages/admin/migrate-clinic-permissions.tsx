'use client';
import React, { useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';

const MigratePermissionsPage: NextPageWithLayout = () => {
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [resultClinic, setResultClinic] = useState<any>(null);
  const [resultAgent, setResultAgent] = useState<any>(null);
  const [errorClinic, setErrorClinic] = useState<string | null>(null);
  const [errorAgent, setErrorAgent] = useState<string | null>(null);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const runClinicMigration = async () => {
    setLoadingClinic(true);
    setErrorClinic(null);
    setResultClinic(null);

    try {
      const { data } = await axios.post(
        '/api/admin/permissions/migrate-submodule-keys',
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (data.success) {
        setResultClinic(data);
      } else {
        setErrorClinic(data.message || 'Failed to run clinic migration');
      }
    } catch (err: any) {
      setErrorClinic(err.response?.data?.message || err.message || 'Failed to run clinic migration');
    } finally {
      setLoadingClinic(false);
    }
  };

  const runAgentMigration = async () => {
    setLoadingAgent(true);
    setErrorAgent(null);
    setResultAgent(null);

    try {
      const { data } = await axios.post(
        '/api/admin/permissions/migrate-agent-submodule-keys',
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (data.success) {
        setResultAgent(data);
      } else {
        setErrorAgent(data.message || 'Failed to run agent migration');
      }
    } catch (err: any) {
      setErrorAgent(err.response?.data?.message || err.message || 'Failed to run agent migration');
    } finally {
      setLoadingAgent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Migrate Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Add moduleKey to submodules in existing clinic and agent permissions</p>
        </div>

        {/* Clinic Permissions Migration */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clinic Permissions</h2>
            <p className="text-sm text-gray-700 mt-1">
              This migration will add a <code className="bg-gray-100 px-1 py-0.5 rounded">moduleKey</code> field 
              to each submodule in existing clinic permissions, using the navigation items as the source of truth.
            </p>
          </div>

          <button
            onClick={runClinicMigration}
            disabled={loadingClinic}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            {loadingClinic ? 'Running Clinic Migration...' : 'Run Clinic Migration'}
          </button>

          {errorClinic && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <strong>Error:</strong> {errorClinic}
            </div>
          )}

          {resultClinic && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <strong>Success!</strong> {resultClinic.message}
              <div className="mt-2">
                <p>Updated: {resultClinic.updated} permissions</p>
                <p>Total: {resultClinic.total} permissions</p>
              </div>
            </div>
          )}
        </div>

        {/* Agent Permissions Migration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Agent Permissions</h2>
            <p className="text-sm text-gray-700 mt-1">
              This migration will add a <code className="bg-gray-100 px-1 py-0.5 rounded">moduleKey</code> field 
              to each submodule in existing agent permissions, using the navigation items as the source of truth.
            </p>
          </div>

          <button
            onClick={runAgentMigration}
            disabled={loadingAgent}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            {loadingAgent ? 'Running Agent Migration...' : 'Run Agent Migration'}
          </button>

          {errorAgent && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <strong>Error:</strong> {errorAgent}
            </div>
          )}

          {resultAgent && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <strong>Success!</strong> {resultAgent.message}
              <div className="mt-2">
                <p>Updated: {resultAgent.updatedCount} permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MigratePermissionsPage.getLayout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;

const ProtectedMigratePermissionsPage: NextPageWithLayout = withAdminAuth(MigratePermissionsPage) as any;
ProtectedMigratePermissionsPage.getLayout = MigratePermissionsPage.getLayout;

export default ProtectedMigratePermissionsPage;
