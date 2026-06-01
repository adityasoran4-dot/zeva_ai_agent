import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const LandingHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerCls = scrolled
    ? "bg-white/95 backdrop-blur border-b border-gray-100"
    : "bg-gradient-to-br from-[#0A1F44] via-[#0D2951] to-[#0A1F44] text-white shadow-[0_4px_20px_rgba(10,31,68,0.35)]";
  const linkCls = scrolled
    ? "text-gray-700 hover:text-blue-700"
    : "text-white/90 hover:text-white";
  const brandTextCls = scrolled ? "text-gray-800" : "text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F0D98C]";
  const whatsappTextCls = scrolled ? "text-gray-700" : "text-white";
  const whatsappIconCls = scrolled ? "text-blue-700" : "text-white";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${headerCls}`}>
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-20 relative">
        {/* Mobile Menu Toggle - Positioned Absolutely */}
        <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 rounded-lg ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-center h-full gap-4 pr-12 md:pr-0">
          {/* Logo */}
          <Link href="/clinic-management-software-uae" className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
            <div className="w-9 h-9 rounded-md bg-[#F0D98C] flex-shrink-0 flex items-center justify-center text-[#0A1F44] font-bold text-sm shadow-sm">
              Z
            </div>
            <span className={`text-base font-bold truncate max-w-full ${brandTextCls}`}>
              Zeva Clinic Management System
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-7 text-base">
            <Link href="/clinic-management-software-uae#features" className={linkCls}>Features</Link>
            <Link href="/clinic-management-software-uae#pricing" className={linkCls}>Pricing</Link>
            {/* <Link href="/testimonials" className={linkCls}>Testimonials</Link>
            <Link href="/resources" className={linkCls}>Resources</Link> */}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 justify-end">
            <div className="flex items-center gap-2 text-base whitespace-nowrap">
              <WhatsAppIcon className={`w-5 h-5 ${whatsappIconCls}`} />
              <a 
                href="https://wa.me/971502983757" 
                className={whatsappTextCls} 
                aria-label="Chat on WhatsApp +971 50 298 3757"
                target="_blank"
                rel="noopener noreferrer"
              >
                +971 50 298 3757
              </a>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("zeva:open-demo-popup"))}
              className="inline-flex items-center justify-center bg-yellow-300 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-base font-semibold shadow-sm whitespace-nowrap"
              aria-label="Book Demo"
              type="button"
            >
              Book Demo
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown - Separate from Header */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t ${scrolled ? 'bg-white border-gray-200' : 'bg-[#0A1F44] border-white/10'}`}>
          <nav className="px-4 py-4 space-y-3">
            <Link 
              href="/clinic-management-software-uae#features" 
              className={`block py-2 text-base ${linkCls}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/clinic-management-software-uae#pricing" 
              className={`block py-2 text-base ${linkCls}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className={`pt-3 border-t ${scrolled ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2">
                <WhatsAppIcon className={`w-5 h-5 ${whatsappIconCls}`} />
                <a 
                  href="https://wa.me/971502983757" 
                  className={`text-base ${whatsappTextCls}`} 
                  aria-label="Chat on WhatsApp +971 50 298 3757"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +971 50 298 3757
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
