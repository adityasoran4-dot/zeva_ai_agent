"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Maximize2,
  MessageSquare,
  Square,
  ArrowRightCircle,
  List,
  Image,
  MapPin,
  User,
  Globe,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
  Save,
  Plus,
  Minus,
  Lock,
  Move,
} from "lucide-react";
import ClinicLayout from "../../../components/ClinicLayout";
import withClinicAuth from "../../../components/withClinicAuth";
import WhatsAppMarketingSidebar from "../../../components/WhatsAppMarketingSidebar";

const FlowBuilderPage = () => {
  const router = useRouter();
  const { flowId } = router.query;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState("start-trigger");
  const [newKeyword, setNewKeyword] = useState("");
  const [errors, setErrors] = useState({
    contactType: false,
    triggerType: false,
  });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [components, setComponents] = useState([
    {
      id: "start-trigger",
      type: "start-trigger",
      position: { x: 400, y: 300 },
      isDragging: false,
      data: {
        contactType: "new",
        triggerType: "keyword",
        keywords: [],
      },
    },
  ]);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const suggestedKeywords = ["hello", "hi", "start", "help", "info", "menu", "order", "support", "contact"];

  const availableComponents = [
    {
      category: "BASIC MESSAGES",
      items: [
        { id: "text", label: "Text Message", icon: MessageSquare },
        { id: "button", label: "Button Message", icon: Square },
        { id: "cta", label: "Call To Action", icon: ArrowRightCircle },
      ],
    },
    {
      category: "INTERACTIVE CONTENT",
      items: [
        { id: "list", label: "List Message", icon: List },
        { id: "media", label: "Media Message", icon: Image },
        { id: "location", label: "Location", icon: MapPin },
        { id: "contact", label: "Contact Card", icon: User },
      ],
    },
    {
      category: "ADVANCED FEATURES",
      items: [
        { id: "api", label: "API Request", icon: Globe },
      ],
    },
  ];

  const getCurrentComponent = () => {
    return components.find((c) => c.id === selectedComponent);
  };

  const updateComponentData = (componentId, data) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId ? { ...comp, data: { ...comp.data, ...data } } : comp
      )
    );
  };

  const handleAddKeyword = () => {
    const component = getCurrentComponent();
    if (!component) return;
    const keywords = component.data?.keywords || [];
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      updateComponentData(selectedComponent, {
        keywords: [...keywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  };

  const handleAddSuggestedKeyword = (keyword) => {
    const component = getCurrentComponent();
    if (!component) return;
    const keywords = component.data?.keywords || [];
    if (!keywords.includes(keyword)) {
      updateComponentData(selectedComponent, {
        keywords: [...keywords, keyword],
      });
    }
  };

  const handleRemoveKeyword = (keyword) => {
    const component = getCurrentComponent();
    if (!component) return;
    const keywords = component.data?.keywords || [];
    updateComponentData(selectedComponent, {
      keywords: keywords.filter((k) => k !== keyword),
    });
  };

  const handleInputChange = (field, value) => {
    updateComponentData(selectedComponent, { [field]: value });
    if (value) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const handleSave = () => {
    const component = getCurrentComponent();
    if (!component) return;
    const data = component.data || {};
    const keywords = data.keywords || [];
    const newErrors = {
      contactType: !data.contactType,
      triggerType: !data.triggerType,
    };
    setErrors(newErrors);

    if (!newErrors.contactType && !newErrors.triggerType && keywords.length > 0) {
      // TODO: Save flow logic
      alert("Flow saved successfully!");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToScreen = () => {
    setZoom(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  const handleMouseWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)));
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey && !e.target.closest(".component"))) {
      // Middle mouse button or Alt + Left click for panning (but not on components)
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPosition.x, y: e.clientY - canvasPosition.y });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setCanvasPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggedComponent) {
      // Calculate new position based on mouse position and zoom
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - canvasPosition.x - dragOffset.x) / zoom;
        const y = (e.clientY - rect.top - canvasPosition.y - dragOffset.y) / zoom;
        setComponents((prev) =>
          prev.map((comp) =>
            comp.id === draggedComponent
              ? { ...comp, position: { x, y }, isDragging: true }
              : comp
          )
        );
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (draggedComponent) {
      setComponents((prev) =>
        prev.map((comp) =>
          comp.id === draggedComponent ? { ...comp, isDragging: false } : comp
        )
      );
      setDraggedComponent(null);
    }
  };

  const handleComponentMouseDown = (e, componentId) => {
    e.stopPropagation();
    setDraggedComponent(componentId);
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const component = components.find((c) => c.id === componentId);
      if (component) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleDragStart = (e, componentType) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("componentType", componentType);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData("componentType");
    if (componentType) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - canvasPosition.x) / zoom;
        const y = (e.clientY - rect.top - canvasPosition.y) / zoom;
        const newComponent = {
          id: `component-${Date.now()}`,
          type: componentType,
          position: { x, y },
          isDragging: false,
          data: {
            // Initialize component-specific data
            ...(componentType === "start-trigger" && {
              contactType: "",
              triggerType: "",
              keywords: [],
            }),
          },
        };
        setComponents((prev) => [...prev, newComponent]);
        setSelectedComponent(newComponent.id);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleMouseWheel, { passive: false });
      container.addEventListener("mousedown", handleCanvasMouseDown);
      container.addEventListener("mousemove", handleCanvasMouseMove);
      container.addEventListener("mouseup", handleCanvasMouseUp);
      container.addEventListener("mouseleave", handleCanvasMouseUp);
      container.addEventListener("dragover", handleDragOver);
      container.addEventListener("drop", handleDrop);

      return () => {
        container.removeEventListener("wheel", handleMouseWheel);
        container.removeEventListener("mousedown", handleCanvasMouseDown);
        container.removeEventListener("mousemove", handleCanvasMouseMove);
        container.removeEventListener("mouseup", handleCanvasMouseUp);
        container.removeEventListener("mouseleave", handleCanvasMouseUp);
        container.removeEventListener("dragover", handleDragOver);
        container.removeEventListener("drop", handleDrop);
      };
    }
  }, [isPanning, panStart, canvasPosition, draggedComponent, dragOffset, zoom, components]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <WhatsAppMarketingSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Flow Builder</h1>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
          >
            <Save className="w-4 h-4" />
            Save Flow
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Available Components */}
          <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isFullscreen ? "w-0 overflow-hidden" : "w-64"}`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Available Components</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                >
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto h-full">
              {availableComponents.map((category, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 cursor-move transition"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Area */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-gray-100"
            style={{ cursor: isPanning ? "grabbing" : draggedComponent ? "move" : "default" }}
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)`,
              }}
            />

            {/* Canvas Content */}
            <div
              ref={canvasRef}
              className="absolute w-full h-full"
              style={{
                transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              {/* Render Components */}
              {components.map((component) => (
                <div
                  key={component.id}
                  className="component absolute cursor-move"
                  style={{
                    left: `${component.position.x}px`,
                    top: `${component.position.y}px`,
                    transform: "translate(-50%, -50%)",
                    opacity: component.isDragging ? 0.8 : 1,
                    zIndex: component.isDragging ? 1000 : 1,
                  }}
                  onMouseDown={(e) => handleComponentMouseDown(e, component.id)}
                >
                  {component.type === "start-trigger" && (
                    <div className="bg-white rounded-lg shadow-lg border-2 border-pink-300 w-96">
                      {/* Component Header */}
                      <div className="bg-purple-50 px-4 py-3 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Start Trigger</h3>
                            <p className="text-xs text-gray-500">Entry Point</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 hover:bg-purple-100 rounded transition">
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-purple-100 rounded transition">
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => {
                              setComponents((prev) => prev.filter((c) => c.id !== component.id));
                            }}
                            className="p-1 hover:bg-red-100 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Component Body */}
                      <div className="p-4">
                        {/* Error Messages */}
                        {(errors.contactType || errors.triggerType) && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-2">
                              Please fix the following errors:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                              {errors.contactType && <li>Contact type is required</li>}
                              {errors.triggerType && <li>Trigger type is required</li>}
                            </ul>
                          </div>
                        )}

                        {/* Contact Type */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={component.data?.contactType || ""}
                            onChange={(e) => handleInputChange("contactType", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              errors.contactType ? "border-red-500" : "border-gray-300"
                            }`}
                          >
                            <option value="">Select contact type</option>
                            <option value="new">New Contact</option>
                            <option value="existing">Existing Contact</option>
                            <option value="all">All Contacts</option>
                          </select>
                          {errors.contactType && (
                            <p className="mt-1 text-xs text-red-600">Please select a contact type</p>
                          )}
                        </div>

                        {/* Trigger Type */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trigger Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={component.data?.triggerType || ""}
                            onChange={(e) => handleInputChange("triggerType", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              errors.triggerType ? "border-red-500" : "border-gray-300"
                            }`}
                          >
                            <option value="">Select trigger type</option>
                            <option value="keyword">Keyword</option>
                            <option value="menu">Menu</option>
                            <option value="button">Button</option>
                          </select>
                          {errors.triggerType && (
                            <p className="mt-1 text-xs text-red-600">Please select a trigger type</p>
                          )}
                        </div>

                        {/* Trigger Keywords */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trigger Keywords <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            This flow will be triggered when a user sends any of these keywords
                          </p>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                              placeholder="Add a keyword..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              onClick={handleAddKeyword}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Suggested Keywords */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {suggestedKeywords.map((keyword) => {
                              const componentKeywords = component.data?.keywords || [];
                              return (
                                <button
                                  key={keyword}
                                  onClick={() => handleAddSuggestedKeyword(keyword)}
                                  disabled={componentKeywords.includes(keyword)}
                                  className={`px-2 py-1 text-xs rounded transition ${
                                    componentKeywords.includes(keyword)
                                      ? "bg-purple-100 text-purple-700 cursor-not-allowed"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {keyword}
                                </button>
                              );
                            })}
                          </div>

                          {/* Added Keywords */}
                          {component.data?.keywords && component.data.keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {component.data.keywords.map((keyword) => (
                                <span
                                  key={keyword}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {keyword}
                                  <button
                                    onClick={() => handleRemoveKeyword(keyword)}
                                    className="hover:text-blue-900 font-bold"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No keywords added yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Add other component types here */}
                </div>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1 z-10">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Zoom In (Ctrl + Scroll)"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Zoom Out (Ctrl + Scroll)"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleFitToScreen}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-2 py-1 text-xs text-center text-gray-600 border-t border-gray-200 mt-1 pt-1">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Preview Window */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 w-48 h-32 p-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Preview</div>
              <div className="bg-gray-50 rounded h-full flex items-center justify-center">
                <div className="w-2 h-full bg-blue-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout
FlowBuilderPage.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={true}>
      {page}
    </ClinicLayout>
  );
};

// Protect and preserve layout
const ProtectedFlowBuilderPage = withClinicAuth(FlowBuilderPage);
ProtectedFlowBuilderPage.getLayout = FlowBuilderPage.getLayout;

export default ProtectedFlowBuilderPage;

