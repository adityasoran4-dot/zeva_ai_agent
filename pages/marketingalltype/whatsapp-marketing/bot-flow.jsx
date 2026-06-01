import { useState } from "react";
import { useRouter } from "next/router";
import {
  Plus,
  Infinity,
  Search,
  ChevronUp,
  ChevronDown,
  Workflow,
  Edit,
  ArrowUpDown,
} from "lucide-react";
import ClinicLayout from "../../../components/ClinicLayout";
import withClinicAuth from "../../../components/withClinicAuth";
import WhatsAppMarketingSidebar from "../../../components/WhatsAppMarketingSidebar";

const BotFlowPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [botFlows, setBotFlows] = useState([
    {
      id: 1,
      name: "Flow 1",
      description: "a",
      isActive: true,
    },
    {
      id: 2,
      name: "Flow 2",
      description: "",
      isActive: true,
    },
    {
      id: 3,
      name: "flow 3",
      description: "",
      isActive: true,
    },
    {
      id: 4,
      name: "333",
      description: "",
      isActive: true,
    },
  ]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedFlows = [...botFlows].sort((a, b) => {
      if (key === "srNo") {
        return direction === "asc" ? a.id - b.id : b.id - a.id;
      }
      if (key === "name") {
        return direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (key === "description") {
        const descA = a.description || "";
        const descB = b.description || "";
        return direction === "asc" ? descA.localeCompare(descB) : descB.localeCompare(descA);
      }
      if (key === "isActive") {
        return direction === "asc" ? (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) : (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1);
      }
      return 0;
    });
    setBotFlows(sortedFlows);
  };

  const handleToggleActive = (id) => {
    setBotFlows((prev) =>
      prev.map((flow) => (flow.id === id ? { ...flow, isActive: !flow.isActive } : flow))
    );
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({ name: "", description: "" });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return; // Name is required
    }
    // Add new bot flow
    const newFlow = {
      id: botFlows.length + 1,
      name: formData.name,
      description: formData.description,
      isActive: true,
    };
    setBotFlows((prev) => [...prev, newFlow]);
    handleCloseModal();
  };

  const filteredFlows = botFlows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 text-purple-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-purple-600" />
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <WhatsAppMarketingSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Bot Flow
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <Infinity className="w-4 h-4" />
              <span className="text-sm font-medium">Unlimited</span>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 flex justify-end">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("srNo")}
                        className="flex items-center gap-2 hover:text-purple-600 transition"
                      >
                        SR.NO
                        <SortIcon columnKey="srNo" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 hover:text-purple-600 transition"
                      >
                        Name
                        <SortIcon columnKey="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("description")}
                        className="flex items-center gap-2 hover:text-purple-600 transition"
                      >
                        Description
                        <SortIcon columnKey="description" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("isActive")}
                        className="flex items-center gap-2 hover:text-purple-600 transition"
                      >
                        Is active
                        <SortIcon columnKey="isActive" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFlows.map((flow, index) => (
                    <tr key={flow.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flow.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {flow.description || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(flow.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            flow.isActive ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              flow.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/marketingalltype/whatsapp-marketing/flow-builder?flowId=${flow.id}`)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-xs font-medium flex items-center gap-1"
                          >
                            <Workflow className="w-3 h-3" />
                            Flow
                          </button>
                          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-xs font-medium flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredFlows.length > 0 ? 1 : 0} to {filteredFlows.length} of{" "}
                {filteredFlows.length} Results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Bot Flow</h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Name Field */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter bot flow name"
                  autoFocus
                  required
                />
              </div>

              {/* Description Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-y min-h-[100px]"
                  placeholder="Enter description (optional)"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Layout
BotFlowPage.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={true}>
      {page}
    </ClinicLayout>
  );
};

// Protect and preserve layout
const ProtectedBotFlowPage = withClinicAuth(BotFlowPage);
ProtectedBotFlowPage.getLayout = BotFlowPage.getLayout;

export default ProtectedBotFlowPage;

