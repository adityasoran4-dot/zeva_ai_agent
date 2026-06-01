import React from "react";
import GetAuthorCommentsAndLikes from "../../components/GetAuthorCommentsAndLikes";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";

function DoctorGetAuthorCommentsAndLikes() {
  return <GetAuthorCommentsAndLikes tokenKey="doctorToken" />;
}

DoctorGetAuthorCommentsAndLikes.getLayout = function PageLayout(
  page: React.ReactNode
) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorGetAuthorCommentsAndLikes: NextPageWithLayout =
  withDoctorAuth(DoctorGetAuthorCommentsAndLikes);
ProtectedDoctorGetAuthorCommentsAndLikes.getLayout =
  DoctorGetAuthorCommentsAndLikes.getLayout;

export default ProtectedDoctorGetAuthorCommentsAndLikes;
