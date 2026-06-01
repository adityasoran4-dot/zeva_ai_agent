import React from "react";
import AddPettyCashForm from "../staff/AddPettyCashForm";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';

function ClinicAddPettyCashForm() {
  return <AddPettyCashForm />;
}

ClinicAddPettyCashForm.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicAddPettyCashForm = withClinicAuth(ClinicAddPettyCashForm);
ProtectedClinicAddPettyCashForm.getLayout = ClinicAddPettyCashForm.getLayout;

export default ProtectedClinicAddPettyCashForm;

