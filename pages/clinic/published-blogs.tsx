import React from "react";
import PublishedBlogs from "../../components/PublishedBlogs";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

function ClinicPublishedBlogs() {
  return <PublishedBlogs tokenKey="clinicToken" />;
}

ClinicPublishedBlogs.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicPublishedBlogs: NextPageWithLayout =
  withClinicAuth(ClinicPublishedBlogs);
ProtectedClinicPublishedBlogs.getLayout = ClinicPublishedBlogs.getLayout;

export default ProtectedClinicPublishedBlogs;
