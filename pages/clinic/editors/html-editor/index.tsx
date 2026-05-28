import React, { useState, useEffect, useRef } from "react";
import { NextPageWithLayout } from "@/pages/_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { ReactElement } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import {
  Save,
  FileText,
  Code2,
  Eye,
  Braces,
  ArrowLeft,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Grid,
  Columns,
} from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import VariableMappingDropdown from "../../automation/_components/VariableMappingDropdown";

type ViewMode = "desktop" | "mobile";
type EditorLayout = "horizontal" | "vertical";

const HTMLEditorPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { templateId, campaignId } = router.query;
  const token = getTokenByPath();

  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveTemplateLoading, setSaveTemplateLoading] =
    useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [editorLayout, setEditorLayout] = useState<EditorLayout>("horizontal");
  const [wordCount, setWordCount] = useState<number>(0);
  const [lineCount, setLineCount] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        if (!templateId) return;
        const { data } = await axios.get(`/api/all-templates/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.success) {
          setHtmlContent(data?.template?.content || "");
        }
      } catch (error: any) {
        console.error("Error fetching template:", error?.message);
        toast.error(
          error?.response?.data?.message || "Failed to load template",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId, token]);

  useEffect(() => {
    if (htmlContent) {
      const text = htmlContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const words = text === "" ? 0 : text.split(" ").length;
      const lines = htmlContent.split("\n").length;
      setWordCount(words);
      setLineCount(lines);
      validateHTML(htmlContent);
    } else {
      setWordCount(0);
      setLineCount(0);
      setValidationErrors([]);
    }
  }, [htmlContent]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasChanges && (campaignId || templateId)) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [htmlContent, hasChanges, autoSave]);

  const validateHTML = (html: string) => {
    const errors: string[] = [];
    const stack: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1];
      if (match[0].startsWith("</")) {
        if (stack.length > 0 && stack[stack.length - 1] === tag) {
          stack.pop();
        } else if (stack.length === 0) {
          errors.push(`Unexpected closing tag: ${tag}`);
        }
      } else if (!tag.match(/^(br|hr|img|input|link|meta)$/i)) {
        stack.push(tag);
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed tags: ${stack.join(", ")}`);
    }
    setValidationErrors(errors);
  };

  const handleAutoSave = async () => {
    if (!htmlContent) return;
    try {
      if (campaignId) {
        await axios.put(
          `/api/campaigns/${campaignId}`,
          { content: htmlContent, editorType: "html-editor" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else if (templateId) {
        await axios.put(
          `/api/all-templates/edit-template/${templateId}`,
          { content: htmlContent, editorType: "html-editor" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }
      setLastSaved(new Date());
      setHasChanges(false);
      toast.success("Auto-saved successfully", { icon: "💾" });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleSave = async () => {
    if (!campaignId) return;
    try {
      setSaveLoading(true);
      const { data } = await axios.put(
        `/api/campaigns/${campaignId}`,
        { content: textAreaRef?.current?.value, editorType: "html-editor" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (data?.success) {
        toast.success("Campaign saved successfully!");
        setHasChanges(false);
        setLastSaved(new Date());
        router.back();
      }
    } catch (error: any) {
      console.error("Error saving campaign:", error?.message);
      toast.error(error?.response?.data?.message || "Failed to save campaign");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateId) return;
    try {
      setSaveTemplateLoading(true);
      const { data } = await axios.put(
        `/api/all-templates/edit-template/${templateId}`,
        { content: textAreaRef?.current?.value, editorType: "html-editor" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (data?.success) {
        toast.success(data.message || "Template saved successfully!");
        setHasChanges(false);
        setLastSaved(new Date());
        router.push(`/clinic/all-templates/${templateId}`);
      }
    } catch (error: any) {
      console.error("Error saving template:", error?.message);
      toast.error(error?.response?.data?.message || "Failed to save template");
    } finally {
      setSaveTemplateLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    toast.success("HTML code copied to clipboard!");
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-template-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      document.addEventListener("fullscreenchange", handleFullscreenChange);
    } else {
      document.exitFullscreen();
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
    if (!document.fullscreenElement) {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  HTML Email Editor
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create and customize your email templates
                </p>
              </div>
              {hasChanges && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Unsaved changes
                </span>
              )}
              {lastSaved && !hasChanges && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Auto-save Toggle */}
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={clsx(
                  "px-2 py-1 rounded-lg text-xs font-medium transition-all",
                  autoSave
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                Auto-save {autoSave ? "ON" : "OFF"}
              </button>

              <div className="w-px h-6 bg-gray-200"></div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={clsx(
                    "p-2 rounded-md transition-all",
                    viewMode === "desktop"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={clsx(
                    "p-2 rounded-md transition-all",
                    viewMode === "mobile"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Layout Toggle */}
              <button
                onClick={() =>
                  setEditorLayout(
                    editorLayout === "horizontal" ? "vertical" : "horizontal",
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle Layout"
              >
                {editorLayout === "horizontal" ? (
                  <Columns className="w-4 h-4 text-gray-600" />
                ) : (
                  <Grid className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-600" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                )}
              </button>

              <div className="w-px h-6 bg-gray-200"></div>

              {/* Copy & Download */}
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Code"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleDownloadHTML}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download HTML"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>

              <div className="w-px h-6 bg-gray-200"></div>

              {/* Save Buttons */}
              {campaignId && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    !saveLoading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed",
                  )}
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Campaign
                    </>
                  )}
                </button>
              )}

              {templateId && (
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={saveTemplateLoading}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    !saveTemplateLoading
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed",
                  )}
                >
                  {saveTemplateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Save Template
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div
          className={clsx(
            "flex gap-4",
            editorLayout === "vertical" ? "flex-col" : "flex-col lg:flex-row",
          )}
        >
          {/* Editor Panel */}
          <div
            className={clsx(
              "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
              editorLayout === "vertical" ? "w-full" : "lg:w-1/2",
            )}
          >
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  HTML Code
                </span>
              </div>
              <div className="flex items-center gap-3">
                <VariableMappingDropdown
                  entity="Lead"
                  onSelect={(_value: string) => {}}
                  nodeId={""}
                  align="right"
                  triggerButton={
                    <button className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                      <Braces className="w-3 h-3" />
                      Insert Merge Tag
                    </button>
                  }
                  textAreaRef={textAreaRef as any}
                />
                <div className="text-xs text-gray-500">
                  Lines: {lineCount} | Words: {wordCount}
                </div>
              </div>
            </div>

            <textarea
              ref={textAreaRef}
              value={htmlContent}
              onChange={(e) => {
                setHtmlContent(e.target.value);
                setHasChanges(true);
              }}
              className="w-full text-gray-500 h-[500px] p-4 font-mono text-sm focus:outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
              placeholder='<!DOCTYPE html>
<html>
<head>
  <title>Email Template</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello {{patient_name}}!</h1>
    <p>Your appointment is on {{appointment_date}} at {{appointment_time}}.</p>
    <p>Best regards,<br>{{clinic_name}}</p>
  </div>
</body>
</html>'
              spellCheck={false}
            />
          </div>

          {/* Preview Panel */}
          <div
            className={clsx(
              "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
              editorLayout === "vertical" ? "w-full" : "lg:w-1/2",
            )}
          >
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Live Preview
                </span>
              </div>
              <button
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                title="Refresh Preview"
              >
                <RefreshCw className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            <div
              className={clsx(
                "p-4 bg-gray-100",
                viewMode === "mobile" && "flex items-center justify-center",
              )}
            >
              <div
                className={clsx(
                  "bg-white rounded-lg shadow-sm overflow-auto transition-all duration-300",
                  viewMode === "mobile" && "max-w-[375px] w-full",
                )}
              >
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  srcDoc={htmlContent}
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  HTML Validation Issues:
                </p>
                <ul className="mt-1 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-700 text-xs">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500">Characters</p>
            <p className="text-xl font-bold text-gray-900">
              {htmlContent.length.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500">Words</p>
            <p className="text-xl font-bold text-gray-900">
              {wordCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500">Lines</p>
            <p className="text-xl font-bold text-gray-900">
              {lineCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <p className="text-xs text-gray-500">File Size</p>
            <p className="text-xl font-bold text-gray-900">
              {(new Blob([htmlContent]).size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout configuration
HTMLEditorPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedHTMLEditorPage = withClinicAuth(
  HTMLEditorPage,
) as NextPageWithLayout;
ProtectedHTMLEditorPage.getLayout = HTMLEditorPage.getLayout;

export default ProtectedHTMLEditorPage;
