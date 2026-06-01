"use client";
import React from 'react';
import ModernBlogForm from './BlogFormNew';
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app';

// Use the new modern blog form
function ClinicBlog() {
  return <ModernBlogForm />;
}

ClinicBlog.getLayout = function PageLayout(page: React.ReactNode) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedClinicBlog: NextPageWithLayout = withClinicAuth(ClinicBlog);
ProtectedClinicBlog.getLayout = ClinicBlog.getLayout;

export default ProtectedClinicBlog;
