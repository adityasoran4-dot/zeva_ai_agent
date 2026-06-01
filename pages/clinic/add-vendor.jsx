import React from "react";
import AddVendor from "../staff/add-vendor";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";

function ClinicAddVendor() {
  return <AddVendor />;
}

ClinicAddVendor.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicAddVendor = withClinicAuth(ClinicAddVendor);
ProtectedClinicAddVendor.getLayout = ClinicAddVendor.getLayout;

export default ProtectedClinicAddVendor;

