import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { AssignedLeadsPageBase } from "../clinic/assigned-leads";
import type { NextPageWithLayout } from "../_app";

const AgentClinicAssignedLeadsPage = () => {
  // Type assertion needed because AssignedLeadsPageBase is from a JS file without TypeScript types
  return <AssignedLeadsPageBase contextOverride={"agent" as any} />;
};

AgentClinicAssignedLeadsPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicAssignedLeadsPage = withAgentAuth(AgentClinicAssignedLeadsPage) as NextPageWithLayout;
ProtectedAgentClinicAssignedLeadsPage.getLayout = AgentClinicAssignedLeadsPage.getLayout;

export default ProtectedAgentClinicAssignedLeadsPage;

