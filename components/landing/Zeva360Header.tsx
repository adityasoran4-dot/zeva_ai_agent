import React from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface Zeva360HeaderProps {
  whatsappUrl?: string;
  whatsappNumber?: string;
  homeUrl?: string;
}

const Zeva360Header: React.FC<Zeva360HeaderProps> = ({
  whatsappUrl,
  whatsappNumber = "971502983757",
  homeUrl = "/clinic-management-system-uae",
}) => {
  // Use provided whatsappUrl or construct it from whatsappNumber
  const finalWhatsappUrl = whatsappUrl || `https://wa.me/${whatsappNumber}`;
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/95 backdrop-blur-md"
    }`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-20 relative">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 items-center h-full gap-4 pr-12 md:pr-0">
          {/* Logo */}
          <Link href={homeUrl} className="flex items-center gap-3 min-w-0 flex-1 md:flex-none col-span-1">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-extrabold text-base">Z</span>
            </div>
            <span className="text-xl font-bold text-blue-600 truncate">
              ZEVA <span className="font-normal text-gray-500 text-base">360</span>
            </span>
          </Link>

          {/* Spacer for desktop layout */}
          <div className="hidden md:block"></div>

          {/* WhatsApp Button */}
          <div className="flex items-center justify-end col-span-1">
            <a
              href={finalWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500 text-green-500 text-sm font-medium hover:bg-green-500 hover:text-white transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-6 py-4 space-y-3">
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <a
                href={finalWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-base text-gray-700"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Zeva360Header;
