import React from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Calculator,
  Calendar,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Video,
} from "lucide-react";

type PlatformCard = {
  title: string;
  description: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const CARDS: PlatformCard[] = [
  {
    title: "Book Appointments",
    description: "Schedule with top clinics in seconds",
    href: "/clinic/appointment-landing",
    Icon: Calendar,
  },
  {
    title: "Telemedicine",
    description: "Video consultations from anywhere",
    href: "/telemedicine",
    Icon: Video,
  },
  {
    title: "Find Clinics ",
    description: "Discover verified healthcare providers",
    href: "/clinic/findclinic",
    Icon: MapPin,
  },
  {
    title: "Find Doctors",
    description:"Access qualified doctors providing reliable and expert medical care",
    href: "/doctor/search",
    Icon: ShieldCheck,
  },
  // image.png
  {
    title: "Marketplace",
    description: "Health products & wellness services",
    href: "/bussiness/marketplace",
    Icon: ShoppingBag,
  },
  {
    title: "Jobs & Careers",
    description: "Healthcare job opportunities",
    href: "/job-listings",
    Icon: BriefcaseBusiness,
  },
  {
    title: "Buy / Sell / Invest",
    description: "Clinic investment opportunities",
    href: "/bussiness/finance",
    Icon: TrendingUp,
  },
  {
    title: "Health Calculators",
    description: "BMI, pregnancy, wellness tools",
    href: "/calculator/allcalc",
    Icon: Calculator,
  },
  // {
  //   title: "Offers & Memberships",
  //   description: "Exclusive deals and packages",
  //   href: "/offers-memberships",
  //   Icon: BadgePercent,
  // },
];

const OnePlatformSection: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  return (
    <section className={embedded ? "w-full py-6" : "w-full bg-white py-10"}>
      <div className={embedded ? "w-full" : "max-w-6xl mx-auto px-4"}>
        <div className="text-center mb-8">
           <div className="flex justify-center mt-8 mb-4">
        <div className="flex text-2xl items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-sm text-teal-700">
          <span>
            All-In-One Platform
          </span>
        </div>
      </div>
          <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
            Everything You Need in One Platform
          </p>
          <h1 className="text-gray-600 text-[24px] text-base font-normal mt-3" >
            Comprehensive healthcare services designed for your convenience and peace of
            mind  
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {CARDS.map(({ title, description, href, Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 p-6 flex flex-col items-center text-center"
              aria-label={title}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-700" />
              </div>
              <div className="text-gray-900 font-semibold text-sm">{title}</div>
              <div className="text-gray-500 text-xs mt-2 leading-relaxed">{description}</div>
            </Link>
          ))}
        </div>

        {/* <div className="mt-8 text-center">
          <Link
            href="/one-platform"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
          >
            Explore all modules
          </Link>
        </div> */}
      </div>
    </section>
  );
};

export default OnePlatformSection;


