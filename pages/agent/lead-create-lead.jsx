import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { CreateLeadPageBase } from "../clinic/create-lead";

const AgentLeadCreateLeadPage = () => {
  return <CreateLeadPageBase />;
};

AgentLeadCreateLeadPage.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentLeadCreateLeadPage = withAgentAuth(AgentLeadCreateLeadPage);
ProtectedAgentLeadCreateLeadPage.getLayout = AgentLeadCreateLeadPage.getLayout;

export default ProtectedAgentLeadCreateLeadPage;

