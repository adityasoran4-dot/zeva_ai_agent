import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import DoctorLayout from "../../components/DoctorLayout";
import { Toaster, toast } from "react-hot-toast";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";
import Image from "next/image";
import {
  Plus,
  X,
  Heart,
  Building2,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Camera,
  Calendar,
  Activity,
  Clock,
  Stethoscope,
  BarChart3,
  TrendingUp,
  Star,
} from "lucide-react";
import { normalizeImagePath } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface User {
  name: string;
  email: string;
  phone: string;
}

interface TimeSlot {
  date: string;
  availableSlots: number;
  sessions: {
    morning: string[];
    evening: string[];
  };
}

interface TreatmentItem {
  mainTreatment: string;
  mainTreatmentSlug: string;
  subTreatments: Array<{
    name: string;
    slug: string;
    price?: number;
  }>;
}

interface DoctorProfile {
  user: string;
  degree: string;
  experience: number;
  address: string;
  treatments: TreatmentItem[];
  consultationFee: string;
  clinicContact: string;
  timeSlots: TimeSlot[];
  location?: {
    coordinates: [number, number];
  };
  photos?: string[];
}

interface DoctorData {
  user: User;
  doctorProfile: DoctorProfile;
}

interface DoctorStats {
  totalReviews: number;
  totalEnquiries: number;
  totalTreatments: number;
  totalSubTreatments: number;
  totalTimeSlots: number;
  totalPhotos: number;
}

interface FormData {
  userId: string;
  degree: string;
  experience: string;
  address: string;
  treatments: TreatmentItem[];
  consultationFee: string;
  clinicContact: string;
  phone: string;
  timeSlots: string;
  latitude: string;
  longitude: string;
}

interface TreatmentManagerProps {
  label: string;
  icon: React.ReactNode;
  items: TreatmentItem[];
  newItem: string;
  setNewItem: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  availableTreatments: Treatment[];
  showCustomInput: boolean;
  setShowCustomInput: (value: boolean) => void;
  onAddFromDropdown: (treatmentName: string) => void;
  onUpdateTreatment: (index: number, treatment: TreatmentItem) => void;
}

interface Treatment {
  _id: string;
  name: string;
  subcategories?: Array<{
    name: string;
    slug: string;
  }>;
}

interface Subcategory {
  name: string;
  slug: string;
}

const TreatmentManager = ({
  label,
  icon,
  items,
  newItem,
  setNewItem,
  onAdd,
  onRemove,
  availableTreatments,
  showCustomInput,
  setShowCustomInput,
  onAddFromDropdown,
  onUpdateTreatment,
}: TreatmentManagerProps) => {
  const [customSubTreatment, setCustomSubTreatment] = useState<string>("");
  const [customSubTreatmentPrice, setCustomSubTreatmentPrice] =
    useState<string>("");
  const [showSubTreatmentInput, setShowSubTreatmentInput] = useState<
    number | null
  >(null);
  const [showCustomSubTreatmentInput, setShowCustomSubTreatmentInput] =
    useState<number | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [selectedSubTreatment, setSelectedSubTreatment] = useState<{
    index: number;
    value: string;
  } | null>(null);

  const handleAddSubTreatment = async (mainTreatmentIndex: number) => {
    if (customSubTreatment.trim()) {
      const currentTreatment = items[mainTreatmentIndex];
      const newSubTreatment = {
        name: customSubTreatment.trim(),
        slug: customSubTreatment.trim().toLowerCase().replace(/\s+/g, "-"),
        price: Number(customSubTreatmentPrice) || 0,
      };

      // Only update local state, don't save to database immediately
      const updatedTreatment: TreatmentItem = {
        ...currentTreatment,
        subTreatments: [
          ...(currentTreatment.subTreatments || []),
          newSubTreatment,
        ],
      };

      onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
      setCustomSubTreatment("");
      setCustomSubTreatmentPrice("");
      setShowSubTreatmentInput(null);
      setShowCustomSubTreatmentInput(null);
    }
  };

  const handleRemoveSubTreatment = (
    mainTreatmentIndex: number,
    subTreatmentIndex: number
  ) => {
    const currentTreatment = items[mainTreatmentIndex];
    const updatedSubTreatments = currentTreatment.subTreatments.filter(
      (_, index) => index !== subTreatmentIndex
    );

    const updatedTreatment: TreatmentItem = {
      ...currentTreatment,
      subTreatments: updatedSubTreatments,
    };

    onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
  };

  const handleAddFromAvailableSubTreatments = (
    mainTreatmentIndex: number,
    subTreatmentName: string
  ) => {
    const currentTreatment = items[mainTreatmentIndex];
    const newSubTreatment = {
      name: subTreatmentName,
      slug: subTreatmentName.toLowerCase().replace(/\s+/g, "-"),
      price: 0, // Default price for available treatments
    };

    const updatedTreatment: TreatmentItem = {
      ...currentTreatment,
      subTreatments: [
        ...(currentTreatment.subTreatments || []),
        newSubTreatment,
      ],
    };

    onUpdateTreatment(mainTreatmentIndex, updatedTreatment);
  };

  const handleTreatmentSelection = (treatmentId: string) => {
    if (treatmentId === "custom") {
      setShowCustomInput(true);
      setSelectedTreatmentId("");
    } else if (treatmentId) {
      setSelectedTreatmentId(treatmentId);
    }
  };

  const handleAddSelectedTreatment = () => {
    if (selectedTreatmentId) {
      const selectedTreatment = availableTreatments.find(
        (t: Treatment) => t._id === selectedTreatmentId
      );
      if (selectedTreatment) {
        onAddFromDropdown(selectedTreatment.name);
        setSelectedTreatmentId("");
      }
    }
  };

  const handleSubTreatmentSelection = (
    mainTreatmentIndex: number,
    subTreatmentValue: string
  ) => {
    if (subTreatmentValue === "custom") {
      setShowCustomSubTreatmentInput(mainTreatmentIndex);
      setCustomSubTreatment("");
      setCustomSubTreatmentPrice("");
      setSelectedSubTreatment(null);
    } else if (subTreatmentValue) {
      setSelectedSubTreatment({
        index: mainTreatmentIndex,
        value: subTreatmentValue,
      });
    } else {
      setSelectedSubTreatment(null);
    }
  };

  const handleAddSelectedSubTreatment = () => {
    if (selectedSubTreatment) {
      handleAddFromAvailableSubTreatments(
        selectedSubTreatment.index,
        selectedSubTreatment.value
      );
      setSelectedSubTreatment(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">{icon}</div>
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        </div>
        <p className="text-sm text-gray-600">Select and manage treatments for this case.</p>
      </div>

      {/* Treatment Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
        {!showCustomInput ? (
          <div className="relative">
            <select
              onChange={(e) => handleTreatmentSelection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={selectedTreatmentId}
            >
              <option value="">Select a treatment</option>
              {availableTreatments?.map((treatment: Treatment) => (
                <option key={treatment._id} value={treatment._id}>
                  {treatment.name}
                </option>
              ))}
              <option value="custom">+ Add Custom Treatment</option>
            </select>
            {selectedTreatmentId && (
              <button
                type="button"
                onClick={handleAddSelectedTreatment}
                className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Add Selected Treatment
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter custom treatment name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setNewItem("");
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Selected Treatments */}
      <div className="space-y-3">
        {items?.map((item: TreatmentItem, index: number) => {
          const selectedTreatment = availableTreatments.find(
            (t: Treatment) => t.name === item.mainTreatment
          );

          return (
            <div
              key={index}
              className="border-2 rounded-xl p-4 bg-gradient-to-br from-teal-50 to-cyan-50 transition-all duration-300 hover:shadow-lg"
              style={{ borderColor: "#2D9AA5" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-semibold text-lg"
                  style={{ color: "#21737b" }}
                >
                  {item.mainTreatment}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-treatment Selection */}
              <div className="ml-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#21737b" }}
                  >
                    Sub-treatments:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSubTreatmentInput(index)}
                    className="px-3 py-1 text-white rounded-full text-xs transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: "#2D9AA5" }}
                    onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "#21737b")
                    }
                    onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "#2D9AA5")
                    }
                  >
                    + Add Sub-treatment
                  </button>
                </div>

                {/* Sub-treatment Input */}
                {showSubTreatmentInput === index && (
                  <div
                    className="bg-white/80 backdrop-blur-sm border rounded-lg p-3"
                    style={{ borderColor: "#2D9AA5" }}
                  >
                    <div className="flex gap-2 items-center">
                      <select
                        onChange={(e) => handleSubTreatmentSelection(index, e.target.value)}
                        className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm 
               focus:outline-none focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5] 
               transition-all duration-300"
                        value={
                          selectedSubTreatment?.index === index
                            ? selectedSubTreatment.value
                            : ""
                        }
                      >
                        <option value="">Select sub-treatment</option>
                        {selectedTreatment?.subcategories?.map((sub: Subcategory) => (
                          <option key={sub.slug} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom Sub-treatment</option>
                      </select>

                      {selectedSubTreatment?.index === index && selectedSubTreatment.value && (
                        <button
                          type="button"
                          onClick={handleAddSelectedSubTreatment}
                          className="px-3 py-2 text-white rounded-lg text-xs transition-all duration-300 
                 hover:shadow-lg transform hover:scale-105"
                          style={{ backgroundColor: "#2D9AA5" }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLButtonElement).style.backgroundColor = "#21737b")
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLButtonElement).style.backgroundColor = "#2D9AA5")
                          }
                        >
                          Add
                        </button>
                      )}

                      {showCustomSubTreatmentInput === index && (
                        <>
                          <input
                            type="text"
                            value={customSubTreatment}
                            onChange={(e) => setCustomSubTreatment(e.target.value)}
                            className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm 
                   focus:outline-none focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5] 
                   transition-all duration-300"
                            placeholder="Custom sub-treatment name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubTreatment(index);
                              }
                            }}
                          />
                          <input
                            type="number"
                            min="0"
                            value={customSubTreatmentPrice}
                            onChange={(e) => setCustomSubTreatmentPrice(e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm ml-2 
                   focus:outline-none focus:border-[#2D9AA5] focus:ring-2 focus:ring-[#2D9AA5]"
                            placeholder="Price"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubTreatment(index);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubTreatment(index)}
                            className="px-3 py-2 text-white rounded-lg text-xs transition-all duration-300 
                   hover:shadow-lg transform hover:scale-105"
                            style={{ backgroundColor: "#2D9AA5" }}
                            onMouseEnter={(e) =>
                              ((e.target as HTMLButtonElement).style.backgroundColor = "#21737b")
                            }
                            onMouseLeave={(e) =>
                              ((e.target as HTMLButtonElement).style.backgroundColor = "#2D9AA5")
                            }
                          >
                            Add
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowSubTreatmentInput(null);
                          setShowCustomSubTreatmentInput(null);
                          setCustomSubTreatment("");
                          setCustomSubTreatmentPrice("");
                          setSelectedSubTreatment(null);
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 
               transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                )}

                {/* Existing Sub-treatments */}
                {item.subTreatments && item.subTreatments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.subTreatments.map((subTreatment, subIndex) => (
                      <span
                        key={subIndex}
                        className="inline-flex items-center gap-2 px-3 py-1 text-white text-sm rounded-full transition-all duration-300 hover:shadow-lg"
                        style={{ backgroundColor: "#2D9AA5" }}
                      >
                        {subTreatment.name}
                        <input
                          type="number"
                          min="0"
                          value={subTreatment.price ?? 0}
                          onChange={(e) => {
                            const updatedSubTreatments = item.subTreatments.map(
                              (st, i) =>
                                i === subIndex
                                  ? { ...st, price: Number(e.target.value) }
                                  : st
                            );
                            onUpdateTreatment(index, {
                              ...item,
                              subTreatments: updatedSubTreatments,
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs ml-2 bg-white text-black"
                          placeholder="Price"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSubTreatment(index, subIndex)
                          }
                          className="text-white/80 hover:text-white p-0.5 rounded-full hover:bg-white/20 transition-all duration-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function DoctorDashboard() {
  const [data, setData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [doctorStats, setDoctorStats] = useState<DoctorStats>({
    totalReviews: 0,
    totalEnquiries: 0,
    totalTreatments: 0,
    totalSubTreatments: 0,
    totalTimeSlots: 0,
    totalPhotos: 0,
  });
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [form, setForm] = useState<FormData>({
    userId: "",
    degree: "",
    experience: "",
    address: "",
    treatments: [],
    consultationFee: "",
    clinicContact: "",
    phone: "",
    timeSlots: "",
    latitude: "",
    longitude: "",
  });
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [_photoError, setPhotoError] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [geocodingStatus, setGeocodingStatus] = useState<string>("");
  const addressDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCustomTreatmentInput, setShowCustomTreatmentInput] =
    useState(false);
  const [newTreatment, setNewTreatment] = useState("");

  const reviewChartData = useMemo(
    () => [
      { name: "Reviews", value: doctorStats.totalReviews },
      { name: "Enquiries", value: doctorStats.totalEnquiries },
    ],
    [doctorStats.totalReviews, doctorStats.totalEnquiries]
  );

  const distributionChartData = useMemo(
    () => [
      { name: "Treatments", value: doctorStats.totalTreatments },
      { name: "Sub-Treatments", value: doctorStats.totalSubTreatments },
      { name: "Time Slots", value: doctorStats.totalTimeSlots },
    ],
    [
      doctorStats.totalTreatments,
      doctorStats.totalSubTreatments,
      doctorStats.totalTimeSlots,
    ]
  );
  const distributionColors = ["#3b82f6", "#8b5cf6", "#f59e0b"];


  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await axios.get("/api/doctor/getTreatment");
        setTreatments(res.data.treatments || []);
      } catch {
        console.error("Error fetching treatments");
      }
    };
    fetchTreatments();
  }, []);

  useEffect(() => {
    const fetchDoctorData = async () => {
      const token = localStorage.getItem("doctorToken");
      if (!token) {
        setError("Not authorized");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/api/doctor/manage", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(res.data);

        const parsedSlots = res.data.doctorProfile?.timeSlots || [];
        setTimeSlots(parsedSlots);
        const treatmentsList = res.data.doctorProfile?.treatments || [];
        const totalSubTreatments = treatmentsList.reduce(
          (sum: number, treatment: TreatmentItem) =>
            sum + (treatment.subTreatments?.length || 0),
          0
        );
        setDoctorStats((prev) => ({
          ...prev,
          totalTreatments: treatmentsList.length,
          totalSubTreatments,
          totalTimeSlots: parsedSlots.length,
          totalPhotos: res.data.doctorProfile?.photos?.length || 0,
        }));

        setForm({
          userId: res.data.doctorProfile?.user || "",
          degree: res.data.doctorProfile?.degree || "",
          experience: res.data.doctorProfile?.experience?.toString() || "",
          address: res.data.doctorProfile?.address || "",
          treatments: res.data.doctorProfile?.treatments || [],
          consultationFee: res.data.doctorProfile?.consultationFee || "",
          clinicContact: res.data.doctorProfile?.clinicContact || "",
          phone: res.data.user?.phone || "",
          timeSlots: JSON.stringify(parsedSlots),
          latitude:
            res.data.doctorProfile?.location?.coordinates?.[1]?.toString() ||
            "",
          longitude:
            res.data.doctorProfile?.location?.coordinates?.[0]?.toString() ||
            "",
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          err !== null &&
          "response" in err
        ) {
          // @ts-expect-error: err.response may not be typed
          setError(err.response?.data?.message || "Failed to load data");
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, []);

  useEffect(() => {
    const fetchDoctorStats = async () => {
      const token = localStorage.getItem("doctorToken");
      if (!token) {
        setStatsLoading(false);
        return;
      }
      try {
        setStatsLoading(true);
        const res = await axios.get("/api/doctor/dashbaordStats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.success) {
          setDoctorStats((prev) => ({
            ...prev,
            totalReviews: res.data.totalReviews || 0,
            totalEnquiries: res.data.totalEnquiries || 0,
          }));
        }
      } catch (err) {
        console.error("Error fetching doctor stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDoctorStats();
  }, []);

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      date: "",
      availableSlots: 0,
      sessions: { morning: [], evening: [] },
    };
    const updated = [...timeSlots, newSlot];
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const removeTimeSlot = (index: number) => {
    const updated = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const updateTimeSlot = (
    index: number,
    field: string,
    value: string | number | string[]
  ) => {
    const updated = [...timeSlots];
    if (field === "sessions.morning" || field === "sessions.evening") {
      const session = field.split(".")[1] as "morning" | "evening";
      updated[index].sessions[session] = (
        typeof value === "string"
          ? value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          : value
      ) as string[];
    } else {
      if (field === "date") {
        updated[index].date = value as string;
      } else if (field === "availableSlots") {
        updated[index].availableSlots = Number(value);
      }
    }
    setTimeSlots(updated);
    setForm({ ...form, timeSlots: JSON.stringify(updated) });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check all selected files for size
      const tooLarge = Array.from(e.target.files).some(
        (file) => (file as File).size > 1024 * 1024
      );
      if (tooLarge) {
        setPhotoError(
          "File is too large and you have to upload file less than one mb only"
        );
        setPhotoFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setPhotoFiles(e.target.files);
        setPhotoError("");
      }
    }
  };

  const clearPhotoFiles = () => {
    setPhotoFiles(null);
    setPhotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addTreatment = () => {
    const trimmed = newTreatment.trim();
    if (trimmed && !form.treatments?.some((t) => t.mainTreatment === trimmed)) {
      setForm((prev) => ({
        ...prev,
        treatments: [
          ...(prev.treatments || []),
          {
            mainTreatment: trimmed,
            mainTreatmentSlug: trimmed.toLowerCase().replace(/\s+/g, "-"),
            subTreatments: [],
          },
        ],
      }));
    }
    setNewTreatment("");
    setShowCustomTreatmentInput(false);
  };

  const addTreatmentFromDropdown = (treatmentName: string) => {
    if (
      treatmentName &&
      !form.treatments?.some((t) => t.mainTreatment === treatmentName)
    ) {
      setForm((prev) => ({
        ...prev,
        treatments: [
          ...(prev.treatments || []),
          {
            mainTreatment: treatmentName,
            mainTreatmentSlug: treatmentName.toLowerCase().replace(/\s+/g, "-"),
            subTreatments: [],
          },
        ],
      }));
    }
  };

  const removeTreatment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      treatments: prev.treatments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleUpdateTreatment = (index: number, updatedTreatment: TreatmentItem) => {
    setForm((prev) => ({
      ...prev,
      treatments:
        prev.treatments?.map((treatment, i) =>
          i === index ? updatedTreatment : treatment
        ) || [],
    }));
  };

  // Geocode address and update coordinates in form
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    setGeocodingStatus("Locating address...");
    try {
      const res = await axios.get("/api/clinics/geocode", {
        params: { place: address },
      });
      if (
        res.data &&
        typeof res.data.lat === "number" &&
        typeof res.data.lng === "number"
      ) {
        setForm((prev) => ({
          ...prev,
          latitude: res.data.lat.toString(),
          longitude: res.data.lng.toString(),
        }));
        setGeocodingStatus("Address located on map!");
        setTimeout(() => setGeocodingStatus(""), 2000);
      } else {
        setGeocodingStatus(
          "Could not locate address. Please check the address."
        );
        setTimeout(() => setGeocodingStatus(""), 4000);
      }
    } catch {
      setGeocodingStatus("Geocoding failed. Please check the address.");
      setTimeout(() => setGeocodingStatus(""), 4000);
    }
  };

  // Enhanced address change handler with debounce and geocoding
  const handleAddressChangeWithGeocode = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, address: value }));
    if (addressDebounceTimer.current)
      clearTimeout(addressDebounceTimer.current);
    if (value.trim().length > 10) {
      addressDebounceTimer.current = setTimeout(() => {
        geocodeAddress(value);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("doctorToken");
    const formData = new FormData();

    // First, save any custom treatments to the database
    if (form.treatments && form.treatments.length > 0) {
      for (const treatment of form.treatments) {
        // Check if this is a custom treatment (not in available treatments)
        const isCustomTreatment = !treatments.some(
          (t: Treatment) => t.name === treatment.mainTreatment
        );

        if (isCustomTreatment) {
          try {
            await axios.post(
              "/api/doctor/add-custom-treatment",
              {
                mainTreatment: treatment.mainTreatment,
                subTreatments: treatment.subTreatments || [],
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (error) {
            console.error("Error saving custom treatment:", error);
            // Continue with form submission even if custom treatment save fails
          }
        }
      }
    }

    Object.entries(form).forEach(([key, value]) => {
      if (key === "treatments") {
        formData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });

    if (photoFiles) {
      Array.from(photoFiles).forEach((file) => {
        formData.append("photos", file as Blob);
      });
    }

    try {
      const res = await axios.put("/api/doctor/edit-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      setData({ ...data!, doctorProfile: res.data.profile });

      // Update doctorUser in localStorage with new photo if available
      if (res.data.profile?.photos?.[0]) {
        try {
          const userData = JSON.parse(localStorage.getItem("doctorUser") || "{}");
          userData.photo = res.data.profile.photos[0];
          localStorage.setItem("doctorUser", JSON.stringify(userData));
        } catch (e) {
          console.error("Failed to update localStorage with photo", e);
        }
      }
    } catch {
      toast.error("Please update at least one field.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-black">
            Loading doctor details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-black">No data available</p>
        </div>
      </div>
    );
  }

  const { user, doctorProfile } = data;
  const primaryPhoto = doctorProfile.photos?.[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {!isEditing ? (
          <>
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-4 border-gray-100 bg-gray-50">
                      {primaryPhoto ? (
                        <Image src={normalizeImagePath(primaryPhoto)} alt={user.name} width={120} height={120} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Stethoscope className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    {doctorStats.totalPhotos > 1 && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm">
                        +{doctorStats.totalPhotos - 1} more
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Doctor Profile</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                      Dr. {user.name}
                    </h1>
                    <p className="text-xs text-gray-600 break-words">
                      {doctorProfile.degree || "Qualification not added"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {doctorProfile.experience || 0} yrs experience
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {doctorProfile.address || "Address not provided"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-gray-700" />
                <h2 className="text-base font-bold text-gray-900">Statistics Overview</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <StatCard icon={<Star className="w-5 h-5" />} label="Reviews" value={doctorStats.totalReviews} color="text-yellow-600" bgColor="bg-yellow-50" borderColor="border-yellow-200" loading={statsLoading} />
                <StatCard icon={<Mail className="w-5 h-5" />} label="Enquiries" value={doctorStats.totalEnquiries} color="text-blue-600" bgColor="bg-blue-50" borderColor="border-blue-200" loading={statsLoading} />
                <StatCard icon={<Heart className="w-5 h-5" />} label="Treatments" value={doctorStats.totalTreatments} color="text-rose-600" bgColor="bg-rose-50" borderColor="border-rose-200" />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Sub-Treatments" value={doctorStats.totalSubTreatments} color="text-purple-600" bgColor="bg-purple-50" borderColor="border-purple-200" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Time Slots" value={doctorStats.totalTimeSlots} color="text-emerald-600" bgColor="bg-emerald-50" borderColor="border-emerald-200" />
                <StatCard icon={<Camera className="w-5 h-5" />} label="Gallery" value={doctorStats.totalPhotos} color="text-gray-700" bgColor="bg-gray-50" borderColor="border-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Email</p>
                        <p className="text-sm text-gray-900 break-words">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Phone</p>
                        <p className="text-sm text-gray-900">{user.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Clinic Contact</p>
                        <p className="text-sm text-gray-900">{doctorProfile.clinicContact || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Consultation Fee</p>
                        <p className="text-sm text-gray-900">AED {doctorProfile.consultationFee || "0"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="text-lg font-bold text-gray-900">{doctorProfile.experience || 0} years</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-900 break-words">{doctorProfile.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {doctorProfile.treatments && doctorProfile.treatments.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Treatments Offered</h3>
                    <div className="space-y-2">
                      {doctorProfile.treatments.map((treatment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <p className="font-semibold text-sm text-gray-900">{treatment.mainTreatment}</p>
                          {treatment.subTreatments && treatment.subTreatments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] text-gray-500 mb-1">Sub-treatments</p>
                              <div className="flex flex-wrap gap-1.5">
                                {treatment.subTreatments.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-[10px] text-gray-700"
                                  >
                                    {sub.name}
                                    {typeof sub.price === "number" && sub.price > 0 && (
                                      <>
                                        {" "}
                                        - <span className="text-blue-600 font-semibold">د.إ{sub.price}</span>
                                      </>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doctorProfile.photos && doctorProfile.photos.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Profile Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {doctorProfile.photos.map((photo, index) => (
                        <div key={index} className="w-full h-28 sm:h-32 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <Image src={normalizeImagePath(photo)} alt={`Photo ${index + 1}`} width={200} height={200} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Time Slots</h3>
                  </div>
                  {timeSlots && timeSlots.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900">{slot.date || `Slot ${index + 1}`}</p>
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                              {slot.availableSlots} slots
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {slot.sessions.morning.length > 0 && (
                              <div>
                                <p className="text-gray-600 font-medium">Morning</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {slot.sessions.morning.map((session, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                      {session}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {slot.sessions.evening.length > 0 && (
                              <div>
                                <p className="text-gray-600 font-medium">Evening</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {slot.sessions.evening.map((session, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                                      {session}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No time slots available</p>
                  )}
                </div>

              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Analytics & Insights</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Reviews & Enquiries</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={reviewChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Offerings Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={distributionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {distributionChartData.map((_, idx) => (
                          <Cell
                            key={`distribution-${idx}`}
                            fill={distributionColors[idx % distributionColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <SummaryCard
                  title="Engagement"
                  value={doctorStats.totalReviews + doctorStats.totalEnquiries}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <SummaryCard
                  title="Treatments"
                  value={doctorStats.totalTreatments}
                  icon={<Heart className="w-5 h-5" />}
                  color="rose"
                />
                <SummaryCard
                  title="Sessions"
                  value={doctorStats.totalTimeSlots}
                  icon={<Clock className="w-5 h-5" />}
                  color="yellow"
                />
                <SummaryCard
                  title="Gallery Items"
                  value={doctorStats.totalPhotos}
                  icon={<Camera className="w-5 h-5" />}
                  color="green"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
                <p className="text-xs text-gray-600">Update your professional information</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-base font-semibold text-black mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    "degree",
                    "experience",
                    "consultationFee",
                    "clinicContact",
                  ].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-black mb-1.5 capitalize">
                        {field
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </label>

                      {/* Add description just above clinicContact input */}
                      {field === "clinicContact" && (
                        <p className="text-[10px] text-gray-500 mb-1">
                          This contact will help you get in touch with patients
                          professionally.
                        </p>
                      )}

                      <input
                        name={field}
                        type={
                          field === "experience" || field === "consultationFee"
                            ? "number"
                            : "text"
                        }
                        value={form[field as keyof FormData] as string}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-black bg-white text-sm ${field === "phone"
                            ? "cursor-not-allowed bg-gray-100"
                            : ""
                          }`}
                        placeholder={`Enter ${field
                          .replace(/([A-Z])/g, " $1")
                          .toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Address and Location */}
              <div>
                <h3 className="text-base font-semibold text-black mb-3">
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Address
                    </label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleAddressChangeWithGeocode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-sm"
                      placeholder="Enter address"
                    />
                    {geocodingStatus && (
                      <span className="text-green-600 text-[10px] ml-2">
                        {geocodingStatus}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Latitude
                    </label>
                    <input
                      name="latitude"
                      value={form.latitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed text-sm"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1.5">
                      Longitude
                    </label>
                    <input
                      name="longitude"
                      value={form.longitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed text-sm"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>
              </div>

              {/* Treatments */}
              <div>
                <h3 className="text-base font-semibold text-black mb-3">
                  Treatments
                </h3>
                <TreatmentManager
                  label="Treatments"
                  icon={<Heart className="w-4 h-4" />}
                  items={form.treatments || []}
                  newItem={newTreatment}
                  setNewItem={setNewTreatment}
                  onAdd={addTreatment}
                  onRemove={removeTreatment}
                  availableTreatments={treatments}
                  showCustomInput={showCustomTreatmentInput}
                  setShowCustomInput={setShowCustomTreatmentInput}
                  onAddFromDropdown={addTreatmentFromDropdown}
                  onUpdateTreatment={handleUpdateTreatment}
                />
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
                  <h3 className="text-base font-semibold text-black">
                    Time Slots
                  </h3>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
                  >
                    + Add Slot
                  </button>
                </div>

                <div className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-sm text-black">
                          Time Slot {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">
                            Date
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 4 July"
                            value={slot.date}
                            onChange={(e) =>
                              updateTimeSlot(index, "date", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-sm placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">
                            Available Slots
                          </label>
                          <input
                            type="number"
                            placeholder="Number of slots"
                            value={slot.availableSlots}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "availableSlots",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-sm placeholder-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">
                            Morning Sessions
                          </label>
                          <input
                            type="text"
                            placeholder="09:00 AM - 09:30 AM"
                            value={slot.sessions.morning.join(", ")}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "sessions.morning",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-sm placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">
                            Evening Sessions
                          </label>
                          <input
                            type="text"
                            placeholder="06:00 PM - 06:30 PM"
                            value={slot.sessions.evening.join(", ")}
                            onChange={(e) =>
                              updateTimeSlot(
                                index,
                                "sessions.evening",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-sm placeholder-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">
                    Doctor Profile
                  </label>

                  {/* Image Preview Area */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Current Photos - Shown if no new selection */}
                    {doctorProfile.photos && doctorProfile.photos.length > 0 && !photoFiles && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-100 shadow-sm">
                        <Image
                          src={normalizeImagePath(doctorProfile.photos[0])}
                          alt="Current profile"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 py-0.5 text-center">
                          <span className="text-[10px] text-white font-bold">Current</span>
                        </div>
                      </div>
                    )}

                    {/* New Selection Previews */}
                    {photoFiles && Array.from(photoFiles).map((file, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-green-200 shadow-md animate-in fade-in zoom-in duration-300">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="New preview"
                          className="w-full h-full object-cover"
                                                  />
                        <div className="absolute top-0 right-0 p-1">
                          <div className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-green-600/80 py-0.5 text-center">
                          <span className="text-[10px] text-white font-bold">New</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="photos"
                      accept=".jpg,.jpeg,.png,.gif"
                      multiple
                      onChange={handlePhotoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200 text-black text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {photoFiles && photoFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPhotoFiles}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                        title="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  borderColor: string;
  loading?: boolean;
}

const StatCard = ({ icon, label, value, color, bgColor, borderColor, loading }: StatCardProps) => (
  <div className={`bg-white rounded-lg p-3 border ${borderColor} ${bgColor} shadow-sm`}>
    <div className={`flex items-center gap-2 mb-1 ${color}`}>
      {icon}
      <span className="text-[10px] font-bold text-gray-700 uppercase">{label}</span>
    </div>
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500" />
        <span className="text-[10px] text-gray-500">Loading...</span>
      </div>
    ) : (
      <p className="text-xl font-bold text-gray-900">{value}</p>
    )}
  </div>
);

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "rose" | "yellow" | "green";
}

const SummaryCard = ({ title, value, icon, color }: SummaryCardProps) => {
  const colorClasses = {
    blue: {
      border: "border-blue-200",
      text: "text-blue-600",
      bg: "bg-blue-50",
    },
    rose: {
      border: "border-rose-200",
      text: "text-rose-600",
      bg: "bg-rose-50",
    },
    yellow: {
      border: "border-yellow-200",
      text: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    green: {
      border: "border-green-200",
      text: "text-green-600",
      bg: "bg-green-50",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`bg-white rounded-lg p-3 border ${classes.border} shadow-sm`}>
      <div className={`flex items-center gap-2 mb-1 ${classes.text}`}>
        {icon}
        <span className="text-[10px] font-bold text-gray-700 uppercase">{title}</span>
      </div>
      <p className={`text-base font-bold ${classes.text}`}>{value}</p>
    </div>
  );
};

DoctorDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withDoctorAuth(DoctorDashboard);

// Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = DoctorDashboard.getLayout;

export default ProtectedDashboard;