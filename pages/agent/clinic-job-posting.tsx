import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { ClinicJobPostingPageBase } from "../clinic/job-posting";
import type { NextPageWithLayout } from "../_app";

const AgentClinicJobPostingPage = () => {
  return <ClinicJobPostingPageBase contextOverride="agent" />;
};

AgentClinicJobPostingPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicJobPostingPage = withAgentAuth(AgentClinicJobPostingPage) as NextPageWithLayout;
ProtectedAgentClinicJobPostingPage.getLayout = AgentClinicJobPostingPage.getLayout;

export default ProtectedAgentClinicJobPostingPage;

