import { useEffect, useState } from "react";
import { Search, Users, Shield, ChevronRight, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/lead/dashboard", icon: "🏠", description: "Overview & metrics" },
  { label: "Create Agent", path: "/lead/create-agent", icon: "📅", description: "Manage Clinic" },
  { label: "Create Permission", path: "/lead/permission", icon: "🔒", description: "Manage Permission" },
  {
    label: "Lead", icon: "🧑‍💼", description: "Lead Management", children: [
      { label: "Create Lead", path: "/lead/create-lead", icon: "👤", description: "Create Lead" },
      { label: "Assign Lead", path: "/lead/assign-lead", icon: "👨‍⚕️", description: "All Patient Enquiries" }
    ]
  },
  { label: "Create offers", path: "/lead/create-offer", icon: "🤑", description: "Manage Offers" },
  { label: "Marketing", path: "/marketingalltype/social-marketing", icon: "📊", description: "Manage Marketing" },
];

const roles = ["agent"];

const renderNavItems = (items, user, refreshUsers, level = 0, token) => (
  <div className={`space-y-2 ${level > 0 ? 'ml-4 mt-2 pl-3 border-l-2 border-gray-200' : ''}`}>
    {items.map((item) => {
      const isChecked = user.permissions.includes(item.label.toLowerCase());

      const handleChange = async () => {
        const confirmMsg = isChecked
          ? `Do you want to remove ${item.label} from ${user.name}?`
          : `Do you want to assign ${item.label} to ${user.name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
          const response = await fetch("/api/lead-ms/assign-permission", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, // include token
            },
            body: JSON.stringify({
              agentId: user._id,
              permission: item.label.toLowerCase(),
              action: isChecked ? "remove" : "add",
            }),
          });

          if (!response.ok) throw new Error("Failed to update");
          refreshUsers();
        } catch (err) {
          console.error(err);
          alert("Failed to update permissions");
        }
      };

      return (
        <div key={item.label} className="space-y-2">
          <div className="group bg-white border border-gray-200 rounded-lg p-2.5 hover:border-[#2D9AA5] hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  )}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2D9AA5]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2D9AA5]"></div>
              </label>
            </div>
          </div>

          {item.children && renderNavItems(item.children, user, refreshUsers, level + 1, token)}
        </div>
      );
    })}
  </div>
);

export default function UsersPage() {
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("doctorToken");
    if (storedToken) setToken(storedToken);
  }, []);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/lead-ms/get-username-permission", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to fetch users");
    }
  };

  // Fetch users after token is loaded
  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole ? u.role === selectedRole : true;
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`${sidebarOpen ? 'w-full md:w-80' : 'w-0'} ${sidebarOpen ? 'absolute md:relative' : ''} ${sidebarOpen ? 'z-50' : ''} bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 overflow-hidden flex-shrink-0 h-full`}>
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-[#2D9AA5] to-[#258a94] flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white">Team Members</h2>
                <p className="text-xs text-white/80">{filteredUsers.length} users</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-sm border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  setSelectedUser(user._id);
                  setSidebarOpen(false);
                }}
                className={`group p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedUser === user._id
                    ? 'bg-gradient-to-r from-[#2D9AA5] to-[#258a94] shadow-lg shadow-[#2D9AA5]/20'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                      selectedUser === user._id
                        ? 'bg-white/20 text-white'
                        : 'bg-gradient-to-br from-[#2D9AA5] to-[#258a94] text-white'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${
                        selectedUser === user._id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedUser === user._id
                            ? 'bg-white/20 text-white'
                            : 'bg-[#2D9AA5]/10 text-[#2D9AA5]'
                        }`}>{user.role}</span>
                        <span className={`text-xs ${
                          selectedUser === user._id ? 'text-white/70' : 'text-gray-500'
                        }`}>{user.permissions.length} permissions</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                    selectedUser === user._id ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="bg-white border-b border-gray-200 p-4 md:p-6 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <Users className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#2D9AA5] to-[#258a94] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D9AA5]/20 flex-shrink-0">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Permission Management</h1>
                <p className="text-xs md:text-sm text-gray-500 truncate">Manage user access and permissions</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by role:</span>
            <button
              onClick={() => setSelectedRole("")}
              className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedRole === ""
                  ? "bg-gradient-to-r from-[#2D9AA5] to-[#258a94] text-white shadow-lg shadow-[#2D9AA5]/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 whitespace-nowrap ${
                  selectedRole === role
                    ? "bg-gradient-to-r from-[#2D9AA5] to-[#258a94] text-white shadow-lg shadow-[#2D9AA5]/20"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-6 auto-rows-fr">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 flex flex-col ${
                    selectedUser === user._id
                      ? 'border-[#2D9AA5] shadow-lg shadow-[#2D9AA5]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 md:p-4 border-b ${
                    selectedUser === user._id
                      ? 'bg-gradient-to-r from-[#2D9AA5] to-[#258a94] border-[#2D9AA5]/20'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-sm md:text-base shadow-md flex-shrink-0 ${
                        selectedUser === user._id
                          ? 'bg-white/20 text-white'
                          : 'bg-gradient-to-br from-[#2D9AA5] to-[#258a94] text-white'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm md:text-base truncate ${
                          selectedUser === user._id ? 'text-white' : 'text-gray-900'
                        }`}>{user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 md:px-2.5 py-0.5 rounded-full font-medium ${
                            selectedUser === user._id
                              ? 'bg-white/20 text-white'
                              : 'bg-[#2D9AA5]/10 text-[#2D9AA5]'
                          }`}>{user.role}</span>
                          <span className={`text-xs ${
                            selectedUser === user._id ? 'text-white/80' : 'text-gray-500'
                          }`}>• {user.permissions.length} active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4">
                    {renderNavItems(navItems, user, fetchUsers, 0, token)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
