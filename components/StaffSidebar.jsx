import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { jwtDecode } from "jwt-decode";


const Sidebar = () => {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [cancelledClaims, setCancelledClaims] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role); // "staff" or "doctor"
    }
  }, []);

  // Fetch cancelled advance claims count for doctorStaff
  const fetchCancelledClaimsCount = async () => {
    if (role !== "doctorStaff") return;
    
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch('/api/staff/cancelled-claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCancelledClaims(data.data || []);
      } else {
        console.error('Failed to fetch cancelled claims count');
      }
    } catch (error) {
      console.error('Error fetching cancelled claims count:', error);
    }
  };

  // Fetch cancelled claims count when role is doctorStaff
  useEffect(() => {
    if (role === "doctorStaff") {
      fetchCancelledClaimsCount();
    }
  }, [role]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  let navItems = [];

  if (role === "staff") {
    navItems = [
      { 
        label: "Dashboard", 
        path: "/staff/staff-dashboard", 
        icon: "🏠", 
        description: "Overview & analytics" 
      },
      { 
        label: "Add Service", 
        path: "/staff/add-service", 
        icon: "➕", 
        description: "Add package/treatment" 
      },
      { 
        label: "Patient Registration", 
        path: "/staff/patient-registration", 
        icon: "🧍‍♂️", 
        description: "Manage Clinic" 
      },
      { 
        label: "Patient Information", 
        path: "/staff/patient-information", 
        icon: "📋", 
        description: "Manage Clinic" 
      },
      { 
        label: "Add EOD Task", 
        path: "/staff/eodNotes", 
        icon: "✅", 
        description: "Manage Clinic" 
      },
      { 
        label: "Add Expense", 
        path: "/staff/AddPettyCashForm", 
        icon: "💸", 
        description: "Add Petty Cash Entry" 
      },
       { 
        label: " Add Vendor", 
        path: "/staff/add-vendor", 
        icon: "🧑‍💼", 
        description: "Manage vendor" 
      },
      { 
        label: "Membership", 
        path: "/staff/membership", 
        icon: "🧑‍💼", 
        description: "Manage Membership" 
      },
      { 
        label: "All Contracts", 
        path: "/staff/contract", 
        icon: "🧑‍💼", 
        description: "See all contracts" 
      },
      
    ];
  }

  if (role === "doctorStaff") {
    navItems = [
      { 
        label: "Dashboard", 
        path: "/staff/staff-dashboard", 
        icon: "🏠", 
        description: "Doctor Overview & Appointments" 
      },
      { 
        label: "Booked Appointments", 
        path: "/staff/booked-appointments", 
        icon: "📅", 
        description: "View your schedule" 
      },
      { 
        label: "Pending Claims", 
        path: "/staff/pending-claims", 
        icon: "🧑‍⚕️", 
        description: "View & Manage Patients" 
      },
      {
        label: "Add Treatment", 
        path: "/staff/add-treatment", 
        icon: "➕", 
        description: "Manage doctor treatments" 
      },
      { 
        label: "EOD Notes", 
        path: "/staff/eodNotes", 
        icon: "📝", 
        description: "End of Day Notes" 
      },
      { 
        label: "Cancelled Claims", 
        path: "/staff/cancelled-claims", 
        icon: "❌", 
        description: `View Cancelled Claims (${cancelledClaims.length})`,
        badge: cancelledClaims.length > 0 ? cancelledClaims.length : null
      },
      
      
    ];
  }

  const handleToggleDesktop = () => {
    setIsDesktopHidden(!isDesktopHidden);
  };

  const handleToggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleCloseMobile = () => {
    setIsMobileOpen(false);
  };

  const handleItemClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={handleToggleMobile}
        className={clsx(
          "fixed top-4 left-4 z-[100] bg-white text-[#2D9AA5] p-3 rounded-lg shadow-lg transition-all duration-300 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 lg:hidden touch-manipulation",
          {
            'block': !isMobileOpen,
            'hidden': isMobileOpen
          }
        )}
        aria-label="Open mobile menu"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop Toggle Button */}
      <button
        onClick={handleToggleDesktop}
        className={clsx(
          "fixed top-4 left-4 z-[60] bg-white text-[#2D9AA5] p-3 rounded-lg shadow-lg transition-all duration-300 border border-gray-200 hidden lg:block",
          {
            'lg:block': isDesktopHidden,
            'lg:hidden': !isDesktopHidden
          }
        )}
        aria-label="Toggle desktop sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={clsx(
        'transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-sm flex-col min-h-screen w-72 hidden lg:flex',
        {
          'lg:flex': !isDesktopHidden,
          'lg:hidden': isDesktopHidden
        }
      )} style={{ height: '100vh' }}>

        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="p-6 border-b border-gray-100 flex-shrink-0 relative">
            <Link href="/staff/staff-dashboard">
              <div className="group cursor-pointer">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 group-hover:bg-[#2D9AA5]/5 transition-all duration-300 border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xl text-gray-900 block">ZEVA</span>
                    <span className="text-sm text-[#2D9AA5] font-medium">Staff Dashboard</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Close Button */}
            <button
              onClick={handleToggleDesktop}
              className="absolute right-6 top-6 bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-all duration-300"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 min-h-0">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
              Staff Management
            </div>
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = router.pathname === item.path;
                const isHovered = hoveredItem === item.path;

                // Regular navigation items
                return (
                  <Link key={`${item.path}-${index}`} href={item.path}>
                    <div
                      className={clsx(
                        'group relative block rounded-lg transition-all duration-200 cursor-pointer p-3',
                        {
                          'bg-[#2D9AA5] text-white shadow-sm': isActive,
                          'hover:bg-gray-50 text-gray-700 hover:text-gray-900': !isActive,
                        }
                      )}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}

                      <div className="flex items-center space-x-3">
                        <div className={clsx(
                          'text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0',
                          {
                            'bg-white/20 text-white': isActive,
                            'text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10': !isActive
                          }
                        )}>
                          {item.icon}
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            'font-medium text-sm transition-colors duration-200 truncate',
                            {
                              'text-white': isActive,
                              'text-gray-900 group-hover:text-gray-900': !isActive
                            }
                          )}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className={clsx(
                              'text-xs mt-0.5 transition-all duration-200 truncate',
                              {
                                'text-white/80': isActive,
                                'text-gray-500 group-hover:text-gray-600': !isActive
                              }
                            )}>
                              {item.description}
                            </div>
                          )}
                        </div>

                        <div className={clsx(
                          'transition-all duration-200 flex-shrink-0',
                          {
                            'opacity-100 transform translate-x-0': isActive || isHovered,
                            'opacity-0 transform -translate-x-1': !isActive && !isHovered
                          }
                        )}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out',
        {
          'translate-x-0': isMobileOpen,
          '-translate-x-full': !isMobileOpen,
        }
      )}>
        <aside className="w-full max-w-xs h-full bg-white shadow-xl border-r border-gray-200 flex flex-col">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-100 relative flex-shrink-0">
              <button
                onClick={handleCloseMobile}
                className="absolute right-4 top-4 bg-gray-100 text-gray-600 p-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 z-10 touch-manipulation"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="pr-16">
                <Link href="/staff/staff-dashboard" onClick={handleItemClick}>
                  <div className="group cursor-pointer">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group-hover:bg-[#2D9AA5]/5 transition-all duration-300 border border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-lg text-gray-900 block">ZEVA</span>
                        <span className="text-xs text-[#2D9AA5] font-medium">Staff Dashboard</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
                Staff Management
              </div>

              <div className="space-y-1">
                {navItems.map((item, index) => {
                  const isActive = router.pathname === item.path;

                  // Regular navigation items for mobile
                  return (
                    <Link key={`${item.path}-${index}`} href={item.path}>
                      <div
                        className={clsx(
                          'group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98',
                          {
                            'bg-[#2D9AA5] text-white shadow-sm': isActive,
                            'hover:bg-gray-50 text-gray-700 active:bg-gray-100': !isActive,
                          }
                        )}
                        onClick={handleItemClick}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                        )}

                        <div className="flex items-center space-x-3">
                          <div className={clsx(
                            'text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0',
                            {
                              'bg-white/20 text-white': isActive,
                              'text-gray-500 group-hover:text-[#2D9AA5] group-hover:bg-[#2D9AA5]/10': !isActive
                            }
                          )}>
                            {item.icon}
                            {item.badge && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className={clsx(
                              'font-medium text-sm transition-colors duration-200 truncate',
                              {
                                'text-white': isActive,
                                'text-gray-900': !isActive
                              }
                            )}>
                              {item.label}
                            </div>
                            {item.description && (
                              <div className={clsx(
                                'text-xs mt-0.5 transition-all duration-200 truncate',
                                {
                                  'text-white/80': isActive,
                                  'text-gray-500': !isActive
                                }
                              )}>
                                {item.description}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 opacity-60">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;