import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { CreateAgentPageBase } from "../clinic/create-agent";

const AgentLeadCreateAgentPage = () => {
  return <CreateAgentPageBase />;
};

AgentLeadCreateAgentPage.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentLeadCreateAgentPage = withAgentAuth(AgentLeadCreateAgentPage);
ProtectedAgentLeadCreateAgentPage.getLayout = AgentLeadCreateAgentPage.getLayout;

export default ProtectedAgentLeadCreateAgentPage;

