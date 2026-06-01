// pages/lead/offers.jsx
import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Package, TrendingUp, Calendar, DollarSign } from "lucide-react";
import CreateOfferModal from "../../../components/CreateOfferModal";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editingOfferData, setEditingOfferData] = useState(null);
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: undefined, // undefined means not loaded yet
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : "";

  // Fetch permissions
  const fetchPermissions = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/doctor/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p?.module) return false;
          if (p.module === "create_offers") return true;
          if (p.module === "clinic_create_offers") return true;
          if (p.module.startsWith("clinic_") && p.module.slice(7) === "create_offers") {
            return true;
          }
          return false;
        });
        if (modulePermission) {
          const actions = modulePermission.actions || {};
          setPermissions({
            canCreate: actions.all === true || actions.create === true,
            canUpdate: actions.all === true || actions.update === true,
            canDelete: actions.all === true || actions.delete === true,
            canRead: actions.all === true || actions.read === true,
          });
        } else {
          // No permissions found, default to false
          setPermissions({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canRead: false,
          });
        }
      } else {
        // API failed, default to false
        setPermissions({
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canRead: false,
        });
      }
      setPermissionsLoaded(true);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      // On error, default to false
      setPermissions({
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canRead: false,
      });
      setPermissionsLoaded(true);
    }
  };

  // Fetch all offers
  const fetchOffers = async () => {
    if (!token) return;
    
    // Wait for permissions to load
    if (!permissionsLoaded) return;
    
    // Check if user has read permission
    if (permissions.canRead === false) {
      setOffers([]);
      return;
    }

    // Serve instantly from cache if available
    try {
      const cached = sessionStorage.getItem("offersCache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setOffers(parsed);
      }
    } catch {}

    try {
      const res = await fetch("/api/lead-ms/get-create-offer", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const next = data.offers || [];
        setOffers(next);
        try { sessionStorage.setItem("offersCache", JSON.stringify(next)); } catch {}
      } else {
        // If permission denied, clear offers
        if (data.message && data.message.includes("permission")) {
          setOffers([]);
        }
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
      // keep whatever is shown (cached) to avoid flash
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [token]);

  useEffect(() => {
    // Fetch offers after permissions are loaded
    if (permissionsLoaded) {
      fetchOffers();
    }
  }, [permissionsLoaded, permissions.canRead]);

  const openEditModal = async (offerId) => {
    if (!token) return alert("Not authorized!");
    if (!permissions.canUpdate) {
      alert("You do not have permission to update offers");
      return;
    }
    setEditingOfferId(offerId);
    setModalOpen(true);

    try {
      const res = await fetch(`/api/lead-ms/update-offer?id=${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEditingOfferData(data.offer);
      } else {
        alert(data.message || "Failed to fetch offer");
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setModalOpen(false);
    }
  };

  const handleOfferSaved = (offer, isUpdate) => {
    if (isUpdate) {
      setOffers((prev) => prev.map((o) => (o._id === offer._id ? offer : o)));
    } else {
      setOffers((prev) => [offer, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!permissions.canDelete) {
      alert("You do not have permission to delete offers");
      return;
    }
    if (!confirm("Are you sure you want to delete this offer?")) return;
    if (!token) return alert("Not authorized!");

    try {
      const res = await fetch(`/api/lead-ms/delete-create-offer?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o._id !== id));
      } else {
        alert(data.message || "Failed to delete offer");
      }
    } catch (err) {
      console.error("Error deleting offer:", err);
      alert("Server error");
    }
  };

  // Calculate stats
  const activeOffers = offers.filter((o) => o.status === "active").length;
  const totalValue = offers.reduce((sum, o) => {
    if (o.type === "fixed") return sum + (o.value || 0);
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-0.5">Offers Management</h1>
              <p className="text-gray-600 text-xs">Create and manage promotional offers for your clinic</p>
            </div>
            {permissions.canCreate && (
              <button
                onClick={() => {
                  setEditingOfferId(null);
                  setEditingOfferData(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-2 rounded-md shadow hover:shadow-md transition-all duration-200 text-xs font-medium"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create New Offer</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-0.5">Total Offers</p>
                <p className="text-xl font-bold text-gray-900">{offers.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-md">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-0.5">Active Offers</p>
                <p className="text-xl font-bold text-green-600">{activeOffers}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-md">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-0.5">Total Discount Value</p>
                <p className="text-xl font-bold text-teal-600">₹{totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-teal-100 p-2 rounded-md">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-teal-600" />
              <h2 className="text-base font-semibold text-gray-900">All Offers</h2>
            </div>
          </div>

          <div className="p-3">
            {offers.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2.5">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No offers yet</h3>
                <p className="text-gray-500 text-xs mb-4">Get started by creating your first promotional offer</p>
                {permissions.canCreate && (
                  <button
                    onClick={() => {
                      setEditingOfferId(null);
                      setEditingOfferData(null);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded text-xs transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Create Your First Offer</span>
                  </button>
                )}
                {!permissions.canCreate && (
                  <p className="text-red-500 text-xs">You do not have permission to create offers</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Offer Details
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Validity
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-teal-600 rounded flex items-center justify-center flex-shrink-0">
                              <Package className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-xs">{offer.title}</p>
                              <p className="text-[11px] text-gray-500">ID: {offer._id.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 capitalize">
                            {offer.type}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm font-bold text-teal-600">
                            {offer.type === "percentage" ? `${offer.value}%` : `₹${offer.value}`}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-[11px]">
                              {offer.endsAt
                                ? new Date(offer.endsAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "No expiry"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              offer.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                offer.status === "active" ? "bg-green-500" : "bg-gray-500"
                              }`}
                            ></span>
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {permissions.canUpdate && (
                              <button
                                onClick={() => openEditModal(offer._id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Edit offer"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button
                                onClick={() => handleDelete(offer._id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Delete offer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                            {!permissions.canUpdate && !permissions.canDelete && (
                              <span className="text-xs text-gray-400">No actions available</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateOfferModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingOfferId(null);
          setEditingOfferData(null);
        }}
        onCreated={(offer) => handleOfferSaved(offer, !!editingOfferId)}
        token={token || ""}
        offer={editingOfferData}
        mode={editingOfferId ? "update" : "create"}
      />
    </div>
  );
}

// Wrap in layout
OffersPage.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Protect page and preserve layout
const ProtectedOffersPage = withDoctorAuth(OffersPage);
ProtectedOffersPage.getLayout = OffersPage.getLayout;

export default ProtectedOffersPage
