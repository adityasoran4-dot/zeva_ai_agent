import React, { useState, useRef, useEffect } from "react";
import {
  Braces,
  Search,
  Zap,
  User,
  Building,
  Calendar,
  ChevronRight,
  MessageSquare,
  FileText,
  Clock,
  RefreshCw,
  XCircle,
  Mail,
  Phone,
  Smartphone,
  Users,
  Home,
  Activity,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { useRouter } from "next/router";
import useTriggerByWorkflowId from "@/hooks/useTriggerByWorkflowId";
import {
  getAiComposerVariables,
  getDynamicRestApiVariables,
  getDynamicWebhookVariables,
} from "@/lib/workflows";
import usePrevRestApiAction from "@/hooks/usePrevRestApiAction";
import usePrevAiComposerAction from "@/hooks/usePrevAiComposerAction";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface Variable {
  label: string;
  value: string;
  category: string;
  icon: any;
}

const appointmentVariables: Variable[] = [
  // Patient Information
  {
    label: "Patient ID",
    value: "{{appointment.patientId}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Patient Name",
    value: "{{appointment.patientName}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Patient First Name",
    value: "{{appointment.patientFirstName}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Patient Last Name",
    value: "{{appointment.patientLastName}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Patient Gender",
    value: "{{appointment.patientGender}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Patient Email",
    value: "{{appointment.patientEmail}}",
    category: "Appointment",
    icon: Mail,
  },
  {
    label: "Patient Phone",
    value: "{{appointment.patientPhone}}",
    category: "Appointment",
    icon: Phone,
  },
  {
    label: "Patient Mobile Number",
    value: "{{appointment.patientMobileNumber}}",
    category: "Appointment",
    icon: Smartphone,
  },
  {
    label: "Patient Type",
    value: "{{appointment.patientType}}",
    category: "Appointment",
    icon: User,
  },
  // Doctor Information
  {
    label: "Doctor ID",
    value: "{{appointment.doctorId}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Doctor Name",
    value: "{{appointment.doctorName}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Doctor Email",
    value: "{{appointment.doctorEmail}}",
    category: "Appointment",
    icon: Mail,
  },
  {
    label: "Doctor Phone",
    value: "{{appointment.doctorPhone}}",
    category: "Appointment",
    icon: Phone,
  },
  {
    label: "Doctor Gender",
    value: "{{appointment.doctorGender}}",
    category: "Appointment",
    icon: User,
  },
  {
    label: "Doctor Age",
    value: "{{appointment.doctorAge}}",
    category: "Appointment",
    icon: Calendar,
  },
  {
    label: "Doctor Date of Birth",
    value: "{{appointment.doctorDob}}",
    category: "Appointment",
    icon: Calendar,
  },
  // Room Information
  {
    label: "Room ID",
    value: "{{appointment.roomId}}",
    category: "Appointment",
    icon: Home,
  },
  {
    label: "Room Name",
    value: "{{appointment.roomName}}",
    category: "Appointment",
    icon: Home,
  },
  // Appointment Information
  {
    label: "Appointment ID",
    value: "{{appointment.id}}",
    category: "Appointment",
    icon: FileText,
  },
  {
    label: "Appointment Date",
    value: "{{appointment.date}}",
    category: "Appointment",
    icon: Calendar,
  },
  {
    label: "Appointment Time",
    value: "{{appointment.time}}",
    category: "Appointment",
    icon: Clock,
  },
  {
    label: "Follow Type",
    value: "{{appointment.followType}}",
    category: "Appointment",
    icon: RefreshCw,
  },
  {
    label: "Status",
    value: "{{appointment.status}}",
    category: "Appointment",
    icon: Activity,
  },
  {
    label: "Cancellation Reason",
    value: "{{appointment.cancellationReason}}",
    category: "Appointment",
    icon: XCircle,
  },
  {
    label: "Referral",
    value: "{{appointment.referral}}",
    category: "Appointment",
    icon: Users,
  },
  {
    label: "Notes",
    value: "{{appointment.notes}}",
    category: "Appointment",
    icon: FileText,
  },
  {
    label: "Treatment",
    value: "{{appointment.treatment}}",
    category: "Appointment",
    icon: Activity,
  },
];

const variables: Variable[] = [
  // Lead
  {
    label: "Lead Name",
    value: "{{lead.name}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Email",
    value: "{{lead.email}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Phone",
    value: "{{lead.phone}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Gender",
    value: "{{lead.gender}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Age",
    value: "{{lead.age}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Source",
    value: "{{lead.source}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Custom Source",
    value: "{{lead.customSource}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Offer",
    value: "{{lead.offerTag}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Status",
    value: "{{lead.status}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Lead Custom Status",
    value: "{{lead.customStatus}}",
    category: "Lead",
    icon: User,
  },
  {
    label: "Clinic Name",
    value: "{{lead.clinicName}}",
    category: "Lead",
    icon: Building,
  },
  // Patient
  {
    label: "Patient Name",
    value: "{{patient.name}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Email",
    value: "{{patient.email}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Phone",
    value: "{{patient.phone}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Gender",
    value: "{{patient.gender}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Age",
    value: "{{patient.age}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Source",
    value: "{{patient.source}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Custom Source",
    value: "{{patient.customSource}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Status",
    value: "{{patient.status}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Patient Custom Status",
    value: "{{patient.customStatus}}",
    category: "Patient",
    icon: User,
  },
  {
    label: "Clinic Name",
    value: "{{patient.clinicName}}",
    category: "Patient",
    icon: Building,
  },
  // Clinic
  {
    label: "Clinic Name",
    value: "{{clinic.name}}",
    category: "Clinic",
    icon: Building,
  },
  {
    label: "Clinic Address",
    value: "{{clinic.address}}",
    category: "Clinic",
    icon: Building,
  },
  {
    label: "Clinic Phone",
    value: "{{clinic.phone}}",
    category: "Clinic",
    icon: Building,
  },
  // Message
  {
    label: "Message ID",
    value: "{{incoming_message.id}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Content",
    value: "{{incoming_message.content}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Channel",
    value: "{{incoming_message.channel}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Status",
    value: "{{incoming_message.status}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Direction",
    value: "{{incoming_message.direction}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Sender ID",
    value: "{{incoming_message.senderId}}",
    category: "Incoming Message",
    icon: User,
  },
  {
    label: "Message Recipient ID",
    value: "{{incoming_message.recipientId}}",
    category: "Incoming Message",
    icon: User,
  },
  {
    label: "Message Sent At",
    value: "{{incoming_message.sentAt}}",
    category: "Incoming Message",
    icon: Calendar,
  },
  {
    label: "Message Received At",
    value: "{{incoming_message.receivedAt}}",
    category: "Incoming Message",
    icon: Calendar,
  },
  {
    label: "Message Media URL",
    value: "{{incoming_message.mediaUrl}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  {
    label: "Message Media Type",
    value: "{{incoming_message.mediaType}}",
    category: "Incoming Message",
    icon: MessageSquare,
  },
  // System
  {
    label: "Current Date",
    value: "{{system.date}}",
    category: "System",
    icon: Zap,
  },
  {
    label: "Current Time",
    value: "{{system.time}}",
    category: "System",
    icon: Zap,
  },
];

interface VariableMappingDropdownProps {
  onSelect: (value: string) => void;
  entity?: string;
  align?: "left" | "right";
  nodeId: string;
  triggerButton?: React.ReactNode;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const VariableMappingDropdown: React.FC<VariableMappingDropdownProps> = ({
  onSelect,
  entity = "Lead",
  align = "left",
  nodeId,
  triggerButton,
  textAreaRef,
  inputRef,
}) => {
  const router = useRouter();
  const { workflowId } = router.query;
  const { trigger } = useTriggerByWorkflowId({
    workflowId: workflowId as string,
  });
  const { prevRestApiAction } = usePrevRestApiAction({
    workflowId: workflowId as string,
    nodeId,
  });
  const { prevAiComposerAction } = usePrevAiComposerAction({
    workflowId: workflowId as string,
    nodeId,
  });

  const webhookVariables = getDynamicWebhookVariables(
    trigger?.webhookResponse || {},
  );
  const restApiVariables = getDynamicRestApiVariables(
    prevRestApiAction?.apiResponse || {},
  );
  const aiComposerVariables = getAiComposerVariables(
    prevAiComposerAction?.parameters?.outputKey || "",
  );

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use textAreaRef or inputRef (prefer textAreaRef)
  const activeInputRef = textAreaRef || inputRef;

  const filteredVariables = [
    ...webhookVariables,
    ...restApiVariables,
    ...aiComposerVariables,
    ...appointmentVariables,
    ...variables,
  ]
    ?.filter((v) => {
      switch (entity) {
        case "Lead":
          return (
            v.category === "Lead" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "Patient":
          return (
            v.category === "Patient" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "Clinic":
          return (
            v.category === "Clinic" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "Webhook":
          return (
            v.category === "Webhook" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "Message":
          return (
            v.category === "Incoming Message" ||
            v.category === "Lead" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "Appointment":
          return (
            v.category === "Appointment" ||
            v.category === "System" ||
            (Object.entries(restApiVariables).length > 0 &&
              v.category === "Rest API") ||
            (aiComposerVariables?.length > 0 && v.category === "AI Composer")
          );
        case "System":
          return v.category === "System";
        default:
          return true;
      }
    })
    .filter(
      (v) =>
        v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.value.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const categories = Array.from(
    new Set(filteredVariables.map((v) => v.category)),
  );

  // Function to insert text at cursor position
  const insertAtCursor = (text: string) => {
    const inputElement = activeInputRef?.current;
    if (!inputElement) {
      // Fallback: just call onSelect
      onSelect(text);
      return;
    }

    const element = inputElement;
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const value = element.value || "";

    // Insert the variable at cursor position
    const newValue = value.substring(0, start) + text + value.substring(end);

    // Update the input/textarea value
    element.value = newValue;

    // Trigger change event to update React state
    const changeEvent = new Event("input", { bubbles: true });
    element.dispatchEvent(changeEvent);

    // Move cursor after the inserted text
    const newCursorPosition = start + text.length;
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleVariableSelect = (variableValue: string) => {
    if (activeInputRef?.current) {
      // If we have a ref, insert at cursor position
      insertAtCursor(variableValue);
    } else {
      // Fallback to the onSelect callback
      onSelect(variableValue);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {triggerButton ? (
        <div onClick={() => setIsOpen(!isOpen)}>{triggerButton}</div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all text-gray-400 hover:text-blue-500 shadow-sm flex items-center justify-center",
            isOpen && "ring-2 ring-blue-100 border-blue-500 text-blue-500",
          )}
          title="Insert Variable"
        >
          <Braces className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[110] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden`}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Variables List */}
          <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar">
            {categories.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-400 font-medium italic">
                  No variables found
                </p>
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat} className="p-2">
                  <h4 className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    {cat === "Rest API" && "🔄"}
                    {cat === "AI Composer" && "✨"}
                    {cat === "Webhook" && "🌐"}
                    {cat}
                  </h4>
                  <div className="space-y-0.5 mt-1">
                    {filteredVariables
                      .filter((v) => v.category === cat)
                      .map((variable) => {
                        const Icon = variable.icon;
                        return (
                          <button
                            key={variable.value}
                            type="button"
                            onClick={() => handleVariableSelect(variable.value)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 group/var transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-gray-100 rounded group-hover/var:bg-blue-100 transition-colors">
                                <Icon className="w-3 h-3 text-gray-500 group-hover/var:text-blue-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-gray-700 group-hover/var:text-blue-700 leading-none">
                                  {variable.label}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono mt-1 leading-none truncate max-w-[180px]">
                                  {variable.value}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover/var:opacity-100 group-hover/var:text-blue-400 transition-all flex-shrink-0" />
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[9px] text-center text-gray-400 font-medium">
              Click a variable to insert it at cursor position
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableMappingDropdown;
