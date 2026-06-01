import React from "react";
import ContractsPage from "../staff/contract";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";

function ClinicContract() {
  return <ContractsPage />;
}

ClinicContract.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicContract = withClinicAuth(ClinicContract);
ProtectedClinicContract.getLayout = ClinicContract.getLayout;

export default ProtectedClinicContract;

