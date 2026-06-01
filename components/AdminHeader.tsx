import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdminHeaderProps {
  sidebarItems?: Array<{
    label: string;
    path?: string;
    icon?: string;
    children?: Array<{ label: string; path?: string }>;
  }>;
  onSearch?: (query: string) => void;
  isDesktopHidden?: boolean;
  isMobileOpen?: boolean;
  onToggleDesktop?: () => void;
  onToggleMobile?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  sidebarItems = [],
  onSearch,
  isDesktopHidden = false,
  isMobileOpen = false,
  onToggleDesktop,
  onToggleMobile,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ label: string; path?: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if modal is open by checking body class
  useEffect(() => {
    const checkModalOpen = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'));
    };

    // Check initially
    checkModalOpen();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const storedUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  // const email = storedUser.email;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      if (onSearch) onSearch('');
      return;
    }

    const results: Array<{ label: string; path?: string }> = [];
    
    sidebarItems.forEach((item) => {
      if (item.label.toLowerCase().includes(query.toLowerCase())) {
        if (item.path) {
          results.push({ label: item.label, path: item.path });
        }
      }
      
      if (item.children) {
        item.children.forEach((child) => {
          if (child.label.toLowerCase().includes(query.toLowerCase())) {
            if (child.path) {
              results.push({ label: child.label, path: child.path });
            }
          }
        });
      }
    });

    setSearchResults(results);
    setShowSearchResults(results.length > 0);
    if (onSearch) onSearch(query);
  };

  const handleSearchResultClick = (path?: string) => {
    if (path) {
      router.push(path);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Hide header when modal is open
  if (isModalOpen) {
    return null;
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm z-40 sticky top-0 backdrop-blur-sm bg-white/95">
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4">
        <div className="flex items-center justify-between gap-1 sm:gap-2 lg:gap-3">
          {/* Left: Hamburger buttons - Always visible, priority positioning */}
          <div className="flex items-center gap-1 flex-shrink-0 relative z-[51] min-w-[2rem]">
            {/* Mobile Hamburger - Always visible on mobile, changes to X when sidebar is open */}
            {onToggleMobile && (
              <button
                onClick={onToggleMobile}
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
            {onToggleDesktop && isDesktopHidden && (
              <button
                onClick={onToggleDesktop}
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
          <div className="relative flex-1 min-w-0 mx-1 sm:mx-2">
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
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {/* Avatar - Always visible */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {storedUser?.name ? getInitials(storedUser.name) : 'AU'}
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

export default AdminHeader;             
