import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppointmentPageBase } = require("../clinic/appointment");
import type { NextPageWithLayout } from "../_app";

const AgentClinicAppointmentPage = () => {
  return <AppointmentPageBase contextOverride="agent" />;
};

AgentClinicAppointmentPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicAppointmentPage = withAgentAuth(AgentClinicAppointmentPage) as NextPageWithLayout;
ProtectedAgentClinicAppointmentPage.getLayout = AgentClinicAppointmentPage.getLayout;

export default ProtectedAgentClinicAppointmentPage;

