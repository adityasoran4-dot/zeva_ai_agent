//pages/clinic/policy_compliance.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import Head from "next/head";
import { ShieldCheck, FileText, BookOpenCheck, ClipboardList, Plus, Search, UploadCloud, MoreVertical, Sparkles, AlertTriangle, TrendingUp, CircleCheckBig, Eye, Clock, X, Users, Building, Layers, Tag, Hash, CalendarDays, User } from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";
import Loader from "../../components/Loader";
import axios from "axios";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
const COMPLIANCE_MODULE_KEY = "clinic_compliance";

const isTruthy = (val: unknown) =>
  val === true || val === "true" || String(val || "").toLowerCase() === "true";

const findComplianceModule = (permissionsList: any[]) =>
  permissionsList.find((p: any) => {
    if (!p?.module) return false;
    const mod = String(p.module).toLowerCase();
    return (
      mod === "clinic_compliance" ||
      mod === "clinic_policy_compliance" ||
      mod === "policy_compliance" ||
      mod === "compliance"
    );
  });

const parsePermissionActions = (actions: Record<string, unknown> = {}) => {
  const moduleAll = isTruthy(actions.all);
  return {
    canRead: moduleAll || isTruthy(actions.read),
    canCreate: moduleAll || isTruthy(actions.create),
    canUpdate: moduleAll || isTruthy(actions.update),
    canDelete: moduleAll || isTruthy(actions.delete),
  };
};

type Sop = {
  _id: string;
  name: string;
  department: string;
  applicableRoles: string[];
  category: string;
  riskLevel: string;
  version: string;
  lastUpdated: string;
  status: string;
  content?: string;
  checklist?: string[];
  attachments?: string[];
  effectiveDate?: string;
  reviewDate?: string;
  mandatoryAck?: boolean;
  acknowledgmentDeadline?: string;
  ackPercent?: number;
  ackOverall?: number;
};

type Policy = {
  _id: string;
  name: string;
  policyType: string;
  department?: string;
  appliesTo: string;
  appliesToRoles?: string[];
  description?: string;
  approvalRequired: boolean;
  version: string;
  effectiveDate: string;
  status: string;
  ackPercent?: number;
  ackPercentAgent?: number;
  ackPercentDoctor?: number;
};
type Playbook = {
  _id: string;
  scenarioName: string;
  triggerCondition: string;
  department: string;
  riskLevel: string;
  resolutionTimeMinutes: number;
  escalationLevel: string;
  status: string;
  steps?: string[];
  expectedResolutionTime?: string;
  escalationPath?: string[];
  owner?: string;
  ownerName?: string;
};

type AckItem = {
  _id: string;
  staffName: string;
  role: string;
  documentName: string;
  type: "SOP" | "Policy" | "Playbook";
  version: string;
  status: "Acknowledged" | "Pending" | "Viewed" | "Overdue";
  assignedDate: string;
  dueDate: string;
  acknowledgedOn?: string | null;
  documentType?: string;
  documentId?: string;
  staffId?: string;
};

type TabKey = "sops" | "policies" | "playbooks" | "ack";

const THEMES = {
  purple: {
    card: "bg-purple-50 border-purple-200",
    title: "text-purple-700",
    value: "text-purple-900",
    subtitle: "text-purple-600",
  },
  red: {
    card: "bg-red-50 border-red-200",
    title: "text-red-700",
    value: "text-red-900",
    subtitle: "text-red-600",
  },
  green: {
    card: "bg-green-50 border-green-200",
    title: "text-green-700",
    value: "text-green-900",
    subtitle: "text-green-600",
  }
};

function StatCard({ title, value, subtitle, icon, theme }: { title: string; value: string | number; subtitle?: string; icon: React.ReactNode; theme: keyof typeof THEMES }) {
  const t = THEMES[theme];

  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${t.card}`}>
      <div>
        <div className={`text-xs font-medium ${t.title}`}>
          {title}
        </div>
        <div className={`mt-1 text-xl font-bold ${t.value}`}>
          {value}
        </div>
        <div className={`mt-1 text-[11px] ${t.subtitle}`}>
          {subtitle}
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60">
        {icon}
      </div>
    </div>
  );
}



function PolicyCompliance() {
  const [activeTab, setActiveTab] = useState<TabKey>("sops");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [policyTypeFilter, setPolicyTypeFilter] = useState("");
  const [rolesFilter, setRolesFilter] = useState("");
  const [policyTypes, setPolicyTypes] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Array<{ key: string; label: string }>>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [sopCategories, setSopCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [sops, setSops] = useState<Sop[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [overview, setOverview] = useState<{ sopCount: number; policyCount: number; playbookCount: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [ackItems, setAckItems] = useState<AckItem[]>([]);
  const [ackStatusFilter, setAckStatusFilter] = useState("");
  const [ackTypeFilter, setAckTypeFilter] = useState("");
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("Document Preview");
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TabKey | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [policyTypeDraft, setPolicyTypeDraft] = useState("");
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [currentAck, setCurrentAck] = useState<AckItem | null>(null);
  const [hideAckTabForStaff, setHideAckTabForStaff] = useState(false);

  // Permission states
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);


  const openViewer = (url?: string, title?: string, ack?: AckItem | null) => {
    if (!url) return;
    setCurrentAck(ack || null);
    setViewerUrl(url);
    setViewerTitle(title || "Document Preview");
    setViewerOpen(true);
    setViewerError(null);
  };

  const loadPdfIntoModal = async (pdfUrl: string) => {
    try {
      setViewerError(null);
      const ensurePdfJs = async () => {
        const w = window as any;
        if (w.pdfjsLib) return;
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load PDF viewer"));
          document.body.appendChild(s);
        });
        await new Promise<void>((resolve, reject) => {
          const sw = document.createElement("script");
          sw.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          sw.onload = () => resolve();
          sw.onerror = () => reject(new Error("Failed to load PDF worker"));
          document.body.appendChild(sw);
        });
      };
      await ensurePdfJs();
      // Inject styles to reduce print/save options
      if (!document.getElementById("pdf-secure-styles")) {
        const style = document.createElement("style");
        style.id = "pdf-secure-styles";
        style.textContent =
          ".pdf-secure{user-select:none;-webkit-user-select:none;-ms-user-select:none}.pdf-secure canvas{pointer-events:auto}.pdf-secure .overlay{position:absolute;inset:0;background:transparent;pointer-events:none}.pdf-secure .container{position:relative}.pdf-secure *{webkit-touch-callout:none}@media print{.pdf-secure{display:none !important}}";
        document.head.appendChild(style);
      }
      const fullUrl = pdfUrl.startsWith("http") ? pdfUrl : `${window.location.origin}${pdfUrl}`;
      const headers = { ...(getAuthHeaders() as Record<string, string>), Accept: "application/pdf" };
      const resp = await fetch(fullUrl, { headers, credentials: "include", cache: "no-store" });
      if (!resp.ok) {
        let message: any = `Failed to fetch document: ${resp.status}`;
        try {
          const raw = await resp.text();
          try {
            const parsed = JSON.parse(raw);
            message = parsed?.message ?? parsed?.error ?? raw ?? message;
          } catch {
            message = raw || message;
          }
        } catch {}
        const msgString = typeof message === "string" ? message : JSON.stringify(message);
        setViewerError(msgString);
        const c = pdfContainerRef.current!;
        c.innerHTML = `<div class="p-8 text-center"><div class="text-red-600 mb-2">Failed to load document</div><div class="text-sm text-gray-500">${msgString}</div></div>`;
        return;
      }
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const task = pdfjsLib.getDocument({ url: objectUrl });
      const pdf = await task.promise;

      const container = pdfContainerRef.current!;
      container.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-secure container";
      container.appendChild(wrapper);
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.1 });
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.margin = "0 auto 16px auto";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        const ctx = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        wrapper.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const shouldPlaceSignature = (currentAck?.status === "Acknowledged" || !!currentAck?.acknowledgedOn) && !!(currentAck as any)?.signatureDataUrl;
        if (shouldPlaceSignature && (currentAck as any)?.signatureDataUrl) {
          const img = new Image();
          img.onload = () => {
            const padding = 16;
            const sigW = Math.min(200, canvas.width * 0.35);
            const sigH = Math.round(sigW * 0.35);
            const sx = canvas.width - sigW - padding - 8;
            const sy = canvas.height - sigH - padding - 8;
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.drawImage(img, sx, sy, sigW, sigH);
            // Digital timestamp near signature
            const ts = (currentAck as any)?.signatureAt
              ? new Date((currentAck as any).signatureAt)
              : (currentAck?.acknowledgedOn ? new Date(currentAck.acknowledgedOn) : new Date());
            let whenStr: string;
            try {
              whenStr = ts.toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              });
            } catch {
              whenStr = ts.toISOString();
            }
            ctx.globalAlpha = 1;
            ctx.font = "11px Segoe UI, Arial, sans-serif";
            ctx.fillStyle = "#374151";
            ctx.fillText(`Signed: ${whenStr}`, Math.max(padding, sx - 160), sy + sigH + 14);
            ctx.restore();
          };
          img.src = (currentAck as any).signatureDataUrl;
        }
      }
      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.style.pointerEvents = "none";
      overlay.oncontextmenu = (e) => e.preventDefault();
      wrapper.appendChild(overlay);
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      console.error("Error loading PDF:", error);
      setViewerError(error?.message || "Failed to load document");
      if (pdfContainerRef.current) {
        pdfContainerRef.current.innerHTML = `<div class="p-8 text-center"><div class="text-red-600 mb-2">Failed to load document</div><div class="text-sm text-gray-500">${error?.message || "Unknown error"}</div></div>`;
      }
    }
  };




  useEffect(() => {
    if (viewerOpen && viewerUrl) {
      const preventContext = (e: Event) => e.preventDefault();
      const preventKeys = (e: KeyboardEvent) => {
        const k = e.key?.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("contextmenu", preventContext);
      document.addEventListener("keydown", preventKeys, true);
      loadPdfIntoModal(viewerUrl);
      return () => {
        document.removeEventListener("contextmenu", preventContext);
        document.removeEventListener("keydown", preventKeys, true);
      };
    }
  }, [viewerOpen, viewerUrl]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/clinic/departments", { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && Array.isArray(json.departments)) {
          setDepartments(json.departments);
        } else {
          setDepartments([{ _id: "clinic", name: "Clinic" }]);
        }
      } catch {
        setDepartments([{ _id: "clinic", name: "Clinic" }]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/compliance/roles", { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const roles: string[] = json.roles || [];
          const labels = json.labels || {};
          setAvailableRoles(roles.map(r => ({ key: r, label: labels[r] || r })));
        } else {
          setAvailableRoles([{ key: "agent", label: "Agent" }, { key: "doctorStaff", label: "DoctorStaff" }]);
        }
      } catch {
        setAvailableRoles([{ key: "agent", label: "Agent" }, { key: "doctorStaff", label: "DoctorStaff" }]);
      }
    })();
  }, []);

  const onSopTitleClick = async (id: string, title: string) => {
    try {
      openViewer(`/api/compliance/file?type=sops&id=${encodeURIComponent(id)}`, title);
    } catch {
      // noop
    }
  };

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    for (const key of TOKEN_PRIORITY) {
      const value =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  useEffect(() => {
    // Hide the Acknowledgment Tracker only in the agent/staff portal route
    let hide = false;
    if (typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      hide = path.startsWith("/staff");
      if (!hide) {
        const hasClinic = !!localStorage.getItem("clinicToken") || !!sessionStorage.getItem("clinicToken");
        const isStaff =
          !!localStorage.getItem("agentToken") ||
          !!sessionStorage.getItem("agentToken") ||
          !!localStorage.getItem("userToken") ||
          !!sessionStorage.getItem("userToken");
        hide = !hasClinic && isStaff;
      }
    }
    setHideAckTabForStaff(hide);
    if (hide && activeTab === "ack") {
      setActiveTab("sops");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = (): HeadersInit => {
    const t = getAuthToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const headersWithJson = (): HeadersInit => {
    const base: Record<string, string> = { "Content-Type": "application/json" };
    const auth = getAuthHeaders() as Record<string, string>;
    return { ...base, ...auth };
  };

  useEffect(() => {
    if (!permissionsLoaded || !permissions.canRead) return;
    const loadOverview = async () => {
      const res = await fetch("/api/clinic/policy_compliance", { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.overview) setOverview(json.overview);
    };
    loadOverview();
  }, [permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    if (!permissionsLoaded || (!permissions.canRead && !permissions.canCreate)) return;
    const loadTypes = async () => {
      try {
        const res = await fetch("/api/compliance/policy_types", { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const names = (json.items || []).map((t: any) => t.name).filter(Boolean);
          setPolicyTypes(names);
        }
      } catch { }
    };
    loadTypes();
  }, [permissionsLoaded, permissions.canRead, permissions.canCreate]);

  useEffect(() => {
    if (!permissionsLoaded || (!permissions.canRead && !permissions.canCreate)) return;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/compliance/sop_categories", { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const names = (json.items || []).map((t: any) => t.name).filter(Boolean);
          setSopCategories(names);
        }
      } catch { }
    };
    loadCategories();
  }, [permissionsLoaded, permissions.canRead, permissions.canCreate]);
  useEffect(() => {
    if (!permissionsLoaded || !permissions.canRead) return;
    const load = async () => {
      const res = await fetch(`/api/clinic/policy_compliance?type=${activeTab}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) return;
      if (activeTab === "sops") setSops(json.items || []);
      if (activeTab === "policies") setPolicies(json.items || []);
      if (activeTab === "playbooks") setPlaybooks(json.items || []);
    };
    if (activeTab !== "ack") load();
  }, [activeTab, permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    if (!permissionsLoaded || !permissions.canRead) return;
    const loadAck = async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (ackStatusFilter) params.set("status", ackStatusFilter);
      if (ackTypeFilter) params.set("type", ackTypeFilter);
      params.set("all", "1");
      const res = await fetch(`/api/compliance/acknowledgments?${params.toString()}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) return;
      const items = Array.isArray(json.items) ? json.items : [];
      const normalized = items.map((i: any) => ({
        ...i,
        type: i.type || i.documentType || "",
      }));
      setAckItems(normalized);
    };
    if (activeTab === "ack") loadAck();
  }, [activeTab, search, ackStatusFilter, ackTypeFilter, permissionsLoaded, permissions.canRead]);

  const filteredSops = useMemo(() => {
    return sops.filter(i => (!search || i.name.toLowerCase().includes(search.toLowerCase())) && (!departmentFilter || i.department === departmentFilter) && (!statusFilter || i.status === statusFilter) && (!riskFilter || i.riskLevel === riskFilter));
  }, [sops, search, departmentFilter, statusFilter, riskFilter]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(i =>
      (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
      (!policyTypeFilter || i.policyType === policyTypeFilter) &&
      (!rolesFilter || (i.appliesToRoles || []).includes(rolesFilter))
    );
  }, [policies, search, policyTypeFilter, rolesFilter]);

  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(i => (!search || i.scenarioName.toLowerCase().includes(search.toLowerCase())) && (!departmentFilter || i.department === departmentFilter) && (!riskFilter || i.riskLevel === riskFilter) && (!statusFilter || i.status === statusFilter));
  }, [playbooks, search, departmentFilter, riskFilter, statusFilter]);

  const filteredAckItems = useMemo(() => {
    return ackItems.filter(i =>
      (!search || i.staffName.toLowerCase().includes(search.toLowerCase()) || i.documentName.toLowerCase().includes(search.toLowerCase())) &&
      (!ackStatusFilter || i.status === ackStatusFilter) &&
      (!ackTypeFilter || i.type === ackTypeFilter)
    );
  }, [ackItems, search, ackStatusFilter, ackTypeFilter]);

  const ackPending = filteredAckItems.filter(i => i.status === "Pending").length;
  const ackCompleted = filteredAckItems.filter(i => i.status === "Acknowledged").length;
  const ackOverdue = filteredAckItems.filter(i => i.status === "Overdue").length;
  const ackComplianceRate = filteredAckItems.length ? Math.round((ackCompleted / filteredAckItems.length) * 100) : 0;

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      const token = getAuthToken();
      if (!token) return { role: null, id: null };
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(
            (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      return {
        role: decoded.role || decoded.userRole || null,
        id: decoded.userId || decoded.id || null,
      };
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  };

  // Helper function to get stored token for agent/staff
  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    for (const key of TOKEN_PRIORITY) {
      const value =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  const getUserRole = (): string | null => getUserInfo().role;

  // Handle permissions - two-level: clinic level + agent/doctorStaff level
  useEffect(() => {
    let isMounted = true;

    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken")
        : null;

    const userRole = getUserRole();
    const authToken = getStoredToken();

    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          const clinicAuthToken = clinicToken || doctorToken || authToken;
          if (!clinicAuthToken) {
            if (!isMounted) return;
            setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${clinicAuthToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            } else {
              const modulePermission = findComplianceModule(res.data.permissions);
              if (modulePermission) {
                setPermissions(parsePermissionActions(modulePermission.actions || {}));
              } else {
                setPermissions({ canRead: true, canCreate: false, canUpdate: false, canDelete: false });
              }
            }
          } else {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
          }
        } catch (err: any) {
          console.error("Error fetching clinic sidebar permissions:", err);
          if (isMounted) {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchClinicPermissions();
      return () => {
        isMounted = false;
      };
    }

    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (
      agentToken ||
      staffToken ||
      userToken ||
      userRole === "agent" ||
      userRole === "doctorStaff" ||
      userRole === "staff"
    ) {
      const fetchAgentPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          let permissionToken = agentStaffToken;
          if (userRole === "agent") {
            permissionToken = agentToken || agentStaffToken;
          } else if (userRole === "doctorStaff" || userRole === "staff") {
            permissionToken = userToken || staffToken || agentStaffToken;
          }

          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: COMPLIANCE_MODULE_KEY },
            headers: { Authorization: `Bearer ${permissionToken}` },
          });

          if (!isMounted) return;

          if (
            !res.data?.permissions &&
            res.data?.error?.includes("not found in agent permissions")
          ) {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            return;
          }

          if (res.data?.success && res.data?.permissions) {
            setPermissions(parsePermissionActions(res.data.permissions.actions || {}));
          } else {
            setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
          }
        } catch (err: any) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchAgentPermissions();
    } else {
      setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) {
      setSops([]);
      setPolicies([]);
      setPlaybooks([]);
      setAckItems([]);
      setOverview(null);
      setShowCreate(false);
      setShowTypeModal(false);
      setShowCategoryModal(false);
    }
  }, [permissionsLoaded, permissions.canRead]);

  const canViewData = permissions.canRead;
  const canCreateActions = permissions.canCreate;
  const canUpdateActions = permissions.canRead && permissions.canUpdate;
  const canDeleteActions = permissions.canRead && permissions.canDelete;


  const handleRowView = async (type: TabKey, id: string, title: string, ack?: AckItem | null) => {
    try {
      if (type === "policies") {
        const res = await fetch(`/api/compliance/policies?id=${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
        const json = await res.json();
        if (!json.success || !json.item) return;
        const url = json.item.documentUrl || (json.item.attachments?.[0]);
        if (url) openViewer(url, title, ack || null);
        setRowMenuId(null);
        return;
      }
      const dlType = type === "playbooks" ? "playbooks" : "sops";
      openViewer(`/api/compliance/file?type=${dlType}&id=${encodeURIComponent(id)}`, title, ack || null);
      setRowMenuId(null);
    } catch { }
  };

  const handleRowEdit = (type: TabKey, item: any) => {
    if (!canUpdateActions) return;
    setEditingType(type);
    setEditingItem(item);
    setShowCreate(true);
    setRowMenuId(null);
  };

  const handleRowDelete = async (type: TabKey, id: string) => {
    if (!canDeleteActions) return;
    try {
      const endpoint =
        type === "sops"
          ? "/api/compliance/sops"
          : type === "policies"
            ? "/api/compliance/policies"
            : "/api/compliance/playbooks";
      const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) return;
      if (type === "sops") setSops(prev => prev.filter(x => x._id !== id));
      if (type === "policies") setPolicies(prev => prev.filter(x => x._id !== id));
      if (type === "playbooks") setPlaybooks(prev => prev.filter(x => x._id !== id));
      setRowMenuId(null);
    } catch { }
  };

  const avgResolution = useMemo(() => {
    if (!playbooks.length) return 0;
    const total = playbooks.reduce((acc, cur) => acc + (Number(cur.resolutionTimeMinutes || 0) || 0), 0);
    return Math.round(total / playbooks.length);
  }, [playbooks]);

  const handleCreate = async (formData: Record<string, any>) => {
    if (editingType && !canUpdateActions) return;
    if (!editingType && !permissions.canCreate) return;
    const type = editingType || activeTab;
    if (type === "sops") {
      const url = editingType ? `/api/compliance/sops?id=${encodeURIComponent(editingItem?._id)}` : "/api/compliance/sops";
      const method = editingType ? "PUT" : "POST";
      const agentIds = Array.isArray(formData.targetAgentIds) ? (formData.targetAgentIds || []).filter((v: string) => !v.startsWith("__ALL_")) : [];
      const doctorIds = Array.isArray(formData.targetDoctorIds) ? (formData.targetDoctorIds || []).filter((v: string) => !v.startsWith("__ALL_")) : [];
      const staffIds = [...agentIds, ...doctorIds];
      const payload = staffIds.length ? { ...formData, staffIds } : { ...formData };
      const res = await fetch(url, { method, headers: headersWithJson(), body: JSON.stringify(payload) });
      let json: any = null;
      try { json = await res.json(); } catch { json = { success: false }; }
      if (res.ok && json?.success) {
        setSops(prev => editingType ? prev.map(x => x._id === json.item._id ? json.item : x) : [json.item, ...prev]);
        setShowCreate(false);
        setEditingType(null);
        setEditingItem(null);
      }
      return;
    }
    if (type === "policies") {
      const url = editingType ? `/api/compliance/policies?id=${encodeURIComponent(editingItem?._id)}` : "/api/compliance/policies";
      const method = editingType ? "PUT" : "POST";
      const agentIds = Array.isArray(formData.targetAgentIds) ? (formData.targetAgentIds || []).filter((v: string) => !v.startsWith("__ALL_")) : [];
      const doctorIds = Array.isArray(formData.targetDoctorIds) ? (formData.targetDoctorIds || []).filter((v: string) => !v.startsWith("__ALL_")) : [];
      const staffIds = [...agentIds, ...doctorIds];
      const payload = staffIds.length ? { ...formData, staffIds } : { ...formData };
      const res = await fetch(url, { method, headers: headersWithJson(), body: JSON.stringify(payload) });
      let json: any = null;
      try { json = await res.json(); } catch { json = { success: false }; }
      if (res.ok && json?.success) {
        setPolicies(prev => editingType ? prev.map(x => x._id === json.item._id ? json.item : x) : [json.item, ...prev]);
        setShowCreate(false);
        setEditingType(null);
        setEditingItem(null);
      }
      return;
    }
    // if (type === "playbooks") {
    //   const url = editingType ? `/api/compliance/playbooks?id=${encodeURIComponent(editingItem?._id)}` : "/api/compliance/playbooks";
    //   const method = editingType ? "PUT" : "POST";
    //   const expected = String(formData.expectedResolutionTime || "").toLowerCase();
    //   let minutes = Number(formData.resolutionTimeMinutes || 0);
    //   if (!minutes) {
    //     if (expected.includes("hour")) {
    //       const h = Number((expected.match(/\d+/) || [1])[0]);
    //       minutes = h * 60;
    //     } else {
    //       const m = Number((expected.match(/\d+/) || [0])[0]);
    //       minutes = m;
    //     }
    //   }
    //   const payload = {
    //     scenarioName: formData.scenarioName || "",
    //     triggerCondition: formData.triggerCondition || "",
    //     department: formData.department || "Clinic",
    //     riskLevel: formData.riskLevel || "",
    //     ownerName: "Clinic Admin",
    //     owner: formData.owner || "Clinic Admin",
    //     resolutionTimeMinutes: minutes || 0,
    //     expectedResolutionTime: formData.expectedResolutionTime || "",
    //     escalationLevel: formData.escalationLevel || "",
    //     status: formData.status || "Active",
    //     steps: formData.steps || [],
    //     escalationPath: formData.escalationPath || [],
    //     trainingMaterials: formData.trainingMaterials || [],
    //     attachments: formData.attachments || [],
    //     documentUrl: formData.documentUrl || undefined
    //   };
    //   const res = await fetch(url, { method, headers: headersWithJson(), body: JSON.stringify(payload) });
    //   let json: any = null;
    //   try { json = await res.json(); } catch { json = { success: false }; }
    //   if (res.ok && json?.success) {
    //     setPlaybooks(prev => editingType ? prev.map(x => x._id === json.item._id ? json.item : x) : [json.item, ...prev]);
    //     setShowCreate(false);
    //     setEditingType(null);
    //     setEditingItem(null);
    //   }
    //   return;
    // }
    if (type === "playbooks") {
      const url = editingType ? `/api/compliance/playbooks?id=${encodeURIComponent(editingItem?._id)}` : "/api/compliance/playbooks";
      const method = editingType ? "PUT" : "POST";

      // Get the clinic owner name from localStorage or context
      const clinicOwnerName = localStorage.getItem("clinicOwnerName") ||
        sessionStorage.getItem("clinicOwnerName") ||
        "Clinic Admin";

      const expected = String(formData.expectedResolutionTime || "").toLowerCase();
      let minutes = Number(formData.resolutionTimeMinutes || 0);
      if (!minutes) {
        if (expected.includes("hour")) {
          const h = Number((expected.match(/\d+/) || [1])[0]);
          minutes = h * 60;
        } else {
          const m = Number((expected.match(/\d+/) || [0])[0]);
          minutes = m;
        }
      }

      const payload = {
        scenarioName: formData.scenarioName || "",
        triggerCondition: formData.triggerCondition || "",
        department: formData.department || "Clinic",
        riskLevel: formData.riskLevel || "",
        owner: formData.owner || "", // This will be the owner ID from the backend
        ownerName: clinicOwnerName, // Add owner name for display
        resolutionTimeMinutes: minutes || 0,
        expectedResolutionTime: formData.expectedResolutionTime || "",
        escalationLevel: formData.escalationLevel || "",
        status: formData.status || "Active",
        steps: formData.steps || [],
        escalationPath: formData.escalationPath || [],
        trainingMaterials: formData.trainingMaterials || [],
        attachments: formData.attachments || [],
        documentUrl: formData.documentUrl || undefined
      };

      const res = await fetch(url, { method, headers: headersWithJson(), body: JSON.stringify(payload) });
      let json: any = null;
      try { json = await res.json(); } catch { json = { success: false }; }
      if (res.ok && json?.success) {
        setPlaybooks(prev => editingType ? prev.map(x => x._id === json.item._id ? json.item : x) : [json.item, ...prev]);
        setShowCreate(false);
        setEditingType(null);
        setEditingItem(null);
      }
      return;
    }
  };

  const CreateModal = () => {
    const [form, setForm] = useState<Record<string, any>>({});
    const [step, setStep] = useState(1);
    const [formMenuOpen, setFormMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [policyRoleOptions, setPolicyRoleOptions] = useState<string[]>(["Agent", "DoctorStaff"]);
    const [agentUsers, setAgentUsers] = useState<Array<{ _id: string, name: string }>>([]);
    const [doctorUsers, setDoctorUsers] = useState<Array<{ _id: string, name: string }>>([]);

    useEffect(() => {
      if ((editingType || activeTab) === "policies") {
        (async () => {
          try {
            const res = await fetch("/api/compliance/roles", { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success && Array.isArray(json.roles)) {
              const labels = json.labels || {};
              const opts = ["All Staff", labels.agent || "Agent", labels.doctorStaff || "DoctorStaff"];
              setPolicyRoleOptions(opts);
            }
          } catch {
            setPolicyRoleOptions(["All Staff", "Agent", "DoctorStaff"]);
          }
        })();
      }
    }, [activeTab, editingType]);

    useEffect(() => {
      if (editingItem) {
        setForm({
          ...editingItem,
          effectiveDate: editingItem.effectiveDate ? String(editingItem.effectiveDate).slice(0, 10) : (editingItem.effectiveDate || ""),
          reviewDate: editingItem.reviewDate ? String(editingItem.reviewDate).slice(0, 10) : (editingItem.reviewDate || "")
        });
      } else {
        const t = editingType || activeTab;
        setForm(t === "policies" ? { department: "" } : {});
      }
    }, [editingItem, editingType, activeTab]);


    useEffect(() => {
      const ct = editingType || activeTab;
      const rolesField = ct === "sops" ? (form.applicableRoles || []) : (form.appliesToRoles || []);
      const hasAgent = rolesField.includes("Agent") || rolesField.includes("agent") || rolesField.includes("All Staff");
      const hasDoctor = rolesField.includes("DoctorStaff") || rolesField.includes("doctorStaff") || rolesField.includes("All Staff");
      (async () => {
        try {
          if (hasAgent) {
            const r = await fetch(`/api/lead-ms/get-agents?role=agent`, { headers: getAuthHeaders() });
            const j = await r.json();
            if (j.success) setAgentUsers(j.agents || []);
          } else {
            setAgentUsers([]);
          }
          if (hasDoctor) {
            const r2 = await fetch(`/api/lead-ms/get-agents?role=doctorStaff`, { headers: getAuthHeaders() });
            const j2 = await r2.json();
            if (j2.success) setDoctorUsers(j2.agents || []);
          } else {
            setDoctorUsers([]);
          }
        } catch { }
      })();
    }, [form.applicableRoles, form.appliesToRoles, activeTab, editingType]);

    const triggerFilePicker = () => fileInputRef.current?.click();

    const uploadAttachment = async (file: File) => {
      setUploadError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const upType = (editingType || activeTab) === "playbooks" ? "playbooks" : "sops";
        const res = await fetch(`/api/compliance/upload?type=${encodeURIComponent(upType)}`, { method: "POST", headers: getAuthHeaders(), body: fd as any });
        const json = await res.json();
        if (!json.success || !json.url) {
          throw new Error(json.message || "Upload failed");
        }
        const list = [...(form.attachments || [])];
        list.push(json.url);
        const next: Record<string, any> = { ...form, attachments: list };
        if (file.type === "application/pdf") {
          next.documentUrl = json.url;
        }
        setForm(next);
      } catch (err: any) {
        setUploadError(err?.message || "Upload error");
      } finally {
        setUploading(false);
      }
    };

    const roleOptions = ["All Staff", "Agent", "DoctorStaff"];
    const riskOptions = ["Low", "Medium", "High", "Critical"];
    const escalationLevels = ["Level 1", "Level 2", "Level 3"];
    const ct = editingType || activeTab;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-[95%] sm:max-w-2xl rounded-2xl bg-white p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">
              {ct === "playbooks"
                ? (editingType ? "Edit Process Playbook" : "Add New Process Playbook")
                : (editingType ? "Edit " : "Add ") + (ct === "sops" ? (editingType ? "SOP" : "New SOP") : (editingType ? "Policy" : "New Policy"))}
            </div>
            <div className="relative">
              <button onClick={() => setFormMenuOpen(!formMenuOpen)} className="inline-flex items-center rounded-md p-1 hover:bg-gray-100">
                {/* <MoreVertical className="h-5 w-5 text-gray-500" /> */}
              </button>
              {formMenuOpen}
            </div>
          </div>
          {ct === "sops" && (
            <>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full text-xs flex items-center justify-center ${step >= 1 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}`}>{1}</div>
                  <div className={`text-sm ${step >= 1 ? "text-gray-900 font-semibold" : "text-gray-600"}`}>Basic Info</div>
                </div>
                <div className="h-px w-10 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full text-xs flex items-center justify-center ${step >= 2 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}`}>{2}</div>
                  <div className={`text-sm ${step >= 2 ? "text-gray-900 font-semibold" : "text-gray-600"}`}>Content</div>
                </div>
                <div className="h-px w-10 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full text-xs flex items-center justify-center ${step >= 3 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"}`}>{3}</div>
                  <div className={`text-sm ${step >= 3 ? "text-gray-900 font-semibold" : "text-gray-600"}`}>Controls</div>
                </div>
              </div>
              {step === 1 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">SOP Title *</div>
                    <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Enter SOP title" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">Department *</div>
                    <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.department || ""} onChange={e => setForm({ ...form, department: e.target.value })}>
                      <option value="">Select department</option>
                      {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">Category *</div>
                    <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="">Select category</option>
                      {(sopCategories.length ? sopCategories : ["General", "Operations", "Safety"]).map(t => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">Risk Level *</div>
                    <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.riskLevel || ""} onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
                      <option value="">Select risk level</option>
                      {riskOptions.map(r => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </div>
                  {/* <div className="space-y-1 sm:col-span-2">
                    <div className="text-sm font-medium text-gray-900">Applicable Roles *</div>
                    <div className="flex flex-wrap gap-1">
                      {roleOptions.map(r => {
                        const selected = (form.applicableRoles || []).includes(r);
                        return (
                          <button key={r} type="button" onClick={() => {
                            const curr = new Set(form.applicableRoles || []);
                            if (selected) { curr.delete(r); } else { curr.add(r); }
                            setForm({ ...form, applicableRoles: Array.from(curr) });
                          }} className={`rounded-full border px-3 py-1 text-xs ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                            {r}
                          </button>
                        );
                      })}
                    </div>
                    {(form.applicableRoles || []).some((v:string)=>/All Staff|Agent/i.test(v)) && agentUsers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Select Agents</div>
                        <select multiple className="w-full rounded-lg border px-3 py-2 text-sm" value={form.targetAgentIds || []} onChange={e => {
                          const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                          setForm({ ...form, targetAgentIds: opts });
                        }}>
                          <option value="__ALL_AGENTS__">All Agents</option>
                          {agentUsers.map(u => (<option key={u._id} value={u._id}>{u.name}</option>))}
                        </select>
                      </div>
                    )}
                    {(form.applicableRoles || []).some((v:string)=>/All Staff|DoctorStaff/i.test(v)) && doctorUsers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Select DoctorStaff</div>
                        <select multiple className="w-full rounded-lg border px-3 py-2 text-sm" value={form.targetDoctorIds || []} onChange={e => {
                          const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                          setForm({ ...form, targetDoctorIds: opts });
                        }}>
                          <option value="__ALL_DOCTORS__">All DoctorStaff</option>
                          {doctorUsers.map(u => (<option key={u._id} value={u._id}>{u.name}</option>))}
                        </select>
                      </div>
                    )}
                  </div> */}

                  {/* Replace the existing "Applicable Roles *" section in your CreateModal with this improved version */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-sm font-medium text-gray-900">Applicable Roles *</div>

                    {/* Main role selection - Clean pill buttons */}
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.map(r => {
                        const selected = (form.applicableRoles || []).includes(r);
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              const curr = new Set(form.applicableRoles || []);

                              // If selecting "All Staff", clear other selections
                              if (r === "All Staff" && !selected) {
                                // Select All Staff, deselect others
                                setForm({
                                  ...form,
                                  applicableRoles: ["All Staff"],
                                  targetAgentIds: [],
                                  targetDoctorIds: []
                                });
                              } else if (r === "All Staff" && selected) {
                                // Deselect All Staff
                                setForm({
                                  ...form,
                                  applicableRoles: [],
                                  targetAgentIds: [],
                                  targetDoctorIds: []
                                });
                              } else {
                                // Handle Agent or DoctorStaff selection
                                if (selected) {
                                  curr.delete(r);
                                } else {
                                  // If selecting a specific role, remove "All Staff" if present
                                  curr.delete("All Staff");
                                  curr.add(r);
                                }
                                setForm({
                                  ...form,
                                  applicableRoles: Array.from(curr)
                                });
                              }
                            }}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${selected
                              ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {r === "All Staff" ? "👥 All Staff" : r === "Agent" ? "👤 Agents" : "👨‍⚕️ Doctor Staff"}
                          </button>
                        );
                      })}
                    </div>

                    {/* Conditional rendering for Agent selection */}
                    {(form.applicableRoles || []).includes("Agent") && agentUsers.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                              <span className="text-xs font-semibold text-blue-700">👤</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">Select Agents</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={form.targetAgentIds?.includes("__ALL_AGENTS__")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({
                                      ...form,
                                      targetAgentIds: ["__ALL_AGENTS__", ...agentUsers.map(u => u._id)]
                                    });
                                  } else {
                                    setForm({
                                      ...form,
                                      targetAgentIds: form.targetAgentIds?.filter((id: string) => id !== "__ALL_AGENTS__")
                                    });
                                  }
                                }}
                              />
                              <span className="font-medium">Select All</span>
                            </label>
                            <span className="text-xs text-gray-500">{agentUsers.length} available</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {agentUsers.map(u => (
                            <label
                              key={u._id}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${form.targetAgentIds?.includes(u._id)
                                ? "border-gray-900 bg-gray-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={form.targetAgentIds?.includes(u._id) || form.targetAgentIds?.includes("__ALL_AGENTS__")}
                                onChange={(e) => {
                                  const current = new Set(form.targetAgentIds || []);
                                  if (e.target.checked) {
                                    current.add(u._id);
                                    // Remove "ALL" if manually selecting individuals
                                    current.delete("__ALL_AGENTS__");
                                  } else {
                                    current.delete(u._id);
                                  }
                                  setForm({ ...form, targetAgentIds: Array.from(current) });
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                <span className="text-xs text-gray-500">Agent</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {form.targetAgentIds?.length > 0 && !form.targetAgentIds?.includes("__ALL_AGENTS__") && (
                          <div className="mt-3 text-xs text-gray-600">
                            Selected {form.targetAgentIds.length} agent{form.targetAgentIds.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conditional rendering for Doctor Staff selection */}
                    {(form.applicableRoles || []).includes("DoctorStaff") && doctorUsers.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                              <span className="text-xs font-semibold text-green-700">👨‍⚕️</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">Select Doctor Staff</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={form.targetDoctorIds?.includes("__ALL_DOCTORS__")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({
                                      ...form,
                                      targetDoctorIds: ["__ALL_DOCTORS__", ...doctorUsers.map(u => u._id)]
                                    });
                                  } else {
                                    setForm({
                                      ...form,
                                      targetDoctorIds: form.targetDoctorIds?.filter((id: string) => id !== "__ALL_DOCTORS__")
                                    });
                                  }
                                }}
                              />
                              <span className="font-medium">Select All</span>
                            </label>
                            <span className="text-xs text-gray-500">{doctorUsers.length} available</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {doctorUsers.map(u => (
                            <label
                              key={u._id}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${form.targetDoctorIds?.includes(u._id)
                                ? "border-gray-900 bg-gray-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={form.targetDoctorIds?.includes(u._id) || form.targetDoctorIds?.includes("__ALL_DOCTORS__")}
                                onChange={(e) => {
                                  const current = new Set(form.targetDoctorIds || []);
                                  if (e.target.checked) {
                                    current.add(u._id);
                                    // Remove "ALL" if manually selecting individuals
                                    current.delete("__ALL_DOCTORS__");
                                  } else {
                                    current.delete(u._id);
                                  }
                                  setForm({ ...form, targetDoctorIds: Array.from(current) });
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                <span className="text-xs text-gray-500">Doctor Staff</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {form.targetDoctorIds?.length > 0 && !form.targetDoctorIds?.includes("__ALL_DOCTORS__") && (
                          <div className="mt-3 text-xs text-gray-600">
                            Selected {form.targetDoctorIds.length} doctor{form.targetDoctorIds.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary section showing selection status */}
                    {(form.applicableRoles || []).length > 0 && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200">
                          <span className="text-xs font-bold text-blue-700">✓</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-blue-900">Selection summary:</span>
                          <span className="ml-2 text-blue-800">
                            {form.applicableRoles?.includes("All Staff")
                              ? "All staff members will be assigned"
                              : [
                                form.applicableRoles?.includes("Agent") && `${form.targetAgentIds?.length || 0} agents`,
                                form.applicableRoles?.includes("DoctorStaff") && `${form.targetDoctorIds?.length || 0} doctor staff`
                              ].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">SOP Content</div>
                      <button type="button" className="rounded-lg border px-3 py-1 text-xs">AI Generate SOP</button>
                    </div>
                    <textarea rows={6} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Enter detailed SOP content, procedures, and guidelines..." value={form.content || ""} onChange={e => setForm({ ...form, content: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">Step-by-Step Checklist (Optional)</div>
                    <div className="flex gap-2">
                      <input className="flex-1 rounded-lg border px-3 py-2 text-sm" value={form._tmpChecklist || ""} onChange={e => setForm({ ...form, _tmpChecklist: e.target.value })} placeholder="Add checklist item" />
                      <button className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white" onClick={() => {
                        const list = [...(form.checklist || [])];
                        if (form._tmpChecklist) list.push(form._tmpChecklist);
                        setForm({ ...form, checklist: list, _tmpChecklist: "" });
                      }}>Add</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(form.checklist || []).map((c: string, idx: number) => (
                        <span key={`${c}-${idx}`} className="rounded-md bg-gray-100 px-2 py-1 text-xs">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">Attachments</div>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadAttachment(f);
                    }} />
                    <button type="button" onClick={triggerFilePicker} className="w-full rounded-lg border border-dashed p-6 text-center text-sm text-gray-700 hover:bg-gray-50">
                      <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                        <UploadCloud className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>{uploading ? "Uploading..." : "Click to upload from your system"}</div>
                      <div className="mt-1 text-xs text-gray-500">PDF, DOC, PPT, Video supported</div>
                    </button>
                    {uploadError && <div className="text-xs text-red-600">{uploadError}</div>}
                    {(form.attachments || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(form.attachments || []).map((url: string, idx: number) => (
                          <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-blue-700">
                            <FileText className="h-3 w-3" /> Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-700">Effective Date</div>
                    <input type="date" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.effectiveDate || ""} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-700">Review Date</div>
                    <input type="date" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.reviewDate || ""} onChange={e => setForm({ ...form, reviewDate: e.target.value })} />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-700">Version</div>
                    <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="text-sm font-medium text-gray-900">Mandatory Acknowledgment</div>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="text-sm text-gray-700">Require staff to acknowledge this SOP</div>
                      {/* <button
                        type="button"
                        onClick={() => {
                          const next = !form.mandatoryAck;
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, "0");
                          const dd = String(today.getDate()).padStart(2, "0");
                          const isoDate = `${yyyy}-${mm}-${dd}`;
                          setForm({
                            ...form,
                            mandatoryAck: next,
                            acknowledgmentDeadline: next ? (form.acknowledgmentDeadline || isoDate) : ""
                          });
                        }}
                        className={`relative h-6 w-11 rounded-full ${form.mandatoryAck ? "bg-gray-900" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.mandatoryAck ? "translate-x-5" : "translate-x-1"}`} />
                      </button> */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !form.mandatoryAck;
                          const today = new Date();
                          const tomorrow = new Date(today);
                          tomorrow.setDate(today.getDate() + 1);
                          const yyyy = tomorrow.getFullYear();
                          const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
                          const dd = String(tomorrow.getDate()).padStart(2, "0");
                          const tomorrowIso = `${yyyy}-${mm}-${dd}`;

                          setForm({
                            ...form,
                            mandatoryAck: next,
                            acknowledgmentDeadline: next
                              ? (form.acknowledgmentDeadline || form.reviewDate || tomorrowIso)
                              : "",
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 px-3 py-2
    ${form.mandatoryAck ? "bg-gray-900" : "bg-gray-300"}
  `}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300
      ${form.mandatoryAck ? "translate-x-5" : "translate-x-1"}
    `}
                        />
                      </button>

                    </div>
                  </div>
                  {form.mandatoryAck && (
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-sm text-gray-700">Acknowledgment Deadline</div>
                      <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={form.acknowledgmentDeadline || ""}
                        onChange={e => setForm({ ...form, acknowledgmentDeadline: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                    <div className="font-semibold text-gray-900">Preview Summary</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-gray-700">
                      <div>Title: {form.name || "Not set"}</div>
                      <div>Department: {form.department || "Not set"}</div>
                      <div>Risk Level: {form.riskLevel || "Not set"}</div>
                      <div>Roles: {(form.applicableRoles || []).length} selected</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-between">
                <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                <div className="flex gap-2">
                  {step > 1 && <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep(step - 1)}>Back</button>}
                  {step < 3 && <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={() => setStep(step + 1)}>Next</button>}
                  {step === 3 && <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={() => handleCreate(form)}>{editingType ? "Update SOP" : "Create SOP"}</button>}
                </div>
              </div>
            </>
          )}
          {ct === "policies" && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Policy Name *</div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Enter policy name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Department (Optional)</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.department || ""} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Policy Type *</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.policyType || ""} onChange={e => setForm({ ...form, policyType: e.target.value })}>
                    <option value="">Select type</option>
                    {(policyTypes.length ? policyTypes : ["Regulatory", "Privacy", "Organizational", "Safety", "HR"]).map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                {/* <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Applies To Roles *</div>
                  <div className="flex flex-wrap gap-2">
                    {policyRoleOptions.map(r => {
                      const selected = (form.appliesToRoles || []).includes(r);
                      return (
                        <button key={r} type="button" onClick={() => {
                          const curr = new Set(form.appliesToRoles || []);
                          if (selected) { curr.delete(r); } else { curr.add(r); }
                          setForm({ ...form, appliesToRoles: Array.from(curr) });
                        }} className={`rounded-full border px-3 py-1 text-xs ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  {(form.appliesToRoles || []).some((v: string) => /All Staff|Agent/i.test(v)) && agentUsers.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">Select Agents</div>
                      <select multiple className="w-full rounded-lg border px-3 py-2 text-sm" value={form.targetAgentIds || []} onChange={e => {
                        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                        setForm({ ...form, targetAgentIds: opts });
                      }}>
                        <option value="__ALL_AGENTS__">All Agents</option>
                        {agentUsers.map(u => (<option key={u._id} value={u._id}>{u.name}</option>))}
                      </select>
                    </div>
                  )}
                  {(form.appliesToRoles || []).some((v: string) => /All Staff|DoctorStaff/i.test(v)) && doctorUsers.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">Select DoctorStaff</div>
                      <select multiple className="w-full rounded-lg border px-3 py-2 text-sm" value={form.targetDoctorIds || []} onChange={e => {
                        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                        setForm({ ...form, targetDoctorIds: opts });
                      }}>
                        <option value="__ALL_DOCTORS__">All DoctorStaff</option>
                        {doctorUsers.map(u => (<option key={u._id} value={u._id}>{u.name}</option>))}
                      </select>
                    </div>
                  )}
                </div> */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Applies To Roles *</div>

                  {/* Main role selection - Clean pill buttons */}
                  <div className="flex flex-wrap gap-2">
                    {policyRoleOptions.map(r => {
                      const selected = (form.appliesToRoles || []).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const curr = new Set(form.appliesToRoles || []);

                            // If selecting "All Staff", clear other selections
                            if (r === "All Staff" && !selected) {
                              // Select All Staff, deselect others
                              setForm({
                                ...form,
                                appliesToRoles: ["All Staff"],
                                targetAgentIds: [],
                                targetDoctorIds: []
                              });
                            } else if (r === "All Staff" && selected) {
                              // Deselect All Staff
                              setForm({
                                ...form,
                                appliesToRoles: [],
                                targetAgentIds: [],
                                targetDoctorIds: []
                              });
                            } else {
                              // Handle Agent or DoctorStaff selection
                              if (selected) {
                                curr.delete(r);
                              } else {
                                // If selecting a specific role, remove "All Staff" if present
                                curr.delete("All Staff");
                                curr.add(r);
                              }
                              setForm({
                                ...form,
                                appliesToRoles: Array.from(curr)
                              });
                            }
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${selected
                              ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {r === "All Staff" ? "👥 All Staff" : r === "Agent" ? "👤 Agents" : "👨‍⚕️ Doctor Staff"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conditional rendering for Agent selection */}
                  {(form.appliesToRoles || []).includes("Agent") && agentUsers.length > 0 && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-xs font-semibold text-blue-700">👤</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">Select Agents</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              checked={form.targetAgentIds?.includes("__ALL_AGENTS__")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({
                                    ...form,
                                    targetAgentIds: ["__ALL_AGENTS__", ...agentUsers.map(u => u._id)]
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    targetAgentIds: form.targetAgentIds?.filter((id: string) => id !== "__ALL_AGENTS__")
                                  });
                                }
                              }}
                            />
                            <span className="font-medium">Select All</span>
                          </label>
                          <span className="text-xs text-gray-500">{agentUsers.length} available</span>
                        </div>
                      </div>

                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                        {agentUsers.map(u => (
                          <label
                            key={u._id}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${form.targetAgentIds?.includes(u._id)
                                ? "border-gray-900 bg-gray-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              checked={form.targetAgentIds?.includes(u._id) || form.targetAgentIds?.includes("__ALL_AGENTS__")}
                              onChange={(e) => {
                                const current = new Set(form.targetAgentIds || []);
                                if (e.target.checked) {
                                  current.add(u._id);
                                  // Remove "ALL" if manually selecting individuals
                                  current.delete("__ALL_AGENTS__");
                                } else {
                                  current.delete(u._id);
                                }
                                setForm({ ...form, targetAgentIds: Array.from(current) });
                              }}
                            />
                            <div className="flex flex-col truncate">
                              <span className="truncate text-sm font-medium text-gray-900">{u.name}</span>
                              <span className="text-xs text-gray-500">Agent</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {form.targetAgentIds?.length > 0 && !form.targetAgentIds?.includes("__ALL_AGENTS__") && (
                        <div className="mt-3 text-xs text-gray-600">
                          Selected {form.targetAgentIds.length} agent{form.targetAgentIds.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conditional rendering for Doctor Staff selection */}
                  {(form.appliesToRoles || []).includes("DoctorStaff") && doctorUsers.length > 0 && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                            <span className="text-xs font-semibold text-green-700">👨‍⚕️</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">Select Doctor Staff</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              checked={form.targetDoctorIds?.includes("__ALL_DOCTORS__")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({
                                    ...form,
                                    targetDoctorIds: ["__ALL_DOCTORS__", ...doctorUsers.map(u => u._id)]
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    targetDoctorIds: form.targetDoctorIds?.filter((id: string) => id !== "__ALL_DOCTORS__")
                                  });
                                }
                              }}
                            />
                            <span className="font-medium">Select All</span>
                          </label>
                          <span className="text-xs text-gray-500">{doctorUsers.length} available</span>
                        </div>
                      </div>

                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                        {doctorUsers.map(u => (
                          <label
                            key={u._id}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${form.targetDoctorIds?.includes(u._id)
                                ? "border-gray-900 bg-gray-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              checked={form.targetDoctorIds?.includes(u._id) || form.targetDoctorIds?.includes("__ALL_DOCTORS__")}
                              onChange={(e) => {
                                const current = new Set(form.targetDoctorIds || []);
                                if (e.target.checked) {
                                  current.add(u._id);
                                  // Remove "ALL" if manually selecting individuals
                                  current.delete("__ALL_DOCTORS__");
                                } else {
                                  current.delete(u._id);
                                }
                                setForm({ ...form, targetDoctorIds: Array.from(current) });
                              }}
                            />
                            <div className="flex flex-col truncate">
                              <span className="truncate text-sm font-medium text-gray-900">{u.name}</span>
                              <span className="text-xs text-gray-500">Doctor Staff</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {form.targetDoctorIds?.length > 0 && !form.targetDoctorIds?.includes("__ALL_DOCTORS__") && (
                        <div className="mt-3 text-xs text-gray-600">
                          Selected {form.targetDoctorIds.length} doctor{form.targetDoctorIds.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary section showing selection status */}
                  {(form.appliesToRoles || []).length > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200">
                        <span className="text-xs font-bold text-blue-700">✓</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-blue-900">Selection summary:</span>
                        <span className="ml-2 text-blue-800">
                          {form.appliesToRoles?.includes("All Staff")
                            ? "All staff members will be assigned"
                            : [
                              form.appliesToRoles?.includes("Agent") && `${form.targetAgentIds?.length || 0} agents selected`,
                              form.appliesToRoles?.includes("DoctorStaff") && `${form.targetDoctorIds?.length || 0} doctor staff selected`
                            ].filter(Boolean).join(" • ")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Policy Description *</div>
                  <textarea rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Enter detailed policy description..." value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                {/* <div className="space-y-2 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Approval Required</div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="text-sm text-gray-700">Require management approval before enforcement</div>
                    <button type="button" onClick={() => setForm({ ...form, approvalRequired: !form.approvalRequired })} className={`relative h-6 w-11 rounded-full ${form.approvalRequired ? "bg-gray-900" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.approvalRequired ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div> */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">
                    Approval Required
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="text-sm text-gray-700 leading-snug">
                      Require management approval before enforcement
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          approvalRequired: !form.approvalRequired,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
        ${form.approvalRequired ? "bg-gray-900" : "bg-gray-300"}
      `}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300
          ${form.approvalRequired ? "translate-x-5" : "translate-x-1"}
        `}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Effective Date</div>
                  <input type="date" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.effectiveDate || ""} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Version</div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.version || "1.0"} onChange={e => setForm({ ...form, version: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Mandatory Acknowledgment</div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="text-sm text-gray-700">Require staff to acknowledge this policy</div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mandatoryAck: !form.mandatoryAck })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${form.mandatoryAck ? "bg-gray-900" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${form.mandatoryAck ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="rounded-lg border px-4 py-2 text-sm mr-2" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={() => handleCreate(form)}>{editingType ? "Update Policy" : "Create Policy"}</button>
              </div>
            </>
          )}
          {ct === "playbooks" && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Scenario Name *</div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g., Patient Emergency Response" value={form.scenarioName || ""} onChange={e => setForm({ ...form, scenarioName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">When to Use (Trigger Condition) *</div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Describe when this playbook should be activated..." value={form.triggerCondition || ""} onChange={e => setForm({ ...form, triggerCondition: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Department *</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.department || ""} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Risk Level *</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.riskLevel || ""} onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
                    <option value="">Select risk level</option>
                    {riskOptions.map(r => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Responsible Owner</div>
                  <div className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {(() => {
                      // Get clinic owner name from storage
                      const ownerName = typeof window !== 'undefined' ?
                        (localStorage.getItem("clinicOwnerName") ||
                          sessionStorage.getItem("clinicOwnerName") ||
                          "Clinic Admin") : "Clinic Admin";
                      return ownerName;
                    })()}
                  </div>
                  <input type="hidden" name="owner" value="" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Expected Resolution Time</div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g., 30 minutes" value={form.expectedResolutionTime || ""} onChange={e => setForm({ ...form, expectedResolutionTime: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Escalation Level</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.escalationLevel || ""} onChange={e => setForm({ ...form, escalationLevel: e.target.value })}>
                    <option value="">Select level</option>
                    {escalationLevels.map(l => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">Status</div>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.status || "Active"} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">Step-by-Step Handling Process *</div>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" /> AI Suggest Steps
                    </button>
                  </div>
                  <div className="relative flex gap-2">
                    <input className="flex-1 rounded-lg border px-3 py-2 text-sm" value={form._tmpStep || ""} onChange={e => setForm({ ...form, _tmpStep: e.target.value })} placeholder="Add a step..." />
                    <button className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white" aria-label="Add step" onClick={() => {
                      const list = [...(form.steps || [])];
                      if (form._tmpStep) list.push(form._tmpStep);
                      setForm({ ...form, steps: list, _tmpStep: "" });
                    }}>+</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(form.steps || []).map((s: string, idx: number) => (
                      <div key={`${s}-${idx}`} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs">{idx + 1}</span>
                          <span className="text-sm">{s}</span>
                        </div>
                        <button
                          className="rounded-md border px-2 py-1 text-xs"
                          onClick={() => {
                            const list = [...(form.steps || [])];
                            list.splice(idx, 1);
                            setForm({ ...form, steps: list });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Escalation Path Builder</div>
                  <div className="mb-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="rounded-md bg-white px-2 py-1">Staff Member</span>
                      <span>→</span>
                      <span className="rounded-md bg-white px-2 py-1">Supervisor</span>
                      <span>→</span>
                      <span className="rounded-md bg-white px-2 py-1">Department Head</span>
                      <span>→</span>
                      <span className="rounded-md bg-white px-2 py-1">C-Level</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(form.escalationPath || []).map((s: string, idx: number) => (<span key={`${s}-${idx}`} className="rounded-md bg-gray-100 px-2 py-1 text-xs">{s}</span>))}
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Attach Training Material (Optional)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadAttachment(f);
                    }}
                  />
                  <div
                    className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={triggerFilePicker}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer?.files?.[0];
                      if (f) uploadAttachment(f);
                    }}
                  >
                    <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                      <UploadCloud className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>Drop files or click to upload training materials</div>
                  </div>
                  {(form.attachments || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(form.attachments || []).map((url: string, idx: number) => (
                        <a
                          key={`${url}-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-blue-700"
                        >
                          <FileText className="h-3 w-3" /> Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="rounded-lg border px-4 py-2 text-sm mr-2" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={() => handleCreate(form)}>{editingType ? "Update Playbook" : "Create Playbook"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const AckModal = ({ onClose }: { onClose: () => void }) => {
    const [form, setForm] = useState<Record<string, any>>({
      role: "agent",
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      acknowledgedOn: ""
    });
    const [staffList, setStaffList] = useState<Array<{ _id: string; name: string }>>([]);
    const [docType, setDocType] = useState<"SOP" | "Policy" | "Playbook">("SOP");
    const [docOptions, setDocOptions] = useState<Array<{ _id: string; name: string; version?: string }>>([]);
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      (async () => {
        const res = await fetch(`/api/lead-ms/get-agents?role=${form.role}`, { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const arr = (json.agents || []).map((u: any) => ({ _id: u._id, name: u.name }));
          setStaffList(arr);
        }
      })();
    }, [form.role]);

    useEffect(() => {
      (async () => {
        const endpoint = docType === "SOP" ? "/api/compliance/sops" : docType === "Policy" ? "/api/compliance/policies" : "/api/compliance/playbooks";
        const res = await fetch(endpoint, { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          const arr = (json.items || []).map((i: any) => ({ _id: i._id, name: i.name || i.scenarioName, version: i.version }));
          setDocOptions(arr);
        }
      })();
    }, [docType]);

    const filteredStaff = staffList.filter(s => !query || s.name?.toLowerCase().includes(query.toLowerCase()));

    const submitAck = async () => {
      if (!form.staffId || !form.documentId) return;
      const payload = {
        staffId: form.staffId,
        staffName: form.staffName,
        role: form.role,
        documentType: docType,
        documentId: form.documentId,
        documentName: form.documentName,
        version: form.version || "",
      };
      const res = await fetch("/api/compliance/acknowledgments", { method: "POST", headers: headersWithJson(), body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success && json.item) {
        setAckItems(prev => [json.item, ...prev]);
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-[95%] sm:max-w-2xl rounded-2xl bg-white p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">Add Staff Acknowledgment</div>
            <button onClick={onClose} className="rounded-md px-3 py-1 text-sm border hover:bg-gray-50">Close</button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <div className="text-sm font-medium text-gray-900">Role</div>
              <div className="flex gap-2">
                {["agent", "doctorStaff"].map(r => (
                  <button key={r} className={`rounded-full border px-3 py-1 text-xs ${form.role === r ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`} onClick={() => setForm({ ...form, role: r })}>
                    {r === "agent" ? "Agent" : "DoctorStaff"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2 relative">
              <div className="text-sm font-medium text-gray-900">Staff Name</div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Type to search staff..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && query && filteredStaff.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border bg-white shadow z-50">
                  {filteredStaff.slice(0, 8).map(s => (
                    <button
                      key={s._id}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${form.staffId === s._id ? "bg-gray-100" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, staffId: s._id, staffName: s.name });
                        setQuery("");
                        setShowSuggestions(false);
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">Type</div>
              <select className="w-full rounded-lg border px-3 py-2 text-sm" value={docType} onChange={e => setDocType(e.target.value as any)}>
                <option value="SOP">SOP Library</option>
                <option value="Policy">Policy Center</option>
                <option value="Playbook">Process Playbooks</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">Document Name</div>
              <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.documentId || ""} onChange={e => {
                const id = e.target.value;
                const doc = docOptions.find(d => d._id === id);
                setForm({ ...form, documentId: id, documentName: doc?.name, version: doc?.version || "" });
              }}>
                <option value="">Select document</option>
                {docOptions.map(d => (<option key={d._id} value={d._id}>{d.name}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">Version</div>
              <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-lg border px-4 py-2 text-sm mr-2" onClick={onClose}>Cancel</button>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={submitAck}>Add</button>
          </div>
        </div>
      </div>
    );
  };

  if (!permissionsLoaded) {
    return <Loader />;
  }

  return (
    <>
      <Head>
        <title>Process & Compliance | ZEVA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-3 py-4">
          <div className="rounded-2xl border bg-white p-4">
            <div className="mt-1 text-lg font-bold text-gray-900">Process & Compliance</div>
            <div className="mt-1 text-xs text-gray-600">Manage SOPs, policies, playbooks, and track compliance across your organization</div>

            {!canViewData && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <ShieldCheck className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Access Denied</h3>
                <p className="mt-1 text-xs text-gray-700">
                  You do not have permission to view policy compliance data. Please contact your administrator.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              <button onClick={() => setActiveTab("sops")} className={`rounded-lg px-3 py-1.5 text-xs ${activeTab === "sops" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>SOP Library</button>
              <button onClick={() => setActiveTab("policies")} className={`rounded-lg px-3 py-1.5 text-xs ${activeTab === "policies" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>Policy Center</button>
              <button onClick={() => setActiveTab("playbooks")} className={`rounded-lg px-3 py-1.5 text-xs ${activeTab === "playbooks" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>Process Playbooks</button>
            {!hideAckTabForStaff && (
              <button onClick={() => setActiveTab("ack")} className={`rounded-lg px-3 py-1.5 text-xs ${activeTab === "ack" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                <span>Acknowledgment Tracker</span>
                {ackPending > 0 && (
                  <span className={`ml-2 inline-flex items-center justify-center rounded-full ${activeTab === "ack" ? "bg-white text-gray-900" : "bg-red-600 text-white"} text-[10px] h-4 min-w-4 px-1`}>
                    {ackPending}
                  </span>
                )}
              </button>
            )}
            </div>

            {canViewData && activeTab === "playbooks" && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard
                  title="Total Playbooks"
                  value={overview?.playbookCount || 0}
                  subtitle="Active scenarios"
                  icon={<BookOpenCheck className="h-5 w-5 text-purple-500" />}
                  theme="purple"
                />
                <StatCard
                  title="Critical Risk"
                  value={playbooks.filter(p => p.riskLevel === "Critical").length}
                  subtitle="High priority playbooks"
                  icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                  theme="red"
                />
                <StatCard
                  title="Avg Resolution"
                  value={`${avgResolution} min`}
                  subtitle="Average handling time"
                  icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                  theme="green"
                />
              </div>
            )}

            {canViewData && activeTab === "ack" && !hideAckTabForStaff && (
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-900">Pending</div>
                    <ClipboardList className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-blue-900">{ackPending}</div>
                  <div className="text-[11px] text-blue-700">Awaiting acknowledgment</div>
                </div>
                <div className="rounded-xl border bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-green-900">Completed</div>
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-green-900">{ackCompleted}</div>
                  <div className="text-[11px] text-green-700">Successfully acknowledged</div>
                </div>
                <div className="rounded-xl border bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-red-900">Overdue</div>
                    <ShieldCheck className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-red-900">{ackOverdue}</div>
                  <div className="text-[11px] text-red-700">Past due date</div>
                </div>
                <div className="rounded-xl border bg-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-purple-900">Compliance Rate</div>
                    <FileText className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-purple-900">{ackComplianceRate}%</div>
                  <div className="text-[11px] text-purple-700">Overall completion</div>
                </div>
              </div>
            )}

            {canViewData && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border bg-white px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={activeTab === "sops" ? "Search SOPs..." : activeTab === "policies" ? "Search policies..." : activeTab === "ack" ? "Search staff or documents..." : "Search scenarios..."}
                  className="ml-2 w-full text-xs outline-none"
                />
              </div>
              {activeTab === "policies" ? (
                <>
                  <select value={policyTypeFilter} onChange={e => setPolicyTypeFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Types</option>
                    {(policyTypes.length ? policyTypes : ["Regulatory", "Privacy", "Organizational", "Safety", "HR"]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select value={rolesFilter} onChange={e => setRolesFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Roles</option>
                    {availableRoles.map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </>
              ) : activeTab === "playbooks" ? (
                <>
                  <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Departments</option>
                    {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                  </select>
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Risk Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </>
              ) : activeTab === "ack" ? (
                <>
                  <select value={ackStatusFilter} onChange={e => setAckStatusFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Status</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Pending">Pending</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                  <select value={ackTypeFilter} onChange={e => setAckTypeFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Types</option>
                    <option value="SOP">SOP</option>
                    <option value="Policy">Policy</option>
                    <option value="Playbook">Playbook</option>
                  </select>
                </>
              ) : (
                <>
                  <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Departments</option>
                    {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                  </select>
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs">
                    <option value="">All Risk Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </>
              )}
            </div>
            )}

            {canCreateActions && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeTab === "sops" && (
                  <button onClick={() => setShowCategoryModal(true)} className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white">
                    <Plus className="h-4 w-4 mr-1" /> Create Categories
                  </button>
                )}
                {activeTab === "policies" && (
                  <button onClick={() => setShowTypeModal(true)} className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white">
                    <Plus className="h-4 w-4 mr-1" /> Create Type
                  </button>
                )}
                {activeTab !== "ack" && (
                  <button
                    onClick={() => {
                      setEditingType(null);
                      setEditingItem(null);
                      setShowCreate(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white"
                  >
                    <Plus className="h-4 w-4" /> {activeTab === "sops" ? "Add SOP" : activeTab === "policies" ? "Add Policy" : "Add Playbook"}
                  </button>
                )}
              </div>
            )}

            {canViewData && activeTab === "sops" && (
              <div className="mt-4 overflow-x-auto">
                <div className="mb-2 text-xs text-gray-600">{filteredSops.length} SOPs found</div>
                <table className="min-w-max w-full border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-gray-600">
                      <th className="w-6 px-2 py-2"></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><FileText className="h-4 w-4 text-gray-500" /><span>SOP Name</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden sm:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Building className="h-4 w-4 text-gray-500" /><span>Department</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Users className="h-4 w-4 text-gray-500" /><span>Applicable Roles</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Layers className="h-4 w-4 text-gray-500" /><span>Category</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><AlertTriangle className="h-4 w-4 text-gray-500" /><span>Risk Level</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Tag className="h-4 w-4 text-gray-500" /><span>Version</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-gray-500" /><span>Last Updated</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck className="h-4 w-4 text-gray-500" /><span>Status</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ClipboardList className="h-4 w-4 text-gray-500" /><span>Acknowledgment</span></div></th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSops.map(i => (
                      <tr key={i._id} className="border-t text-xs">
                        <td className="px-2 py-2">
                          {/* <input type="checkbox" className="h-4 w-4 rounded border" /> */}
                        </td>
                        <td className="px-2 py-2 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center rounded-full bg-gray-100 text-xs text-gray-700"></div>
                            <button className="text-left hover:underline" onClick={() => onSopTitleClick(i._id, i.name)}>{i.name}</button>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden sm:table-cell">{i.department}</td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(i.applicableRoles || []).map((r, idx) => {
                              const ab = r.slice(0, 2).toUpperCase();
                              return <span key={`${r}-${idx}`} className="inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700">{ab}</span>;
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{i.category}</td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs">{i.riskLevel}</span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden lg:table-cell">{i.version}</td>
                        <td className="px-2 py-2 text-gray-700 hidden lg:table-cell">{new Date(i.lastUpdated).toLocaleDateString('en-GB')}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-md px-2 py-1 text-xs ${i.status === "Active" ? "bg-green-100" : i.status === "Under Review" ? "bg-blue-100" : "bg-gray-100"}`}>{i.status}</span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-900 font-semibold">{Math.round(i.ackOverall || 0)}%</div>
                            <div className="w-20 rounded bg-gray-200">
                              <div className="h-2 rounded bg-gray-900" style={{ width: `${Math.min(Math.max(i.ackOverall || 0, 0), 100)}%` }} />
                            </div>
                            {Math.round(i.ackOverall || 0) === 100 && <CircleCheckBig className="h-4 w-4 text-green-600" />}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right relative">
                          <button onClick={() => setRowMenuId(rowMenuId === i._id ? null : i._id)} className="inline-flex items-center rounded-md p-1 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                          {rowMenuId === i._id && (
                            <div className="absolute right-2 top-9 z-10 w-32 rounded-lg border bg-white shadow">
                              <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowView("sops", i._id, i.name)}>View</button>
                              {canUpdateActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowEdit("sops", i)}>Edit</button>
                              )}
                              {canDeleteActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-gray-50" onClick={() => handleRowDelete("sops", i._id)}>Delete</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canViewData && activeTab === "policies" && (
              <div className="mt-4 overflow-x-auto">
                <div className="mb-2 text-xs text-gray-600">{filteredPolicies.length} policies found</div>
                <table className="min-w-max w-full border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-gray-600">
                      <th className="w-6 px-2 py-2"></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><FileText className="h-4 w-4 text-gray-500" /><span>Policy Name</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden sm:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Tag className="h-4 w-4 text-gray-500" /><span>Policy Type</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Users className="h-4 w-4 text-gray-500" /><span>Applies To</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck className="h-4 w-4 text-gray-500" /><span>Approval Required</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Hash className="h-4 w-4 text-gray-500" /><span>Version</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-gray-500" /><span>Effective Date</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck className="h-4 w-4 text-gray-500" /><span>Status</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ClipboardList className="h-4 w-4 text-gray-500" /><span>Acknowledgment</span></div></th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.map(i => (
                      <tr key={i._id} className="border-t text-xs">
                        <td className="px-2 py-2">
                          {/* <input type="checkbox" className="h-4 w-4 rounded border" /> */}
                        </td>
                        <td className="px-2 py-2 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {i.name}
                          </div>
                        </td>
                        <td className="px-2 py-2 hidden sm:table-cell">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">{i.policyType}</span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{i.appliesTo}</td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <span className={`rounded-md px-2 py-1 text-xs ${i.approvalRequired ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>
                            {i.approvalRequired ? "Required" : "Not Required"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden lg:table-cell">{i.version}</td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{new Date(i.effectiveDate).toLocaleDateString()}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-md px-2 py-1 text-xs ${i.status === "Active" ? "bg-green-100" : i.status === "Under Review" ? "bg-blue-100" : "bg-gray-100"}`}>{i.status}</span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-900 font-semibold">{Math.round((i as any).ackOverall || 0)}%</div>
                            <div className="w-20 rounded bg-gray-200">
                              <div className="h-2 rounded bg-gray-900" style={{ width: `${Math.min(Math.max((i as any).ackOverall || 0, 0), 100)}%` }} />
                            </div>
                            {Math.round((i as any).ackOverall || 0) === 100 && <CircleCheckBig className="h-4 w-4 text-green-600" />}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right relative">
                          <button onClick={() => setRowMenuId(rowMenuId === i._id ? null : i._id)} className="inline-flex items-center rounded-md p-1 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                          {rowMenuId === i._id && (
                            <div className="absolute right-2 top-9 z-10 w-32 rounded-lg border bg-white shadow">
                              <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowView("policies", i._id, i.name)}>View</button>
                              {canUpdateActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowEdit("policies", i)}>Edit</button>
                              )}
                              {canDeleteActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-gray-50" onClick={() => handleRowDelete("policies", i._id)}>Delete</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canViewData && activeTab === "playbooks" && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-max w-full border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-gray-600">
                      <th className="w-6 px-2 py-2"></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><FileText className="h-4 w-4 text-gray-500" /><span>Scenario Name</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><AlertTriangle className="h-4 w-4 text-gray-500" /><span>Trigger Condition</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><Building className="h-4 w-4 text-gray-500" /><span>Department</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><AlertTriangle className="h-4 w-4 text-gray-500" /><span>Risk Level</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><User className="h-4 w-4 text-gray-500" /><span>Owner</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-4 w-4 text-gray-500" /><span>Resolution Time</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><TrendingUp className="h-4 w-4 text-gray-500" /><span>Escalation Level</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck className="h-4 w-4 text-gray-500" /><span>Status</span></div></th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlaybooks.map(i => (
                      <tr key={i._id} className="border-t text-xs">
                        <td className="px-2 py-2">
                          {/* <input type="checkbox" className="h-4 w-4 rounded border" /> */}
                        </td>
                        <td className="px-2 py-2 font-semibold text-gray-900">{i.scenarioName}</td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {/* <ClipboardList className="h-4 w-4 text-purple-500" /> */}
                            <span>{i.triggerCondition}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-700">{i.department}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-md px-2 py-1 text-xs ${i.riskLevel === "Critical" ? "bg-red-100 text-red-700" :
                            i.riskLevel === "High" ? "bg-orange-100 text-orange-700" :
                              i.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                            }`}>{i.riskLevel}</span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {/* <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-700">
                              {i.ownerName ? i.ownerName.charAt(0).toUpperCase() : "C"}
                            </div> */}
                            <span>{i.ownerName || "Clinic Admin"}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{i.resolutionTimeMinutes ? `${i.resolutionTimeMinutes} mins` : "-"}</td>
                        <td className="px-2 py-2 hidden lg:table-cell">
                          <span className="rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700">{i.escalationLevel || "-"}</span>
                        </td>
                        <td className="px-2 py-2">
                          <span className={`rounded-md px-2 py-1 text-xs ${i.status === "Active" ? "bg-green-100" : i.status === "Under Review" ? "bg-blue-100" : "bg-gray-100"}`}>{i.status}</span>
                        </td>
                        <td className="px-2 py-2 text-right relative">
                          <button onClick={() => setRowMenuId(rowMenuId === i._id ? null : i._id)} className="inline-flex items-center rounded-md p-1 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                          {rowMenuId === i._id && (
                            <div className="absolute right-2 top-9 z-10 w-32 rounded-lg border bg-white shadow">
                              <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowView("playbooks", i._id, i.scenarioName)}>View</button>
                              {canUpdateActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => handleRowEdit("playbooks", i)}>Edit</button>
                              )}
                              {canDeleteActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-gray-50" onClick={() => handleRowDelete("playbooks", i._id)}>Delete</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canViewData && activeTab === "ack" && (
              <div className="mt-4 overflow-x-auto">
                <div className="mb-2 text-xs text-gray-600">{filteredAckItems.length} records found</div>
                <table className="min-w-max w-full border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-gray-600">
                      <th className="w-6 px-2 py-2"></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><User className="h-4 w-4 text-gray-500" /><span>Staff Name</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><Users className="h-4 w-4 text-gray-500" /><span>Role</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><FileText className="h-4 w-4 text-gray-500" /><span>Document Name</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Tag className="h-4 w-4 text-gray-500" /><span>Type</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden lg:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Hash className="h-4 w-4 text-gray-500" /><span>Version</span></div></th>
                      <th className="px-2 sm:px-3 py-3"><div className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck className="h-4 w-4 text-gray-500" /><span>Status</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-gray-500" /><span>Assigned Date</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-gray-500" /><span>Due Date</span></div></th>
                      <th className="px-2 sm:px-3 py-3 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-gray-500" /><span>Acknowledged On</span></div></th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAckItems.map(i => (
                      <tr key={i._id} className="border-t text-xs">
                        <td className="px-2 py-2">
                          {/* <input type="checkbox" className="h-4 w-4 rounded border" /> */}
                        </td>
                        <td className="px-2 py-2 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {i.staffName}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-700">{i.role}</td>
                        <td className="px-2 py-2 text-gray-700">{i.documentName}</td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">{(i as any).documentType || i.type}</span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden lg:table-cell">{i.version}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${i.status === "Acknowledged"
                              ? "bg-green-100 text-green-700"
                              : i.status === "Pending"
                                ? "bg-blue-100 text-blue-700"
                                : i.status === "Viewed"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                          >
                            {i.status === "Acknowledged" && (
                              <CircleCheckBig className="h-3.5 w-3.5" />
                            )}
                            {i.status === "Pending" && (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {i.status === "Viewed" && (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            {i.status === "Overdue" && (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            <span>{i.status}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{i.assignedDate ? new Date(i.assignedDate).toLocaleDateString('en-GB') : "-"}</td>
                        <td className="px-2 py-2 text-gray-700 hidden md:table-cell">{i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-GB') : "-"}</td>
                        <td className={`px-2 py-2 hidden md:table-cell ${i.acknowledgedOn ? "text-green-700" : "text-gray-500"}`}>
                          <div className="flex items-center gap-2">
                            <span>{i.acknowledgedOn ? new Date(i.acknowledgedOn).toLocaleDateString('en-GB') : "-"}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right relative">
                          <button onClick={() => setRowMenuId(rowMenuId === i._id ? null : i._id)} className="inline-flex items-center rounded-md p-1 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                          {rowMenuId === i._id && (
                            <div className="absolute right-2 top-9 z-10 w-36 rounded-lg border bg-white shadow">
                              <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => {
                                const t = (i as any).documentType === "SOP" ? "sops" : (i as any).documentType === "Policy" ? "policies" : "playbooks";
                                handleRowView(t as TabKey, (i as any).documentId || i._id, i.documentName, i as any);
                              }}>View</button>
                              {canUpdateActions && (
                                <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => {
                                  const t = (i as any).documentType === "SOP" ? "sops" : (i as any).documentType === "Policy" ? "policies" : "playbooks";
                                  handleRowEdit(t as TabKey, i);
                                }}>Edit</button>
                              )}
                              <button className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50" onClick={() => {
                                fetch(`/api/compliance/acknowledgments`, {
                                  method: "POST",
                                  headers: headersWithJson(),
                                  body: JSON.stringify({
                                    staffId: (i as any).staffId || i._id,
                                    staffName: i.staffName,
                                    role: i.role,
                                    documentType: (i as any).documentType || i.type,
                                    documentId: (i as any).documentId || i._id,
                                    documentName: i.documentName,
                                    version: i.version,
                                    notifyOnly: true
                                  })
                                }).then(() => setRowMenuId(null));
                              }}>Track</button>
                            </div>
                          )}
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
      {showCreate && (permissions.canCreate || (editingType && canUpdateActions)) && <CreateModal />}
      {ackModalOpen && canCreateActions && <AckModal onClose={() => setAckModalOpen(false)} />}
      {viewerOpen && viewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">Z</div>
                  <span className="text-xs font-bold text-gray-800">Zeva</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{viewerTitle}</div>
              </div>
              <button
                onClick={() => {
                  setViewerOpen(false);
                  setViewerError(null);
                }}
                className="rounded-md px-3 py-1 text-sm border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            {viewerError && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="text-red-700 text-sm">{String(viewerError)}</div>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto p-0">
              <div ref={pdfContainerRef} className="p-4" />
            </div>
          </div>
        </div>
      )}
      {showTypeModal && canCreateActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">Create Policy Type</div>
              <button onClick={() => {
                setShowTypeModal(false);
                setPolicyTypeDraft("");
              }} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-900">Type Name *</div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="e.g., Privacy"
                value={policyTypeDraft}
                onChange={e => setPolicyTypeDraft(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => {
                setShowTypeModal(false);
                setPolicyTypeDraft("");
              }}>Cancel</button>
              <button
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                onClick={async () => {
                  const name = policyTypeDraft.trim();
                  if (!name) return;
                  try {
                    const res = await fetch("/api/compliance/policy_types", {
                      method: "POST",
                      headers: headersWithJson(),
                      body: JSON.stringify({ name })
                    });
                    const json = await res.json();
                    if (json.success && json.item) {
                      setPolicyTypes(prev => {
                        const next = Array.from(new Set([...(prev || []), json.item.name]));
                        return next;
                      });
                      setPolicyTypeDraft("");
                      setShowTypeModal(false);
                    }
                  } catch { }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategoryModal && canCreateActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">Create SOP Category</div>
              <button onClick={() => {
                setShowCategoryModal(false);
                setCategoryDraft(""); // Clear draft when closing
              }} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-900">Category Name *</div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="e.g., Operations"
                value={categoryDraft}
                onChange={e => setCategoryDraft(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => {
                setShowCategoryModal(false);
                setCategoryDraft("");
              }}>Cancel</button>
              <button
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                onClick={async () => {
                  const name = categoryDraft.trim();
                  if (!name) return;
                  try {
                    const res = await fetch("/api/compliance/sop_categories", {
                      method: "POST",
                      headers: headersWithJson(),
                      body: JSON.stringify({ name })
                    });
                    const json = await res.json();
                    if (json.success && json.item) {
                      setSopCategories(prev => {
                        const next = Array.from(new Set([...(prev || []), json.item.name]));
                        return next;
                      });
                      setCategoryDraft("");
                      setShowCategoryModal(false);
                    }
                  } catch { }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

PolicyCompliance.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedPolicyCompliance: NextPageWithLayout = withClinicAuth(PolicyCompliance);
ProtectedPolicyCompliance.getLayout = PolicyCompliance.getLayout;

export default ProtectedPolicyCompliance;
