import React from 'react';
import AdminSidebar from './StaffSidebar';
import AdminHeader from './StaffHeader';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100" role="application">
      {/* Sidebar - StaffSidebar manages its own mobile state */}
      <div className="h-screen sticky top-0 z-50">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen max-h-screen" style={{ overflowX: 'visible', minWidth: 0 }}>
        {/* Header - Hidden on mobile when sidebar might be open */}
        <div className="sticky top-0 z-10 hidden lg:block">
          <AdminHeader />
        </div>

        {/* Page Content */}
        <main 
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8" 
          role="main"
          style={{ 
            overflowX: 'visible',
            minWidth: 0,
            width: '100%'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
