import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC, useState, useEffect, useRef } from "react";
import clsx from "clsx";
import axios from "axios";
import {
  BarChart3,
  Users,
  FileText,
  Briefcase,
  MessageSquare,
  Calendar,
  CreditCard,
  Star,
  Mail,
  TrendingUp,
  Lock,
  LayoutDashboard,
  Stethoscope,
  Building2,
  UserCircle,
  Menu,
  Inbox,
  UserPlus,
  ClipboardList,
  Gift,
  UserCog,
  PenTool,
  BriefcaseBusiness,
  Eye,
  Phone,
  MessageCircle,
  Send,
  FileEdit,
  HelpCircle,
  Bell,
  CalendarCheck,
  CalendarDays,
  Clock,
  DollarSign,
  Package,
  ShoppingBag,
  Heart,
  Activity,
  Zap,
  Target,
  Award,
  Shield,
  BookOpen,
  Newspaper,
  Image,
  Video,
  Music,
  Folder,
  File,
  Database,
  Server,
  Cloud,
  Wifi,
  Globe,
  Link as LinkIcon,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  XCircle,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  // Additional professional icons
  Home,
  ClipboardCheck,
  UserCheck,
  Wallet,
  Tag,
  Percent,
  Archive,
  Globe2,
  ChevronDown,
  Database as Storage,
  ShoppingCart as Deals,
  Receipt as Billing,
  BookOpen as Guide,
} from "lucide-react";

interface NavItemChild {
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: number;
  order?: number;
}

interface NavItem extends NavItemChild {
  moduleKey?: string;
  children?: NavItemChild[];
}

interface NavigationItemFromAPI {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface ClinicSidebarProps {
  className?: string;
  externalIsDesktopHidden?: boolean;
  externalIsMobileOpen?: boolean;
  onExternalToggleDesktop?: () => void;
  onExternalToggleMobile?: () => void;
}

// Professional icon mapping for clinic sidebar - using Lucide React icons
const iconMap: { [key: string]: React.ReactNode } = {
  // Dashboard & Overview
  "📊": <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  "🏠": <LayoutDashboard className="w-4 h-4 text-[#6B7280]" />,
  "📈": <TrendingUp className="w-4 h-4 text-[#6B7280]" />,
  "📉": <Activity className="w-4 h-4 text-[#6B7280]" />,
  "⚡": <Zap className="w-4 h-4 text-[#6B7280]" />,
  "🎯": <Target className="w-4 h-4 text-[#6B7280]" />,
  home: <Home className="w-4 h-4 text-[#6B7280]" />,
  dashboard: <LayoutDashboard className="w-4 h-4 text-[#6B7280]" />,
  analytics: <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  reports: <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  overview: <Activity className="w-4 h-4 text-[#6B7280]" />,

  // Users & People
  "👥": <Users className="w-4 h-4 text-[#6B7280]" />,
  "👤": <UserCircle className="w-4 h-4 text-[#6B7280]" />,
  "👨‍⚕️": <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  "👨‍💼": <UserCog className="w-4 h-4 text-[#6B7280]" />,
  "👨‍🔬": <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  users: <Users className="w-4 h-4 text-[#6B7280]" />,
  patients: <UserCircle className="w-4 h-4 text-[#6B7280]" />,
  doctors: <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  staff: <UserCog className="w-4 h-4 text-[#6B7280]" />,
  agents: <UserPlus className="w-4 h-4 text-[#6B7280]" />,
  team: <Users className="w-4 h-4 text-[#6B7280]" />,
  profile: <UserCircle className="w-4 h-4 text-[#6B7280]" />,
  "user-circle": <UserCircle className="w-4 h-4 text-[#6B7280]" />,

  // Communication & Messages
  "💬": <MessageSquare className="w-4 h-4 text-[#6B7280]" />,
  "📧": <Mail className="w-4 h-4 text-[#6B7280]" />,
  "📨": <Inbox className="w-4 h-4 text-[#6B7280]" />,
  "💭": <MessageCircle className="w-4 h-4 text-[#6B7280]" />,
  "📱": <Phone className="w-4 h-4 text-[#6B7280]" />,
  "📤": <Send className="w-4 h-4 text-[#6B7280]" />,
  messages: <MessageSquare className="w-4 h-4 text-[#6B7280]" />,
  chat: <MessageCircle className="w-4 h-4 text-[#6B7280]" />,
  email: <Mail className="w-4 h-4 text-[#6B7280]" />,
  inbox: <Inbox className="w-4 h-4 text-[#6B7280]" />,
  notifications: <Bell className="w-4 h-4 text-[#6B7280]" />,
  calls: <Phone className="w-4 h-4 text-[#6B7280]" />,

  // Calendar & Appointments
  "📅": <Calendar className="w-4 h-4 text-[#6B7280]" />,
  "📆": <CalendarDays className="w-4 h-4 text-[#6B7280]" />,
  "📅✅": <CalendarCheck className="w-4 h-4 text-[#6B7280]" />,
  "⏰": <Clock className="w-4 h-4 text-[#6B7280]" />,
  "🗓️": <CalendarCheck className="w-4 h-4 text-[#6B7280]" />,
  appointments: <Calendar className="w-4 h-4 text-[#6B7280]" />,
  schedule: <CalendarDays className="w-4 h-4 text-[#6B7280]" />,
  calendar: <Calendar className="w-4 h-4 text-[#6B7280]" />,
  time: <Clock className="w-4 h-4 text-[#6B7280]" />,
  booking: <CalendarCheck className="w-4 h-4 text-[#6B7280]" />,
  slots: <Clock className="w-4 h-4 text-[#6B7280]" />,

  // Additional icon keys for professional icons
  "bar-chart": <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  "dollar-sign": <DollarSign className="w-4 h-4 text-[#6B7280]" />,

  // Documents & Files
  "📝": <FileText className="w-4 h-4 text-[#6B7280]" />,
  "📄": <File className="w-4 h-4 text-[#6B7280]" />,
  "📑": <FileEdit className="w-4 h-4 text-[#6B7280]" />,
  "📋": <ClipboardList className="w-4 h-4 text-[#6B7280]" />,
  "📚": <BookOpen className="w-4 h-4 text-[#6B7280]" />,
  "📰": <Newspaper className="w-4 h-4 text-[#6B7280]" />,
  "✍️": <PenTool className="w-4 h-4 text-[#6B7280]" />,
  documents: <FileText className="w-4 h-4 text-[#6B7280]" />,
  files: <File className="w-4 h-4 text-[#6B7280]" />,
  records: <ClipboardCheck className="w-4 h-4 text-[#6B7280]" />,
  prescriptions: <FileText className="w-4 h-4 text-[#6B7280]" />,
  notes: <FileEdit className="w-4 h-4 text-[#6B7280]" />,
  forms: <ClipboardList className="w-4 h-4 text-[#6B7280]" />,
  templates: <FileText className="w-4 h-4 text-[#6B7280]" />,

  // Business & Work
  "💼": <Briefcase className="w-4 h-4 text-[#6B7280]" />,
  "💼‍": <BriefcaseBusiness className="w-4 h-4 text-[#6B7280]" />,
  "🏢": <Building2 className="w-4 h-4 text-[#6B7280]" />,
  "🏥": <Building2 className="w-4 h-4 text-[#6B7280]" />,
  "🩺": <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  clinic: <Building2 className="w-4 h-4 text-[#6B7280]" />,
  facility: <Building2 className="w-4 h-4 text-[#6B7280]" />,
  business: <Briefcase className="w-4 h-4 text-[#6B7280]" />,
  organization: <Building2 className="w-4 h-4 text-[#6B7280]" />,

  // Medical & Health
  medical: <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  health: <Heart className="w-4 h-4 text-[#6B7280]" />,
  treatments: <Stethoscope className="w-4 h-4 text-[#6B7280]" />,
  services: <Activity className="w-4 h-4 text-[#6B7280]" />,
  diagnostics: <Activity className="w-4 h-4 text-[#6B7280]" />,
  tests: <FileText className="w-4 h-4 text-[#6B7280]" />,
  "❤️": <Heart className="w-4 h-4 text-[#6B7280]" />,
  "💊": <Package className="w-4 h-4 text-[#6B7280]" />,

  // Reviews & Ratings
  "⭐": <Star className="w-4 h-4 text-[#6B7280]" />,
  "👁️": <Eye className="w-4 h-4 text-[#6B7280]" />,
  "🏆": <Award className="w-4 h-4 text-[#6B7280]" />,
  reviews: <Star className="w-4 h-4 text-[#6B7280]" />,
  ratings: <Star className="w-4 h-4 text-[#6B7280]" />,
  feedback: <MessageSquare className="w-4 h-4 text-[#6B7280]" />,
  testimonials: <Award className="w-4 h-4 text-[#6B7280]" />,

  // Offers & Promotions
  "🎁": <Gift className="w-4 h-4 text-[#6B7280]" />,
  "🎉": <Package className="w-4 h-4 text-[#6B7280]" />,
  "🛍️": <ShoppingBag className="w-4 h-4 text-[#6B7280]" />,
  offers: <Tag className="w-4 h-4 text-[#6B7280]" />,
  promotions: <Gift className="w-4 h-4 text-[#6B7280]" />,
  discounts: <Percent className="w-4 h-4 text-[#6B7280]" />,
  deals: <Deals className="w-4 h-4 text-[#6B7280]" />,
  packages: <Package className="w-4 h-4 text-[#6B7280]" />,
  package: <Package className="w-4 h-4 text-[#6B7280]" />,

  // Payments & Finance
  "💳": <CreditCard className="w-4 h-4 text-[#6B7280]" />,
  "💰": <DollarSign className="w-4 h-4 text-[#6B7280]" />,
  payments: <CreditCard className="w-4 h-4 text-[#6B7280]" />,
  billing: <Billing className="w-4 h-4 text-[#6B7280]" />,
  invoices: <FileText className="w-4 h-4 text-[#6B7280]" />,
  transactions: <DollarSign className="w-4 h-4 text-[#6B7280]" />,
  revenue: <TrendingUp className="w-4 h-4 text-[#6B7280]" />,
  expenses: <TrendingUp className="w-4 h-4 text-[#6B7280]" />,
  wallet: <Wallet className="w-4 h-4 text-[#6B7280]" />,
  finance: <DollarSign className="w-4 h-4 text-[#6B7280]" />,
  accounts: <DollarSign className="w-4 h-4 text-[#6B7280]" />,

  // Settings & Security
  // '⚙️': <Settings className="w-4 h-4 text-[#6B7280]" />,
  "🔒": <Lock className="w-4 h-4 text-[#6B7280]" />,
  "🛡️": <Shield className="w-4 h-4 text-[#6B7280]" />,
  // 'settings': <Settings className="w-4 h-4 text-[#6B7280]" />,
  security: <Shield className="w-4 h-4 text-[#6B7280]" />,
  permissions: <Lock className="w-4 h-4 text-[#6B7280]" />,
  access: <UserCheck className="w-4 h-4 text-[#6B7280]" />,
  // 'configuration': <Settings className="w-4 h-4 text-[#6B7280]" />,
  // 'preferences': <Settings className="w-4 h-4 text-[#6B7280]" />,

  // Notifications & Alerts
  "🔔": <Bell className="w-4 h-4 text-[#6B7280]" />,
  "⚠️": <AlertTriangle className="w-4 h-4 text-[#6B7280]" />,
  ℹ️: <Info className="w-4 h-4 text-[#6B7280]" />,
  "❓": <HelpCircle className="w-4 h-4 text-[#6B7280]" />,
  "✅": <CheckCircle className="w-4 h-4 text-[#6B7280]" />,
  "❌": <XCircle className="w-4 h-4 text-[#6B7280]" />,
  alerts: <AlertCircle className="w-4 h-4 text-[#6B7280]" />,
  warnings: <AlertTriangle className="w-4 h-4 text-[#6B7280]" />,
  help: <HelpCircle className="w-4 h-4 text-[#6B7280]" />,
  support: <HelpCircle className="w-4 h-4 text-[#6B7280]" />,

  // Media & Content
  "🖼️": <Image className="w-4 h-4 text-[#6B7280]" />,
  "🎬": <Video className="w-4 h-4 text-[#6B7280]" />,
  "🎵": <Music className="w-4 h-4 text-[#6B7280]" />,
  media: <Image className="w-4 h-4 text-[#6B7280]" />,
  gallery: <Image className="w-4 h-4 text-[#6B7280]" />,
  videos: <Video className="w-4 h-4 text-[#6B7280]" />,
  content: <FileText className="w-4 h-4 text-[#6B7280]" />,

  // Actions & Tools
  "➕": <Plus className="w-4 h-4 text-[#6B7280]" />,
  "➖": <Minus className="w-4 h-4 text-[#6B7280]" />,
  "✏️": <Edit className="w-4 h-4 text-[#6B7280]" />,
  "🗑️": <Trash2 className="w-4 h-4 text-[#6B7280]" />,
  "💾": <Save className="w-4 h-4 text-[#6B7280]" />,
  "🔍": <Search className="w-4 h-4 text-[#6B7280]" />,
  "🔎": <Filter className="w-4 h-4 text-[#6B7280]" />,
  "🔄": <RefreshCw className="w-4 h-4 text-[#6B7280]" />,
  "⬇️": <Download className="w-4 h-4 text-[#6B7280]" />,
  "⬆️": <Upload className="w-4 h-4 text-[#6B7280]" />,
  "🔗": <LinkIcon className="w-4 h-4 text-[#6B7280]" />,
  "🔀": <Share2 className="w-4 h-4 text-[#6B7280]" />,
  "⋯": <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />,
  add: <Plus className="w-4 h-4 text-[#6B7280]" />,
  create: <Plus className="w-4 h-4 text-[#6B7280]" />,
  new: <Plus className="w-4 h-4 text-[#6B7280]" />,
  edit: <Edit className="w-4 h-4 text-[#6B7280]" />,
  delete: <Trash2 className="w-4 h-4 text-[#6B7280]" />,
  remove: <Trash2 className="w-4 h-4 text-[#6B7280]" />,
  save: <Save className="w-4 h-4 text-[#6B7280]" />,
  search: <Search className="w-4 h-4 text-[#6B7280]" />,
  filter: <Filter className="w-4 h-4 text-[#6B7280]" />,
  refresh: <RefreshCw className="w-4 h-4 text-[#6B7280]" />,
  download: <Download className="w-4 h-4 text-[#6B7280]" />,
  upload: <Upload className="w-4 h-4 text-[#6B7280]" />,
  export: <Download className="w-4 h-4 text-[#6B7280]" />,
  import: <Upload className="w-4 h-4 text-[#6B7280]" />,
  share: <Share2 className="w-4 h-4 text-[#6B7280]" />,
  link: <LinkIcon className="w-4 h-4 text-[#6B7280]" />,
  more: <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />,

  // Folders & Organization
  "📁": <Folder className="w-4 h-4 text-[#6B7280]" />,
  "🗄️": <Database className="w-4 h-4 text-[#6B7280]" />,
  "🖥️": <Server className="w-4 h-4 text-[#6B7280]" />,
  "☁️": <Cloud className="w-4 h-4 text-[#6B7280]" />,
  folders: <Folder className="w-4 h-4 text-[#6B7280]" />,
  archive: <Archive className="w-4 h-4 text-[#6B7280]" />,
  storage: <Storage className="w-4 h-4 text-[#6B7280]" />,
  database: <Database className="w-4 h-4 text-[#6B7280]" />,
  server: <Server className="w-4 h-4 text-[#6B7280]" />,
  cloud: <Cloud className="w-4 h-4 text-[#6B7280]" />,

  // Network & Connectivity
  "🌐": <Globe className="w-4 h-4 text-[#6B7280]" />,
  "📶": <Wifi className="w-4 h-4 text-[#6B7280]" />,
  network: <Wifi className="w-4 h-4 text-[#6B7280]" />,
  connectivity: <Wifi className="w-4 h-4 text-[#6B7280]" />,
  internet: <Globe2 className="w-4 h-4 text-[#6B7280]" />,

  // Leads & Sales
  leads: <Target className="w-4 h-4 text-[#6B7280]" />,
  sales: <TrendingUp className="w-4 h-4 text-[#6B7280]" />,
  conversions: <Target className="w-4 h-4 text-[#6B7280]" />,
  opportunities: <Zap className="w-4 h-4 text-[#6B7280]" />,

  // Analytics & Reports
  statistics: <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  charts: <BarChart3 className="w-4 h-4 text-[#6B7280]" />,
  insights: <TrendingUp className="w-4 h-4 text-[#6B7280]" />,
  metrics: <Activity className="w-4 h-4 text-[#6B7280]" />,
  activity: <Activity className="w-4 h-4 text-[#6B7280]" />,

  // Marketing & Campaigns
  campaigns: <Megaphone className="w-4 h-4 text-[#6B7280]" />,
  marketing: <Target className="w-4 h-4 text-[#6B7280]" />,
  workflowGuide: <Guide className="w-4 h-4 text-[#6B7280]" />,

  // Default fallback for any unmapped icons
};

const renderIcon = (key: string, isActive: boolean = false) => {
  const node = iconMap[key];
  if (node) {
    // Clone the element and update the color class based on active state
    if (React.isValidElement(node)) {
      return React.cloneElement(node as React.ReactElement<any>, {
        className: `w-4 h-4 ${isActive ? 'text-white' : 'text-[#6B7280]'}`
      });
    }
    return node;
  }
  // Return null or a default icon instead of showing the key as text
  return null;
};

const ClinicSidebar: FC<ClinicSidebarProps> = ({
  className,
  externalIsDesktopHidden,
  externalIsMobileOpen,
  onExternalToggleDesktop,
  onExternalToggleMobile,
}) => {
  const router = useRouter();
  const [internalIsDesktopHidden, setInternalIsDesktopHidden] = useState(false);
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isDesktopHidden =
    externalIsDesktopHidden !== undefined
      ? externalIsDesktopHidden
      : internalIsDesktopHidden;
  const isMobileOpen =
    externalIsMobileOpen !== undefined
      ? externalIsMobileOpen
      : internalIsMobileOpen;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [items, setItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Trial countdown timer state
  const [trialInfo, setTrialInfo] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    trialEndDate: string;
  } | null>(null);
  const setShowTrialExpiredPopup = useState(false)[1];
  const dragItemRef = useRef<
    | { type: "parent"; parentIdx: number }
    | { type: "child"; parentIdx: number; childIdx: number }
    | null
  >(null);
  const isDraggingRef = useRef<boolean>(false);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        if (onExternalToggleMobile && externalIsMobileOpen) {
          onExternalToggleMobile(); // Toggle to close
        } else {
          setInternalIsMobileOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, onExternalToggleMobile, externalIsMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  // Trial countdown timer
  useEffect(() => {
    const calculateTrialTime = () => {
      // Get trial info from login response stored in sessionStorage
      const trialData = typeof window !== 'undefined' ? sessionStorage.getItem('clinicTrialInfo') : null;
      
      console.log('Sidebar - Trial Data from sessionStorage:', trialData);
      
      if (!trialData) {
        console.log('Sidebar - No trial data found in sessionStorage');
        setTrialInfo(null);
        return;
      }

      try {
        const trial = JSON.parse(trialData);
        console.log('Sidebar - Parsed trial data:', trial);
        
        // Check if this is a legacy user (no trial restriction)
        if (trial.isLegacyUser) {
          console.log('Sidebar - Legacy user detected, hiding trial countdown');
          setTrialInfo(null);
          return;
        }
        
        // Handle case where trialEndDate might be null
        if (!trial.trialEndDate) {
          console.log('Sidebar - No trial end date, hiding countdown');
          setTrialInfo(null);
          return;
        }
        
        const trialEndDate = new Date(trial.trialEndDate);
        const now = new Date();
        const difference = trialEndDate.getTime() - now.getTime();
        
        console.log('Sidebar - Trial calculation:', {
          trialEndDate,
          now,
          difference,
          isExpired: difference <= 0
        });

        if (difference <= 0) {
          // Trial has expired - show warning but don't auto-logout
          // The verify-token API or page navigation will handle authentication
          console.log('Sidebar - Trial expired! Showing warning...');
          
          // Show trial expired popup
          setShowTrialExpiredPopup(true);
          
          setTrialInfo({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
            trialEndDate: trial.trialEndDate
          });
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        console.log('Sidebar - Setting trial info:', { days, hours, minutes, seconds });
        
        setTrialInfo({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
          trialEndDate: trial.trialEndDate
        });
      } catch (error) {
        console.error('Sidebar - Error parsing trial info:', error);
        setTrialInfo(null);
      }
    };

    // Calculate immediately
    calculateTrialTime();

    // Update every second
    const interval = setInterval(calculateTrialTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch navigation items and permissions
  useEffect(() => {
    const fetchNavigationAndPermissions = async () => {
      try {
        // Use token priority: clinicToken, doctorToken, agentToken, staffToken, userToken, adminToken
        const TOKEN_PRIORITY = [
          "clinicToken",
          "doctorToken",
          "agentToken",
          "staffToken",
          "userToken",
          "adminToken",
        ];

        let token: string | null = null;
        if (typeof window !== "undefined") {
          for (const key of TOKEN_PRIORITY) {
            const value =
              localStorage.getItem(key) || sessionStorage.getItem(key);
            if (value) {
              token = value;
              break;
            }
          }
        }

        if (!token) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        console.log(
          "ClinicSidebar: Using token:",
          token ? "Token exists" : "No token found",
        );

        let res;
        try {
          res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error: any) {
          console.error(
            "ClinicSidebar API Error:",
            error.response?.status,
            error.response?.data,
          );

          // Handle 401, 403, 404, and other errors gracefully
          if (error.response?.status === 401) {
            console.log(
              "ClinicSidebar: Unauthorized - token may be invalid or expired",
            );
            setItems([]);
            setIsLoading(false);
            return;
          }
          if (error.response?.status === 404) {
            console.log(
              "ClinicSidebar: API endpoint not found - this may be normal for agent routes",
            );
            setItems([]);
            setIsLoading(false);
            return;
          }
          // Re-throw other errors to be handled by outer catch
          throw error;
        }

        if (res && res.data && res.data.success) {
          // Convert API navigation items to NavItem format
          const convertedItems: NavItem[] = (
            res.data.navigationItems || []
          ).map((item: NavigationItemFromAPI): NavItem => {
            const navItem: NavItem = {
              label: item.label,
              path: item.path,
              icon: item.icon,
              description: item.description,
              moduleKey: item.moduleKey,
              order: item.order,
            };

            // Convert subModules to children
            if (item.subModules && item.subModules.length > 0) {
              navItem.children = item.subModules.map(
                (subModule: {
                  name: string;
                  path?: string;
                  icon: string;
                  order: number;
                }): NavItemChild => ({
                  label: subModule.name,
                  path: subModule.path,
                  icon: subModule.icon,
                  description: subModule.name,
                  order: subModule.order,
                }),
              );
            }

            return navItem;
          });

          // Sort by order
          convertedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          convertedItems.forEach((item) => {
            if (item.children) {
              item.children.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
          });

          // Build grouped sections using only existing sidebar items
          const toKey = (s: string) => (s || '').trim().toLowerCase();
          const byLabel: Record<string, NavItem> = {};
          const childByLabel: Record<string, NavItemChild> = {};
          convertedItems.forEach((i) => {
            if (i.label) {
              byLabel[toKey(i.label)] = i;
            }
            (i.children || []).forEach((c) => {
              if (c.label) {
                childByLabel[toKey(c.label)] = c;
              }
            });
          });

          const pickTop = (label: string): NavItemChild | null => {
            const found = byLabel[toKey(label)];
            return found
              ? { label: found.label, path: found.path, icon: found.icon }
              : null;
          };
          const pickChild = (label: string): NavItemChild | null => {
            const found = childByLabel[toKey(label)];
            return found
              ? { label: found.label, path: found.path, icon: found.icon }
              : null;
          };
          const nonNull = (...items: Array<NavItemChild | null>) =>
            items.filter(Boolean) as NavItemChild[];

          const dashboardTop = pickTop("Dashboard");
          const groupedModules: NavItem[] = [
            ...(dashboardTop
              ? ([
                  {
                    label: (dashboardTop.label || "Dashboard").toUpperCase(),
                    path: dashboardTop.path,
                    icon: dashboardTop.icon,
                    order: 0,
                  },
                ] as NavItem[])
              : []),
            {
              label: "Business Management",
              icon: "business",
              children: nonNull(
                pickTop("Manage Health Center"),
                {
                  label: "Create Offers",
                  path: "/clinic/create-offer",
                  icon: "🎁",
                },
                {
                  label: "User Package",
                  path: "/clinic/userpackages",
                  icon: "package",
                },
                {
                  label: "Service Setup",
                  path: "/clinic/services_setup",
                  icon: "services",
                },
                {
                  label: "Setup & Operation",
                  path: "/clinic/add-room",
                  icon: "clinic",
                },
                pickChild("Membership"),
              ),
              order: 100,
            },
            {
              label: "HR Management",
              icon: "users",
              children: nonNull(
                { label: "Consent Form", path: "/clinic/consent", icon: "📝" },
                {
                  label: "Job Posting",
                  path: "/clinic/job-posting",
                  icon: "📝",
                },
                { label: "Commission", path: "/clinic/commission", icon: "💰" },
                pickTop("Assigned Leads"),
                pickTop("Referral"),
                pickTop("Referal"),
                pickTop("Track-Members"),
                { label: "Referral", path: "/clinic/referal", icon: "leads" },
                {
                  label: "Track Members",
                  path: "/clinic/Track-Members",
                  icon: "users",
                },
                pickChild("Membership"),
                pickTop("Create Agent"),
              ),
              order: 110,
            },
            {
              label: "Marketing",
              icon: "🎯",
              children: nonNull(
                {
                  label: "Create Lead",
                  path: "/clinic/create-lead",
                  icon: "➕",
                },
                { label: "Inbox", path: "/clinic/inbox", icon: "📨" },
                {
                  label: "Templates",
                  path: "/clinic/all-templates",
                  icon: "📝",
                },
                { label: "Providers", path: "/clinic/providers", icon: "👥" },
                { label: "Reviews", path: "/clinic/getAllReview", icon: "⭐" },
                { label: "Enquiry", path: "/clinic/get-Enquiry", icon: "❓" },
              ),
              order: 120,
            },
            {
              label: "Automation",
              icon: "⚡",
              children: nonNull({
                label: "Automation",
                path: "/clinic/automation",
                icon: "⚡",
              }),
              order: 120,
            },
            {
              label: "Content & SEO",
              icon: "documents",
              children: nonNull(pickTop("Write Blog")),
              order: 130,
            },
            {
              label: "Stock Management",
              icon: "archive",
              children: nonNull(
                {
                  label: "Locations",
                  path: "/clinic/stocks/locations",
                  icon: "storage",
                },
                {
                  label: "Suppliers",
                  path: "/clinic/stocks/suppliers",
                  icon: "archive",
                },
                { label: "UOM", path: "/clinic/stocks/uom", icon: "database" },
                {
                  label: "Purchase Requests",
                  path: "/clinic/stocks/purchase-requests",
                  icon: "reports",
                },
                {
                  label: "Purchase Orders",
                  path: "/clinic/stocks/purchase-orders",
                  icon: "deals",
                },
                { label: "GRN", path: "/clinic/stocks/grn", icon: "billing" },
                {
                  label: "Purchase Invoices",
                  path: "/clinic/stocks/purchase-invoices",
                  icon: "billing",
                },
                {
                  label: "Purchase Returns",
                  path: "/clinic/stocks/purchase-returns",
                  icon: "billing",
                },
                {
                  label: "Stock Qty Adjustment",
                  path: "/clinic/stocks/stock-qty-adjustment",
                  icon: "statistics",
                },
                {
                  label: "Stock Transfer Requests",
                  path: "/clinic/stocks/stock-transfer/stock-transfer-requests",
                  icon: "share",
                },
                {
                  label: "Transfer Stock",
                  path: "/clinic/stocks/stock-transfer/transfer-stock",
                  icon: "share",
                },
                {
                  label: "Material Activity Consumption",
                  path: "/clinic/stocks/material-consumptions",
                  icon: "⚡",
                },
                {
                  label: "Allocated Stock Items",
                  path: "/clinic/stocks/allocated-stock-items",
                  icon: "package",
                },
              ),
              order: 135,
            },
            {
              label: "Policy & Compliance",
              icon: "🛡️",
              children: nonNull({
                label: "Policy & Compliance",
                path: "/clinic/policy_compliance",
                icon: "🛡️",
              }),
              order: 136,
            },
            {
              label: "Security & Privacy",
              icon: "security",
              children: nonNull({
                label: "Authentication",
                path: "/clinic/authentication",
                icon: "🔒",
              }),
              order: 170,
            },
            {
              label: "Patients & Appointments",
              icon: "appointments",
              children: nonNull(
                {
                  label: "Book Appointments",
                  path: "/clinic/appointment",
                  icon: "booking",
                },
                {
                  label: "Scheduled Appointments",
                  path: "/clinic/all-appointment",
                  icon: "calendar",
                },
                {
                  label: "Patient Registration",
                  path: "/clinic/patient-registration",
                  icon: "👤",
                },
                pickChild("Patient Information"),
              ),
              order: 160,
            },
            {
              label: "Reports & Analytics",
              icon: "reports",
              children: nonNull(
                pickChild("Add Expense"),
                pickTop("Add Expense"),
                pickTop("Petty Cash"),
                pickChild("Petty Cash"),
                {
                  label: "Petty Cash",
                  path: "/clinic/pettycash",
                  icon: "dollar-sign",
                },
                { label: "Reports", path: "/clinic/report", icon: "reports" },
              ),
              order: 180,
            },
            {
              label: "Campaigns",
              path: "/clinic/campaigns",
              icon: "campaigns",
              order: 185,
            },
            {
              label: "Workflow Guide",
              path: "/clinic/workflow-guide",
              icon: "workflowGuide",
              order: 190,
            },
          ].filter((group) => (group.children && group.children.length > 0) || group.path);

          const usedLabels = new Set<string>([
            ...groupedModules.flatMap((g) =>
              (g.children || []).map((c) => toKey(c.label)),
            ),
            ...groupedModules.filter((g) => g.path).map((g) => toKey(g.label)),
          ]);
          const usedPaths = new Set<string>([
            ...groupedModules.flatMap((g) =>
              (g.children || []).map((c) => c.path || "").filter(Boolean),
            ),
            ...groupedModules
              .filter((g) => g.path)
              .map((g) => g.path || "")
              .filter(Boolean),
          ]);
          const usedGroupLabels = new Set<string>(
            groupedModules.map((g) => toKey(g.label)),
          );
          const filteredOriginals = convertedItems.filter((i) => {
            const labelUsed = usedLabels.has(toKey(i.label));
            const pathUsed = i.path ? usedPaths.has(i.path) : false;
            const groupLabelDuplicate = usedGroupLabels.has(toKey(i.label));
            const isStockGeneric = toKey(i.label) === "stock";
            const isPolicyCompliance = toKey(i.label) === "policy & compliance";
            return !(
              labelUsed ||
              pathUsed ||
              groupLabelDuplicate ||
              isStockGeneric ||
              isPolicyCompliance
            );
          });

          const finalItems = [...groupedModules, ...filteredOriginals];

          const rank = (it: NavItem) => {
            if (it.path && toKey(it.label) === "dashboard") return -1000;
            return typeof it.order === "number" ? it.order : 9999;
          };
          const sortedItems = [...finalItems].sort((a, b) => rank(a) - rank(b));

          setItems(sortedItems);
          return;
        } else {
          console.error("Error fetching navigation items:", res.data.message);
          setItems([]);
        }
      } catch (err: any) {
        // Only log non-401/404 errors to avoid console spam
        if (err.response?.status !== 401 && err.response?.status !== 404) {
          console.error(
            "Error fetching navigation items and permissions:",
            err,
          );
        }
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigationAndPermissions();
  }, []);

  // Persist order on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined")
        localStorage.setItem("clinicSidebarOrder", JSON.stringify(items));
    } catch {}
  }, [items]);

  const handleToggleDesktop = () => {
    if (onExternalToggleDesktop && externalIsDesktopHidden !== undefined) {
      onExternalToggleDesktop();
    } else {
      setInternalIsDesktopHidden(!isDesktopHidden);
    }
  };

  // Avoid click firing after drag
  const safeClick = (handler?: () => void) => (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handler?.();
  };

  // Drag handlers
  const onDragStartParent = (parentIdx: number) => (e: React.DragEvent) => {
    isDraggingRef.current = true;
    dragItemRef.current = { type: "parent", parentIdx };
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragStartChild =
    (parentIdx: number, childIdx: number) => (e: React.DragEvent) => {
      isDraggingRef.current = true;
      dragItemRef.current = { type: "child", parentIdx, childIdx };
      e.dataTransfer.effectAllowed = "move";
    };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDropParent = (targetParentIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const drag = dragItemRef.current;
    isDraggingRef.current = false;
    if (!drag || drag.type !== "parent" || drag.parentIdx === targetParentIdx)
      return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(drag.parentIdx, 1);
      next.splice(targetParentIdx, 0, moved);
      return next;
    });
    dragItemRef.current = null;
  };
  const onDropChild =
    (targetParentIdx: number, targetChildIdx: number) =>
    (e: React.DragEvent) => {
      e.preventDefault();
      const drag = dragItemRef.current;
      isDraggingRef.current = false;
      if (!drag || drag.type !== "child") return;
      if (drag.parentIdx !== targetParentIdx) return;
      if (drag.childIdx === targetChildIdx) return;
      setItems((prev) => {
        const next = [...prev];
        const group = [...(next[targetParentIdx].children || [])];
        const [moved] = group.splice(drag.childIdx, 1);
        group.splice(targetChildIdx, 0, moved);
        next[targetParentIdx] = { ...next[targetParentIdx], children: group };
        return next;
      });
      dragItemRef.current = null;
    };
  const onDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
      dragItemRef.current = null;
    }, 0);
  };

  return (
    <>
      {/* Desktop Toggle Button - Only shows when no external state */}
      {(!onExternalToggleDesktop || externalIsDesktopHidden === undefined) && (
        <button
          onClick={handleToggleDesktop}
          className={clsx(
            "fixed top-4 left-4 z-[60] bg-white text-[#374151] p-2.5 rounded-lg shadow-md transition-all duration-200 border border-gray-200 hover:bg-teal-50 hover:border-gray-300 hidden lg:block",
            {
              "lg:block": isDesktopHidden,
              "lg:hidden": !isDesktopHidden,
            },
          )}
          aria-label="Toggle desktop sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Toggle Button - Shows when sidebar is hidden */}
      {isDesktopHidden && (
        <button
          onClick={handleToggleDesktop}
          className="fixed top-3 left-3 z-[100] bg-white text-[#374151] p-1.5 rounded-lg shadow-md transition-all duration-200 border border-gray-200 hover:bg-teal-50 hover:border-gray-300 hover:shadow-lg hidden lg:flex items-center justify-center"
          aria-label="Toggle desktop sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#F3F4F6] border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden",
          {
            "translate-x-0": isMobileOpen,
            "-translate-x-full": !isMobileOpen,
          },
          className,
        )}
        style={{ height: "100vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header Section */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
            <div className="group cursor-pointer">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F4F6] transition-all duration-200 border border-gray-200">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium inter-font text-lg">
                    Z
                  </span>
                </div>
                <div>
                  <span className="font-medium text-base text-[#374151] block inter-font">
                    ZEVA
                  </span>
                  <span className="text-xs text-[#374151] font-medium inter-font">
                    Clinic Panel
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            {(onExternalToggleMobile || !onExternalToggleMobile) && (
              <button
                onClick={() => {
                  if (
                    onExternalToggleMobile &&
                    externalIsMobileOpen !== undefined
                  ) {
                    onExternalToggleMobile();
                  } else {
                    setInternalIsMobileOpen(false);
                  }
                }}
                className="absolute right-4 top-4 text-[#374151] p-1.5 transition-all duration-200"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 min-h-0">
            <div className="space-y-1">
              {isLoading ? (
                <div className="text-xs text-[#374151] px-2 inter-font">
                  Loading menu…
                </div>
              ) : (
                items.map((item) => {
                  const isDropdownOpen = openDropdown === item.label;
                  const isSection = !!item.children && !item.path;
                  const isActive = selectedItem
                    ? selectedItem === item.label
                    : router.pathname === item.path;

                  const handleItemClick = () => {
                    setSelectedItem(item.label);
                    if (item.path) {
                      if (onExternalToggleMobile && externalIsMobileOpen) {
                        onExternalToggleMobile();
                      } else {
                        setInternalIsMobileOpen(false);
                      }
                    }
                  };

                  if (isSection && item.children && item.children.length > 0) {
                    const itemIndex = items.findIndex(
                      (i) => i.label === item.label,
                    );
                    return (
                      <div key={item.label} className="mt-4">
                        <div className="px-2 text-xs font-medium uppercase tracking-wider text-[#64748B] inter-font flex items-center">
                          <span className="flex-1">{item.label}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {item.children.map((child, childIdx) => {
                            const isChildActive =
                              router.pathname === child.path;
                            return child.path ? (
                              <Link
                                key={childIdx}
                                href={child.path}
                                onClick={handleItemClick}
                              >
                                <div
                                  draggable
                                  onDragStart={onDragStartChild(
                                    itemIndex,
                                    childIdx,
                                  )}
                                  onDragOver={onDragOver}
                                  onDrop={onDropChild(itemIndex, childIdx)}
                                  onDragEnd={onDragEnd}
                                  className={clsx(
                                    "px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 inter-font",
                                    {
                                      "bg-[#2D9AA5] text-white": isChildActive,
                                      "text-[#374151] hover:bg-gray-100":
                                        !isChildActive,
                                    },
                                  )}
                                >
                                  <span className="text-[#374151]">
                                    {child.label}
                                  </span>
                                  {child.badge && (
                                    <span className="ml-auto bg-red-600 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-medium inter-font">
                                      {child.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ) : (
                              <div
                                key={childIdx}
                                className="px-3 py-2 text-sm text-[#374151]"
                              >
                                {child.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (item.children && item.children.length > 0) {
                    const itemIndex = items.findIndex(
                      (i) => i.label === item.label,
                    );
                    return (
                      <div
                        key={item.label}
                        className="space-y-1"
                        draggable
                        onDragStart={onDragStartParent(itemIndex)}
                        onDragOver={onDragOver}
                        onDrop={onDropParent(itemIndex)}
                        onDragEnd={onDragEnd}
                      >
                        <button
                          onClick={() => {
                            setSelectedItem(item.label);
                            setOpenDropdown(
                              openDropdown === item.label ? null : item.label,
                            );
                          }}
                          className={clsx(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-left group cursor-move",
                            {
                              "bg-[#2D9AA5] text-white": isActive,
                              "text-[#374151] hover:bg-gray-100": !isActive,
                            },
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <div
                              className={clsx(
                                "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                                {
                                  "bg-[#2D9AA5] text-white": isActive,
                                  "text-[#6B7280] group-hover:text-[#374151]":
                                    !isActive,
                                },
                              )}
                            >
                              {renderIcon(item.icon, isActive)}
                            </div>
                            <span className="inter-font text-sm font-medium text-[#374151]">
                              {item.label}
                            </span>
                          </div>
                          <ChevronDown
                            className={clsx(
                              "w-4 h-4 transition-transform duration-200",
                              {
                                "rotate-180": isDropdownOpen,
                                "text-white": isActive,
                                "text-[#374151]": !isActive,
                              },
                            )}
                          />
                        </button>
                        {isDropdownOpen && (
                          <div className="ml-9 space-y-0.5">
                            {item.children.map((child, childIdx) => {
                              const isChildActive =
                                router.pathname === child.path;
                              return child.path ? (
                                <Link
                                  key={childIdx}
                                  href={child.path}
                                  onClick={handleItemClick}
                                >
                                  <div
                                    draggable
                                    onDragStart={onDragStartChild(
                                      itemIndex,
                                      childIdx,
                                    )}
                                    onDragOver={onDragOver}
                                    onDrop={onDropChild(itemIndex, childIdx)}
                                    onDragEnd={onDragEnd}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg transition-all duration-200 text-sm cursor-move flex items-start gap-2.5 inter-font min-w-0",
                                      {
                                        "bg-[#2D9AA5] text-white":
                                          isChildActive,
                                        "text-[#374151] hover:bg-gray-100":
                                          !isChildActive,
                                      },
                                    )}
                                  >
                                    <span
                                      className={clsx(
                                        "flex-shrink-0 mt-0.5",
                                        isChildActive
                                          ? "text-white"
                                          : "text-[#6B7280] group-hover:text-[#374151]",
                                      )}
                                    >
                                      {renderIcon(child.icon, isChildActive)}
                                    </span>
                                    <span
                                      className={clsx(
                                        "inter-font font-medium text-sm leading-tight",
                                        { "text-white": isChildActive },
                                      )}
                                    >
                                      {child.label}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <div
                                  key={childIdx}
                                  className="px-3 py-2 text-sm text-[#374151]"
                                >
                                  {child.label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const MenuItemContent = (
                    <div
                      draggable
                      onDragStart={onDragStartParent(
                        items.findIndex((i) => i.label === item.label),
                      )}
                      onDragOver={onDragOver}
                      onDrop={onDropParent(
                        items.findIndex((i) => i.label === item.label),
                      )}
                      onDragEnd={onDragEnd}
                      onClick={safeClick(handleItemClick)}
                      className={clsx(
                        "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-move inter-font",
                        {
                          "bg-[#2D9AA5] text-white": isActive,
                          "text-[#374151] hover:bg-gray-100": !isActive,
                        },
                      )}
                    >
                      <div
                        className={clsx(
                          "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                          {
                            "text-white": isActive,
                            "text-[#6B7280] group-hover:text-gray-700":
                              !isActive,
                          },
                        )}
                      >
                        {renderIcon(item.icon, isActive)}
                      </div>

                      <div className="flex-1 min-w-0 ">
                        <div
                          className={clsx(
                            "inter-font font-medium text-sm transition-colors duration-200",
                            {
                              "text-white": isActive,
                              "text-[#374151]": !isActive,
                              uppercase:
                                (item.label || "").toUpperCase() ===
                                "DASHBOARD",
                              "text-xs":
                                (item.label || "").toUpperCase() ===
                                "DASHBOARD",
                            },
                          )}
                        >
                          {item.label}
                        </div>
                      </div>
                    </div>
                  );

                  return item.path ? (
                    <Link key={item.path} href={item.path}>
                      {MenuItemContent}
                    </Link>
                  ) : (
                    <div key={item.label}>{MenuItemContent}</div>
                  );
                })
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "transition-all duration-300 ease-in-out bg-[#F3F4F6] border-r border-gray-200 flex-col min-h-screen w-72 hidden lg:flex",
          {
            "lg:flex": !isDesktopHidden,
            "lg:hidden": isDesktopHidden,
          },
          className,
        )}
        style={{ height: "100vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Header Section */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 relative">
            <div className="group cursor-pointer">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F4F6] transition-all duration-200 border border-gray-200">
                <div className="w-10 h-10 bg-[#2D9AA5] rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium inter-font text-lg">
                    Z
                  </span>
                </div>
                <div>
                  <span className="font-medium text-base text-[#374151] block inter-font">
                    ZEVA
                  </span>
                  <span className="text-xs text-[#374151] font-medium inter-font">
                    Clinic Panel
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Close Button */}
            <button
              onClick={handleToggleDesktop}
              className="absolute right-4 top-4 text-[#374151] p-1.5 transition-all duration-200"
              aria-label="Close sidebar"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 min-h-0">
            <div className="space-y-1">
              {isLoading ? (
                <div className="text-xs text-[#374151] px-2 inter-font">
                  Loading menu…
                </div>
              ) : (
                items.map((item, parentIdx) => {
                  const isSection = !!item.children && !item.path;
                  // If an item is manually selected, only that item should be active
                  // Otherwise, use router pathname to determine active state
                  const isActive = selectedItem
                    ? selectedItem === item.label
                    : router.pathname === item.path;

                  // Section header - collapsible on desktop
                  if (isSection && item.children) {
                    const isDropdownOpen = openDropdown === item.label;
                    return (
                      <div
                        key={item.label}
                        draggable
                        onDragStart={onDragStartParent(parentIdx)}
                        onDragOver={onDragOver}
                        onDrop={onDropParent(parentIdx)}
                        onDragEnd={onDragEnd}
                      >
                        <button
                          onClick={() => {
                            setSelectedItem(item.label);
                            setOpenDropdown(isDropdownOpen ? null : item.label);
                          }}
                          className={clsx(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-left group cursor-move mt-3 mb-1",
                            {
                              "bg-[#2D9AA5] text-white": isActive,
                              "text-[#374151] hover:bg-gray-100": !isActive,
                            },
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {renderIcon(item.icon, isActive)}
                            <span
                              className={clsx(
                                "inter-font text-xs font-medium uppercase tracking-wider",
                                { "text-white": isActive },
                              )}
                            >
                              {item.label}
                            </span>
                          </span>
                          <ChevronDown
                            className={clsx(
                              "w-4 h-4 transition-transform duration-200",
                              {
                                "rotate-180": isDropdownOpen,
                                "text-white": isActive,
                                "text-[#374151]": !isActive,
                              },
                            )}
                          />
                        </button>
                        {isDropdownOpen && (
                          <div className="mt-1 ml-9 space-y-0.5">
                            {item.children.map((child, childIdx) => {
                              const childActive = selectedItem
                                ? selectedItem === child.label
                                : router.pathname === child.path;
                              return (
                                <Link key={child.path} href={child.path!}>
                                  <div
                                    draggable
                                    onDragStart={onDragStartChild(
                                      parentIdx,
                                      childIdx,
                                    )}
                                    onDragOver={onDragOver}
                                    onDrop={onDropChild(parentIdx, childIdx)}
                                    onDragEnd={onDragEnd}
                                    className={clsx(
                                      "px-3 py-2 rounded-lg transition-all duration-200 text-sm cursor-move flex items-start gap-2.5 inter-font min-w-0",
                                      {
                                        "bg-[#2D9AA5] text-white": childActive,
                                        "text-[#374151] hover:bg-gray-100":
                                          !childActive,
                                      },
                                    )}
                                    onClick={safeClick(() =>
                                      setSelectedItem(child.label),
                                    )}
                                  >
                                    <span
                                      className={clsx(
                                        "flex-shrink-0 mt-0.5",
                                        childActive
                                          ? "text-white"
                                          : "text-[#6B7280] group-hover:text-[#374151]",
                                      )}
                                    >
                                      {renderIcon(child.icon, childActive)}
                                    </span>
                                    <span
                                      className={clsx(
                                        "inter-font font-medium text-sm leading-tight",
                                        { "text-white": childActive },
                                      )}
                                    >
                                      {child.label}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Regular (non-dropdown) item
                  const MenuItemContent = (
                    <div
                      draggable
                      onDragStart={onDragStartParent(parentIdx)}
                      onDragOver={onDragOver}
                      onDrop={onDropParent(parentIdx)}
                      onDragEnd={onDragEnd}
                      className={clsx(
                        "group relative block rounded-lg transition-all duration-200 cursor-move p-2.5 touch-manipulation",
                        {
                          "bg-[#2D9AA5] text-white": isActive,
                          "hover:bg-gray-100 text-[#374151]": !isActive,
                        },
                      )}
                      onClick={safeClick(() => {
                        setOpenDropdown(null);
                        setSelectedItem(item.label);
                      })}
                    >
                      {/* Active accent removed for blue pill style */}

                      <div className="flex items-center gap-1">
                        <div
                          className={clsx(
                            "p-1.5 rounded-md transition-all duration-200 flex-shrink-0",
                            {
                              "text-white": isActive,
                              "text-[#6B7280] group-hover:text-[#374151]":
                                !isActive,
                            },
                          )}
                        >
                          {renderIcon(item.icon, isActive)}
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium inter-font text-[10px]">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={clsx(
                              "inter-font font-medium text-sm transition-colors duration-200",
                              {
                                "text-white": isActive,
                                "text-[#374151]": !isActive,
                                uppercase:
                                  (item.label || "").toUpperCase() ===
                                  "DASHBOARD",
                                "text-xs":
                                  (item.label || "").toUpperCase() ===
                                  "DASHBOARD",
                              },
                            )}
                          >
                            {item.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return item.path ? (
                    <Link key={item.path} href={item.path}>
                      {MenuItemContent}
                    </Link>
                  ) : (
                    <div key={item.label}>{MenuItemContent}</div>
                  );
                })
              )}
            </div>

            {/* Trial Countdown Timer */}
            {trialInfo && !trialInfo.isExpired && (
              <div className="mt-3 mx-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Free Trial Ends In</span>
                </div>
                
                {/* Countdown Display */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
                    <div className="text-base font-bold text-amber-700">{trialInfo.days}</div>
                    <div className="text-[9px] text-amber-600 uppercase">Days</div>
                  </div>
                  <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
                    <div className="text-base font-bold text-amber-700">{trialInfo.hours}</div>
                    <div className="text-[9px] text-amber-600 uppercase">Hrs</div>
                  </div>
                  <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
                    <div className="text-base font-bold text-amber-700">{trialInfo.minutes}</div>
                    <div className="text-[9px] text-amber-600 uppercase">Min</div>
                  </div>
                  <div className="bg-white rounded-md p-1.5 text-center shadow-sm">
                    <div className="text-base font-bold text-amber-700">{trialInfo.seconds}</div>
                    <div className="text-[9px] text-amber-600 uppercase">Sec</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-amber-200 rounded-full h-1 mb-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-1 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, ((trialInfo.days * 24 * 60 + trialInfo.hours * 60 + trialInfo.minutes) / (30 * 24 * 60)) * 100))}%` 
                    }}
                  ></div>
                </div>
                
                {/* Upgrade Button */}
                <button
                  onClick={() => router.push('/clinic/upgrade-plan')}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-semibold py-1.5 px-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Upgrade to Premium →
                </button>
              </div>
            )}

            {/* Trial Expired Warning */}
            {trialInfo && trialInfo.isExpired && (
              <div className="mt-4 mx-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">Trial Expired</span>
                </div>
                <p className="text-xs text-red-700 mb-3">Your free trial has ended. Upgrade now to continue accessing all features.</p>
                <button
                  onClick={() => router.push('/clinic/upgrade-plan')}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Upgrade to Premium →
                </button>
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default ClinicSidebar;
