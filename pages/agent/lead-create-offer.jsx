import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { CreateOfferPageBase } from "../clinic/create-offer";

const AgentLeadCreateOfferPage = () => {
  return <CreateOfferPageBase />;
};

AgentLeadCreateOfferPage.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentLeadCreateOfferPage = withAgentAuth(AgentLeadCreateOfferPage);
ProtectedAgentLeadCreateOfferPage.getLayout = AgentLeadCreateOfferPage.getLayout;

export default ProtectedAgentLeadCreateOfferPage;

