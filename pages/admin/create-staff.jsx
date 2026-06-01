import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Mail, Lock, Users, CheckCircle, AlertCircle, X, Info, AlertTriangle, Search, Plus } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";


function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[toast.type]}`}>
      {icons[toast.type]}
      <div className="flex-1">
        {toast.title && <p className="font-semibold text-sm mb-1">{toast.title}</p>}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full px-4">
      {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={onClose} />)}
    </div>
  );
}

function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function CreateUserForm({ onClose, onSuccess, addToast }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      addToast("warning", "Please enter a valid full name (at least 2 characters)", "Validation Error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addToast("warning", "Please enter a valid email address", "Invalid Email");
      return false;
    }

    if (formData.password.length < 6) {
      addToast("warning", "Password must be at least 6 characters long", "Weak Password");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    addToast("info", "Creating user account...", "Please Wait");

    try {
      const token = localStorage.getItem("adminToken");
      
      const response = await axios.post(
        "/api/admin/create-staff",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        addToast("success", `User ${formData.name} has been created successfully!`, "Account Created");
        addToast("info", "Login credentials have been sent to the user's email", "Email Sent");
        
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Error creating user";
      
      // Specific error handling with different toast types
      if (err.response?.status === 401) {
        addToast("error", "Your session has expired. Please log in again.", "Session Expired");
      } else if (err.response?.status === 409) {
        addToast("error", "A user with this email already exists in the system.", "Duplicate Email");
      } else if (err.response?.status === 403) {
        addToast("error", "You don't have permission to perform this action.", "Access Denied");
      } else if (err.response?.status === 400) {
        addToast("warning", errorMessage, "Invalid Input");
      } else if (err.response?.status >= 500) {
        addToast("error", "Server error occurred. Please try again later.", "Server Error");
      } else if (!err.response) {
        addToast("error", "Network error. Please check your connection.", "Connection Failed");
      } else {
        addToast("error", errorMessage, "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="text-gray-700 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="text-gray-700 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="text-gray-700 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="text-gray-700 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          >
            <option value="staff">Staff</option>
            <option value="doctorStaff">Doctor</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      
      {getPageNumbers().map((page, idx) => (
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

function UserCard({ user, onAction, addToast }) {
  const handleApprove = () => {
    addToast("success", `${user.name} has been approved`, "Approved");
    onAction(user._id, "approve");
  };

  const handleDecline = () => {
    addToast("info", `${user.name} has been declined`, "Declined");
    onAction(user._id, "decline");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{user.name}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Mail className="w-4 h-4" />
            {user.email}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          user.role === "doctorStaff" 
            ? "bg-blue-100 text-blue-700" 
            : "bg-blue-100 text-blue-700"
        }`}>
          {user.role === "doctorStaff" ? "Doctor" : "Staff"}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Phone:</span> {user.phone || "Not provided"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.isApproved 
              ? "bg-green-100 text-green-700" 
              : user.declined 
              ? "bg-red-100 text-red-700" 
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {user.isApproved ? "Approved" : user.declined ? "Declined" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={user.isApproved}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Approve
        </button>
        <button
          onClick={handleDecline}
          disabled={user.declined}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function CreateUser() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  
  const [staffSearch, setStaffSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  
  const [staffPage, setStaffPage] = useState(1);
  const [doctorPage, setDoctorPage] = useState(1);
  const [staffTotalPages, setStaffTotalPages] = useState(1);
  const [doctorTotalPages, setDoctorTotalPages] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [doctorTotal, setDoctorTotal] = useState(0);
  const itemsPerPage = 9;

  const addToast = (type, message, title = "") => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, message, title };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchStaff = async (role = null, page = 1, search = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (role) {
        params.append("role", role);
      }
      
      if (search) {
        params.append("search", search);
      }

      const response = await axios.get(`/api/admin/get-staff?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.staff) {
        setStaffList(response.data.staff);
        
        // Update pagination data based on role
        if (role === "doctorStaff") {
          setDoctorTotalPages(response.data.pagination?.totalPages || 1);
          setDoctorTotal(response.data.pagination?.total || 0);
        } else if (role === "staff") {
          setStaffTotalPages(response.data.pagination?.totalPages || 1);
          setStaffTotal(response.data.pagination?.total || 0);
        }
      } else {
        setStaffList([]);
        if (role === "doctorStaff") {
          setDoctorTotalPages(1);
          setDoctorTotal(0);
        } else if (role === "staff") {
          setStaffTotalPages(1);
          setStaffTotal(0);
        }
      }
    } catch (err) {
      setStaffList([]);
      if (role === "doctorStaff") {
        setDoctorTotalPages(1);
        setDoctorTotal(0);
      } else if (role === "staff") {
        setStaffTotalPages(1);
        setStaffTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "doctors") {
        fetchStaff("doctorStaff", doctorPage, doctorSearch);
      } else {
        fetchStaff("staff", staffPage, staffSearch);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [activeTab, staffPage, doctorPage, staffSearch, doctorSearch]);

  useEffect(() => {
    addToast("info", "Welcome to Staff Management Dashboard", "Welcome");
  }, []);

  const handleAction = async (userId, action) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        "/api/admin/update-staff-approval",
        { userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        addToast("success", response.data.message || `User ${action}d successfully`, "Action Complete");
        // Refetch current tab data
        fetchStaff(activeTab === "doctors" ? "doctorStaff" : "staff", activeTab === "doctors" ? doctorPage : staffPage, activeTab === "doctors" ? doctorSearch : staffSearch);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error updating user";
      addToast("error", errorMsg, "Error");
      
      if (err.response?.status === 403) {
        addToast("error", "You don't have permission to perform this action", "Access Denied");
      } else if (err.response?.status === 404) {
        addToast("error", "User not found", "Not Found");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Staff Management</h1>
              <p className="text-sm text-blue-600 mt-1">Manage your team members and doctors</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-3 h-3" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "doctors"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeTab === "doctors" ? "bg-blue-100" : "bg-transparent"
              }`}>
                <Users className="w-5 h-5" />
              </div>
              Doctors
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                activeTab === "doctors"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {doctorTotal}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "staff"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeTab === "staff" ? "bg-blue-100" : "bg-transparent"
              }`}>
                <Users className="w-5 h-5" />
              </div>
              Staff
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                activeTab === "staff"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {staffTotal}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={activeTab === "doctors" ? doctorSearch : staffSearch}
              onChange={(e) => {
                if (activeTab === "doctors") {
                  setDoctorSearch(e.target.value);
                  setDoctorPage(1);
                } else {
                  setStaffSearch(e.target.value);
                  setStaffPage(1);
                }
              }}
              className={`text-gray-700 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${
                activeTab === "doctors" ? "focus:ring-blue-500" : "focus:ring-blue-500"
              } focus:border-transparent`}
            />
          </div>
        </div>

        {activeTab === "doctors" ? (
          <section>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : staffList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffList.map(doctor => (
                    <UserCard key={doctor._id} user={doctor} onAction={handleAction} addToast={addToast} />
                  ))}
                </div>
                {doctorTotalPages > 1 && (
                  <Pagination 
                    currentPage={doctorPage} 
                    totalPages={doctorTotalPages} 
                    onPageChange={(page) => {
                      setDoctorPage(page);
                    }} 
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No doctors found</p>
              </div>
            )}
          </section>
        ) : (
          <section>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : staffList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffList.map(staffMember => (
                    <UserCard key={staffMember._id} user={staffMember} onAction={handleAction} addToast={addToast} />
                  ))}
                </div>
                {staffTotalPages > 1 && (
                  <Pagination 
                    currentPage={staffPage} 
                    totalPages={staffTotalPages} 
                    onPageChange={(page) => {
                      setStaffPage(page);
                    }} 
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No staff members found</p>
              </div>
            )}
          </section>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateUserForm 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            // Refetch current tab data after creating user
            fetchStaff(activeTab === "doctors" ? "doctorStaff" : "staff", activeTab === "doctors" ? doctorPage : staffPage, activeTab === "doctors" ? doctorSearch : staffSearch);
          }}
          addToast={addToast}
        />
      </Modal>
    </div>
  );
}

CreateUser.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(CreateUser);
ProtectedDashboard.getLayout = CreateUser.getLayout;

export default ProtectedDashboard;