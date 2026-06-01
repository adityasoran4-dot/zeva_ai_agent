import { useState, useEffect } from "react";
import axios from "axios";

export default function AddContract() {
  const [form, setForm] = useState({
    contractId: "",
    contractTitle: "",
    startDate: "",
    endDate: "",
    renewalDate: "",
    contractValue: "",
    paymentTerms: "monthly",
    responsiblePerson: "",
    status: "Active",
  });

  const [file, setFile] = useState(null); // ✅ for contract file
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch all staff for dropdown
  useEffect(() => {
    async function fetchStaff() {
      try {
        const res = await axios.get("/api/users/getStaff");
        setStaffList(res.data.data || []);
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    }
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        alert("Admin token not found. Please log in again.");
        return;
      }

      // ✅ Create FormData for multipart/form-data
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) formData.append(key, form[key]);
      });

      if (file) {
        formData.append("contractFile", file); // Attach file
      }

      const res = await axios.post("/api/contracts/create", formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Contract added successfully!");
      setForm({
        contractId: "",
        contractTitle: "",
        startDate: "",
        endDate: "",
        renewalDate: "",
        contractValue: "",
        paymentTerms: "monthly",
        responsiblePerson: "",
        status: "Active",
      });
      setFile(null);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error adding contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Add New Contract</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="contractId"
          placeholder="Contract ID"
          onChange={handleChange}
          value={form.contractId}
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="contractTitle"
          placeholder="Contract Title"
          onChange={handleChange}
          value={form.contractTitle}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          name="startDate"
          onChange={handleChange}
          value={form.startDate}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          name="endDate"
          onChange={handleChange}
          value={form.endDate}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          name="renewalDate"
          onChange={handleChange}
          value={form.renewalDate}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          name="contractValue"
          placeholder="Contract Value"
          onChange={handleChange}
          value={form.contractValue}
          required
          className="w-full border p-2 rounded"
        />

        <select
          name="paymentTerms"
          onChange={handleChange}
          value={form.paymentTerms}
          className="w-full border p-2 rounded"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
          <option value="one-time">One-time</option>
        </select>

        <select
          name="responsiblePerson"
          onChange={handleChange}
          value={form.responsiblePerson}
          required
          className="w-full border p-2 rounded"
        >
          <option value="">Select Responsible Staff</option>
          {staffList.map((staff) => (
            <option key={staff._id} value={staff._id}>
              {staff.name} ({staff.role})
            </option>
          ))}
        </select>

        <select
          name="status"
          onChange={handleChange}
          value={form.status}
          className="w-full border p-2 rounded"
        >
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
          <option value="Renewed">Renewed</option>
        </select>

        {/* ✅ File Upload Input */}
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
        />

        <button
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Uploading..." : "Add Contract"}
        </button>
      </form>
    </div>
  );
}
