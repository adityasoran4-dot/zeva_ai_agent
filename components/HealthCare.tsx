"use client";
import React from "react";
import {
  Clock,
  FileText,
  Lock,
  Heart,
  Bell,
  Star,
} from "lucide-react";

export default function HealthcareAccount() {

  const features = [
    { 
      icon: Clock, 
      title: "Appointment History", 
      desc: "Track all your past and upcoming appointments",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      benefits: ["24/7 Access", "Smart Reminders", "Easy Rescheduling"]
    },
    { 
      icon: FileText, 
      title: "Digital Prescriptions", 
      desc: "Access prescriptions anytime, anywhere",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      benefits: ["Instant Access", "Auto-Refills", "Pharmacy Delivery"]
    },
    { 
      icon: Lock, 
      title: "Secure Document Storage", 
      desc: "Store medical records safely in the cloud",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      benefits: ["Bank-Level Security", "Unlimited Storage", "Easy Sharing"]
    },
    { 
      icon: Heart, 
      title: "Insurance Tracking", 
      desc: "Manage claims and coverage details",
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      benefits: ["Real-Time Updates", "Claim History", "Coverage Analysis"]
    },
    { 
      icon: Bell, 
      title: "Favorites & Reminders", 
      desc: "Save preferred doctors and get reminders",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50",
      benefits: ["Custom Alerts", "Favorite Doctors", "Health Tips"]
    },
    { 
      icon: Star, 
      title: "Exclusive Offers", 
      desc: "Get access to member-only deals",
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      benefits: ["Special Discounts", "Premium Services", "Partner Perks"]
    },
  ];

  // const stats = [
  //   { label: "Active Users", value: "50K+", icon: Activity },
  //   { label: "Appointments", value: "100K+", icon: Calendar },
  //   { label: "Secure & Trusted", value: "100%", icon: Shield },
  // ];

  return (
    <section className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 w-full bg-gradient-to-br from-blue-10 via-white to-teal-10 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center ">

 <span className="inline-block text-sm font-medium px-5 py-2 rounded-full bg-teal-50 text-teal-700">
        Your Healthcare Account
        </span>

          <p className="text-blue-700 text-[20px] font-medium text-4xl mt-6">
         Your Personal Healthcare Hub
          </p>
        <h1 className="text-gray-600 text-[24px] text-base font-normal mt-4 " >
            Create a free account and unlock powerful features to manage your health journey
          </h1>
         
        </div>

        {/* Stats */}
       

        {/* Feature Cards */}
        <div className="grid grid-cols-1 ml-9 mr-9 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-9">
          {features.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl p-9 border border-gray-200 hover:shadow-md transition-all duration-300 flex gap-3"
            >
              {/* Icon container */}
              <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}>
                <item.icon className="w-5 h-5 text-teal-700" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-base text-gray-600 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      

      </div>
    </section>
  );
}