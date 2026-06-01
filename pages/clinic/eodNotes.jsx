import React from "react";
import EodNotes from "../staff/eodNotes";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";

function ClinicEodNotes() {
  return <EodNotes />;
}

ClinicEodNotes.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicEodNotes = withClinicAuth(ClinicEodNotes);
ProtectedClinicEodNotes.getLayout = ClinicEodNotes.getLayout;

export default ProtectedClinicEodNotes;

