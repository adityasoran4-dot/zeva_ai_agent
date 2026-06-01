import React, { useState, useEffect } from 'react';
import AgentSidebar from './AgentSidebar';
import AgentHeader from './AgentHeader';

const AgentLayout = ({ children }: { children: React.ReactNode }) => {
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleToggleDesktop = () => {
    setIsDesktopHidden(prev => !prev);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(prev => !prev);
  };

  const handleCloseMobile = () => {
    setIsMobileOpen(false);
  };

  const handleItemClick = () => {
    setIsMobileOpen(false);
  };

  const getMainContentStyle = () => {
    if (!isDesktop) {
      return { marginLeft: '0', width: '100%' };
    }
    return {
      marginLeft: isDesktopHidden ? '0' : '256px',
      width: isDesktopHidden ? '100%' : 'calc(100% - 256px)'
    };
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" role="application">
      <AgentSidebar
        isDesktopHidden={isDesktopHidden}
        isMobileOpen={isMobileOpen}
        handleToggleDesktop={handleToggleDesktop}
        handleCloseMobile={handleCloseMobile}
        handleItemClick={handleItemClick}
      />

      <div 
        className="flex flex-col flex-1 h-screen overflow-hidden min-w-0 transition-all duration-300"
        style={getMainContentStyle()}
      >
        {/* Header - Visible on all screen sizes */}
        <div className="flex-shrink-0 z-10 bg-white sticky top-0">
          <AgentHeader
            handleToggleMobile={handleToggleMobile}
            isMobileOpen={isMobileOpen}
          />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AgentLayout;