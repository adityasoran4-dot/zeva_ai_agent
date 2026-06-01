// Fixed Responsive AdminSidebar.tsx with Proper Desktop Toggle
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  HomeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  NewspaperIcon,
  ChartBarIcon,
  PhoneIcon,
  BriefcaseIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  BeakerIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  PhoneIcon as PhoneIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  UserPlusIcon as UserPlusIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  DocumentIcon as DocumentIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  DocumentCheckIcon as DocumentCheckIconSolid,
  BeakerIcon as BeakerIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  label: string;
  path?: string; 
  icon: any;
  iconSolid?: any;
  description?: string;
  badge?: number;
  children?: NavItem[]; 
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard-admin',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Admin Dashboard'
  },
  {
    label: 'Approval Clinic',
    path: '/admin/AdminClinicApproval ',
    icon: CheckCircleIcon,
    iconSolid: CheckCircleIconSolid,
    description: 'Manage Clinics'
  },
  {
    label: 'Permission Management',
    path: '/admin/manage-clinic-permissions',
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
    description: 'permission Manage Clinic'
  },
  {
    label: 'Approval Doctors',
    path: '/admin/approve-doctors',
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    description: 'Manage Doctors'
  },
  {
    label: 'Add Treatment',
    path: '/admin/add-treatment',
    icon: BeakerIcon,
    iconSolid: BeakerIconSolid,
    description: 'Add new Treatment'
  },
  {
    label: 'All Blogs',
    path: '/admin/all-blogs',
    icon: NewspaperIcon,
    iconSolid: NewspaperIconSolid,
    description: 'Manage blogs'
  },
  {
    label: 'User Analytics',
    path: '/admin/analytics',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    description: 'View detailed reports'
  },
  {
    label: 'Request Call Back',
    path: '/admin/get-in-touch',
    icon: PhoneIcon,
    iconSolid: PhoneIconSolid,
    description: 'View and export user call back requests'
  },
  {
    label: 'Manage Job',
    path: '/admin/job-manage',
    icon: BriefcaseIcon,
    iconSolid: BriefcaseIconSolid,
    description: 'Approve or decline job'
  },
  {
    label: 'Audit SEO',
    path: '/admin/seo-audit',
    icon: BriefcaseIcon,
    iconSolid: BriefcaseIconSolid,
    description: 'Audit SEO'
  },
  {
    label: "Staff Management",
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    description: "Manage Staff",
    children: [
      {
        label: "Create Staff",
        path: "/admin/create-staff",
        icon: UserPlusIcon,
        iconSolid: UserPlusIconSolid,
      },
      {
        label: "Create Vendor",
        path: "/admin/admin-create-vendor",
        icon: BuildingOfficeIcon,
        iconSolid: BuildingOfficeIconSolid,
      },
      {
        label: 'View EOD Report',
        path: '/admin/getAllEodNotes',
        icon: DocumentIcon,
        iconSolid: DocumentIconSolid,
      },
      {
        label: 'Patient Report',
        path: '/admin/patient-report',
        icon: ClipboardDocumentListIcon,
        iconSolid: ClipboardDocumentListIconSolid,
      },
      {
        label: 'Track Expenses',
        path: '/admin/track-expenses',
        icon: CurrencyDollarIcon,
        iconSolid: CurrencyDollarIconSolid,
      },
      {
        label: 'Contracts',
        path: '/admin/Contractor',
        icon: DocumentCheckIcon,
        iconSolid: DocumentCheckIconSolid,
      },
    ],
  },
  {
    label: "Create Agent",
    path: "/admin/create-agent",
    icon: UserPlusIcon,
    iconSolid: UserPlusIconSolid,
    description: "Create agent account",
  },
  {
    label: "SMS Management",
    icon: EnvelopeIcon,
    iconSolid: EnvelopeIconSolid,
    description: "Manage SMS wallets and top-ups",
    children: [
      {
        label: "Manage Wallets",
        path: "/admin/manage-sms-wallets",
        icon: CurrencyDollarIcon,
        iconSolid: CurrencyDollarIconSolid,
      },
      {
        label: "Top-up Requests",
        path: "/admin/manage-sms-topups",
        icon: ChatBubbleLeftRightIcon,
        iconSolid: ChatBubbleLeftRightIconSolid,
      },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
  onItemsChange?: (items: NavItem[]) => void;
  // External state management (optional - for header-controlled toggles)
  externalIsDesktopHidden?: boolean;
  externalIsMobileOpen?: boolean;
  onExternalToggleDesktop?: () => void;
  onExternalToggleMobile?: () => void;
}

const AdminSidebar: FC<AdminSidebarProps> = ({ 
  className, 
  onItemsChange,
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

  // Notify parent component of sidebar items for search
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(navItems);
    }
  }, [onItemsChange]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        if (onExternalToggleMobile && externalIsMobileOpen) {
          onExternalToggleMobile(); // Toggle to close
        } else {
          setInternalIsMobileOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onExternalToggleMobile, externalIsMobileOpen]);

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

  const handleRegularItemClick = () => {
    if (onExternalToggleMobile && externalIsMobileOpen) {
      onExternalToggleMobile(); // Toggle to close
    } else {
      setInternalIsMobileOpen(false);
    }
    setOpenDropdown(null);
  };

  const handleToggleDesktop = () => {
    if (onExternalToggleDesktop) {
      onExternalToggleDesktop();
    } else {
      setInternalIsDesktopHidden(!internalIsDesktopHidden);
    }
  };

  // const handleToggleMobile = () => {
  //   if (onExternalToggleMobile) {
  //     onExternalToggleMobile();
  //   } else {
  //     setInternalIsMobileOpen(!internalIsMobileOpen);
  //   }
  // };

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

  const renderIcon = (item: NavItem, isActive: boolean, isDropdownOpen?: boolean) => {
    const IconComponent = (isActive || isDropdownOpen) && item.iconSolid ? item.iconSolid : item.icon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <>
      {/* Fixed toggle buttons are now handled in AdminHeader - hidden here to avoid conflicts */}
      {/* Mobile Toggle Button - Hidden, using header button instead */}
      {/* Desktop Toggle Button - Hidden, using header button instead */}

      {/* Mobile Overlay - Behind sidebar but above content */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={clsx(
        'transition-all duration-300 ease-in-out bg-white border-r border-blue-200 shadow-sm flex-col min-h-screen w-64 hidden lg:flex',
        {
          'lg:flex': !isDesktopHidden,
          'lg:hidden': isDesktopHidden
        },
        className
      )} style={{ height: '100vh' }}>
        <div className="flex flex-col h-full">
          {/* Desktop Header Section */}
          <div className="p-4 border-b border-blue-200 flex-shrink-0 relative">
            <Link href="/admin/dashboard-admin">
              <div className="group cursor-pointer">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-all duration-200 border border-blue-200">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <div>
                    <span className="font-bold text-base text-blue-900 block">
                      ZEVA
                    </span>
                    <span className="text-xs text-blue-700 font-medium">Admin Panel</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Close Button */}
            <button
              onClick={handleToggleDesktop}
              className="absolute right-4 top-4 bg-blue-100 text-blue-700 p-1.5 rounded-md hover:bg-blue-200 transition-all duration-200 z-50"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 min-h-0">
            <div className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
              Navigation
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = router.pathname === item.path;
                const isDropdownOpen = openDropdown === item.label;

                // If item has children => Dropdown
                if (item.children) {
                  return (
                    <div key={item.label}>
                      <div
                        className={clsx(
                          "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation",
                          {
                            "bg-blue-600 text-white": isDropdownOpen,
                            "hover:bg-blue-50 text-blue-700": !isDropdownOpen,
                          }
                        )}
                        onClick={() => {
                          setOpenDropdown(isDropdownOpen ? null : item.label);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={clsx(
                              "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                              {
                                "bg-white/20 text-white": isDropdownOpen,
                                "text-blue-700 group-hover:text-blue-800 group-hover:bg-blue-100": !isDropdownOpen,
                              }
                            )}
                          >
                            {renderIcon(item, false, isDropdownOpen)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={clsx(
                                "font-medium text-sm transition-colors duration-200",
                                {
                                  "text-white": isDropdownOpen,
                                  "text-blue-900": !isDropdownOpen,
                                }
                              )}
                            >
                              {item.label}
                            </div>
                          </div>
                          <svg
                            className={clsx(
                              "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                              isDropdownOpen && "rotate-90",
                              isDropdownOpen ? "text-white" : "text-blue-700"
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
                            const childActive = router.pathname === child.path;

                            return (
                              <Link key={child.path} href={child.path!}>
                                <div
                                  className={clsx(
                                    "group relative block rounded-lg transition-all duration-200 cursor-pointer p-2 touch-manipulation",
                                    {
                                      "bg-blue-600 text-white": childActive,
                                      "hover:bg-blue-50 text-blue-700": !childActive,
                                    }
                                  )}
                                  onClick={handleItemClick}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div
                                      className={clsx(
                                        "p-1 rounded-md transition-all duration-200 flex-shrink-0",
                                        {
                                          "bg-white/20 text-white": childActive,
                                          "text-blue-700 group-hover:text-blue-800 group-hover:bg-blue-100": !childActive,
                                        }
                                      )}
                                    >
                                      {renderIcon(child, childActive)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={clsx(
                                          "font-medium text-sm transition-colors duration-200",
                                          {
                                            "text-white": childActive,
                                            "text-blue-900": !childActive,
                                          }
                                        )}
                                      >
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
                        "bg-blue-600 text-white": isActive,
                        "hover:bg-blue-50 text-blue-700": !isActive,
                      }
                    )}
                    onClick={handleRegularItemClick}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
                    )}

                    <div className="flex items-center space-x-3">
                      <div
                        className={clsx(
                          "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                          {
                            "bg-white/20 text-white": isActive,
                            "text-blue-700 group-hover:text-blue-800 group-hover:bg-blue-100": !isActive,
                          }
                        )}
                      >
                        {renderIcon(item, isActive)}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={clsx(
                            "font-medium text-sm transition-colors duration-200",
                            {
                              "text-white": isActive,
                              "text-blue-900": !isActive,
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
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar - Above overlay, below header button */}
      <div className={clsx(
        'fixed inset-0 z-[48] lg:hidden transition-transform duration-300 ease-in-out',
        {
          'translate-x-0': isMobileOpen,
          '-translate-x-full': !isMobileOpen,
        }
      )}>
        <aside className="w-full max-w-xs h-full bg-white shadow-xl border-r border-blue-200 flex flex-col">
          <div className="flex flex-col h-full">
            {/* Mobile Header Section */}
            <div className="p-4 border-b border-blue-200 relative flex-shrink-0">
              <button
                onClick={handleCloseMobile}
                className="absolute right-4 top-4 bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-all duration-200 z-10 touch-manipulation"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="pr-16">
                <Link href="/admin/dashboard-admin" onClick={handleItemClick}>
                  <div className="group cursor-pointer">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-all duration-200 border border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Z</span>
                      </div>
                      <div>
                        <span className="font-bold text-base text-blue-900 block">
                          ZEVA
                        </span>
                        <span className="text-xs text-blue-700 font-medium">Admin Panel</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
              <div className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                Navigation
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = router.pathname === item.path;

                  const MenuItemContent = (
                    <div
                      className={clsx(
                        'group relative block rounded-lg transition-all duration-200 cursor-pointer p-2.5 touch-manipulation',
                        {
                          'bg-blue-600 text-white': isActive,
                          'hover:bg-blue-50 text-blue-700': !isActive,
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
                              'text-blue-700 group-hover:text-blue-800 group-hover:bg-blue-100': !isActive,
                            }
                          )}
                        >
                          {renderIcon(item, isActive)}
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
                                'text-blue-900': !isActive,
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
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
};

export default AdminSidebar;
