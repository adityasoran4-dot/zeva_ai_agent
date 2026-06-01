import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { ClinicAllAppointmentsPageBase } from "../clinic/all-appointment";
import type { NextPageWithLayout } from "../_app";

const AgentClinicAllAppointmentPage = () => {
  return <ClinicAllAppointmentsPageBase contextOverride="agent" />;
};

AgentClinicAllAppointmentPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicAllAppointmentPage = withAgentAuth(AgentClinicAllAppointmentPage) as NextPageWithLayout;
ProtectedAgentClinicAllAppointmentPage.getLayout = AgentClinicAllAppointmentPage.getLayout;

export default ProtectedAgentClinicAllAppointmentPage;

