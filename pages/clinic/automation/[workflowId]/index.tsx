import React, {
  ReactElement,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Handle,
  Position,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Zap,
  Play,
  Settings,
  X,
  Plus,
  Save,
  ArrowLeft,
  Search,
  UserPlus,
  Calendar,
  MessageSquare,
  Clock,
  Database,
  Filter,
  Split,
  Tag,
  Trash2,
  Pencil,
  Webhook,
  History,
} from "lucide-react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "@/pages/_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { clsx, type ClassValue } from "clsx";
import { Workflow } from "@/types/workflows";
import axios from "axios";
import { getFormatedTime, getTokenByPath } from "@/lib/helper";
import { FaUserEdit, FaWhatsapp } from "react-icons/fa";
import EditWorkflow from "../_components/EditWorkflow";
import DeleteConfirmation from "../_components/DeleteConfirmation";
import DelayActionModal from "../_components/DelayActionModal";
import RestApiActionModal from "../_components/RestApiActionModal";
import FilterConditionModal from "../_components/FilterConditionModal";
import IfElseConditionModal from "../_components/IfElseConditionModal";
import WebhookTriggerModal from "../_components/WebhookTriggerModal";
import AssignOwnerActionModal from "../_components/AssignOwnerActionModal";
import AddToSegmentActionModal from "../_components/AddToSegmentActionModal";
import AiComposerActionModal from "../_components/AiComposerActionModal";
import SendWhatsappActionModal from "../_components/SendWhatsappActionModal";
import IncomingMessageTriggerModal from "../_components/IncomingMessageTriggerModal";
import BookAppointmentActionModal from "../_components/BookAppointmentActionModal";
import AddTagActionModal from "../_components/AddTagActionModal";
import toast from "react-hot-toast";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const actionIcons: { [key: string]: React.ElementType } = {
  "Send WhatsApp": FaWhatsapp,
  Delay: Clock,
  "Rest API": Database,
  "AI Composer": Zap,
  "Add Tag": Tag,
  "Assign Owner": UserPlus,
  "Add To Segment": UserPlus,
  "Book Appointment": Calendar,
};

const triggerIcons: { [key: string]: React.ElementType } = {
  "New Lead": UserPlus,
  "Update Lead": FaUserEdit,
  "Create or Update Lead": FaUserEdit,
  "New Patient": UserPlus,
  "Update Patient": FaUserEdit,
  "Create or Update Patient": FaUserEdit,
  Appointment: Calendar,
  "Incoming Message": MessageSquare,
  "Webhook Received": Webhook,
};

// --- Custom Node Components ---

const NodeWrapper = ({
  children,
  selected,
  title,
  icon: Icon,
  color,
  description,
  onDelete,
  onEdit,
}: {
  children?: React.ReactNode;
  selected?: boolean;
  title: string;
  icon: any;
  color: string;
  description?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}) => (
  <div
    className={cn(
      "min-w-[250px] bg-white rounded-lg shadow-sm border transition-all duration-200 group/node",
      selected
        ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md",
    )}
  >
    <div className="flex items-center p-3 gap-3">
      <div
        className={cn(
          "p-2 rounded text-white shrink-0 shadow-sm",
          color.replace("bg-", "bg-"),
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <h4 className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
          {title}
        </h4>
        {description && (
          <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
            {description}
          </p>
        )}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Edit node"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
    {children}
  </div>
);

const TriggerNode = ({ id, data, selected }: any) => {
  const Icon = triggerIcons[data.label] || Zap;
  return (
    <NodeWrapper
      selected={selected}
      title={data.label || "Trigger"}
      icon={Icon}
      color={data.color || "bg-amber-500"}
      description="Starts the workflow"
      onDelete={() => data.onDeleteNode(id)}
      onEdit={() => data.onEditNode(id)}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-amber-500 !border-2 !border-white !-right-1.5"
      />
    </NodeWrapper>
  );
};

const ActionNode = ({ id, data, selected }: any) => {
  const Icon = actionIcons[data.label] || Play;
  const isDelay =
    data.label === "Delay" || data.label === "Wait" || data.subType === "delay";
  const delayDesc = data.delayValue
    ? `Wait ${data.delayValue} ${data.delayUnit}`
    : "Performs an operation";

  return (
    <NodeWrapper
      selected={selected}
      title={data.label || "Action"}
      icon={Icon}
      color={data.color || "bg-blue-500"}
      description={isDelay ? delayDesc : "Performs an operation"}
      onDelete={() => data.onDeleteNode(id)}
      onEdit={() => data.onEditNode(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white !-right-1.5"
      />
    </NodeWrapper>
  );
};

const ConditionNode = ({ id, data, selected }: any) => (
  <NodeWrapper
    selected={selected}
    title={data.label || "Condition"}
    icon={data.subType === "if_else" ? Split : Filter}
    color={data.color || "bg-purple-500"}
    description="Branching logic"
    onDelete={() => data.onDeleteNode(id)}
    onEdit={() => data.onEditNode(id)}
  >
    <Handle
      type="target"
      position={Position.Left}
      className="!w-2 !h-2 !bg-purple-500 !border-2 !border-white !-left-1.5"
    />
    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-2">
      <div className="relative group/handle">
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          className="!w-2 !h-2 !bg-green-500 !border-2 !border-white !-right-1.5 !top-1/2"
        />
        <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-500 opacity-0 group-hover/node:opacity-100 transition-opacity">
          YES
        </span>
      </div>
      <div className="relative mt-2 group/handle">
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          className="!w-2 !h-2 !bg-red-500 !border-2 !border-white !-right-1.5 !top-1/2"
        />
        <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-red-500 opacity-0 group-hover/node:opacity-100 transition-opacity">
          NO
        </span>
      </div>
    </div>
  </NodeWrapper>
);

// --- Sidebar Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  description,
  type,
  subType,
  color,
  onDragStart,
}: any) => (
  <div
    className="group flex items-center gap-3 p-2.5 mb-1.5 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
    onDragStart={(event) => onDragStart(event, type, subType, label, color)}
    draggable
  >
    <div className={cn("p-1.5 rounded text-white shrink-0 shadow-sm", color)}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-semibold text-gray-700 leading-none">
        {label}
      </div>
      <div className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
        {description?.length > 25
          ? `${description.slice(0, 25)}...`
          : description}
      </div>
    </div>
    <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
  </div>
);

// --- Main Page Component ---

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

let nodeCounter = 0;
const getId = () => `node_${nodeCounter++}`;

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

const WorkflowEditor = () => {
  const router = useRouter();
  const { workflowId } = router.query;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [nodeSearchTerm, setNodeSearchTerm] = useState("");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [delayModal, setDelayModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [restApiModal, setRestApiModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    conditionId: string | null;
  }>({
    show: false,
    conditionId: null,
  });
  const [ifelseModal, setIfelseModal] = useState<{
    show: boolean;
    conditionId: string | null;
  }>({
    show: false,
    conditionId: null,
  });
  const [webhookModal, setWebhookModal] = useState<{
    show: boolean;
    triggerId: string | null;
  }>({
    show: false,
    triggerId: null,
  });
  const [incomingMessageModal, setIncomingMessageModal] = useState<{
    show: boolean;
    triggerId: string | null;
  }>({
    show: false,
    triggerId: null,
  });
  const [assignOwnerModal, setAssignOwnerModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [addToSegmentModal, setAddToSegmentModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [aiComposerModal, setAiComposerModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [sendWhatsappModal, setSendWhatsappModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [bookAppointmentModal, setBookAppointmentModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [addTagModal, setAddTagModal] = useState<{
    show: boolean;
    actionId: string | null;
  }>({
    show: false,
    actionId: null,
  });
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    nodeId: string | null;
    isLoading: boolean;
  }>({
    show: false,
    nodeId: null,
    isLoading: false,
  });
  const [errorModal, setErrorModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({
    show: false,
    title: "",
    message: "",
  });

  const onDeleteNode = useCallback((nodeId: string) => {
    setDeleteModal({
      show: true,
      nodeId: nodeId,
      isLoading: false,
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const nodeId = deleteModal.nodeId;
    if (!nodeId) return;

    const nodeToDelete = nodes.find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const dbId = nodeToDelete.data.id;
      const nodeType = nodeToDelete.type;
      const token = getTokenByPath();

      if (dbId) {
        let apiEndpoint = "";
        if (nodeType === "trigger") {
          apiEndpoint = `/api/workflows/triggers/delete/${dbId}`;
        } else if (nodeType === "action") {
          apiEndpoint = `/api/workflows/actions/delete/${dbId}`;
        } else if (nodeType === "condition") {
          apiEndpoint = `/api/workflows/conditions/delete/${dbId}`;
        }

        if (apiEndpoint) {
          await axios.delete(apiEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      // Update Flow State
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );

      setDeleteModal({ show: false, nodeId: null, isLoading: false });
    } catch (err: any) {
      console.error("Error deleting node:", err);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
      setErrorModal({
        show: true,
        title: "Delete Failed",
        message:
          err.response?.data?.message || "Failed to delete from database.",
      });
    }
  }, [deleteModal.nodeId, nodes, setNodes, setEdges]);

  const onEditNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === nodeId);
        if (
          node &&
          (node.data.label === "Wait" ||
            node.data.label === "Delay" ||
            node.data.subType === "delay")
        ) {
          setDelayModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Send WhatsApp" ||
            node.data.subType === "send_whatsapp")
        ) {
          setSendWhatsappModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Rest API" || node.data.subType === "rest_api")
        ) {
          setRestApiModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Filter" || node.data.subType === "filter")
        ) {
          setFilterModal({
            show: true,
            conditionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "If/Else" || node.data.subType === "if_else")
        ) {
          setIfelseModal({
            show: true,
            conditionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Webhook Received" ||
            node.data.subType === "webhook_received")
        ) {
          setWebhookModal({
            show: true,
            triggerId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Incoming Message" ||
            node.data.subType === "incoming_message")
        ) {
          setIncomingMessageModal({
            show: true,
            triggerId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Assign Owner" ||
            node.data.subType === "assign_owner")
        ) {
          setAssignOwnerModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Add To Segment" ||
            node.data.subType === "add_to_segment")
        ) {
          setAddToSegmentModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "AI Composer" ||
            node.data.subType === "ai_composer")
        ) {
          setAiComposerModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Book Appointment" ||
            node.data.subType === "book_appointment")
        ) {
          setBookAppointmentModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (
          node &&
          (node.data.label === "Add Tag" || node.data.subType === "add_tag")
        ) {
          setAddTagModal({
            show: true,
            actionId: node.data.id,
          });
        } else if (node) {
          alert(`Edit functionality for node ${nodeId} is coming soon!`);
        }
        return nds;
      });
    },
    [setNodes],
  );

  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) return;
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(`/api/workflows/${workflowId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        const wf = data.data;
        setWorkflow(wf || null);

        // Restore nodes, edges, and viewport if they exist
        if (wf?.nodes?.length > 0) {
          // Update node counter based on existing IDs to prevent duplicates
          const maxId = wf.nodes.reduce((max: number, node: any) => {
            const num = parseInt(node.id.split("_")[1]);
            return isNaN(num) ? max : Math.max(max, num);
          }, -1);
          nodeCounter = maxId + 1;

          setNodes(
            wf.nodes.map((node: any) => ({
              ...node,
              data: {
                ...node.data,
                onDeleteNode,
                onEditNode,
              },
            })),
          );
        }
        if (wf?.edges?.length > 0) {
          setEdges(wf.edges);
        }
      } else {
        console.error("Error fetching workflow:", data.message);
      }
    } catch (err) {
      console.error("Error fetching workflow:", err);
    }
  }, [workflowId, onDeleteNode, onEditNode, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      try {
        const token = getTokenByPath();
        const { data } = await axios.put(
          `/api/workflows/${workflowId}`,
          {
            nodes: flow.nodes,
            edges: flow.edges,
            viewport: flow.viewport,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (data.success) {
          toast.success("Workflow saved successfully!");
        } else {
          console.error("Error saving workflow:", data.message);
          toast.error("Failed to save workflow.");
        }
      } catch (err) {
        console.error("Error saving workflow:", err);
        toast.error("Failed to save workflow.");
      }
    }
  }, [reactFlowInstance, workflowId]);

  const handleAutoSave = useCallback(async () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      try {
        const token = getTokenByPath();
        await axios.put(
          `/api/workflows/${workflowId}`,
          {
            nodes: flow.nodes,
            edges: flow.edges,
            viewport: flow.viewport,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }
  }, [reactFlowInstance, workflowId]);

  const debouncedAutoSave = useCallback(debounce(handleAutoSave, 1000), [
    handleAutoSave,
  ]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (nodes.length > 0 || edges.length > 0) {
      debouncedAutoSave();
    }
  }, [nodes, edges, debouncedAutoSave]);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const shouldShow = (label: string, description?: string) => {
    if (!nodeSearchTerm) return true;
    const term = nodeSearchTerm.toLowerCase();
    return (
      label.toLowerCase().includes(term) ||
      description?.toLowerCase().includes(term)
    );
  };

  const defaultEdgeOptions = {
    style: { strokeDasharray: "5,5", strokeWidth: 2 },
    animated: true,
  };

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) => {
        // Find existing edges originating from the same source/handle OR targeting the same target/handle
        const existingEdges = eds.filter(
          (edge) =>
            (edge.source === params.source &&
              edge.sourceHandle === params.sourceHandle) ||
            (edge.target === params.target &&
              edge.targetHandle === params.targetHandle),
        );

        if (existingEdges.length > 0) {
          // If any conflicting edges exist, we replace them with the new one
          const existingIds = existingEdges.map((e) => e.id);
          return addEdge(
            {
              ...params,
              style: { strokeDasharray: "5,5", strokeWidth: 2 },
              animated: true,
            },
            eds.filter((edge) => !existingIds.includes(edge.id)),
          );
        }

        // Otherwise, just add the new edge
        return addEdge(
          {
            ...params,
            style: { strokeDasharray: "5,5", strokeWidth: 2 },
            animated: true,
          },
          eds,
        );
      }),
    [setEdges],
  );

  const onDragStart = (
    event: any,
    nodeType: string,
    subType: string,
    label: string,
    color: string,
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ nodeType, subType, label, color }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    async (event: any) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const dataStr = event.dataTransfer.getData("application/reactflow");

      if (!dataStr) return;

      const { nodeType, subType, label, color } = JSON.parse(dataStr);

      // Check for single trigger rule
      if (nodeType === "trigger") {
        const hasTrigger = nodes.some((n) => n.type === "trigger");
        if (hasTrigger) {
          setErrorModal({
            show: true,
            title: "Action Restricted",
            message: "Only one trigger is allowed in a workflow.",
          });
          return;
        }
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // --- Create in Database ---
      let dbRecordId = "";
      try {
        const token = getTokenByPath();
        let apiEndpoint = "";
        let payload: any = {};

        if (nodeType === "trigger") {
          apiEndpoint = `/api/workflows/triggers/${workflowId}`;
          payload = { name: label, type: subType };
        } else if (nodeType === "action") {
          apiEndpoint = `/api/workflows/actions/${workflowId}`;
          payload = { name: label, type: subType, parameters: {} };
        } else if (nodeType === "condition") {
          apiEndpoint = `/api/workflows/conditions/${workflowId}`;
          payload = { type: subType, conditions: [] };
        }

        const { data } = await axios.post(apiEndpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          dbRecordId = data.data._id;
        } else {
          console.error(`Error creating ${nodeType}:`, data.message);
          return;
        }
      } catch (err) {
        console.error(`Error creating ${nodeType}:`, err);
        return;
      }

      const newNode = {
        id: getId(),
        type: nodeType,
        position,
        data: {
          label,
          subType,
          color,
          id: dbRecordId, // MongoDB ID
          onDeleteNode,
          onEditNode,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, nodes, onDeleteNode, onEditNode, workflowId],
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 group/header">
              <h1 className="text-lg font-bold text-gray-900">
                {(workflow?.name || "")?.length > 20
                  ? `${workflow?.name.slice(0, 20)}...`
                  : workflow?.name || "Untitled Workflow"}
              </h1>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-gray-100 rounded-md transition-all text-gray-400 hover:text-blue-600"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <span
                className={`px-2 py-0.5 rounded-full ${workflow?.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}
                text-[10px] font-bold uppercase tracking-wider`}
              >
                {workflow?.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Last saved {getFormatedTime(workflow?.updatedAt || "")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Play className="w-4 h-4" />
            Test Flow
          </button> */}
          <button
            onClick={() =>
              router.push(`/clinic/automation/history/${workflowId}`)
            }
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <History className="w-4 h-4" />
            View History
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={cn(
            "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-10 shadow-xl",
            isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-none",
          )}
        >
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                Nodes Library
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={nodeSearchTerm}
                onChange={(e) => setNodeSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-6">
              {/* Triggers Section */}
              {(() => {
                const triggers = [
                  workflow?.entity === "Lead" && {
                    subType: "new_lead",
                    label: "New Lead",
                    description: "When a new lead is added",
                    icon: UserPlus,
                    color: "bg-amber-500",
                  },
                  workflow?.entity === "Lead" && {
                    subType: "update_lead",
                    label: "Update Lead",
                    description: "When a lead is updated",
                    icon: FaUserEdit,
                    color: "bg-yellow-500",
                  },
                  workflow?.entity === "Lead" && {
                    subType: "create_or_update_lead",
                    label: "Create or Update Lead",
                    description: "When a lead is created or updated",
                    icon: FaUserEdit,
                    color: "bg-green-500",
                  },
                  // patient
                  workflow?.entity === "Patient" && {
                    subType: "record_created",
                    label: "New Patient",
                    description: "When a new patient is added",
                    icon: UserPlus,
                    color: "bg-blue-500",
                  },
                  workflow?.entity === "Patient" && {
                    subType: "record_updated",
                    label: "Update Patient",
                    description: "When a patient is updated",
                    icon: FaUserEdit,
                    color: "bg-yellow-500",
                  },
                  workflow?.entity === "Patient" && {
                    subType: "record_create_or_update",
                    label: "Create or Update Patient",
                    description: "When a patient is created or updated",
                    icon: FaUserEdit,
                    color: "bg-green-500",
                  },
                  workflow?.entity === "Appointment" && {
                    subType: "booked_appointment",
                    label: "Booked Appointment",
                    description: "When an appointment is booked",
                    icon: Calendar,
                    color: "bg-amber-500",
                  },
                  workflow?.entity === "Message" && {
                    subType: "incoming_message",
                    label: "Incoming Message",
                    description: "When an incoming message is received",
                    icon: MessageSquare,
                    color: "bg-blue-500",
                  },
                  workflow?.entity === "Webhook" && {
                    subType: "webhook_received",
                    label: "Webhook Received",
                    description: "When a webhook is received",
                    icon: Webhook,
                    color: "bg-red-500",
                  },
                ].filter(Boolean);

                const visibleTriggers = triggers.filter((t: any) =>
                  shouldShow(t.label, t.description),
                );

                if (visibleTriggers.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">
                      Triggers
                    </h3>
                    {visibleTriggers.map((t: any) => (
                      <SidebarItem
                        key={t.subType}
                        type="trigger"
                        subType={t.subType}
                        label={t.label}
                        description={t.description}
                        icon={t.icon}
                        color={t.color}
                        onDragStart={onDragStart}
                      />
                    ))}
                  </div>
                );
              })()}

              {/* Conditions Section */}
              {(() => {
                const conditions = [
                  {
                    subType: "filter",
                    label: "Filter",
                    description: "Filter based on criteria",
                    icon: Filter,
                    color: "bg-purple-500",
                  },
                  {
                    subType: "if_else",
                    label: "If/Else",
                    description: "Branch the workflow",
                    icon: Split,
                    color: "bg-orange-500",
                  },
                ];

                const visibleConditions = conditions.filter((c: any) =>
                  shouldShow(c.label, c.description),
                );

                if (visibleConditions.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">
                      Conditions
                    </h3>
                    {visibleConditions.map((c: any) => (
                      <SidebarItem
                        key={c.subType}
                        type="condition"
                        subType={c.subType}
                        label={c.label}
                        description={c.description}
                        icon={c.icon}
                        color={c.color}
                        onDragStart={onDragStart}
                      />
                    ))}
                  </div>
                );
              })()}

              {/* Actions Section */}
              {(() => {
                const actions = [
                  {
                    subType: "send_whatsapp",
                    label: "Send WhatsApp",
                    description: "Send a whatsapp templated message",
                    icon: FaWhatsapp,
                    color: "bg-green-500",
                  },
                  {
                    subType: "delay",
                    label: "Delay",
                    description: "Delay for specific time",
                    icon: Clock,
                    color: "bg-red-500",
                  },
                  {
                    subType: "rest_api",
                    label: "Rest API",
                    description: "Call a REST API",
                    icon: Database,
                    color: "bg-blue-500",
                  },
                  {
                    subType: "ai_composer",
                    label: "AI Composer",
                    description: "Compose AI responses",
                    icon: Zap,
                    color: "bg-yellow-500",
                  },
                  // {
                  //   subType: "book_appointment",
                  //   label: "Book Appointment",
                  //   description: "Automatically book an appointment",
                  //   icon: Calendar,
                  //   color: "bg-indigo-500",
                  // },
                  workflow?.entity === "Lead" && {
                    subType: "add_tag",
                    label: "Add Tag",
                    description: "Add a tag to the lead",
                    icon: Tag,
                    color: "bg-blue-500",
                  },
                  workflow?.entity === "Lead" && {
                    subType: "assign_owner",
                    label: "Assign Owner",
                    description: "Assign the lead to a specific owner",
                    icon: UserPlus,
                    color: "bg-purple-500",
                  },
                  workflow?.entity === "Lead" && {
                    subType: "add_to_segment",
                    label: "Add To Segment",
                    description: "Add the lead to a specific segment",
                    icon: UserPlus,
                    color: "bg-green-500",
                  },
                ].filter(Boolean);

                const visibleActions = actions.filter((a: any) =>
                  shouldShow(a.label, a.description),
                );

                if (visibleActions.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">
                      Actions
                    </h3>
                    {visibleActions.map((a: any) => (
                      <SidebarItem
                        key={a.subType}
                        type="action"
                        subType={a.subType}
                        label={a.label}
                        description={a.description}
                        icon={a.icon}
                        color={a.color}
                        onDragStart={onDragStart}
                      />
                    ))}
                  </div>
                );
              })()}

              {nodeSearchTerm &&
                shouldShow("", "") === false && ( // fallback if no sections show up
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs font-medium">
                      No nodes found matching "{nodeSearchTerm}"
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 z-20 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-gray-500 hover:text-blue-600 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Canvas */}
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid={true}
            snapGrid={[12, 12]}
          >
            <Background
              color="#e2e8f0"
              variant={"dots" as any}
              gap={24}
              size={1.5}
            />
            <Controls className="!bg-white !border-none !shadow-xl !rounded-xl overflow-hidden" />
            <MiniMap
              className="!bg-white !rounded-xl !shadow-xl !border-gray-100"
              nodeColor={(n: any) => {
                if (n.type === "trigger") return "#f59e0b";
                if (n.type === "condition") return "#a855f7";
                return "#3b82f6";
              }}
            />
            <Panel
              position="top-right"
              className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2"
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                Flow View
              </span>
              <div className="flex gap-1">
                <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Split className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg">
                  <Database className="w-4 h-4" />
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setErrorModal({ ...errorModal, show: false })}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {errorModal.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {errorModal.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModal({ ...errorModal, show: false })}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workflow Modal */}
      <EditWorkflow
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workflow={workflow}
        onUpdate={(updatedWf) => setWorkflow(updatedWf)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteModal.show}
        isLoading={deleteModal.isLoading}
        onClose={() =>
          setDeleteModal({ show: false, nodeId: null, isLoading: false })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Node?"
        message="This will permanently delete this node and its connections from your workflow."
      />

      {/* Delay Action Modal */}
      <DelayActionModal
        isOpen={delayModal.show}
        onClose={() => setDelayModal({ show: false, actionId: null })}
        actionId={delayModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />
      {/* Rest API Action Modal */}
      <RestApiActionModal
        isOpen={restApiModal.show}
        onClose={() => setRestApiModal({ show: false, actionId: null })}
        actionId={restApiModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* Filter Condition Modal */}
      <FilterConditionModal
        isOpen={filterModal.show}
        onClose={() => setFilterModal({ show: false, conditionId: null })}
        conditionId={filterModal.conditionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* If/Else Condition Modal */}
      <IfElseConditionModal
        isOpen={ifelseModal.show}
        onClose={() => setIfelseModal({ show: false, conditionId: null })}
        conditionId={ifelseModal.conditionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* Webhook Trigger Modal */}
      <WebhookTriggerModal
        isOpen={webhookModal.show}
        onClose={() => setWebhookModal({ show: false, triggerId: null })}
        triggerId={webhookModal.triggerId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />

      {/* Incoming Message Trigger Modal */}
      <IncomingMessageTriggerModal
        isOpen={incomingMessageModal.show}
        onClose={() =>
          setIncomingMessageModal({ show: false, triggerId: null })
        }
        triggerId={incomingMessageModal.triggerId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />

      {/* Assign Owner Action Modal */}
      <AssignOwnerActionModal
        isOpen={assignOwnerModal.show}
        onClose={() => setAssignOwnerModal({ show: false, actionId: null })}
        actionId={assignOwnerModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />

      {/* Add To Segment Action Modal */}
      <AddToSegmentActionModal
        isOpen={addToSegmentModal.show}
        onClose={() => setAddToSegmentModal({ show: false, actionId: null })}
        actionId={addToSegmentModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />

      {/* AI Composer Action Modal */}
      <AiComposerActionModal
        isOpen={aiComposerModal.show}
        onClose={() => setAiComposerModal({ show: false, actionId: null })}
        actionId={aiComposerModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* Send WhatsApp Action Modal */}
      <SendWhatsappActionModal
        isOpen={sendWhatsappModal.show}
        onClose={() => setSendWhatsappModal({ show: false, actionId: null })}
        actionId={sendWhatsappModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* Book Appointment Action Modal */}
      <BookAppointmentActionModal
        isOpen={bookAppointmentModal.show}
        onClose={() => setBookAppointmentModal({ show: false, actionId: null })}
        actionId={bookAppointmentModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
        entity={workflow?.entity}
      />

      {/* Add Tag Action Modal */}
      <AddTagActionModal
        isOpen={addTagModal.show}
        onClose={() => setAddTagModal({ show: false, actionId: null })}
        actionId={addTagModal.actionId}
        onUpdate={() => {
          fetchWorkflow();
        }}
      />
    </div>
  );
};

const WorkflowEditPage: NextPageWithLayout = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
};

// Layout configuration
WorkflowEditPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedWorkflowEditPage = withClinicAuth(
  WorkflowEditPage,
) as NextPageWithLayout;
ProtectedWorkflowEditPage.getLayout = WorkflowEditPage.getLayout;

export default ProtectedWorkflowEditPage;
