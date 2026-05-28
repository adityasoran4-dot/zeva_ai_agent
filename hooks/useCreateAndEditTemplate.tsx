import {
  EditorType,
  Template,
  TemplateButtonType,
  TemplateType,
} from "@/types/templates";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useProvider from "./useProvider";
import { getTokenByPath, handleError, handleUpload } from "@/lib/helper";

export type TemplateHeaderType = "text" | "image" | "video" | "document" | "";

export interface TemValue {
  templateType: TemplateType;
  emailTemplateType: "sales" | "marketing";
  provider: string;
  name: string;
  subject: string;
  preheader?: string;
  uniqueName: string;
  language: string;
  category: string;
  isHeader: boolean;
  headerType: TemplateHeaderType;
  headerText: string;
  headerFileURL?: string;
  isFooter: boolean;
  footer: string;
  isButton: boolean;
}

export const templateTypeOptions = [
  {
    label: "SMS",
    value: "sms",
  },
  {
    label: "WhatsApp",
    value: "whatsapp",
  },
  {
    label: "Email",
    value: "email",
  },
];

export const emailTemplateTypeOptions = [
  {
    label: "Sales",
    value: "sales",
  },
  {
    label: "Marketing",
    value: "marketing",
  },
];

export const categoryOptions = [
  {
    label: "Marketing",
    value: "marketing",
  },
  {
    label: "Utility",
    value: "utility",
  },
  {
    label: "Authentication",
    value: "authentication",
  },
];

export const templateHeaderOptions = [
  {
    label: "Text",
    value: "text",
  },
  {
    label: "Image",
    value: "image",
  },
  {
    label: "Video",
    value: "video",
  },
  {
    label: "Document",
    value: "document",
  },
];

export const templateButtonOptions = [
  {
    type: "QUICK_REPLY",
    label: "Quick reply buttons",
    options: [
      {
        label: "Custom",
        type: "QUICK_REPLY",
        value: "Quick Reply",
        headerText: "",
      },
    ],
  },
  {
    type: "CALL_TO_ACTION",
    label: "Call to action buttons",
    options: [
      {
        label: "Visit Website",
        type: "URL",
        value: "Visit website",
        headerText: "2 buttons maximum",
      },
      {
        label: "Call phone number",
        type: "PHONE_NUMBER",
        value: "Call phone number",
        headerText: "1 button maximum",
      },
    ],
  },
];

export interface TemplateButton {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phone_number?: string;
}

const useCreateAndEditTemplate = () => {
  const router = useRouter();
  const { id: templateId } = router.query;
  const { whatsappProviders, smsProviders, emailProviders } = useProvider();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [content, setContent] = useState<string>("");
  const [values, setValues] = useState<TemValue>({
    templateType: "sms",
    emailTemplateType: "sales",
    provider: "",
    name: "",
    subject: "",
    preheader: "",
    uniqueName: "",
    language: "en_US",
    category: "marketing",
    isHeader: false,
    headerType: "text",
    headerText: "",
    headerFileURL: "",
    isFooter: false,
    footer: "",
    isButton: false,
  });
  const [editorType, setEditorType] = useState<EditorType>("rich-text-editor");
  const [variables, setVariables] = useState<string[]>([]);
  const [headerVariables, setHeaderVariables] = useState<string[]>([]);
  const [variableSampleValues, setVariableSampleValues] = useState<string[]>(
    [],
  );
  const [headerVariableSampleValues, setHeaderVariableSampleValues] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  const [templateButtons, setTemplateButtons] = useState<TemplateButton[]>([]);
  const [isAddBtnOpen, setIsAddBtnOpen] = useState<boolean>(false);

  const token = getTokenByPath();

  useEffect(() => {
    if (!templateId || templateId === "new") return;
    fetchTemplate(templateId as string);
  }, [templateId]);

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/all-templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success) {
        const templateData: Template = data.template;
        setTemplate(templateData);
        setValues({
          templateType: templateData.templateType,
          emailTemplateType: templateData.emailTemplateType,
          provider: templateData.provider,
          name: templateData.name,
          subject: templateData.subject,
          preheader: templateData.preheader,
          uniqueName: templateData.uniqueName,
          category: templateData.category,
          language: templateData.language,
          isHeader: templateData.isHeader,
          headerType: templateData.headerType,
          headerText: templateData.headerText,
          headerFileURL: templateData.headerFileUrl,
          isFooter: templateData.isFooter,
          footer: templateData.footer,
          isButton: templateData.isButton,
        });
        setContent(templateData.content);
        setVariables(templateData.variables || []);
        setHeaderVariables(templateData.headerVariables || []);
        setTemplateButtons(templateData.templateButtons || []);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new button based on type
  const handleAddButton = (option: any) => {
    const type = option.type;
    // Max number of buttons allowed
    if (type === "QUICK_REPLY") {
      setTemplateButtons([
        ...templateButtons,
        {
          type: "QUICK_REPLY",
          text: "Quick Reply",
        },
      ]);
    } else if (type === "URL") {
      setTemplateButtons([
        ...templateButtons,
        {
          type: "URL",
          text: "Visit website",
          url: "",
        },
      ]);
    } else if (type === "PHONE_NUMBER") {
      setTemplateButtons([
        ...templateButtons,
        {
          type: "PHONE_NUMBER",
          text: "Call phone number",
          phone_number: "",
        },
      ]);
    }
    //    else if (type === "voice_call") {
    //     setTemplateButtons([
    //       ...templateButtons,
    //       {
    //         type: "voice_call",
    //         text: "Call on WhatsApp",
    //       },
    //     ]);
    //   }
  };
  const handleUpdateButton = (type: TemplateButtonType, index: number) => {
    const updatedButtons = [...templateButtons];

    updatedButtons[index] = {
      type,
      text:
        type === "QUICK_REPLY"
          ? "Quick Reply"
          : type === "URL"
            ? "Visit website"
            : "Call phone number",
      ...(type === "URL"
        ? { url: "" }
        : type === "PHONE_NUMBER"
          ? { phone_number: "" }
          : {}),
    };

    setTemplateButtons(updatedButtons);
  };

  const handleRemoveButton = (index: number) => {
    setTemplateButtons((prevButtons) =>
      prevButtons.filter((_, i) => i !== index),
    );
  };

  // Update the button fields in the state
  const handleButtonInputChange = (
    index: number,
    field: keyof TemplateButton,
    value: string,
  ) => {
    const updatedButtons = [...templateButtons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setTemplateButtons(updatedButtons);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      const fileSize = selectedFile.size; // Size in bytes

      // Define max size limits
      const maxSize = fileType.startsWith("image/")
        ? 5 * 1024 * 1024 // 5MB for images
        : fileType.startsWith("video/")
          ? 16 * 1024 * 1024 // 16MB for videos
          : 100 * 1024 * 1024; // 100MB for documents

      // Validate file size
      if (fileSize > maxSize) {
        toast.error(
          `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`,
        );
        e.target.value = ""; // Reset file input
        return;
      }

      setHeaderFile(selectedFile); // Capture the first selected file

      if (values.templateType === "sms") {
        // Determine the file type based on MIME type
        const type = selectedFile.type;
        if (type.startsWith("image/")) {
          setValues({ ...values, headerType: "image", isHeader: true });
        } else if (type.startsWith("video/")) {
          setValues({ ...values, headerType: "video", isHeader: true });
        } else if (type === "application/pdf") {
          setValues({ ...values, headerType: "document", isHeader: true });
        }
      }
    }
  };

  const handleFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddVariable = () => {
    if (textAreaRef.current) {
      const variableIndex = content.match(/{{\d+}}/g)?.length || 0;
      const variable = `{{${variableIndex + 1}}}`;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;

      // Insert the variable at the cursor position
      const newContent =
        content.slice(0, start) + variable + content.slice(end);

      setContent(newContent);

      // Move the cursor to the end of the inserted variable
      setTimeout(() => {
        textAreaRef.current?.setSelectionRange(
          start + variable.length,
          start + variable.length,
        );
      }, 0);
    }
  };

  //   TODO: Update template function
  const handleUpdateTemplate = async (
    templateId: string,
    redirectPath: string,
  ) => {
    console.log("Update template:", { templateId, redirectPath });
    setLoading(true);

    if (!values.name) {
      toast.error("Template name is required");
      setLoading(false);
      return;
    }
    if (!values.provider) {
      toast.error("Provider is required");
      setLoading(false);
      return;
    }
    if (!content && values?.templateType !== "email") {
      toast.error("Template body is required");
      setLoading(false);
      return;
    }

    if (
      headerVariableSampleValues?.length > 0 &&
      values.templateType === "whatsapp"
    ) {
      for (let i = 0; i < headerVariableSampleValues.length; i++) {
        if (!headerVariableSampleValues[i]) {
          toast.error(`Enter ${headerVariables[i]} sample value for header`);
          setLoading(false); // Ensure loading state resets
          return;
        }
      }
    }
    if (
      variableSampleValues?.length > 0 &&
      values.templateType === "whatsapp"
    ) {
      for (let i = 0; i < variableSampleValues.length; i++) {
        if (!variableSampleValues[i]) {
          toast.error(`Enter ${variables[i]} sample value`);
          setLoading(false); // Ensure loading state resets
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("templateType", values.templateType);
    formData.append("emailTemplateType", values.emailTemplateType);
    formData.append("name", values.name);
    formData.append("provider", values.provider);
    formData.append("uniqueName", values.uniqueName || "");
    formData.append("language", values.language);
    formData.append("category", values.category);
    formData.append("isHeader", String(values.isHeader));
    formData.append("headerType", values.headerType);
    formData.append("headerText", values.headerText || "");
    formData.append("isFooter", String(values.isFooter));
    formData.append("isButton", String(values.isButton));
    formData.append("footer", values.footer || "");
    formData.append("content", content);
    formData.append("editorType", editorType);

    // Append variables array as JSON
    formData.append("variables", JSON.stringify(variables || []));
    formData.append(
      "bodyVariableSampleValues",
      JSON.stringify(variableSampleValues),
    );
    formData.append("headerVariables", JSON.stringify(headerVariables || []));
    formData.append(
      "headerVariableSampleValues",
      JSON.stringify(headerVariableSampleValues),
    );
    if (templateButtons.length > 0) {
      formData.append("templateButtons", JSON.stringify(templateButtons));
    }

    // Handle file upload if headerFile exists
    if (headerFile) {
      formData.append("file", headerFile);
      const resData = await handleUpload(headerFile);
      if (resData && resData.success) {
        formData.append("headerFileUrl", resData.url);
      }
    }

    try {
      const { data } = await axios.put(
        `/api/all-templates/edit-template/${templateId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data && data.success) {
        toast.success(data.message);
        const updatedTemplateId = data?.data?._id || templateId;
        setValues({
          templateType: "sms",
          emailTemplateType: "sales",
          name: "",
          subject: "",
          preheader: "",
          provider: "",
          uniqueName: "",
          language: "en_US",
          category: "marketing",
          isHeader: false,
          headerType: "text",
          headerText: "",
          isFooter: false,
          footer: "",
          isButton: false,
        });
        setContent("");
        setHeaderFile(null);
        setVariables([]);
        setVariableSampleValues([]);
        setHeaderVariables([]);
        setHeaderVariableSampleValues([]);

        if (redirectPath === "none") {
          return updatedTemplateId;
        }
        router.back();
        return updatedTemplateId;
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  //   TODO: Create template function
  const handleCreateTemplate = async (redirectPath: string) => {
    console.log("Create template:", { redirectPath });

    if (!values.name) {
      toast.error("Template name is required");
      setLoading(false);
      return;
    }
    if (!values.provider) {
      toast.error("Provider is required");
      setLoading(false);
      return;
    }
    if (!content && values?.templateType !== "email") {
      toast.error("Template body is required");
      setLoading(false);
      return;
    }

    if (
      headerVariableSampleValues?.length > 0 &&
      values.templateType === "whatsapp"
    ) {
      for (let i = 0; i < headerVariableSampleValues.length; i++) {
        if (!headerVariableSampleValues[i]) {
          toast.error(`Enter ${headerVariables[i]} sample value for header`);
          setLoading(false); // Ensure loading state resets
          return;
        }
      }
    }
    if (
      variableSampleValues?.length > 0 &&
      values.templateType === "whatsapp"
    ) {
      for (let i = 0; i < variableSampleValues.length; i++) {
        if (!variableSampleValues[i]) {
          toast.error(`Enter ${variables[i]} sample value`);
          setLoading(false); // Ensure loading state resets
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("templateType", values.templateType);
    formData.append("emailTemplateType", values.emailTemplateType);
    formData.append("name", values.name);
    formData.append("provider", values.provider);
    formData.append("uniqueName", values.uniqueName || "");
    formData.append("language", values.language);
    formData.append("category", values.category);
    formData.append("isHeader", String(values.isHeader));
    formData.append("headerType", values.headerType);
    formData.append("headerText", values.headerText || "");
    formData.append("isFooter", String(values.isFooter));
    formData.append("isButton", String(values.isButton));
    formData.append("footer", values.footer || "");
    formData.append("subject", values.subject || "");
    if (values?.templateType === "email") {
      let updatedContent = content
        ?.replace(/<p><br><\/p>/g, "<br>")
        .replace(/<p>/g, "")
        .replace(/<\/p>/g, "<br>");

      formData.append("content", updatedContent);
    } else {
      formData.append("content", content);
    }
    formData.append("editorType", editorType);

    // Append variables array as JSON
    formData.append("variables", JSON.stringify(variables || []));
    formData.append(
      "bodyVariableSampleValues",
      JSON.stringify(variableSampleValues),
    );
    formData.append("headerVariables", JSON.stringify(headerVariables || []));
    formData.append(
      "headerVariableSampleValues",
      JSON.stringify(headerVariableSampleValues),
    );
    if (templateButtons.length > 0) {
      formData.append("templateButtons", JSON.stringify(templateButtons));
    }

    // Handle file upload if headerFile exists
    if (headerFile) {
      formData.append("file", headerFile);
      const resData = await handleUpload(headerFile);
      if (resData && resData.success) {
        formData.append("headerFileUrl", resData.url);
      }
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        "/api/all-templates/create-template",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(data.message);
      const createdTemplateId = data?.data?._id;
      setValues({
        templateType: "sms",
        emailTemplateType: "sales",
        name: "",
        subject: "",
        preheader: "",
        provider: "",
        uniqueName: "",
        language: "en_US",
        category: "marketing",
        isHeader: false,
        headerType: "text",
        headerText: "",
        isFooter: false,
        footer: "",
        isButton: false,
      });
      setContent("");
      setHeaderFile(null);
      setVariables([]);
      setVariableSampleValues([]);
      setHeaderVariables([]);
      setHeaderVariableSampleValues([]);

      if (redirectPath === "none") {
        return createdTemplateId;
      }

      if (values.templateType !== "email") {
        router.back();
      }
      return createdTemplateId;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error creating template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const matchedVariables = Array.from(
      new Set(content.match(/{{\d+}}/g) || []), // Safely return empty array if match is null
    ).sort((a, b) => {
      const numA = a.match(/\d+/)?.[0];
      const numB = b.match(/\d+/)?.[0];

      if (numA && numB) {
        return Number(numA) - Number(numB); // Only sort if both numbers are found
      }
      return 0; // If either numA or numB is undefined, don't change their order
    });

    let varValues = [];
    for (let i = 0; i < matchedVariables?.length; i++) {
      varValues.push("");
    }

    setVariables(matchedVariables);
    setVariableSampleValues(varValues);
  }, [content]);

  useEffect(() => {
    if (values.headerText) {
      const regex = /\{\{\d+\}\}/;
      if (regex.test(values.headerText)) {
        setHeaderVariables(["{{1}}"]);
        setHeaderVariableSampleValues([""]);
      } else {
        setHeaderVariables([]);
        setHeaderVariableSampleValues([]);
      }
    }
  }, [values.headerText]);

  const state = {
    textAreaRef,
    fileInputRef,
    // providers,
    whatsappProviders,
    smsProviders,
    emailProviders,
    loading,
    content,
    values,
    variables,
    headerFile,
    variableSampleValues,
    templateButtons,
    headerVariables,
    headerVariableSampleValues,
    template,
    // emailProviders,
    editorType,
    isAddBtnOpen,
  };
  return {
    state,
    setContent,
    setValues,
    setVariableSampleValues,
    setHeaderVariableSampleValues,
    setTemplateButtons,
    setEditorType,
    setIsAddBtnOpen,
    setTemplate,
    handleAddVariable,
    handleCreateTemplate,
    handleFileChange,
    handleFileInput,
    handleAddButton,
    handleButtonInputChange,
    handleUpdateButton,
    handleRemoveButton,
    handleUpdateTemplate,
  };
};

export default useCreateAndEditTemplate;
