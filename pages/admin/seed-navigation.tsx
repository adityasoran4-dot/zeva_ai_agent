'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';

interface NavigationItem {
  _id?: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: number;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

const SeedNavigationPage: NextPageWithLayout = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [role, setRole] = useState<'admin' | 'clinic' | 'doctor'>('admin');

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const fetchNavigationItems = async (selectedRole: string) => {
    setFetching(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/navigation/get-by-role?role=${selectedRole}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) {
        setNavigationItems(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch navigation items');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch navigation items');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (adminToken && role) {
      fetchNavigationItems(role);
    }
  }, [role, adminToken]);

  const seedNavigation = async (selectedRole: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await axios.post(
        '/api/navigation/seed-by-role',
        { role: selectedRole },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (data.success) {
        setResult(data);
        // Refresh the list after seeding
        await fetchNavigationItems(selectedRole);
      } else {
        setError(data.message || 'Failed to seed navigation items');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to seed navigation items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Seed Navigation Items</h1>
          <p className="text-sm text-gray-500 mt-1">View and seed sidebar navigation options by role</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
          <div className="flex gap-3">
            {(['admin', 'clinic', 'doctor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  role === r
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{role.charAt(0).toUpperCase() + role.slice(1)} Navigation Items</h2>
              <p className="text-sm text-gray-500 mt-1">
                {navigationItems.length > 0 
                  ? `Found ${navigationItems.length} navigation items` 
                  : 'No navigation items found. Click "Seed Navigation Items" to create them.'}
              </p>
            </div>
            <button
              onClick={() => seedNavigation(role)}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
            >
              {loading ? 'Seeding...' : 'Seed Navigation Items'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Message */}
        {result && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <strong>Success:</strong> {result.message}
            {result.count && (
              <div className="mt-2">
                <p>Created {result.count} navigation items</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Navigation Items</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">All sidebar options for {role} role</p>
          </div>

          {fetching ? (
            <div className="px-5 py-12 text-center text-gray-500">
              <p>Loading navigation items...</p>
            </div>
          ) : navigationItems.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500">
              <p className="text-sm font-medium text-gray-900">No navigation items found</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "Seed Navigation Items" to create navigation items for this role
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {navigationItems.map((item, idx) => (
                <div key={item._id || idx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl mt-1">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                          {item.badge && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                        {item.path && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{item.path}</p>
                        )}
                        {item.subModules && item.subModules.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1">Sub-modules:</p>
                            {item.subModules.map((sub, subIdx) => (
                              <div key={subIdx} className="text-xs text-gray-500 mb-1">
                                <span className="mr-2">{sub.icon}</span>
                                <span>{sub.name}</span>
                                {sub.path && <span className="ml-2 text-gray-400 font-mono">({sub.path})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-xs text-gray-400">Order: {item.order}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

SeedNavigationPage.getLayout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;

const ProtectedSeedNavigationPage: NextPageWithLayout = withAdminAuth(SeedNavigationPage) as any;
ProtectedSeedNavigationPage.getLayout = SeedNavigationPage.getLayout;

export default ProtectedSeedNavigationPage;

