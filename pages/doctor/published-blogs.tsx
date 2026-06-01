import React from "react";
import PublishedBlogs from "../../components/PublishedBlogs";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";

function DoctorPublishedBlogs() {
  return <PublishedBlogs tokenKey="doctorToken" />;
}

DoctorPublishedBlogs.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorPublishedBlogs: NextPageWithLayout =
  withDoctorAuth(DoctorPublishedBlogs);
ProtectedDoctorPublishedBlogs.getLayout = DoctorPublishedBlogs.getLayout;

export default ProtectedDoctorPublishedBlogs;
