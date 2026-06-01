import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';

interface ClinicHeaderProps {
  handleToggleMobile: () => void;
  isMobileOpen: boolean;
}

const ClinicHeader: React.FC<ClinicHeaderProps> = ({
  handleToggleMobile,
  isMobileOpen
}) => {
  const [tokenUser, setTokenUser] = useState<{ name?: string; email?: string } | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [commissionCount, setCommissionCount] = useState<number>(0);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [commissionItems, setCommissionItems] = useState<Array<{
    commissionId: string;
    patientName: string;
    patientMobile: string;
    invoiceNumber: string;
    invoicedDate: string | null;
    paidAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    finalCommissionAmount?: number;
    doctorName: string;
  }>>([]);
  const walletBtnRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem('agentToken') ||
        localStorage.getItem('userToken') ||
        sessionStorage.getItem('agentToken') ||
        sessionStorage.getItem('userToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('agentToken');
      localStorage.removeItem('userToken');
      localStorage.removeItem('agentUser');
      window.location.href = '/staff';
    }
  };

  useEffect(() => {
    // Get user info from localStorage (stored during login)
    const getUserInfo = () => {
      if (typeof window !== 'undefined') {
        // First try to get from agentUser
        const agentUserRaw = localStorage.getItem('agentUser');
        if (agentUserRaw) {
          try {
            const user = JSON.parse(agentUserRaw);
            setTokenUser({ name: user.name, email: user.email });
            return;
          } catch (error) {
            console.error('Error parsing agentUser:', error);
          }
        }
        
        // Fallback: decode token if agentUser is not available
        const token = localStorage.getItem('agentToken') || localStorage.getItem('userToken');
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              setTokenUser({ name: payload.name, email: payload.email });
            }
          } catch (error) {
            console.error('Error decoding token in header:', error);
          }
        }
      }
    };
    
    getUserInfo();
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('agentToken') || localStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, []);

  const loadCommissions = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await axios.get('/api/agent/commissions/mine', { headers });
      if (res.data && res.data.success) {
        setCommissionCount(res.data.count || 0);
        setTotalCommission(res.data.totalCommission || 0);
        setCommissionItems(res.data.items || []);
      }
    } catch (err) {
      // Silent fail
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const computeDropdownPos = () => {
    if (typeof window === 'undefined') return;
    const btn = walletBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 8;
    const right = Math.max(8, window.innerWidth - rect.right);
    setDropdownPos({ top, right });
  };

  const toggleWallet = () => {
    setWalletOpen((prev) => {
      const next = !prev;
      if (!prev) computeDropdownPos();
      return next;
    });
  };

  useEffect(() => {
    if (!walletOpen) return;
    const handler = () => computeDropdownPos();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [walletOpen]);




//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase())
//       .join('')
//       .slice(0, 2);
//   };

  return (
  <header className="w-full bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
    <div className="px-2 sm:px-4 py-1.5 sm:py-2">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Mobile Hamburger + Brand */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger - Only visible on mobile, positioned on left */}
          <button
            onClick={handleToggleMobile}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex-shrink-0 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform duration-300 ${isMobileOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2D9AA5] to-[#1e7d87] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-[#2D9AA5] rounded-full border-2 border-white"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                ZEVA
              </h1>
              <p className="text-[10px] sm:text-xs text-[#2D9AA5] font-medium -mt-0.5 truncate">Healthcare Excellence</p>
            </div>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Wallet */}
          <div className="relative">
            <button
              ref={walletBtnRef}
              onClick={toggleWallet}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
              aria-label="Commission Wallet"
              title="Your commissions"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a4 4 0 014-4h10a2 2 0 012 2v2h-7a4 4 0 00-4 4v0a4 4 0 004 4h7v2a2 2 0 01-2 2H7a4 4 0 01-4-4V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11h4v4h-4a2 2 0 01-2-2v0a2 2 0 012-2z" />
              </svg>
              {commissionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {commissionCount}
                </span>
              )}
            </button>
            {walletOpen &&
              typeof window !== 'undefined' &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setWalletOpen(false)}
                  />
                  <div
                    className="fixed z-[9999] w-[22rem] sm:w-[24rem] bg-white border border-gray-200 rounded-lg shadow-2xl"
                    style={{ top: dropdownPos.top, right: dropdownPos.right, maxWidth: '92vw' }}
                  >
                    <div className="px-3 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-gray-900">Your Commissions</div>
                        <div className="text-xs text-teal-700 font-semibold">Total ₹ {Number(totalCommission || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-auto">
                      {commissionItems.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-600">No commissions yet</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {commissionItems.map((it) => (
                            <li key={it.commissionId} className="px-3 py-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-900">{it.patientName || '—'}</div>
                                <div className="text-[10px] text-gray-500">{it.invoiceNumber || '—'}</div>
                              </div>
                              <div className="mt-0.5 flex items-center justify-between">
                                <div className="text-[10px] text-gray-700">
                                  Paid ₹ {Number(it.paidAmount || 0).toFixed(2)} • {Number(it.commissionPercent || 0)}%
                                </div>
                                <div className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded">
                                  Commission ₹ {Number((it.finalCommissionAmount ?? it.commissionAmount) || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="mt-0.5 text-[10px] text-gray-500">
                                {it.doctorName ? `Doctor: ${it.doctorName}` : ''}
                              </div>
                              <div className="mt-0.5 text-[10px] text-gray-500">
                                {it.invoicedDate ? new Date(it.invoicedDate).toLocaleDateString() : ''}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )
            }
          </div>
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
          <div className="hidden md:block text-right">
            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
              {tokenUser?.name || ''}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
              {tokenUser?.email || ''}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-[#2D9AA5] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-[10px] sm:text-sm">
                {tokenUser?.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200"
              aria-label="Logout"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
);
};

export default ClinicHeader;
