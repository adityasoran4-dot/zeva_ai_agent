import React, { useState } from 'react';
import ClinicSidebar from './ClinicSidebar';
import ClinicHeader from './ClinicHeader';

interface ClinicLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

const ClinicLayout = ({ children, hideSidebar = false, hideHeader = false }: ClinicLayoutProps) => {
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleDesktop = () => {
    setIsDesktopHidden(!isDesktopHidden);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // If both sidebar and header are hidden, render children directly without layout wrapper
  if (hideSidebar && hideHeader) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50" role="application">
      {/* Mobile Overlay - Shows when mobile sidebar is open */}
      {!hideSidebar && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] lg:hidden"
          onClick={handleToggleMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - ClinicSidebar with external state */}
      {!hideSidebar && (
        <div className={`h-screen ${isMobileOpen ? 'fixed lg:sticky' : 'sticky'} top-0 z-[100]`}>
          <ClinicSidebar 
            externalIsDesktopHidden={isDesktopHidden}
            externalIsMobileOpen={isMobileOpen}
            onExternalToggleDesktop={handleToggleDesktop}
            onExternalToggleMobile={handleToggleMobile}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen max-h-screen relative" style={{ overflowX: 'hidden', minWidth: 0 }}>
        {/* Header - Visible on both mobile and desktop */}
        {!hideHeader && (
          <div className="w-full transition-all duration-300">
            <ClinicHeader 
              handleToggleDesktop={handleToggleDesktop}
              handleToggleMobile={handleToggleMobile}
              isDesktopHidden={isDesktopHidden}
              isMobileOpen={isMobileOpen}
            />
          </div>
        )}

        {/* Page Content */}
        <main 
          className="flex-1 w-full transition-all duration-300" 
          role="main" 
          style={{ 
            overflowY: 'auto', 
            overflowX: 'hidden',
            minWidth: 0
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClinicLayout;
