'use client';

import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import axios from "axios";

interface NavItemChild {
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: number;
  permissionKey?: string;
  order?: number;
}

interface NavItem extends NavItemChild {
  children?: NavItemChild[];
  moduleKey?: string;
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

interface AgentSidebarProps {
  className?: string;
  isDesktopHidden: boolean;
  isMobileOpen: boolean;
  handleToggleDesktop: () => void;
  handleCloseMobile: () => void;
  handleItemClick: () => void;
}

const AgentSidebar: FC<AgentSidebarProps> = ({
  className,
  isDesktopHidden,
  isMobileOpen,
  handleToggleDesktop,
  handleCloseMobile,
  handleItemClick,
}) => {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        handleCloseMobile();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, handleCloseMobile]);

  // Fetch navigation items and permissions on mount and route changes
  useEffect(() => {
    const fetchNavigationAndPermissions = async () => {
      try {
        const agentToken =
          typeof window !== "undefined"
            ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken")
            : null;
        const userToken =
          typeof window !== "undefined"
            ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken")
            : null;
        const token = agentToken || userToken;

        if (!token) {
          setNavigationItems([]);
          setIsLoading(false);
          return;
        }

        const res = await axios.get("/api/agent/sidebar-permissions", {
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
              navItem.children = item.subModules.map((subModule: { name: string; path?: string; icon: string; order: number }): NavItemChild => ({
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

  const filteredItems = useMemo(() => {
    // Add Dashboard item at the beginning
    const dashboardItem: NavItem = {
      label: 'Dashboard',
      path: '/staff/dashboard',
      icon: '📊',
      description: 'Staff Dashboard',
      order: 0,
    };

    // All Claims item
    const allClaimsItem: NavItem = {
      label: 'All Claims',
      path: '/staff/all-claims',
      icon: '📋',
      description: 'Review Insurance Claims',
      moduleKey: 'agent_all_claims',
      order: 9,
    };

    // Navigation items are already filtered by the API based on permissions
    // Just return them as-is, but ensure children are properly structured
    const apiItems = navigationItems.map(item => ({
          ...item,
      children: item.children && item.children.length > 0 ? item.children : undefined,
    })).filter(item => {
      // Remove items with no path and no children (empty modules)
      if (!item.path && (!item.children || item.children.length === 0)) {
        return false;
      }
      return true;
    });

    // Prepend Dashboard item at the beginning, insert All Claims
    return [dashboardItem, allClaimsItem, ...apiItems];
  }, [navigationItems]);

  return (
    <>
      {/* Desktop Toggle Button - Positioned on left when sidebar is hidden */}
      <button
        onClick={handleToggleDesktop}
        className={clsx(
          "fixed top-4 left-4 z-[60] bg-white text-sky-600 p-3 rounded-lg shadow-lg transition-all duration-300 border border-slate-200 hidden lg:block",
          {
            "lg:block": isDesktopHidden,
            "lg:hidden": !isDesktopHidden,
          }
        )}
        aria-label="Toggle desktop sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

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
          "transition-all duration-300 ease-in-out bg-white border-r border-slate-200 shadow-sm flex-col w-64 hidden lg:flex flex-shrink-0",
          {
            "lg:flex": !isDesktopHidden,
            "lg:hidden": isDesktopHidden,
          },
          className
        )}
        style={{ height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 30 }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex-shrink-0 relative">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <span className="font-semibold text-sm">AG</span>
              </div>
              <div>
                <span className="font-semibold text-sm text-slate-900 block">Agent Portal</span>
                <span className="text-xs text-sky-600 font-medium">Lead management</span>
              </div>
            </div>

            <button
              onClick={handleToggleDesktop}
              className="absolute right-4 top-4 bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200 transition-all duration-300"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
              Navigation
            </div>

            {isLoading ? (
              <div className="text-xs text-slate-500 px-2">Loading menu…</div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isDropdownOpen = openDropdown === item.label;
                  // Use exact path matching - only match if pathname exactly equals item.path
                  // Clear selectedItem when route changes to ensure pathname-based matching
                  const isActive = item.path ? router.pathname === item.path : false;
                  const isHovered = hoveredItem === item.path;

                  if (item.children && item.children.length > 0) {
                    return (
                      <div key={item.label}>
                        <div
                          className={clsx(
                            "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2",
                            {
                              "bg-sky-600 text-white shadow-sm": isDropdownOpen,
                              "hover:bg-slate-50 text-slate-700 hover:text-slate-900": !isDropdownOpen,
                            }
                          )}
                          onClick={() => {
                            setOpenDropdown(isDropdownOpen ? null : item.label);
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="text-base p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-600">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-xs">{item.label}</div>
                              {item.description && (
                                <div className="text-[10px] text-slate-500">{item.description}</div>
                              )}
                            </div>
                            <svg
                              className={clsx(
                                "w-3.5 h-3.5 transition-transform duration-200",
                                isDropdownOpen && "rotate-90"
                              )}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M6 6L14 10L6 14V6Z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        {isDropdownOpen && (
                          <div className="pl-5 mt-1 space-y-1">
                            {item.children.map((child) => {
                              // Use exact path matching for child items too
                              const childActive = child.path ? router.pathname === child.path : false;
                              return (
                                <Link key={child.path} href={child.path!}>
                                  <div
                                    className={clsx(
                                      "group relative block rounded-lg transition-all duration-200 cursor-pointer",
                                      child.description ? "p-2.5" : "p-1.5",
                                      {
                                        "bg-sky-600 text-white shadow-sm": childActive,
                                        "hover:bg-slate-50 text-slate-700 hover:text-slate-900": !childActive,
                                      }
                                    )}
                                    onMouseEnter={() => setHoveredItem(child.path!)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    onClick={() => {
                                      // Don't set selectedItem - let pathname matching handle active state
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className={clsx(
                                          "text-sm p-1.5 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                          {
                                            "bg-white/20 text-white": childActive,
                                            "text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50": !childActive,
                                          }
                                        )}
                                      >
                                        {child.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div
                                          className={clsx(
                                            "font-medium text-xs transition-colors duration-200",
                                            {
                                              "text-white": childActive,
                                              "text-slate-900 group-hover:text-slate-900": !childActive,
                                            }
                                          )}
                                        >
                                          {child.label}
                                        </div>
                                        {child.description && (
                                          <div
                                            className={clsx(
                                              "text-[10px] mt-0.5 transition-all duration-200",
                                              {
                                                "text-white/80": childActive,
                                                "text-slate-500 group-hover:text-slate-600": !childActive,
                                              }
                                            )}
                                          >
                                            {child.description}
                                          </div>
                                        )}
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

                  if (item.path) {
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          className={clsx(
                            "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2",
                            {
                              "bg-sky-600 text-white shadow-sm": isActive,
                              "hover:bg-slate-50 text-slate-700 hover:text-slate-900": !isActive,
                            }
                          )}
                          onMouseEnter={() => setHoveredItem(item.path!)}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={() => {
                            setOpenDropdown(null);
                            // Don't set selectedItem - let pathname matching handle active state
                          }}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                          )}
                          <div className="flex items-center space-x-2">
                            <div
                              className={clsx(
                                "text-base p-1.5 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                {
                                  "bg-white/20 text-white": isActive,
                                  "text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50": !isActive,
                                }
                              )}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={clsx("font-medium text-xs", {
                                  "text-white": isActive,
                                  "text-slate-900 group-hover:text-slate-900": !isActive,
                                })}
                              >
                                {item.label}
                              </div>
                              {item.description && (
                                <div
                                  className={clsx("text-[10px] mt-0.5", {
                                    "text-white/80": isActive,
                                    "text-slate-500 group-hover:text-slate-600": !isActive,
                                  })}
                                >
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <div
                              className={clsx("transition-all duration-200 flex-shrink-0", {
                                "opacity-100 transform translate-x-0": isActive || isHovered,
                                "opacity-0 transform -translate-x-1": !isActive && !isHovered,
                              })}
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label} className="px-3 py-2 font-semibold text-slate-700 flex items-center space-x-3">
                      <div className="text-base p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </nav>
        </div>
      </aside>

      <div
        className={clsx(
          "fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out pointer-events-none",
          {
            "translate-x-0": isMobileOpen,
            "-translate-x-full": !isMobileOpen,
          }
        )}
      >
        <aside className="w-full max-w-xs h-full bg-white shadow-xl border-r border-slate-200 flex flex-col pointer-events-auto">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 relative flex-shrink-0">
              <button
                onClick={handleCloseMobile}
                className="absolute right-4 top-4 bg-slate-100 text-slate-600 p-2.5 rounded-lg hover:bg-slate-200 transition-all duration-200 z-10"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="pr-16">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <span className="font-semibold text-sm">AG</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-900 block">Agent Portal</span>
                    <span className="text-xs text-sky-600 font-medium">Lead management</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">
                Navigation
              </div>

              {isLoading ? (
                <div className="text-xs text-slate-500 px-2">Loading menu…</div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    // Use exact path matching for mobile too
                    const isActive = item.path ? router.pathname === item.path : false;
                    const isDropdownOpen = openDropdown === item.label;

                    if (item.children && item.children.length > 0) {
                      return (
                        <div key={item.label}>
                          <div
                            className={clsx(
                              "group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98",
                              {
                                "bg-sky-600 text-white shadow-sm": isDropdownOpen,
                                "hover:bg-slate-50 text-slate-700 active:bg-slate-100": !isDropdownOpen,
                              }
                            )}
                            onClick={() => {
                              setOpenDropdown(isDropdownOpen ? null : item.label);
                              // Don't set selectedItem - let pathname matching handle active state
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={clsx(
                                  "text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                  {
                                    "bg-white/20 text-white": isDropdownOpen,
                                    "text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50": !isDropdownOpen,
                                  }
                                )}
                              >
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={clsx(
                                    "font-medium text-sm transition-colors duration-200",
                                    {
                                      "text-white": isDropdownOpen,
                                      "text-slate-900": !isDropdownOpen,
                                    }
                                  )}
                                >
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div
                                    className={clsx(
                                      "text-xs mt-0.5 transition-all duration-200",
                                      {
                                        "text-white/80": isDropdownOpen,
                                        "text-slate-500": !isDropdownOpen,
                                      }
                                    )}
                                  >
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              <svg
                                className={clsx(
                                  "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                                  isDropdownOpen && "rotate-90"
                                )}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M6 6L14 10L6 14V6Z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          {isDropdownOpen && (
                            <div className="pl-6 mt-1 space-y-1">
                              {item.children.map((child) => {
                                // Use exact path matching for child items too
                                const childActive = child.path ? router.pathname === child.path : false;

                                return (
                                  <Link key={child.path} href={child.path!}>
                                    <div
                                      className={clsx(
                                        "group relative block rounded-lg transition-all duration-200 cursor-pointer touch-manipulation active:scale-98",
                                        child.description ? "p-3" : "p-1.5",
                                        {
                                          "bg-sky-600 text-white shadow-sm": childActive,
                                          "hover:bg-slate-50 text-slate-700 active:bg-slate-100": !childActive,
                                        }
                                      )}
                                      onClick={() => {
                                        handleItemClick();
                                        // Don't set selectedItem - let pathname matching handle active state
                                      }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className={clsx(
                                            "text-base p-1.5 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                            {
                                              "bg-white/20 text-white": childActive,
                                              "text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50": !childActive,
                                            }
                                          )}
                                        >
                                          {child.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className={clsx(
                                              "font-medium text-sm transition-colors duration-200",
                                              {
                                                "text-white": childActive,
                                                "text-slate-900": !childActive,
                                              }
                                            )}
                                          >
                                            {child.label}
                                          </div>
                                          {child.description && (
                                            <div
                                              className={clsx(
                                                "text-xs mt-0.5 transition-all duration-200",
                                                {
                                                  "text-white/80": childActive,
                                                  "text-slate-500": !childActive,
                                                }
                                              )}
                                            >
                                              {child.description}
                                            </div>
                                          )}
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

                    if (item.path) {
                      return (
                        <Link key={item.path} href={item.path}>
                          <div
                            className={clsx(
                              "group relative block rounded-lg transition-all duration-200 cursor-pointer p-3 touch-manipulation active:scale-98",
                              {
                                "bg-sky-600 text-white shadow-sm": isActive,
                                "hover:bg-slate-50 text-slate-700 active:bg-slate-100": !isActive,
                              }
                            )}
                            onClick={() => {
                              // Don't set selectedItem - let pathname matching handle active state
                              handleItemClick();
                            }}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                            )}

                            <div className="flex items-center space-x-3">
                              <div
                                className={clsx(
                                  "text-lg p-2 rounded-lg transition-all duration-200 relative flex-shrink-0",
                                  {
                                    "bg-white/20 text-white": isActive,
                                    "text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50": !isActive,
                                  }
                                )}
                              >
                                {item.icon}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className={clsx(
                                    "font-medium text-sm transition-colors duration-200",
                                    {
                                      "text-white": isActive,
                                      "text-slate-900": !isActive,
                                    }
                                  )}
                                >
                                  {item.label}
                                </div>

                                {item.description && (
                                  <div
                                    className={clsx(
                                      "text-xs mt-0.5 transition-all duration-200",
                                      {
                                        "text-white/80": isActive,
                                        "text-slate-500": !isActive,
                                      }
                                    )}
                                  >
                                    {item.description}
                                  </div>
                                )}
                              </div>

                              <div className="flex-shrink-0 opacity-60">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    return (
                      <div key={item.label} className="px-3 py-2 font-semibold text-slate-700 flex items-center space-x-3 touch-manipulation">
                        <div className="text-lg p-2 rounded-lg bg-slate-100 text-slate-600">{item.icon}</div>
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.5);
        }
        .custom-scrollbar {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </>
  );
};

export default AgentSidebar;
