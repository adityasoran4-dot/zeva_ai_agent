import React from "react";
import GetAuthorCommentsAndLikes from "../../components/GetAuthorCommentsAndLikes";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";



function ClinicGetAuthorCommentsAndLikes() {
  return <GetAuthorCommentsAndLikes tokenKey="clinicToken" />;
}

ClinicGetAuthorCommentsAndLikes.getLayout = function PageLayout(
  page: React.ReactNode
) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicGetAuthorCommentsAndLikes: NextPageWithLayout =
  withClinicAuth(ClinicGetAuthorCommentsAndLikes);
ProtectedClinicGetAuthorCommentsAndLikes.getLayout =
  ClinicGetAuthorCommentsAndLikes.getLayout;

export default ProtectedClinicGetAuthorCommentsAndLikes;
