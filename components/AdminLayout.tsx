import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

interface NavItem {
  label: string;
  path?: string;
  icon?: any;
  children?: NavItem[];
}

const AdminLayout = ({
  children,
  hideSidebar = false,
  hideHeader = false,
}: AdminLayoutProps) => {
  const [sidebarItems, setSidebarItems] = useState<NavItem[]>([]);
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (hideSidebar && hideHeader) {
    return <>{children}</>;
  }

  const toggleDesktop = () => {
    setIsDesktopHidden(!isDesktopHidden);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50" role="application">
      {/* Sidebar */}
      {!hideSidebar && (
        <div className={`h-screen ${isMobileOpen ? 'fixed lg:sticky' : 'sticky'} top-0 z-50`}>
          <AdminSidebar 
            onItemsChange={setSidebarItems}
            externalIsDesktopHidden={isDesktopHidden}
            externalIsMobileOpen={isMobileOpen}
            onExternalToggleDesktop={toggleDesktop}
            onExternalToggleMobile={toggleMobile}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen max-h-screen relative" style={{ overflowX: 'visible', minWidth: 0 }}>
        {/* Header */}
        {!hideHeader && (
          <div className={`${isMobileOpen ? 'w-1/2 ml-auto' : 'w-full'} transition-all duration-300`}>
            <AdminHeader 
              sidebarItems={sidebarItems}
              isDesktopHidden={isDesktopHidden}
              isMobileOpen={isMobileOpen}
              onToggleDesktop={toggleDesktop}
              onToggleMobile={toggleMobile}
            />
          </div>
        )}

        {/* Page Content */}
        <main
          className={`flex-1 ${isMobileOpen ? 'w-1/2 ml-auto' : 'w-full'} transition-all duration-300 overflow-y-auto relative`}
          role="main"
        >
          {children}
        </main>

        {/* Mobile Overlay - Shows when mobile sidebar is open */}
        {!hideSidebar && isMobileOpen && (
          <div
            className="fixed inset-y-0 right-0 w-1/2 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleMobile}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
