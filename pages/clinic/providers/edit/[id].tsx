import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement } from "react";

const ProvidersEditPage: NextPageWithLayout = () => {
  return <div>Providers edit page</div>;
};

// Layout configuration
ProvidersEditPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedProvidersEditPage = withClinicAuth(
  ProvidersEditPage,
) as NextPageWithLayout;
ProtectedProvidersEditPage.getLayout = ProvidersEditPage.getLayout;

export default ProvidersEditPage;
