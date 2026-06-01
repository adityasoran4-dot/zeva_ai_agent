import React from "react";
import AddService from "../staff/add-service";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';

function ClinicAddService() {
  return <AddService contextOverride="clinic" />;
}

ClinicAddService.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicAddService = withClinicAuth(ClinicAddService);
ProtectedClinicAddService.getLayout = ClinicAddService.getLayout;

export default ProtectedClinicAddService;

