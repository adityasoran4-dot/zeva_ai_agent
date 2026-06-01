import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { ClinicEnquiriesBase } from "../clinic/get-Enquiry";
import type { NextPageWithLayout } from "../_app";

const AgentClinicEnquiriesPage = () => {
  return <ClinicEnquiriesBase contextOverride="agent" />;
};

AgentClinicEnquiriesPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicEnquiriesPage = withAgentAuth(AgentClinicEnquiriesPage) as NextPageWithLayout;
ProtectedAgentClinicEnquiriesPage.getLayout = AgentClinicEnquiriesPage.getLayout;

export default ProtectedAgentClinicEnquiriesPage;

