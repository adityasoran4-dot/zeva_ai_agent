import React, { useState, useEffect } from "react";
import AgentLayout from "../../components/AgentLayout"; // ✅ use Agent layout
import withAgentAuth from "../../components/withAgentAuth"; // ✅ use Agent auth
import { AuroraBackground } from "@/components/ui/aurora-bento-grid";
import { Typewriter } from "@/components/ui/typewriter-text";
import axios from "axios";
import { useRouter } from "next/router";

const AgentDashboard = () => {
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [navigationItems, setNavigationItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateTime, setDateTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Decode JWT token to get user info
    const getToken = () => {
      if (typeof window !== "undefined") {
        // Check for agentToken first, then userToken
        return (
          localStorage.getItem("agentToken") ||
          localStorage.getItem("userToken")
        );
      }
      return null;
    };

    const decodeToken = (token) => {
      try {
        if (!token) {
          return null;
        }

        // JWT tokens have 3 parts: header.payload.signature
        const parts = token.split(".");
        if (parts.length !== 3) {
          return null;
        }

        // Decode the payload (second part)
        const payload = JSON.parse(atob(parts[1]));

        return {
          name: payload.name || "",
          email: payload.email || "",
        };
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    };

    const token = getToken();

    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUserInfo(decoded);
      }
    }
  }, []);

  // Fetch navigation items from the same API as sidebar (single source of truth)
  useEffect(() => {
    const fetchNavigationAndPermissions = async () => {
      try {
        setIsLoading(true);
        const agentToken =
          typeof window !== "undefined"
            ? localStorage.getItem("agentToken") ||
              sessionStorage.getItem("agentToken")
            : null;
        const userToken =
          typeof window !== "undefined"
            ? localStorage.getItem("userToken") ||
              sessionStorage.getItem("userToken")
            : null;
        const token = agentToken || userToken;

        if (!token) {
          setNavigationItems([]);
          setIsLoading(false);
          return;
        }

        const res = await axios.get("/api/agent/sidebar-permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          // Filter out dashboard item itself and items without paths
          const filteredItems = (res.data.navigationItems || [])
            .filter((item) => {
              // Exclude dashboard item and items without paths
              const isDashboard =
                item.path === "/agent/dashboard" ||
                item.path === "/agent/agent-dashboard" ||
                item.moduleKey?.toLowerCase().includes("dashboard");
              return !isDashboard && item.path;
            })
            .map((item) => ({
              label: item.label,
              path: item.path,
              icon: item.icon,
              description: item.description || item.label,
              moduleKey: item.moduleKey,
              order: item.order || 999,
              subModules: item.subModules || [],
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          setNavigationItems(filteredItems);
        } else {
          console.error("Error fetching navigation items:", res.data.message);
          setNavigationItems([]);
        }
      } catch (err) {
        console.error("Error fetching navigation items and permissions:", err);
        setNavigationItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigationAndPermissions();

    // Re-fetch on route changes to ensure permissions are always up-to-date
    const handleRouteChange = () => {
      fetchNavigationAndPermissions();
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "short" });
      const month = now.toLocaleDateString("en-US", { month: "short" });
      const dayNum = now.getDate();
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setDateTime(`${day}, ${month} ${dayNum} • ${time}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Render icon from emoji string or return as-is
  const renderIcon = (iconString) => {
    if (!iconString) return null;
    // If it's an emoji, render it directly
    if (typeof iconString === "string" && iconString.length <= 2) {
      return <span className="text-2xl">{iconString}</span>;
    }
    // Otherwise, treat as text/emoji
    return <span className="text-xl">{iconString}</span>;
  };
  // support agentToken and userToken routes
  const handleDeskTimeClick = () => {
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken")
        : null;

    if (agentToken) {
      router.push("/staff/desktime");
    } else if (userToken) {
      router.push("/staff/desktime/doctor");
    } else {
      console.error("No valid token found.");
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 p-2 md:p-3">
        <div className="max-w-7xl mt-1 mx-auto">
          {/* User Info Section at the top */}
          <div className="mb-1 pb-3 border-b border-white/20 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            {/* Left side - Name and Welcome */}
            <div className="flex-1">
              {userInfo.name && (
                <h1
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight"
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Hi, {userInfo.name}
                </h1>
              )}
              {!userInfo.name && (
                <h1
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight"
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Hi, Agent!
                </h1>
              )}
              <div
                className="mt-1 text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 leading-relaxed tracking-normal"
                style={{
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  letterSpacing: "0.01em",
                }}
              >
                <Typewriter
                  text={[
                    "Welcome to your agent dashboard.",
                    "Manage your leads efficiently.",
                    "Track your performance.",
                    "Stay organized and productive.",
                  ]}
                  speed={100}
                  loop={true}
                  className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300"
                />
              </div>
            </div>
            {/* <div className="text-sm md:text-base font-medium">
              <button
                onClick={handleDeskTimeClick}
                className="px-2 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:bg-cyan-800 dark:hover:bg-cyan-700"
              >
                View DeskTime
              </button>
            </div> */}

            {/* Right side - Date and Time */}
            {/* <div className="bg-cyan-800 dark:bg-cyan-800 rounded-lg px-2 py-1.5 md:px-2.5 md:py-1.5 shadow-md">
              <div className="text-white font-bold text-xs md:text-sm whitespace-nowrap" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {dateTime}
              </div>
            </div> */}
          </div>

          {/* Permission-based Dashboard Cards */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600 dark:text-gray-400">
                Loading dashboard...
              </div>
            </div>
          ) : navigationItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600 dark:text-gray-400 text-center">
                <p className="text-lg font-semibold mb-2">
                  No modules available
                </p>
                <p className="text-sm">
                  You don't have permissions to view any dashboard modules yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 mt-3">
              {navigationItems.map((item, index) => (
                <div
                  key={item.moduleKey || index}
                  onClick={() => item.path && router.push(item.path)}
                  className={`
                    group relative rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-400 
                    hover:shadow-lg transition-all duration-200 cursor-pointer
                    border border-transparent hover:border-white/20
                    flex flex-col justify-between
                    p-2.5 md:p-3 min-h-[120px] md:min-h-[130px]
                    ${
                      item.path
                        ? "hover:scale-[1.02]"
                        : "opacity-60 cursor-not-allowed"
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="p-1.5 bg-white/10 rounded-md backdrop-blur-sm">
                      {renderIcon(item.icon)}
                    </div>
                    {item.subModules && item.subModules.length > 0 && (
                      <span className="text-xs text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                        {item.subModules.length}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="text-base md:text-lg font-bold text-white leading-tight mb-0.5">
                      {item.label}
                    </h3>
                    <p className="text-xs md:text-sm text-white/70 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Attach Agent layout
AgentDashboard.getLayout = function PageLayout(page) {
  return <AgentLayout>{page}</AgentLayout>;
};

// ✅ Apply Agent Auth HOC
const ProtectedAgentDashboard = withAgentAuth(AgentDashboard);

// ✅ Reassign layout for the protected version
ProtectedAgentDashboard.getLayout = AgentDashboard.getLayout;

export default ProtectedAgentDashboard;
