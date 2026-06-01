// pages/lead/dashboard.jsx
import React from 'react';
import AgentLayout from '../../../components/AgentLayout';
import withAgentAuth from '../../../components/withAgentAuth';

function AgentDashboard() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold">Hi, Agent!</h1>
        <p className="mt-3 text-sm text-gray-600">Welcome to your lead dashboard.</p>

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
AgentDashboard.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentDashboard = withAgentAuth(AgentDashboard);
ProtectedAgentDashboard.getLayout = AgentDashboard.getLayout;

export default ProtectedAgentDashboard;
