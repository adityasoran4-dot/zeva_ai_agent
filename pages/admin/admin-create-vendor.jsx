import React from "react";
import VendorForm from "../../components/VendorForm";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";

function AdminCreateVendor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <VendorForm />
      </div>
    </div>
  );
}

AdminCreateVendor.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminCreateVendor);
ProtectedDashboard.getLayout = AdminCreateVendor.getLayout;

export default ProtectedDashboard;
