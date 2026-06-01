"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import useClinicBranches from "@/hooks/useClinicBranches";
import useClinicDoctors from "@/hooks/useClinicDoctors";

interface FilterData {
  branch: string;
  doctor: string;
  room: string;
  materialConsumptionNo: string;
  fromDate: string;
  toDate: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterData) => void;
  filterData: FilterData;
  setFilterData: React.Dispatch<React.SetStateAction<FilterData>>;
  title?: string;
}

const FilterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApply,
  filterData,
  setFilterData,
  title = "Advanced Filter",
}) => {
  const { clinicBranches } = useClinicBranches();
  const { doctors } = useClinicDoctors();
  const token = getTokenByPath() || "";
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (filterData.branch) {
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [filterData.branch]);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await axios.get(
        `/api/clinic/rooms?branchId=${filterData.branch}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRooms(res.data?.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClear = () => {
    setFilterData({
      branch: "",
      doctor: "",
      room: "",
      materialConsumptionNo: "",
      fromDate: "",
      toDate: "",
      status: "",
    });
  };

  const handleApply = () => {
    onApply(filterData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Filter your material consumption records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Branch
              </label>
              <select
                value={filterData.branch}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    branch: e.target.value,
                    room: "", // Clear room when branch changes
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Branches</option>
                {clinicBranches?.map((branch: any) => (
                  <option key={branch?._id} value={branch?._id}>
                    {branch?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Doctor
              </label>
              <select
                value={filterData.doctor}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    doctor: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Doctors</option>
                {doctors?.map((doctor: any) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Room
              </label>
              <select
                value={filterData.room}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    room: e.target.value,
                  }))
                }
                disabled={!filterData.branch || roomsLoading}
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {roomsLoading
                    ? "Loading rooms..."
                    : !filterData.branch
                      ? "Select branch first"
                      : "All Rooms"}
                </option>
                {rooms?.map((room: any) => (
                  <option key={room._id} value={room._id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Status
              </label>
              <select
                value={filterData.status}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Verified">Verified</option>
                <option value="Deleted">Deleted</option>
              </select>
            </div>

            {/* MC Number Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Material Consumption No
              </label>
              <input
                type="text"
                value={filterData.materialConsumptionNo}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    materialConsumptionNo: e.target.value,
                  }))
                }
                placeholder="Enter MC number"
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                From Date
              </label>
              <input
                type="date"
                value={filterData.fromDate}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                To Date
              </label>
              <input
                type="date"
                value={filterData.toDate}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    toDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
