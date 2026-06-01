import React from 'react';
import BlogEditor from '../../components/createBlog';
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';
import type { NextPageWithLayout } from '../_app';

function DoctorBlog() {
  return <BlogEditor tokenKey="doctorToken" />;
}

DoctorBlog.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorBlog: NextPageWithLayout = withDoctorAuth(DoctorBlog);
ProtectedDoctorBlog.getLayout = DoctorBlog.getLayout;

export default ProtectedDoctorBlog;