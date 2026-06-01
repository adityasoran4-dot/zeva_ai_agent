import React, { useState } from 'react';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeader from './DoctorHeader';

interface DoctorLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

const DoctorLayout = ({ children, hideSidebar = false, hideHeader = false }: DoctorLayoutProps) => {
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleDesktop = () => {
    setIsDesktopHidden(!isDesktopHidden);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Intentionally unused - reserved for future use or external component handlers
  const handleCloseMobile = () => {
    setIsMobileOpen(false);
  };

  // Intentionally unused - reserved for future use or external component handlers
  const handleItemClick = () => {
    setIsMobileOpen(false);
  };

  // Reference unused functions to satisfy TypeScript (reserved for future use)
  void handleCloseMobile;
  void handleItemClick;

  // If both sidebar and header are hidden, render children directly without layout wrapper
  if (hideSidebar && hideHeader) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100" role="application">
      {/* Sidebar - DoctorSidebar with external state */}
      {!hideSidebar && (
        <div className="fixed lg:sticky top-0 left-0 z-50 h-screen">
          <DoctorSidebar
            externalIsDesktopHidden={isDesktopHidden}
            externalIsMobileOpen={isMobileOpen}
            onExternalToggleDesktop={handleToggleDesktop}
            onExternalToggleMobile={handleToggleMobile}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-0" style={{ overflowX: 'visible', minWidth: 0 }}>
        {/* Header - Visible on both mobile and desktop */}
        {!hideHeader && (
          <div className="sticky top-0 z-40">
            <DoctorHeader
              handleToggleDesktop={handleToggleDesktop}
              handleToggleMobile={handleToggleMobile}
              isDesktopHidden={isDesktopHidden}
              isMobileOpen={isMobileOpen}
            />
          </div>
        )}

        {/* Page Content */}
        <main 
          className="flex-1 overflow-y-auto relative" 
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

export default DoctorLayout;