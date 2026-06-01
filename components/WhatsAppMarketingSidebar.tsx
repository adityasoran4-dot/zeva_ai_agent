import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Link2,
  MessageSquare,
  Workflow,
  CreditCard,
  Receipt,
  User,
  FileText,
  Megaphone,
  MessageCircle,
  Tag,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const WhatsAppMarketingSidebar = () => {
  const router = useRouter();
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    if (router) {
      setActivePath(router.pathname || "");
    }
  }, [router?.pathname]);

  const menuSections: SidebarSection[] = [
    {
      items: [
        {
          id: "connect-waba",
          label: "Connect WABA",
          icon: Link2,
          path: "/marketingalltype/whatsapp-marketing/connect-waba",
        },
        {
          id: "chat",
          label: "Chat",
          icon: MessageSquare,
          path: "/marketingalltype/whatsapp-marketing/chat",
        },
        {
          id: "bot-flow",
          label: "Bot Flow",
          icon: Workflow,
          path: "/marketingalltype/whatsapp-marketing/bot-flow",
        },
      ],
    },
    {
      title: "My Subscription",
      items: [
        {
          id: "subscription",
          label: "Subscription",
          icon: CreditCard,
          path: "/marketingalltype/whatsapp-marketing/subscription",
        },
        {
          id: "invoices",
          label: "Invoices",
          icon: Receipt,
          path: "/marketingalltype/whatsapp-marketing/invoices",
        },
      ],
    },
    {
      title: "Contact",
      items: [
        {
          id: "contact",
          label: "Contact",
          icon: User,
          path: "/marketingalltype/whatsapp-marketing/contact",
        },
      ],
    },
    {
      title: "Templates",
      items: [
        {
          id: "templates",
          label: "Templates",
          icon: FileText,
          path: "/marketingalltype/whatsapp-marketing/templates",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          id: "campaign",
          label: "Campaign",
          icon: Megaphone,
          path: "/marketingalltype/whatsapp-marketing/campaign",
        },
        {
          id: "message-bot",
          label: "Message Bot",
          icon: MessageCircle,
          path: "/marketingalltype/whatsapp-marketing/message-bot",
        },
        {
          id: "template-bot",
          label: "Template Bot",
          icon: Tag,
          path: "/marketingalltype/whatsapp-marketing/template-bot",
        },
      ],
    },
  ];

  const handleNavigation = (path?: string) => {
    if (path && router) {
      router.push(path);
    }
  };

  const isActive = (path?: string, itemId?: string) => {
    if (!path || !activePath) return false;
    // If on main dashboard page, highlight Chat by default
    if (activePath === "/marketingalltype/whatsapp-marketing" && itemId === "chat") {
      return true;
    }
    // Check if current path matches or starts with the item path
    return activePath === path || activePath.startsWith(path + "/");
  };

  return (
    <div className="h-full bg-gradient-to-b from-white to-gray-50/30 border-r border-gray-200 w-36 flex flex-col overflow-hidden">
      <div className="p-2.5">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? "mt-5" : ""}>
            {section.title && (
              <h3 className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 relative group
                      ${
                        active
                          ? "bg-purple-50 text-purple-700 shadow-sm border-l-2 border-purple-600"
                          : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900 border-l-2 border-transparent"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        w-3.5 h-3.5 flex-shrink-0 transition-all duration-200
                        ${active ? "text-purple-600 scale-105" : "text-gray-400 group-hover:text-gray-600"}
                      `}
                    />
                    <span
                      className={`
                        text-[11px] transition-colors duration-200
                        ${active ? "text-purple-700 font-semibold" : "text-gray-600 font-normal group-hover:text-gray-900"}
                      `}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhatsAppMarketingSidebar;

