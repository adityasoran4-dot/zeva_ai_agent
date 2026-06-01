import React from "react";
import MembershipPage from "../staff/membership";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";

function ClinicMembership() {
  return <MembershipPage />;
}

ClinicMembership.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicMembership = withClinicAuth(ClinicMembership);
ProtectedClinicMembership.getLayout = ClinicMembership.getLayout;

export default ProtectedClinicMembership;

