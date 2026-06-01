'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CreateAgentModal from '../../components/CreateAgentModal';
import AgentPermissionModal from '../../components/AgentPermissionModal';
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';
import type { NextPageWithLayout } from '../_app';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  declined: boolean;
  role?: string;
}

const ManageAgentsPage: NextPageWithLayout = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [doctorStaff, setDoctorStaff] = useState<Agent[]>([]);
  const [activeView, setActiveView] = useState<'agents' | 'doctorStaff'>('agents');
  const [menuAgentId, setMenuAgentId] = useState<string | null>(null);
  const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
  const [permissionAgent, setPermissionAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Get the appropriate token based on what's available (doctor > admin)
  // This ensures we use the correct token for the logged-in user
  const doctorToken = typeof window !== 'undefined' ? localStorage.getItem('doctorToken') : null;
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  
  // Determine which token to use based on what's available
  // Priority: doctorToken > adminToken
  const token = doctorToken || adminToken;

  async function loadAgents() {
    try {
      const { data } = await axios.get('/api/lead-ms/get-agents?role=agent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setAgents(data.agents);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDoctorStaff() {
    try {
      const { data } = await axios.get('/api/lead-ms/get-agents?role=doctorStaff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setDoctorStaff(data.agents);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAll() {
    await Promise.all([loadAgents(), loadDoctorStaff()]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAction(agentId: string, action: string) {
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        } else {
          setAgents((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordAgent) return;
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId: passwordAgent._id, action: 'resetPassword', newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        } else {
          setAgents((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        }
        setPasswordAgent(null);
        setNewPassword('');
        setConfirmPassword('');
        setMenuAgentId(null);
        alert('Password updated');
      } else {
        alert(data?.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reset password');
    }
  }

  const currentList = activeView === 'agents' ? agents : doctorStaff;
  const totalAgents = agents.length;
  const approvedAgents = agents.filter((a: Agent) => a.isApproved).length;
  const declinedAgents = agents.filter((a: Agent) => a.declined).length;
  const totalDoctorStaff = doctorStaff.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Agent management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create and manage agent accounts</p>
        </div>

        {/* Toggle Slider - Subtle integration */}
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveView('agents')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeView === 'agents'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Agents ({totalAgents})
            </button>
            <button
              onClick={() => setActiveView('doctorStaff')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeView === 'doctorStaff'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Doctor Staff ({totalDoctorStaff})
            </button>
          </div>
        </div>

        {/* Stats + Create Button */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Total agents</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{totalAgents}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Approved</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">{approvedAgents}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Declined</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">{declinedAgents}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-end">
              <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors w-full sm:w-auto shadow-sm">
                + Create agent
              </button>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Agents</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Approve, decline and update password</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Agent Name',
                    'Email Address',
                    'Phone Number',
                    'Status',
                    'Actions',
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-300 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-900">No agents found</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Create your first agent to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentList.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center text-[11px] font-semibold shadow-sm">
                            {agent.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-medium text-gray-900">
                              {agent.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-600">
                        {agent.email}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-600">
                        {agent.phone || '-'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            agent.declined
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : agent.isApproved
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}
                        >
                          {agent.declined
                            ? 'Declined'
                            : agent.isApproved
                            ? 'Approved'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-medium relative">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleAction(agent._id, 'approve')}
                            disabled={agent.isApproved}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                              agent.isApproved
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(agent._id, 'decline')}
                            disabled={agent.declined}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                              agent.declined
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            Decline
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuAgentId(menuAgentId === agent._id ? null : agent._id)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200 transition-colors"
                              aria-label="More actions"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                              </svg>
                            </button>
                            {menuAgentId === agent._id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                <button
                                  className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 transition-colors"
                                  onClick={() => {
                                    setPasswordAgent(agent);
                                    setMenuAgentId(null);
                                  }}
                                >
                                  Change password
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 transition-colors border-t border-gray-200"
                                  onClick={() => {
                                    setPermissionAgent(agent);
                                    setMenuAgentId(null);
                                  }}
                                >
                                  Rights
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadAll}
        token={undefined}
        doctorToken={doctorToken || undefined}
        adminToken={adminToken || undefined}
        defaultRole={activeView === 'doctorStaff' ? 'doctorStaff' : 'agent'}
      />

      {/* Agent Permission Modal */}
      {permissionAgent && (
        <AgentPermissionModal
          isOpen={!!permissionAgent}
          onClose={() => setPermissionAgent(null)}
          agentId={permissionAgent._id}
          agentName={permissionAgent.name}
          token={token || null}
          userRole="doctor"
        />
      )}

      {/* Change Password Modal */}
      {passwordAgent && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-xl">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Change password</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{passwordAgent.name} • {passwordAgent.email}</p>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-5">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors"
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setPasswordAgent(null); setNewPassword(''); setConfirmPassword(''); }}
                  className="px-3.5 py-2 rounded-md border border-gray-300 text-[11px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-medium rounded-md transition-colors shadow-sm"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Apply Layout
ManageAgentsPage.getLayout = (page: React.ReactNode) => <DoctorLayout>{page}</DoctorLayout>;

// Preserve layout on wrapped component
const ProtectedManageAgentsPage: NextPageWithLayout = withDoctorAuth(ManageAgentsPage) as any;
ProtectedManageAgentsPage.getLayout = ManageAgentsPage.getLayout;

export default ProtectedManageAgentsPage;

