import React, { useMemo, useState } from "react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import dayjs from "dayjs";
import dynamic from "next/dynamic";

const DepartmentReport = dynamic(() => import("../../components/reports/DepartmentReport"), { ssr: false });
const PackageReport = dynamic(() => import("../../components/reports/PackageReport"), { ssr: false });
const MembershipReport = dynamic(() => import("../../components/reports/MembershipReport"), { ssr: false });
const AppointmentReport = dynamic(() => import("../../components/reports/AppointmentReport"), { ssr: false });
const PatientReport = dynamic(() => import("../../components/reports/PatientReport"), { ssr: false });
const LeadReport = dynamic(() => import("../../components/reports/LeadReport"), { ssr: false });
const DoctorStaffReport = dynamic(() => import("../../components/reports/DoctorStaffReport"), { ssr: false });
const RevenueReport = dynamic(() => import("../../components/reports/RevenueReport"), { ssr: false });
const RoomResourceReport = dynamic(() => import("../../components/reports/RoomResourceReport"), { ssr: false });
const StockReport = dynamic(() => import("../../components/reports/StockReport"), { ssr: false });
const OfferTrackReport = dynamic(() => import("../../components/reports/OfferTrackReport"), { ssr: false });

const TAB_CONFIG = {
  department: { label: "Department", color: "bg-teal-800 hover:bg-teal-900" },
  package: { label: "Package", color: "bg-teal-800 hover:bg-teal-900" },
  membership: { label: "Membership", color: "bg-teal-800 hover:bg-teal-900" },
  appointment: { label: "Appointment", color: "bg-teal-800 hover:bg-teal-900" },
  patient: { label: "Patient", color: "bg-teal-800 hover:bg-teal-900" },
  lead: { label: "Lead", color: "bg-teal-800 hover:bg-teal-900" },
  doctorStaff: { label: "Doctor Staff", color: "bg-teal-800 hover:bg-teal-900" },
  revenue: { label: "Revenue", color: "bg-teal-800 hover:bg-teal-900" },
  rooms: { label: "Rooms", color: "bg-teal-800 hover:bg-teal-900" },
  stock: { label: "Stock", color: "bg-teal-800 hover:bg-teal-900" },
  offerTrack: { label: "Offer Track", color: "bg-teal-800 hover:bg-teal-900" },
};

function ReportPage() {
  const [activeTab, setActiveTab] = useState<
    "department" | "package" | "membership" | "appointment" | "patient" | "lead" | "doctorStaff" | "rooms" | "revenue" | "stock" | "offerTrack"
  >("department");
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("clinicToken") ||
        sessionStorage.getItem("clinicToken") ||
        localStorage.getItem("agentToken") ||
        sessionStorage.getItem("agentToken") ||
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken")
      : "";

  const headers = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    }),
    [token]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Responsive */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[90%] sm:max-w-9xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">View detailed performance metrics and insights</p>
            </div>
            <div className="bg-blue-50 rounded-lg px-3 sm:px-4 py-2 border border-blue-100 w-full sm:w-auto">
              <div className="text-xs text-gray-600 font-medium">Date Range</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-900">
                {dayjs(startDate).format("MMM DD, YYYY")} - {dayjs(endDate).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90%] sm:max-w-9xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Date Filter & Tabs Container - Responsive */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
          {/* Tabs Navigation - Scrollable on Mobile */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-3 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                {Object.entries(TAB_CONFIG).map(([key, config]) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`group px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? `${config.color} text-white shadow-md`
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date Range Selector - Stacked on Mobile */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 italic w-full sm:w-auto text-center sm:text-left">
                Select date range to view analytics
              </div>
            </div>
          </div>
        </div>

        {/* Report Content - Responsive */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-6 min-h-[500px] sm:min-h-[600px] overflow-x-auto">
          {activeTab === "department" && <DepartmentReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "package" && <PackageReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "membership" && <MembershipReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "appointment" && <AppointmentReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "patient" && <PatientReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "lead" && <LeadReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "doctorStaff" && <DoctorStaffReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "revenue" && <RevenueReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "rooms" && <RoomResourceReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "stock" && <StockReport startDate={startDate} endDate={endDate} headers={headers} />}
                    {activeTab === "offerTrack" && <OfferTrackReport startDate={startDate} endDate={endDate} headers={headers} />}
        </div>
      </div>
    </div>
  );
}

ReportPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const Protected = withClinicAuth(ReportPage as any);
(Protected as any).getLayout = ReportPage.getLayout;

export default Protected;
