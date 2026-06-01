"use client";
import React, { useState } from "react";
import { ModernScheduler } from "../../components/clinic/ModernScheduler";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import type { NextPageWithLayout } from "../_app";
import { Calendar, Clock, Users, Building2 } from "lucide-react";

const ModernSchedulerDemo: NextPageWithLayout = () => {
  const [viewMode, setViewMode] = useState<"doctors" | "rooms" | "both">("both");

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken")
        : null;
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-100 dark:via-gray-50 dark:to-gray-100 p-6">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-gray-50 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-300 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Modern Appointment Scheduler
              </h1>
              <p className="text-gray-600 dark:text-gray-700">
                Experience our new calendar-based scheduling system with a clean, minimal UI
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-700">View:</span>
              <button
                onClick={() => setViewMode("doctors")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "doctors"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-300"
                }`}
              >
                Doctors
              </button>
              <button
                onClick={() => setViewMode("rooms")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "rooms"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-300"
                }`}
              >
                Rooms
              </button>
              <button
                onClick={() => setViewMode("both")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "both"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-300"
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-100/50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-700" />
              <div>
                <div className="text-xs font-semibold text-blue-800 dark:text-blue-900">Calendar View</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-700">Time-based grid layout</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-100/50 rounded-xl">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-700" />
              <div>
                <div className="text-xs font-semibold text-purple-800 dark:text-purple-900">Real-time</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-700">Instant updates</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-100/50 rounded-xl">
              <Users className="w-5 h-5 text-green-600 dark:text-green-700" />
              <div>
                <div className="text-xs font-semibold text-green-800 dark:text-green-900">Smart Filters</div>
                <div className="text-[10px] text-green-600 dark:text-green-700">Advanced search</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-100/50 rounded-xl">
              <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-700" />
              <div>
                <div className="text-xs font-semibold text-orange-800 dark:text-orange-900">Color Coding</div>
                <div className="text-[10px] text-orange-600 dark:text-orange-700">Custom statuses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Scheduler Component */}
      <div className="max-w-7xl mx-auto">
        <ModernScheduler
          initialDate={new Date().toISOString().split("T")[0]}
          viewMode={viewMode}
          getAuthHeaders={getAuthHeaders}
          enableDragDrop={true}
          showColorSettings={true}
          onBookAppointment={(appointment) => {
            console.log("✅ New appointment booked:", appointment);
          }}
          onEditAppointment={(appointment) => {
            console.log("✏️ Editing appointment:", appointment);
          }}
        />
      </div>

      {/* Usage Instructions */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-md border border-gray-200 dark:border-gray-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-4">
            How to Use the Scheduler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-700 mb-2">
                📅 Book an Appointment
              </h3>
              <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-800">
                <li>1. Click any empty time slot</li>
                <li>2. Select patient or add new</li>
                <li>3. Fill in appointment details</li>
                <li>4. Click "Book Appointment"</li>
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-700 mb-2">
                🔍 Filter Appointments
              </h3>
              <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-800">
                <li>1. Use search bar for patients</li>
                <li>2. Filter by doctor or room</li>
                <li>3. Filter by status</li>
                <li>4. Clear all with one click</li>
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-700 mb-2">
                🎨 Customize Colors
              </h3>
              <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-800">
                <li>1. Click "Colors" button</li>
                <li>2. Choose status to customize</li>
                <li>3. Pick your preferred colors</li>
                <li>4. Save your preferences</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ModernSchedulerDemo.getLayout = function getLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export default withClinicAuth(ModernSchedulerDemo);
