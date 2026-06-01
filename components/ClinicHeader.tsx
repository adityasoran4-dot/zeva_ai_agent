import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface SearchResult {
  label: string;
  path: string;
}

interface ClinicHeaderProps {
  handleToggleDesktop?: () => void;
  handleToggleMobile?: () => void;
  isDesktopHidden?: boolean;
  isMobileOpen?: boolean;
}

const ClinicHeader: React.FC<ClinicHeaderProps> = ({
  handleToggleDesktop,
  handleToggleMobile,
  isDesktopHidden = false,
  isMobileOpen = false,
}: ClinicHeaderProps) => {
  const router = useRouter();
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [clinicUser, setClinicUser] = useState<{ name?: string; email?: string } | null>(null);

  // Fetch navigation items for search
  useEffect(() => {
    const fetchNavigationItems = async () => {
      try {
        const token = localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
        if (!token) return;

        const res = await axios.get('/api/clinic/sidebar-permissions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.navigationItems) {
          setNavigationItems(res.data.navigationItems);
        }
      } catch (error) {
        console.error('Error fetching navigation items:', error);
      }
    };

    fetchNavigationItems();
  }, []);

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    navigationItems.forEach((item) => {
      // Search in module label
      if (item.label.toLowerCase().includes(lowerQuery)) {
        if (item.path) {
          results.push({
            label: item.label,
            path: item.path,
          });
        }
      }

      // Search in submodules
      if (item.subModules) {
        item.subModules.forEach((subModule) => {
          if (subModule.name.toLowerCase().includes(lowerQuery)) {
            if (subModule.path) {
              results.push({
                label: subModule.name,
                path: subModule.path,
              });
            }
          }
        });
      }
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
    setShowSearchResults(results.length > 0);
  };

  const handleSearchResultClick = (path?: string) => {
    if (path) {
      router.push(path);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('clinicToken');
    localStorage.removeItem('clinicUser');
    sessionStorage.removeItem('clinicEmail');
    sessionStorage.removeItem('clinicName');
    sessionStorage.removeItem('clinicUser');
    sessionStorage.removeItem('clinicTrialInfo');
    sessionStorage.removeItem('resetEmail');
    sessionStorage.removeItem('clinicEmailForReset');
    window.location.href = '/clinic/login-clinic';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('clinicUser') || sessionStorage.getItem('clinicUser');
      setClinicUser(raw ? JSON.parse(raw) : null);
    } catch {
      setClinicUser(null);
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm z-40 sticky top-0 backdrop-blur-sm bg-white/95">
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4">
        <div className="flex items-center justify-between gap-1 sm:gap-2 lg:gap-3">
          {/* Left: Hamburger buttons - Always visible, priority positioning */}
          <div className="flex items-center gap-1 flex-shrink-0 relative z-[51] min-w-[2rem]">
            {/* Mobile Hamburger - Always visible on mobile, changes to X when sidebar is open */}
            {handleToggleMobile && (
              <button
                onClick={handleToggleMobile}
                className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-all duration-200 lg:hidden shadow-sm border border-gray-200 relative z-[51] flex-shrink-0"
                aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isMobileOpen ? (
                  <svg
                    className="w-4 h-4 text-gray-700 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-gray-700 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}

            {/* Desktop Hamburger - Only show when sidebar is hidden */}
            {handleToggleDesktop && isDesktopHidden && (
              <button
                onClick={handleToggleDesktop}
                className="hidden lg:inline-flex p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors duration-200 shadow-sm border border-gray-200 relative z-[51] flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-4 h-4 text-gray-700 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Center: Search Bar - Responsive width with adjusted mobile spacing */}
          <div className="relative flex-1 min-w-0 mx-1 sm:mx-2" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                placeholder="Search..."
                className="block w-full pl-7 pr-2 py-1 sm:py-1.5 border border-gray-300 rounded-lg leading-4 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result.path)}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors duration-150 text-xs sm:text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium truncate">{result.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: User Profile - Always aligned to right corner */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Name + Email */}
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {clinicUser?.name || 'Clinic User'}
              </div>
              <div className="text-xs text-gray-500">
                {clinicUser?.email || ''}
              </div>
            </div>
            {/* Avatar - Always visible */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {clinicUser?.name ? getInitials(clinicUser.name) : 'CU'}
              </span>
            </div>

            {/* Logout Button - Icon only */}
            <button
              onClick={handleLogout}
              className="p-1 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 focus:outline-none flex-shrink-0"
              aria-label="Logout"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClinicHeader;
