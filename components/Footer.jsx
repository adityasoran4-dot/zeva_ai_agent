import Link from "next/link";
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "About ZEVA", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Careers", href: "/careers" },
      { label: "Press Kit", href: "/press" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "For Users",
    links: [
      { label: "Find Clinics", href: "/clinic/findclinic" },
      { label: "Find Doctors", href: "/doctor/search" },
      { label: "Book Appointment", href: "/clinic/appointment-landing" },
      { label: "Telemedicine", href: "/telemedicine" },
      { label: "Insurance", href: "/insurance" },
      { label: "Health Tools", href: "/tools" },
    ],
  },
  {
    title: "For Businesses",
    links: [
      { label: "List Your Clinic", href: "/clinic/findclinic" },
      { label: "For Doctors", href: "/doctor/search" },
      // { label: "For Hospitals", href: "/hospitals" },
      // { label: "Business Solutions", href: "/solutions" },
      // { label: "Partner Program", href: "/partners" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Data Security", href: "/security" },
      { label: "Refund Policy", href: "/refund" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* BRAND */}
          <div>
            <h2 className="text-xl font-semibold text-teal-700">ZEVA</h2>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Your trusted healthcare & wellness discovery and booking platform.
            </p>

            {/* SOCIAL ICONS */}
            <div className="flex gap-3 mt-4 text-gray-500">
  <a
    href="https://twitter.com"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-blue-500 transition"
  >
    <Twitter size={18} />
  </a>

  <a
    href="https://facebook.com"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-blue-600 transition"
  >
    <Facebook size={18} />
  </a>

  <a
    href="https://instagram.com"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-pink-500 transition"
  >
    <Instagram size={18} />
  </a>

  <a
    href="https://linkedin.com"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-blue-700 transition"
  >
    <Linkedin size={18} />
  </a>

  <a
    href="https://youtube.com"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-red-500 transition"
  >
    <Youtube size={18} />
  </a>
</div>

          </div>

          {/* FOOTER SECTIONS */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-medium text-blue-700 mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2 text-xs text-gray-700">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-blue-600 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* DIVIDER */}
        <div className="my-6" />

        {/* APP DOWNLOAD + LANGUAGE */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-sm font-medium text-blue-600 mb-2">
              Download the ZEVA App
            </h4>
            <div className="flex gap-3">
              <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs">
                App Store
              </button>
              <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs">
                Google Play
              </button>
            </div>
          </div>

          {/* <select className="border rounded-md px-3 py-1.5 text-xs">
            <option>English</option>
            <option>Hindi</option>
          

          </select> */}
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-6 pt-4 flex flex-col md:flex-row justify-between text-xs text-gray-600">
          <span>© 2024 ZEVA Healthcare. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <span className="text-red-500">❤️</span> for better healthcare
          </span>
        </div>

      </div>
    </footer>
  );
}
