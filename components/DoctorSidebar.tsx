import React, { useState, useEffect, FC } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import axios from "axios";
import { Menu } from "lucide-react";

interface NavItem {
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: string | number;
  order?: number;
  moduleKey?: string;
  children?: NavItem[];
}

interface NavigationItemFromAPI {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface DoctorSidebarProps {
  className?: string;
  externalIsDesktopHidden?: boolean;
  externalIsMobileOpen?: boolean;
  onExternalToggleDesktop?: () => void;
  onExternalToggleMobile?: () => void;
}

const DoctorSidebar: FC<DoctorSidebarProps> = ({
  className,
  externalIsDesktopHidden,
  externalIsMobileOpen,
  onExternalToggleDesktop,
  onExternalToggleMobile,
}) => {
  const router = useRouter();
  const [internalIsDesktopHidden, setInternalIsDesktopHidden] = useState(false);
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isDesktopHidden = externalIsDesktopHidden !== undefined ? externalIsDesktopHidden : internalIsDesktopHidden;
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalIsMobileOpen;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch navigation items and permissions
  useEffect(() => {
    const fetchNavigationAndPermissions = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('doctorToken') : null;
        if (!token) {
          setNavigationItems([]);
          setIsLoading(false);
          return;
        }

        const res = await axios.get("/api/doctor/sidebar-permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          // Convert API navigation items to NavItem format
          const convertedItems: NavItem[] = (res.data.navigationItems || []).map((item: NavigationItemFromAPI): NavItem => {
            const navItem: NavItem = {
              label: item.label,
              path: item.path,
              icon: item.icon,
              description: item.description,
              moduleKey: item.moduleKey,
              order: item.order,
            };

            // Convert subModules to children
            if (item.subModules && item.subModules.length > 0) {
              navItem.children = item.subModules.map((subModule: { name: string; path?: string; icon: string; order: number }): NavItem => ({
                label: subModule.name,
                path: subModule.path,
                icon: subModule.icon,
                description: subModule.name,
                order: subModule.order,
              }));
            }

            return navItem;
          });

          // Sort by order
          convertedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          convertedItems.forEach(item => {
            if (item.children) {
              item.children.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
          });

          setNavigationItems(convertedItems);
        } else {
          console.error("Error fetching navigation items:", res.data.message);
          setNavigationItems([]);
        }
      } catch (err: any) {
        console.error("Error fetching navigation items and permissions:", err);
        setNavigationItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigationAndPermissions();

    // Re-fetch on route changes to ensure permissions are always up-to-date
    const handleRouteChange = () => {
      fetchNavigationAndPermissions();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        if (onExternalToggleMobile && externalIsMobileOpen) {
          onExternalToggleMobile(); // Toggle to close
        } else {
          setInternalIsMobileOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, onExternalToggleMobile, externalIsMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const handleToggleDesktop = () => {
    if (onExternalToggleDesktop && externalIsDesktopHidden !== undefined) {
      onExternalToggleDesktop();
    } else {
      setInternalIsDesktopHidden(!isDesktopHidden);
    }
  };

  const handleToggleMobile = () => {
    if (onExternalToggleMobile && externalIsMobileOpen !== undefined) {
      onExternalToggleMobile();
    } else {
      setInternalIsMobileOpen(!isMobileOpen);
    }
  };

  const handleCloseMobile = () => {
    if (onExternalToggleMobile && externalIsMobileOpen) {
      onExternalToggleMobile(); // Toggle to close
    } else {
      setInternalIsMobileOpen(false);
    }
  };

  const handleItemClick = () => {
    if (onExternalToggleMobile && externalIsMobileOpen) {
      onExternalToggleMobile(); // Toggle to close
    } else {
      setInternalIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button - Only shows when sidebar is closed and no external state */}
      {(!onExternalToggleMobile || externalIsMobileOpen === undefined) && (
        <button
          onClick={handleToggleMobile}
          className={clsx(
            "fixed top-4 left-4 z-[100] bg-white text-[#2D9AA5] p-3 rounded-lg shadow-lg transition-all duration-200 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 lg:hidden touch-manipulation",
            {
              block: !isMobileOpen,
              hidden: isMobileOpen,
            }
          )}
          aria-label="Open mobile menu"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Desktop Toggle Button - Only shows when no external state */}
      {(!onExternalToggleDesktop || externalIsDesktopHidden === undefined) && (
        <button
          onClick={handleToggleDesktop}
          className={clsx(
            "fixed top-4 left-4 z-[60] bg-white text-[#2D9AA5] p-2.5 rounded-lg shadow-md transition-all duration-200 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hidden lg:block",
            {
              "lg:block": isDesktopHidden,
              "lg:hidden": !isDesktopHidden,
            }
          )}
          aria-label="Toggle desktop sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Toggle Button - Shows when sidebar is hidden */}
      {isDesktopHidden && (
        <button
          onClick={handleToggleDesktop}
          className="fixed top-3 left-3 z-[100] bg-white text-[#2D9AA5] p-1.5 rounded-lg shadow-md transition-all duration-200 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hidden lg:flex items-center justify-center"
          aria-label="Toggle desktop sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Overlay - Covers entire screen when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex-col min-h-screen w-64 hidden lg:flex",
          {
            "lg:flex": !isDesktopHidden,
            "lg:hidden": isDesktopHidden,
          },
          className
        )}
        style={{ height: "100vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
            <div className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-all duration-200 border border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <span className="font-bold text-base text-gray-900 block">ZEVA</span>
                <span className="text-xs text-[#2D9AA5] font-medium">Doctor Portal</span>
              </div>
            </div>

            {/* Desktop Close Button */}
            <button
              onClick={handleToggleDesktop}
              className="absolute right-4 top-4 bg-gray-100 text-gray-700 p-1.5 rounded-md hover:bg-gray-200 transition-all duration-200"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 min-h-0">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
              Doctor Management
            </div>

            {isLoading ? (
              <div className="text-xs text-gray-500 px-2">Loading menu…</div>
            ) : (
              <div className="space-y-1">
                {navigationItems.map((item) => {
                const isDropdownOpen = openDropdown === item.label;
                // If an item is manually selected, only that item should be active
                // Otherwise, use router pathname to determine active state
                const isActive = selectedItem 
                  ? selectedItem === item.label 
                  : router.pathname === item.path;

                // If item has children => Dropdown
                if (item.children) {
                  return (
                    <div
                      key={item.label}
                    >
                      <div
                        className={clsx(
                          "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation",
                          {
                            "bg-[#2D9AA5] text-white": isDropdownOpen,
                            "hover:bg-gray-50 text-gray-700": !isDropdownOpen,
                          }
                        )}
                        onClick={() => {
                          setOpenDropdown(isDropdownOpen ? null : item.label);
                          setSelectedItem(item.label);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={clsx(
                            "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                            {
                              "bg-white/20 text-white": isDropdownOpen,
                              "text-gray-700 group-hover:text-gray-800 group-hover:bg-gray-100": !isDropdownOpen,
                            }
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={clsx(
                              "font-medium text-sm transition-colors duration-200",
                              {
                                "text-white": isDropdownOpen,
                                "text-gray-900": !isDropdownOpen,
                              }
                            )}>
                              {item.label}
                            </div>
                          </div>
                          <svg
                            className={clsx(
                              "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                              isDropdownOpen && "rotate-90",
                              isDropdownOpen ? "text-white" : "text-gray-700"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 6L14 10L6 14V6Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Dropdown children */}
                      {isDropdownOpen && (
                        <div className="pl-4 mt-1 space-y-0.5">
                          {item.children.map((child) => {
                            // Child items are active if they are selected OR if no item is selected and router matches
                            const childActive = selectedItem 
                              ? selectedItem === child.label 
                              : router.pathname === child.path;

                            return (
                              <Link key={child.path} href={child.path!}>
                                <div
                                  className={clsx(
                                    "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2 touch-manipulation",
                                    {
                                      "bg-[#2D9AA5] text-white": childActive,
                                      "hover:bg-gray-50 text-gray-700": !childActive,
                                    }
                                  )}
                                  onClick={() => {
                                    setSelectedItem(child.label);
                                  }}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div className={clsx(
                                      "p-1 rounded-md transition-all duration-200 flex-shrink-0",
                                      {
                                        "bg-white/20 text-white": childActive,
                                        "text-gray-700 group-hover:text-gray-800 group-hover:bg-gray-100": !childActive,
                                      }
                                    )}>
                                      {child.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={clsx(
                                        "font-medium text-sm transition-colors duration-200",
                                        {
                                          "text-white": childActive,
                                          "text-gray-900": !childActive,
                                        }
                                      )}>
                                        {child.label}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular (non-dropdown) item
                const MenuItemContent = (
                  <div
                    className={clsx(
                      "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation",
                      {
                        "bg-[#2D9AA5] text-white": isActive,
                        "hover:bg-gray-50 text-gray-700": !isActive,
                      }
                    )}
                    onClick={() => {
                      setOpenDropdown(null);
                      setSelectedItem(item.label);
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
                    )}

                    <div className="flex items-center space-x-3">
                      <div className={clsx(
                        "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                        {
                          "bg-white/20 text-white": isActive,
                          "text-gray-700 group-hover:text-gray-800 group-hover:bg-gray-100": !isActive,
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
                          "font-medium text-sm transition-colors duration-200",
                          {
                            "text-white": isActive,
                            "text-gray-900": !isActive,
                          }
                        )}>
                          {item.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return item.path ? (
                  <Link key={item.path} href={item.path}>
                    {MenuItemContent}
                  </Link>
                ) : (
                  <div key={item.label}>{MenuItemContent}</div>
                );
              })}
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar - Full height overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out",
          {
            "translate-x-0": isMobileOpen,
            "-translate-x-full": !isMobileOpen,
          }
        )}
      >
        <aside className="w-full max-w-xs h-full bg-white shadow-xl border-r border-gray-200 flex flex-col">
          <div className="flex flex-col h-full">
            {/* Mobile Header Section */}
            <div className="p-4 border-b border-gray-200 relative flex-shrink-0">
              <button
                onClick={handleCloseMobile}
                className="absolute right-4 top-4 bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-all duration-200 z-10 touch-manipulation"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="pr-16">
                <div className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 transition-all duration-200 border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-xl flex items-center justify-center shadow-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-base text-gray-900 block">ZEVA</span>
                    <span className="text-xs text-[#2D9AA5] font-medium">Doctor Portal</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                Doctor Management
              </div>

              {isLoading ? (
                <div className="text-xs text-gray-500 px-2">Loading menu…</div>
              ) : (
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const isDropdownOpen = openDropdown === item.label;
                    // If an item is manually selected, only that item should be active
                    // Otherwise, use router pathname to determine active state
                    const isActive = selectedItem 
                      ? selectedItem === item.label 
                      : router.pathname === item.path;

                    // If item has children => Dropdown
                    if (item.children) {
                      return (
                        <div key={item.label}>
                          <div
                            className={clsx(
                              "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation",
                              {
                                "bg-[#2D9AA5] text-white": isDropdownOpen,
                                "hover:bg-gray-50 text-gray-700": !isDropdownOpen,
                              }
                            )}
                            onClick={() => {
                              setOpenDropdown(isDropdownOpen ? null : item.label);
                              setSelectedItem(item.label);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={clsx(
                                "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                                {
                                  "bg-white/20 text-white": isDropdownOpen,
                                  "text-gray-700 group-hover:text-gray-800 group-hover:bg-gray-100": !isDropdownOpen,
                                }
                              )}>
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={clsx(
                                  "font-medium text-sm transition-colors duration-200",
                                  {
                                    "text-white": isDropdownOpen,
                                    "text-gray-900": !isDropdownOpen,
                                  }
                                )}>
                                  {item.label}
                                </div>
                              </div>
                              <svg
                                className={clsx(
                                  "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                                  {
                                    "text-white rotate-90": isDropdownOpen,
                                    "text-gray-500": !isDropdownOpen,
                                  }
                                )}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          {isDropdownOpen && item.children && (
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                              {item.children.map((child) => {
                                // Child items are active if they are selected OR if no item is selected and router matches
                                const childActive = selectedItem 
                                  ? selectedItem === child.label 
                                  : router.pathname === child.path;
                                return child.path ? (
                                  <Link key={child.path} href={child.path} onClick={handleItemClick}>
                                    <div
                                      className={clsx(
                                        "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2 touch-manipulation",
                                        {
                                          "bg-gray-100 text-gray-900": childActive,
                                          "hover:bg-gray-50 text-gray-700": !childActive,
                                        }
                                      )}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs">{child.icon}</span>
                                        <span className="text-xs font-medium">{child.label}</span>
                                      </div>
                                    </div>
                                  </Link>
                                ) : (
                                  <div key={child.label} className="p-2 text-xs text-gray-500">
                                    {child.label}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const MenuItemContent = (
                      <div
                        className={clsx(
                          'group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation',
                          {
                            'bg-[#2D9AA5] text-white': isActive,
                            'hover:bg-gray-50 text-gray-700': !isActive,
                          }
                        )}
                        onClick={handleItemClick}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
                        )}

                        <div className="flex items-center space-x-3">
                          <div
                            className={clsx(
                              'p-1.5 rounded-md transition-all duration-200 flex-shrink-0',
                              {
                                'bg-white/20 text-white': isActive,
                                'text-gray-700 group-hover:text-gray-800 group-hover:bg-gray-100': !isActive,
                              }
                            )}
                          >
                            {item.icon}
                            {item.badge && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className={clsx(
                                'font-medium text-sm transition-colors duration-200 truncate',
                                {
                                  'text-white': isActive,
                                  'text-gray-900': !isActive,
                                }
                              )}
                            >
                              {item.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    return item.path ? (
                      <Link key={item.label} href={item.path}>
                        {MenuItemContent}
                      </Link>
                    ) : (
                      <div key={item.label}>{MenuItemContent}</div>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
};

export default DoctorSidebar;
