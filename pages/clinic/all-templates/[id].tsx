import React, { ReactElement, useEffect, useRef, useState } from "react";
import { NextPageWithLayout } from "../../_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { useRouter } from "next/router";
import useCreateAndEditTemplate, {
  categoryOptions,
  emailTemplateTypeOptions,
  TemplateButton,
  templateButtonOptions,
  templateHeaderOptions,
  templateTypeOptions,
} from "@/hooks/useCreateAndEditTemplate";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  Bold,
  Code,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Paperclip,
  Plus,
  Quote,
  Smile,
  Underline,
  X,
} from "lucide-react";
import EmojiPickerModal from "@/components/shared/EmojiPickerModal";

export const getUniqueName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .toLowerCase();
};

// Move InputField to top-level so it's identity is stable across renders
const InputField = React.memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    maxLength,
    disabled = false,
    required = false,
    type = "text",
    showCharCount = false,
    autoFocus = false,
    className = "",
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    required?: boolean;
    type?: string;
    showCharCount?: boolean;
    autoFocus?: boolean;
    className?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showCharCount && maxLength && (
          <span className="text-xs text-gray-500">
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white ${className}`}
      />
    </div>
  ),
);

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write your email content here...",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<p><br></p>";
    }
  }, [value]);

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parent =
        selection.getRangeAt(0).commonAncestorContainer.parentElement;
      while (parent && parent !== editorRef.current) {
        const tag = parent.tagName.toLowerCase();
        if (["h1", "h2", "h3", "blockquote", "a"].includes(tag)) {
          formats.add(tag);
        }
        parent = parent.parentElement;
      }
    }
    setActiveFormats(formats);
  };

  const formatText = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  const addLink = () => {
    const url = prompt("Enter the URL");
    if (url) {
      formatText("createLink", url);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button
          onClick={() => formatText("bold")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("bold") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => formatText("italic")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("italic") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => formatText("underline")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("underline") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={addLink}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("a") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Add Link"
        >
          <Link size={16} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <button
          onClick={() => formatText("formatBlock", "h1")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("h1") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => formatText("formatBlock", "h2")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("h2") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => formatText("formatBlock", "h3")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("h3") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <button
          onClick={() => formatText("justifyLeft")}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => formatText("justifyCenter")}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => formatText("justifyRight")}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <button
          onClick={() => formatText("insertUnorderedList")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("ul") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => formatText("insertOrderedList")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("ol") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => formatText("formatBlock", "blockquote")}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.has("blockquote") ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] text-sm focus:outline-none bg-white prose max-w-none"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const TemplateCreateAndEditPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    state,
    setContent,
    setValues,
    setVariableSampleValues,
    setHeaderVariableSampleValues,
    // setTemplateButtons,
    setEditorType,
    setIsAddBtnOpen,
    handleAddVariable,
    handleCreateTemplate,
    handleFileChange,
    handleFileInput,
    handleAddButton,
    handleButtonInputChange,
    // handleUpdateButton,
    handleRemoveButton,
    handleUpdateTemplate,
  } = useCreateAndEditTemplate();

  const {
    textAreaRef,
    // fileInputRef,
    whatsappProviders,
    smsProviders,
    emailProviders,
    content,
    values,
    loading,
    headerFile,
    variables,
    variableSampleValues,
    templateButtons,
    headerVariables,
    headerVariableSampleValues,
    template,
    editorType,
    isAddBtnOpen,
  } = state;

  const handleOpenHtmlEditor = async () => {
    let finalId = id;
    if (isCreateMode) {
      // Create first
      const newId = await handleCreateTemplate("none");
      if (newId) finalId = newId;
      else return;
    } else {
      // Update first
      const updatedId = await handleUpdateTemplate(id as string, "none");
      if (updatedId) finalId = updatedId;
      else return;
    }

    if (finalId) {
      router.push(`/clinic/editors/html-editor/?templateId=${finalId}`);
    }
  };

  const isCreateMode = id === "new";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAddBtnOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasDuplicateTextInButtons = (buttons: TemplateButton[]) => {
    const textSet = new Set();
    for (const button of buttons) {
      if (textSet.has(button.text)) {
        return true;
      }
      textSet.add(button.text);
    }
    return false;
  };

  useEffect(() => {
    if (!isCreateMode && id) {
      // fetch template by id
    }
  }, [id]);

  // Custom Button Component
  const Button = ({
    children,
    onClick,
    variant = "primary",
    disabled = false,
    loading = false,
    className = "",
    type = "button",
    icon,
    size = "md",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    type?: "button" | "submit";
    icon?: React.ReactNode;
    size?: "sm" | "md" | "lg";
  }) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

    const sizeStyles = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantStyles = {
      primary: "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200",
      ghost: "text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${
          variantStyles[variant]
        } ${
          disabled || loading ? "cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  };

  // Custom Dropdown Component
  const Dropdown = ({
    children,
    isOpen,
    // onClose,
    align = "left",
    className = "",
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    align?: "left" | "right";
    className?: string;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="relative">
        <div
          ref={dropdownRef}
          className={`absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${className}`}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              <ArrowLeft size={16} />
            </Button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {template ? "Update Template" : "Create New Template"}
            </h2>
          </div>
          {!template && (
            <p className="mt-2 text-sm text-gray-600">
              Create SMS, WhatsApp, and Email templates with dynamic variables
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className={`${
              values?.templateType === "email"
                ? "lg:col-span-3"
                : "lg:col-span-2"
            } space-y-6`}
          >
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Template Type Selection */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Template Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {templateTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValues((prev: any) => ({
                            ...prev,
                            templateType: option.value,
                          }))
                        }
                        className={`p-4 rounded-lg border transition-all ${
                          values?.templateType === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Create {option.label.toLowerCase()} templates
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Template Details
                  </h3>

                  <InputField
                    label="Template Name"
                    value={values.name}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        name: e.target.value.slice(0, 50),
                        uniqueName: getUniqueName(e.target.value).slice(0, 512),
                      }))
                    }
                    placeholder="e.g., Appointment Reminder, Welcome Message"
                    maxLength={50}
                    disabled={loading}
                    required
                    showCharCount
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Provider <span className="text-red-500 text-sm">*</span>
                    </label>
                    <select
                      value={values?.provider}
                      onChange={(e) =>
                        setValues((prev: any) => ({
                          ...prev,
                          provider: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                      disabled={loading || !!template}
                    >
                      <option value="">Select provider</option>
                      {(values?.templateType === "whatsapp"
                        ? whatsappProviders
                        : values?.templateType === "sms"
                          ? smsProviders
                          : values?.templateType === "email"
                            ? emailProviders
                            : []
                      ).map((provider) => (
                        <option key={provider._id} value={provider._id}>
                          {provider.label || provider.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email Specific Fields */}
                  {values?.templateType === "email" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Editor Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setEditorType("rich-text-editor")}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                              editorType === "rich-text-editor"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600"
                            }`}
                          >
                            <Edit3 size={18} />
                            <span className="font-medium">Rich Text</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenHtmlEditor}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                              editorType === "html-editor"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600"
                            }`}
                          >
                            <Code size={18} />
                            <span className="font-medium">HTML Editor</span>
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {editorType === "html-editor"
                            ? "Advanced HTML editor for custom email designs."
                            : "Simple drag-and-drop style rich text editor."}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Email Template Type
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {emailTemplateTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  emailTemplateType: option.value,
                                }))
                              }
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                values?.emailTemplateType === option.value
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <InputField
                        label="Subject"
                        value={values?.subject || ""}
                        onChange={(e) =>
                          setValues((prev: any) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="Enter email subject"
                        maxLength={200}
                        disabled={loading}
                        required
                      />

                      {values?.emailTemplateType === "marketing" && (
                        <InputField
                          label="Preheader"
                          value={values?.preheader || ""}
                          onChange={(e) =>
                            setValues((prev: any) => ({
                              ...prev,
                              preheader: e.target.value,
                            }))
                          }
                          placeholder="Brief preview text for email clients"
                          maxLength={200}
                          disabled={loading}
                        />
                      )}
                    </>
                  )}

                  {/* WhatsApp Specific Fields */}
                  {values?.templateType === "whatsapp" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InputField
                        label="Unique Name"
                        value={values?.uniqueName || ""}
                        onChange={(e) =>
                          setValues((prev: any) => ({
                            ...prev,
                            uniqueName: getUniqueName(e.target.value)?.slice(
                              0,
                              512,
                            ),
                          }))
                        }
                        placeholder="unique_template_name"
                        maxLength={512}
                        disabled={true}
                        required
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Language
                        </label>
                        <select
                          value={values?.language || ""}
                          onChange={(e) =>
                            setValues((prev: any) => ({
                              ...prev,
                              language: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                          disabled={loading || !!template}
                        >
                          <option value="">Select language</option>
                          <option value="en_US">English (US)</option>
                          <option value="es_ES">Spanish</option>
                          <option value="fr_FR">French</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Category
                        </label>
                        <select
                          value={values?.category || ""}
                          onChange={(e) =>
                            setValues((prev: any) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                          disabled={loading}
                        >
                          <option value="">Select category</option>
                          {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Section */}
                {values?.isHeader && values.templateType === "whatsapp" && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Header</h4>
                      <button
                        type="button"
                        onClick={() =>
                          setValues((prev: any) => ({
                            ...prev,
                            isHeader: false,
                          }))
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Header Type
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {templateHeaderOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  headerType: option.value,
                                }))
                              }
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                values?.headerType === option.value
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {values?.headerType === "text" ? (
                        <div className="space-y-3">
                          <InputField
                            label="Header Text"
                            value={values?.headerText || ""}
                            onChange={(e) =>
                              setValues((prev: any) => ({
                                ...prev,
                                headerText: e.target.value,
                              }))
                            }
                            placeholder="Enter header text"
                            maxLength={50}
                            disabled={loading}
                            required
                            showCharCount
                          />
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  headerText: `${prev.headerText || ""} {{1}}`,
                                }))
                              }
                              disabled={/\{\{\d+\}\}/.test(
                                values?.headerText || "",
                              )}
                              className="text-xs"
                            >
                              <Plus size={14} className="mr-1" />
                              Add Variable
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Upload File
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="flex-1">
                              <input
                                type="file"
                                className="hidden"
                                accept={
                                  values.headerType === "image"
                                    ? "image/jpeg,image/jpg,image/png"
                                    : values.headerType === "video"
                                      ? "video/mp4,video/3gp"
                                      : values.headerType === "document"
                                        ? ".pdf,.doc,.docx,.pptx,.xlsx"
                                        : "image/jpeg,image/jpg,image/png"
                                }
                                onChange={handleFileChange}
                                disabled={loading}
                              />
                              <div className="cursor-pointer px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center">
                                <div className="text-sm text-gray-600">
                                  Click to upload{" "}
                                  {values.headerType === "image"
                                    ? "an image"
                                    : values.headerType === "video"
                                      ? "a video"
                                      : "a document"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {values.headerType === "image"
                                    ? "JPG, PNG up to 5MB"
                                    : values.headerType === "video"
                                      ? "MP4, 3GP up to 16MB"
                                      : "PDF, DOC, DOCX up to 100MB"}
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Header Variables Section */}
                {values?.templateType === "whatsapp" &&
                  headerVariables?.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50/30">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Header Variables
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Provide sample values for header variables
                      </p>
                      <div className="space-y-3">
                        {headerVariables.map(
                          (variable: string, index: number) => (
                            <InputField
                              key={index}
                              label={`Variable ${variable}`}
                              value={headerVariableSampleValues[index] || ""}
                              onChange={(e) => {
                                const updatedValues =
                                  headerVariableSampleValues.map((val, idx) =>
                                    idx === index ? e.target.value : val,
                                  );
                                setHeaderVariableSampleValues(updatedValues);
                              }}
                              placeholder={`Sample value for ${variable}`}
                              maxLength={50}
                              required
                              showCharCount
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Content Editor */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Content
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Body Content
                    </label>
                    {values?.templateType === "email" ? (
                      <RichTextEditor
                        value={content}
                        onChange={(html) => setContent(html)}
                      />
                    ) : (
                      <textarea
                        ref={textAreaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your template content here..."
                        rows={6}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white resize-none"
                      />
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <div>Use {"{{variable}}"} for dynamic content</div>
                      <div>{content?.length || 0} characters</div>
                    </div>
                  </div>
                </div>

                {/* Body Variables Section */}
                {values?.templateType === "whatsapp" &&
                  variables?.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-green-50/30">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Body Variables
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Provide sample values for body variables
                      </p>
                      <div className="space-y-3">
                        {variables.map((variable: string, index: number) => (
                          <InputField
                            key={index}
                            label={`Variable ${variable}`}
                            value={variableSampleValues[index] || ""}
                            onChange={(e) => {
                              const updatedValues = variableSampleValues.map(
                                (val, idx) =>
                                  idx === index ? e.target.value : val,
                              );
                              setVariableSampleValues(updatedValues);
                            }}
                            placeholder={`Sample value for ${variable}`}
                            maxLength={50}
                            required
                            showCharCount
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Footer Section */}
                {values?.isFooter && values.templateType === "whatsapp" && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Footer</h4>
                      <button
                        type="button"
                        onClick={() =>
                          setValues((prev: any) => ({
                            ...prev,
                            isFooter: false,
                          }))
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <InputField
                      label="Footer Text"
                      value={values?.footer || ""}
                      onChange={(e) =>
                        setValues((prev: any) => ({
                          ...prev,
                          footer: e.target.value,
                        }))
                      }
                      placeholder="Enter footer text"
                      maxLength={60}
                      disabled={loading}
                      required
                      showCharCount
                    />
                  </div>
                )}

                {/* Buttons Section */}
                {values?.isButton && values?.templateType === "whatsapp" && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-purple-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Buttons</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Add interactive buttons to your message
                        </p>
                      </div>
                      <div className="relative" ref={dropdownRef}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Plus size={16} />}
                          onClick={() => setIsAddBtnOpen(!isAddBtnOpen)}
                        >
                          Add Button
                        </Button>

                        <Dropdown
                          isOpen={isAddBtnOpen}
                          onClose={() => setIsAddBtnOpen(false)}
                        >
                          <div className="py-2">
                            {templateButtonOptions.map((category) => (
                              <div
                                key={category.type}
                                className="mb-2 last:mb-0"
                              >
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {category.label}
                                </div>
                                {category.options.map((option) => {
                                  const disabled =
                                    (option.type === "URL" &&
                                      templateButtons.filter(
                                        (t: any) => t.type === "URL",
                                      ).length >= 2) ||
                                    (option.type === "PHONE_NUMBER" &&
                                      templateButtons.filter(
                                        (t: any) => t.type === "PHONE_NUMBER",
                                      ).length >= 1);

                                  return (
                                    <button
                                      key={option.value}
                                      disabled={disabled}
                                      onClick={() => {
                                        handleAddButton(option);
                                        setIsAddBtnOpen(false);
                                      }}
                                      className={`w-full px-3 py-2 text-sm text-left ${
                                        disabled
                                          ? "text-gray-400 cursor-not-allowed"
                                          : "hover:bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      <div className="font-medium">
                                        {option.label}
                                      </div>
                                      {option.headerText && (
                                        <div className="text-xs text-gray-500">
                                          {option.headerText}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </Dropdown>
                      </div>
                    </div>

                    {/* Button List */}
                    {templateButtons.length > 0 && (
                      <div className="space-y-3">
                        {templateButtons.map((button: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-white border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <InputField
                                  label={`Button Text`}
                                  value={button.text || ""}
                                  onChange={(e) =>
                                    handleButtonInputChange(
                                      index,
                                      "text",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={
                                    button.type === "QUICK_REPLY"
                                      ? "Quick Reply"
                                      : button.type === "URL"
                                        ? "Visit website"
                                        : "Call phone number"
                                  }
                                />

                                {button.type === "URL" && (
                                  <div className="mt-3">
                                    <InputField
                                      label="URL"
                                      value={button.url || ""}
                                      onChange={(e) =>
                                        handleButtonInputChange(
                                          index,
                                          "url",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                )}

                                {button.type === "PHONE_NUMBER" && (
                                  <div className="mt-3">
                                    <InputField
                                      label="Phone number"
                                      value={button.phone_number || ""}
                                      onChange={(e) =>
                                        handleButtonInputChange(
                                          index,
                                          "phone_number",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="+1234567890"
                                    />
                                  </div>
                                )}

                                <div className="text-xs text-gray-500 mt-2">
                                  {button.type}
                                </div>
                              </div>

                              <div className="flex-shrink-0 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveButton(index)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <EmojiPickerModal
                        inputRef={textAreaRef as any}
                        setValue={(val) => {
                          setContent(val);
                        }}
                        triggerButton={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-[38px]"
                          >
                            <Smile size={16} />
                          </Button>
                        }
                        align="start"
                        position="top-left"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Plus size={16} />}
                        onClick={handleAddVariable}
                      >
                        Add Variable
                      </Button>

                      {values?.templateType === "whatsapp" && (
                        <>
                          {!values?.isHeader && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Plus size={16} />}
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  isHeader: true,
                                }))
                              }
                            >
                              Add Header
                            </Button>
                          )}
                          {!values?.isFooter && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Plus size={16} />}
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  isFooter: true,
                                }))
                              }
                            >
                              Add Footer
                            </Button>
                          )}
                          {!values?.isButton && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Plus size={16} />}
                              onClick={() =>
                                setValues((prev: any) => ({
                                  ...prev,
                                  isButton: true,
                                }))
                              }
                            >
                              Add Buttons
                            </Button>
                          )}
                        </>
                      )}

                      {values?.templateType === "sms" && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Paperclip size={16} />}
                          onClick={handleFileInput}
                        >
                          Attach File
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() =>
                          template
                            ? handleUpdateTemplate(template._id, "/")
                            : handleCreateTemplate("/")
                        }
                        disabled={
                          loading || hasDuplicateTextInButtons(templateButtons)
                        }
                        loading={loading}
                      >
                        {template ? "Update Template" : "Create Template"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={`space-y-5 ${
              values?.templateType === "email"
                ? "lg:col-span-3"
                : "lg:col-span-1"
            }`}
          >
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Template Guide
                </h3>

                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Variables
                    </h4>
                    <p className="text-sm text-blue-700">
                      Use {"{{variable_name}}"} to insert dynamic content
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">
                      Character Limits
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• WhatsApp: 1024 characters</li>
                      <li>• SMS: 1600 characters</li>
                      <li>• Email: No limit</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-1">Tips</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Keep messages concise and clear</li>
                      <li>• Test variables with sample data</li>
                      <li>• Preview before sending</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Live Preview
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        values?.templateType === "whatsapp"
                          ? "bg-green-100 text-green-800"
                          : values?.templateType === "sms"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {values?.templateType === "whatsapp" && "WhatsApp"}
                      {values?.templateType === "sms" && "SMS"}
                      {values?.templateType === "email" && "Email"}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Preview */}
                {values?.templateType === "whatsapp" && (
                  <div className="space-y-4">
                    {/* WhatsApp Header */}
                    <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-green-100/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">WA</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Business Account
                          </div>
                          <div className="text-sm text-gray-600">
                            Verified • Business
                          </div>
                        </div>
                      </div>

                      {values?.category && (
                        <div className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200">
                          <span className="text-xs font-medium text-gray-700">
                            {values.category === "marketing"
                              ? "MARKETING"
                              : values.category === "utility"
                                ? "UTILITY"
                                : values.category === "authentication"
                                  ? "AUTHENTICATION"
                                  : "TEMPLATE"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preview Container */}
                    <div className="space-y-4">
                      {/* Header Preview */}
                      {values?.isHeader && (
                        <div className="relative">
                          {values?.headerType === "text" &&
                            values?.headerText && (
                              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
                                <div className="font-medium text-sm">
                                  {values.headerText}
                                </div>
                              </div>
                            )}

                          {headerFile && values?.headerType !== "text" && (
                            <div className="relative rounded-t-lg overflow-hidden bg-gray-100">
                              {headerFile.type.startsWith("image/") ? (
                                <img
                                  src={URL.createObjectURL(headerFile)}
                                  alt="Template header"
                                  className="w-full h-48 object-cover"
                                />
                              ) : headerFile.type.startsWith("video/") ? (
                                <div className="relative h-48 bg-black">
                                  <video className="w-full h-full object-cover">
                                    <source
                                      src={URL.createObjectURL(headerFile)}
                                      type={headerFile.type}
                                    />
                                  </video>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-6 h-6 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-48 flex flex-col items-center justify-center p-6 bg-gray-50">
                                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-900">
                                      {headerFile.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {(headerFile.size / 1024 / 1024).toFixed(
                                        2,
                                      )}{" "}
                                      MB
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Body */}
                      {(content || values?.isHeader) && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-4">
                            {/* Variable Placeholders */}
                            {variables?.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-500 mb-2">
                                  Variables will appear as:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {variables.map(
                                    (variable: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                                      >
                                        {variable}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Content */}
                            {content ? (
                              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {content.split("{{").map((part, index) => {
                                  if (part.includes("}}")) {
                                    const [variable, ...rest] =
                                      part.split("}}");
                                    return (
                                      <span key={index}>
                                        <span className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                          {variable}
                                        </span>
                                        {rest.join("")}
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic">
                                Your message will appear here...
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          {values?.isFooter && values?.footer && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50">
                              <div className="text-sm text-gray-600">
                                {values.footer}
                              </div>
                            </div>
                          )}

                          {/* Buttons Preview */}
                          {values?.isButton && templateButtons.length > 0 && (
                            <div className="border-t border-gray-100">
                              {templateButtons
                                .slice(0, 2)
                                .map((button, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center gap-3 px-4 py-3 ${
                                      index > 0
                                        ? "border-t border-gray-100"
                                        : ""
                                    } hover:bg-gray-50 transition-colors`}
                                  >
                                    {button?.type === "QUICK_REPLY" && (
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-green-600"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                                        </svg>
                                      </div>
                                    )}
                                    {button?.type === "URL" && (
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-blue-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                    {button?.type === "PHONE_NUMBER" && (
                                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-purple-600"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {button?.text}
                                      </div>
                                      {button?.type === "URL" && (
                                        <div className="text-xs text-gray-500">
                                          Tap to open link
                                        </div>
                                      )}
                                      {button?.type === "PHONE_NUMBER" && (
                                        <div className="text-xs text-gray-500">
                                          Call phone number
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}

                              {templateButtons.length >= 3 && (
                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                  <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 6h16M4 12h16M4 18h16"
                                        />
                                      </svg>
                                    </div>
                                    <div className="text-sm font-medium">
                                      +{templateButtons.length - 2} more options
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty State */}
                      {!content && !values?.isHeader && !headerFile && (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              No content yet
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Start typing to see a live preview
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">
                            Template Name
                          </div>
                          <div className="font-medium text-gray-900">
                            {values?.name || "Untitled"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {isCreateMode ? "Draft" : "Editing"}
                          </div>
                        </div>
                        {values?.language && (
                          <div>
                            <div className="text-xs text-gray-500">
                              Language
                            </div>
                            <div className="font-medium text-gray-900">
                              {values.language === "en_US"
                                ? "English"
                                : values.language}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Preview */}
                {values?.templateType === "sms" && (
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            S
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            SMS Sender
                          </div>
                          <div className="text-sm text-gray-600">
                            +1 (555) 123-4567
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        {content ? (
                          <div className="text-gray-800 whitespace-pre-wrap">
                            {content}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">
                            SMS message will appear here...
                          </div>
                        )}

                        {headerFile && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm text-gray-600">
                              📎 Attachment included
                            </div>
                          </div>
                        )}

                        <div className="mt-3 text-right">
                          <div className="text-xs text-gray-500">
                            {content?.length || 0}/160 characters
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Preview */}
                {values?.templateType === "email" && (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Email Header */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            New Message
                          </div>
                          <div className="text-xs text-gray-500">Now</div>
                        </div>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">From:</span>
                            <span className="ml-2 text-gray-900">
                              yourbusiness@company.com
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Subject:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {values?.subject || "No subject"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Email Body */}
                      <div className="p-6">
                        {content ? (
                          <div className="prose prose-sm max-w-none">
                            <div
                              dangerouslySetInnerHTML={{ __html: content }}
                            />
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-center py-8">
                            Email content will appear here...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout configuration
TemplateCreateAndEditPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Wrap page with auth HOC
const ProtectedTemplateCreateAndEditPage = withClinicAuth(
  TemplateCreateAndEditPage,
) as NextPageWithLayout;

// Re-attach layout
ProtectedTemplateCreateAndEditPage.getLayout =
  TemplateCreateAndEditPage.getLayout;

export default ProtectedTemplateCreateAndEditPage;
