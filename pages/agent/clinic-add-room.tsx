import React from "react";
import AgentLayout from "../../components/AgentLayout";
import withAgentAuth from "../../components/withAgentAuth";
import { AddRoomPageBase } from "../clinic/add-room";
import type { NextPageWithLayout } from "../_app";

const AgentClinicAddRoomPage = () => {
  // Type assertion needed because AddRoomPageBase is from a JS file without TypeScript types
  return <AddRoomPageBase contextOverride={"agent" as any} />;
};

AgentClinicAddRoomPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentClinicAddRoomPage = withAgentAuth(AgentClinicAddRoomPage) as NextPageWithLayout;
ProtectedAgentClinicAddRoomPage.getLayout = AgentClinicAddRoomPage.getLayout;

export default ProtectedAgentClinicAddRoomPage;

