import React, {
  useState,
  useEffect,
  useMemo,
} from "react";
// import dynamic from "next/dynamic";
import axios from "axios";
import { useRouter } from "next/router";
import {
  FileText,
  Video,
  Save,
  Send,
  Trash2,
  X,
  Link,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
} from "lucide-react";
// Minimal local types to avoid importing quill types
type QuillRange = { index: number; length: number } | null;
type StringMap = Record<string, unknown>;
interface MinimalQuillEditor {
  getSelection: (focus?: boolean) => QuillRange;
  focus: () => void;
  setSelection: (index: number, length: number, source?: string) => void;
  getFormat: (index?: number, length?: number) => StringMap;
  on: (event: string, handler: (range: QuillRange) => void) => void;
  off: (event: string, handler: (range: QuillRange) => void) => void;
  history: { undo: () => void; redo: () => void };
  insertEmbed: (index: number, type: string, value: unknown) => void;
  insertText: (index: number, text: string) => void;
  blur: () => void;
  getBounds: (index: number, length?: number) => { top: number; left: number };
  formatText: (
    index: number,
    length: number,
    formats: Record<string, unknown>
  ) => void;
  format: (name: string, value: unknown) => void;
  removeFormat: (index: number, length: number, source?: string) => void;
}
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import type { ComponentType } from "react";
type InlineFormat = "bold" | "italic" | "underline" | "link" | "align" | "list" | "blockquote" | "code-block" | "indent" | "outdent" | "header" | "color" | "background" | "image" | "video" | "undo" | "redo" | "clean";
type DesiredValue = boolean | string | undefined;

// Domain types for API responses
interface Draft {
  _id?: string;
  title?: string;
  content?: string;
  paramlink?: string;
}
type DraftResponse = { draft?: Draft } | Draft;

interface BlogDoc {
  _id?: string;
  title?: string;
  content?: string;
  paramlink?: string;
}
type BlogResponse = { blog?: BlogDoc } | BlogDoc;

// Dynamic import for ReactQuill
const ReactQuill = dynamic<ComponentType<unknown>>(
  () =>
    import("react-quill").then((mod) => {
      // Tell TypeScript this is a React component
      return mod.default as ComponentType<unknown>;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-gray-100 animate-pulse rounded flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
  }
);

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

interface ConfirmAction {
  type: string;
  id: string;
  title: string;
}

interface BlogEditorProps {
  tokenKey: "clinicToken" | "doctorToken" | "agentToken";
  skipLandingPage?: boolean;
  onClose?: () => void;
  editBlogId?: string;
  editDraftId?: string;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ tokenKey, skipLandingPage = false, onClose, editBlogId, editDraftId }) => {
  const [title, setTitle] = useState<string>("");
  const [isParamlinkEditable, setIsParamlinkEditable] = useState(false);
  const [content, setContent] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [selectedPublished, setSelectedPublished] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [linkUrl, setLinkUrl] = useState<string>("");
  // Text link modal state
  const [showTextLinkModal, setShowTextLinkModal] = useState<boolean>(false);
  const [textLinkUrl, setTextLinkUrl] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [showImageContextMenu, setShowImageContextMenu] =
    useState<boolean>(false);
  const [contextMenuImage, setContextMenuImage] =
    useState<HTMLImageElement | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // Video context menu state
  const [showVideoContextMenu, setShowVideoContextMenu] =
    useState<boolean>(false);
  const [contextMenuVideo, setContextMenuVideo] = useState<HTMLElement | null>(
    null
  );
  // Sharing moved to reusable component
  const [paramlink, setParamlink] = useState<string>("");
  const [paramlinkError, setParamlinkError] = useState<string>("");

  // New video-related state
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoType, setVideoType] = useState<"youtube" | "drive">("youtube");
  // Open/close main editor modal
  // If edit props are provided, show editor immediately
  const [showEditor, setShowEditor] = useState<boolean>(skipLandingPage || !!editBlogId || !!editDraftId);
  // Close confirmation modal for editor
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  
  // Floating toolbar state - appears when text is selected
  const [showFloatingToolbar, setShowFloatingToolbar] = useState<boolean>(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [currentFormats, setCurrentFormats] = useState<StringMap>({});
  const floatingToolbarRef = React.useRef<HTMLDivElement | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(tokenKey);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Debug effect for context menu
  useEffect(() => {
    console.log("Context menu state changed:", showImageContextMenu);
  }, [showImageContextMenu]);

  // Global click handler to close context menus and floating toolbar
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (showImageContextMenu) {
        setShowImageContextMenu(false);
        setContextMenuImage(null);
      }
      if (showVideoContextMenu) {
        setShowVideoContextMenu(false);
        setContextMenuVideo(null);
      }
      // Hide floating toolbar if clicking outside editor and toolbar
      if (showFloatingToolbar) {
        const target = e.target as HTMLElement;
        const editorElement = document.querySelector('.ql-editor');
        const toolbarElement = floatingToolbarRef.current;
        if (editorElement && !editorElement.contains(target) && toolbarElement && !toolbarElement.contains(target)) {
          setShowFloatingToolbar(false);
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [showImageContextMenu, showVideoContextMenu, showFloatingToolbar]);

  // Reset editor when opened from modal (skipLandingPage = true)
  // This runs on mount and whenever skipLandingPage changes to ensure fresh start
  useEffect(() => {
    if (skipLandingPage) {
      // Clear all editor state when opened from modal to ensure fresh start
      setTitle("");
      setContent("");
      setParamlink("");
      setSelectedDraft(null);
      setSelectedPublished(null);
      setParamlinkError("");
      setLastSaved(null);
      setIsParamlinkEditable(false);
      // Ensure editor is shown
      setShowEditor(true);
    }
  }, [skipLandingPage]);

  // Support loading by query param when navigated from Published Blogs page
  // Skip loading from router.query if skipLandingPage is true (opened from modal)
  const router = useRouter();
  useEffect(() => {
    // If opened from modal with edit props, load the blog/draft
    if (skipLandingPage) {
      if (editDraftId) {
        loadDraft(editDraftId);
        setShowEditor(true);
      } else if (editBlogId) {
        loadPublishedBlog(editBlogId);
        setShowEditor(true);
      }
      return;
    }
    // Otherwise, load from router.query (standalone page mode)
    const { draftId, blogId } = router.query as {
      draftId?: string;
      blogId?: string;
    };
    if (draftId) {
      loadDraft(draftId);
      setShowEditor(true);
    } else if (blogId) {
      loadPublishedBlog(blogId);
      setShowEditor(true);
    }
  }, [router.query, skipLandingPage, editBlogId, editDraftId]);

  // Ask to save as draft when trying to close editor with content
  const requestCloseEditor = () => {
    if (!title && !content) {
      setShowEditor(false);
      return;
    }
    setShowCloseConfirm(true);
  };

  const saveAndCloseEditor = async () => {
    const ok = await saveDraft();
    if (ok) {
      setShowCloseConfirm(false);
      setShowEditor(false);
      if (onClose) {
        onClose();
      }
    }
  };

  const discardAndCloseEditor = () => {
    setShowCloseConfirm(false);
    setShowEditor(false);
    if (onClose) {
      onClose();
    }
  };

  const resetEditorFields = () => {
    setTitle("");
    setContent("");
    setParamlink("");
    setSelectedDraft(null);
    setSelectedPublished(null);
    setParamlinkError("");
    setLastSaved(null);
    showToast("Editor has been reset", "success");
  };

  // Load ReactQuill CSS after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
      document.head.appendChild(link);
    }
  }, []);

  // Improve Quill toolbar accessibility with titles
  useEffect(() => {
    try {
      const toolbar = document.querySelector(
        ".quill-container .ql-toolbar"
      ) as HTMLElement | null;
      if (!toolbar) return;
      const setTitle = (selector: string, title: string) => {
        const el = toolbar.querySelector(selector) as HTMLElement | null;
        if (el && !el.getAttribute("title")) el.setAttribute("title", title);
      };
      setTitle("button.ql-bold", "Bold (Ctrl+B)");
      setTitle("button.ql-italic", "Italic (Ctrl+I)");
      setTitle("button.ql-underline", "Underline (Ctrl+U)");
      setTitle(".ql-color .ql-picker-label", "Text color");
      setTitle(".ql-background .ql-picker-label", "Highlight color");
      setTitle(".ql-align .ql-picker-label", "Text alignment");
      setTitle("button.ql-indent[value='-1']", "Decrease indent");
      setTitle("button.ql-indent[value='+1']", "Increase indent");
      setTitle("button.ql-list[value='ordered']", "Numbered list");
      setTitle("button.ql-list[value='bullet']", "Bulleted list");
      setTitle("button.ql-list[value='check']", "Task list");
      setTitle("button.ql-blockquote", "Block quote");
      setTitle("button.ql-code-block", "Code block");
      setTitle("button.ql-link", "Insert link");
      setTitle("button.ql-image", "Insert image");
      setTitle("button.ql-video", "Insert video");
      setTitle("button.ql-undo", "Undo");
      setTitle("button.ql-redo", "Redo");
      setTitle("button.ql-clean", "Clear formatting");
    } catch { }
  }, [showEditor, content]);

  // Auto-save draft every 30 seconds if there's content and not editing published blog
  useEffect(() => {
    if (!title && !content) return;
    if (selectedPublished) return;

    const autoSaveTimer = setTimeout(() => {
      if (title || content) {
        saveDraft();
      }
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedPublished]);

  // Add image and video click handlers after content changes
  useEffect(() => {
    const normalizeImages = () => {
      const editorContainer = document.querySelector(".ql-editor");
      if (!editorContainer) return;
      const images = editorContainer.querySelectorAll("img");
      images.forEach((img) => {
        const image = img as HTMLImageElement;
        image.style.width = "100%";
        image.style.height = "var(--ql-image-height, 300px)";
        image.style.objectFit = "contain";
        image.removeAttribute("width");
        image.removeAttribute("height");
      });
    };

    const attachMediaListeners = () => {
      const editorContainer = document.querySelector(".ql-editor");
      if (editorContainer) {
        // Handle images
        const images = editorContainer.querySelectorAll("img");
        console.log("Found images:", images.length);

        images.forEach((img) => {
          img.removeEventListener(
            "dblclick",
            handleImageDoubleClick as EventListener
          );
          img.removeEventListener(
            "contextmenu",
            handleImageRightClick as EventListener
          );

          img.addEventListener(
            "dblclick",
            handleImageDoubleClick as EventListener
          );
          img.addEventListener(
            "contextmenu",
            handleImageRightClick as EventListener
          );

          (img as HTMLImageElement).style.cursor = "pointer";
          (img as HTMLImageElement).title =
            "Double-click to add/edit link, Right-click for more options";
        });

        // Handle videos
        const videoContainers =
          editorContainer.querySelectorAll(".video-container");
        console.log("Found videos:", videoContainers.length);

        videoContainers.forEach((container) => {
          container.removeEventListener(
            "contextmenu",
            handleVideoRightClick as EventListener
          );

          container.addEventListener(
            "contextmenu",
            handleVideoRightClick as EventListener
          );

          (container as HTMLElement).style.cursor = "pointer";
          (container as HTMLElement).title = "Right-click to remove video";
        });

        // Normalize images every time we attach listeners
        normalizeImages();
      }
    };

    const timer = setTimeout(attachMediaListeners, 1000);

    const editorContainer = document.querySelector(".ql-editor");
    if (editorContainer) {
      editorContainer.addEventListener("focus", attachMediaListeners);
      editorContainer.addEventListener("input", attachMediaListeners);
    }

    return () => {
      clearTimeout(timer);
      if (editorContainer) {
        editorContainer.removeEventListener("focus", attachMediaListeners);
        editorContainer.removeEventListener("input", attachMediaListeners);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Slugify function
  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  // Auto-generate paramlink from title if not manually edited
  useEffect(() => {
    if (!selectedDraft && !selectedPublished) {
      setParamlink(slugify(title));
    }
  }, [title, selectedDraft, selectedPublished]);

  // New video utility functions
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /drive\.google\.com.*\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const createVideoEmbed = (url: string, type: "youtube" | "drive"): string => {
    if (type === "youtube") {
      const videoId = extractYouTubeId(url);
      if (!videoId) return "";

      return `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;">
        <iframe 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
          src="https://www.youtube.com/embed/${videoId}" 
          frameborder="0" 
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
        </iframe>
      </div>`;
    } else {
      const fileId = extractGoogleDriveId(url);
      if (!fileId) return "";

      return `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;">
        <iframe 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
          src="https://drive.google.com/file/d/${fileId}/preview" 
          frameborder="0" 
          allowfullscreen>
        </iframe>
      </div>`;
    }
  };

  const validateVideoUrl = (
    url: string,
    type: "youtube" | "drive"
  ): boolean => {
    if (type === "youtube") {
      return extractYouTubeId(url) !== null;
    } else {
      return extractGoogleDriveId(url) !== null;
    }
  };

  const handleVideoInsert = () => {
    const trimmedUrl = videoUrl.trim();

    if (!trimmedUrl) {
      showToast("Please enter a video URL", "warning");
      return;
    }

    if (!validateVideoUrl(trimmedUrl, videoType)) {
      const message =
        videoType === "youtube"
          ? "Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)"
          : "Please enter a valid Google Drive video URL (e.g., https://drive.google.com/file/d/.../view)";
      showToast(message, "error");
      return;
    }

    const videoEmbed = createVideoEmbed(trimmedUrl, videoType);
    if (!videoEmbed) {
      showToast("Failed to create video embed", "error");
      return;
    }

    // Insert the video embed into the content with automatic line break
    const newContent = content + videoEmbed + "\n";
    setContent(newContent);

    // Close modal and reset
    setShowVideoModal(false);
    setVideoUrl("");
    setVideoType("youtube");

    showToast(
      `${videoType === "youtube" ? "YouTube" : "Google Drive"
      } video added successfully!`,
      "success"
    );
  };

  const ensureLinksUnderlined = (htmlContent: string) => {
    if (typeof window === "undefined") return htmlContent;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const links = tempDiv.querySelectorAll("a");
    links.forEach((link) => {
      if (!link.style.textDecoration || link.style.textDecoration === "none") {
        link.style.textDecoration = "underline";
        link.style.textDecorationColor = "#2563eb";
        link.style.textDecorationThickness = "2px";
      }
    });

    return tempDiv.innerHTML;
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // const openConfirmModal = (type: string, id: string, title: string) => {
  //   setConfirmAction({ type, id, title });
  //   setShowConfirmModal(true);
  // };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "deleteDraft") {
      deleteDraft(confirmAction.id);
    } else if (confirmAction.type === "deletePublished") {
      deletePublishedBlog(confirmAction.id);
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleImageDoubleClick = (e: Event) => {
    e.preventDefault();
    const img = e.target as HTMLImageElement;
    openImageLinkEditor(img);
  };

  const openImageLinkEditor = (imageEl: HTMLImageElement) => {
    const currentLink =
      imageEl.parentElement?.tagName === "A"
        ? (imageEl.parentElement as HTMLAnchorElement).href
        : "";
    setSelectedImage(imageEl);
    setLinkUrl(currentLink);
    setShowLinkModal(true);
  };

  const handleImageRightClick = (e: Event) => {
    e.preventDefault();
    console.log("Right-click detected on image");
    const img = e.target as HTMLImageElement;
    const rect = img.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 80;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = rect.left;
    let y = rect.bottom + window.scrollY;

    if (x + menuWidth > windowWidth) {
      x = rect.right - menuWidth;
    }

    if (y + menuHeight > windowHeight + window.scrollY) {
      y = rect.top + window.scrollY - menuHeight;
    }

    console.log("Image rect:", rect);
    console.log("Context menu position:", { x, y });

    setContextMenuImage(img);
    setContextMenuPosition({ x, y });
    setShowImageContextMenu(true);
  };

  const handleVideoRightClick = (e: Event) => {
    e.preventDefault();
    console.log("Right-click detected on video");
    const videoContainer = e.currentTarget as HTMLElement;
    const rect = videoContainer.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 50;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = rect.left;
    let y = rect.bottom + window.scrollY;

    if (x + menuWidth > windowWidth) {
      x = rect.right - menuWidth;
    }

    if (y + menuHeight > windowHeight + window.scrollY) {
      y = rect.top + window.scrollY - menuHeight;
    }

    console.log("Video rect:", rect);
    console.log("Video context menu position:", { x, y });

    setContextMenuVideo(videoContainer);
    setContextMenuPosition({ x, y });
    setShowVideoContextMenu(true);
  };

  const removeVideo = () => {
    console.log("removeVideo called");
    if (contextMenuVideo) {
      console.log("Removing video:", contextMenuVideo);

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const videoContainers = tempDiv.querySelectorAll(".video-container");
        let videoRemoved = false;

        videoContainers.forEach((container) => {
          const iframe = container.querySelector("iframe");
          const contextIframe = contextMenuVideo.querySelector("iframe");

          if (
            iframe &&
            contextIframe &&
            iframe.src === contextIframe.src &&
            !videoRemoved
          ) {
            container.remove();
            videoRemoved = true;
          }
        });

        if (videoRemoved) {
          setContent(tempDiv.innerHTML);
          showToast("Video removed successfully!", "success");
        } else {
          showToast("Video not found in content", "error");
        }
      } catch (error) {
        console.error("Error removing video:", error);
        showToast("Failed to remove video", "error");
      }
    } else {
      console.log("No contextMenuVideo found");
      showToast("No video selected for removal", "error");
    }

    setShowVideoContextMenu(false);
    setContextMenuVideo(null);
  };
  const removeImage = () => {
    console.log("removeImage called");
    if (contextMenuImage) {
      console.log("Removing image:", contextMenuImage);

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const images = tempDiv.querySelectorAll("img");
        let imageRemoved = false;

        images.forEach((img) => {
          if (img.src === contextMenuImage.src && !imageRemoved) {
            img.remove();
            imageRemoved = true;
          }
        });

        if (imageRemoved) {
          setContent(tempDiv.innerHTML);
          showToast("Image removed successfully!", "success");
        } else {
          showToast("Image not found in content", "error");
        }
      } catch (error) {
        console.error("Error removing image:", error);
        showToast("Failed to remove image", "error");
      }
    } else {
      console.log("No contextMenuImage found");
      showToast("No image selected for removal", "error");
    }

    setShowImageContextMenu(false);
    setContextMenuImage(null);
  };

  const checkImageSizes = (htmlContent: string): boolean => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const images = tempDiv.querySelectorAll("img");
    let hasLargeImage = false;

    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("data:image")) {
        const base64Data = src.split(",")[1];
        if (base64Data) {
          const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
          const sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > 1) {
            hasLargeImage = true;
            showToast(
              `Image size (${sizeInMB.toFixed(
                2
              )}MB) exceeds the 1MB limit. Please resize the image before publishing.`,
              "error"
            );
          }
        }
      }
    });

    return hasLargeImage;
  };

  const handleLinkSubmit = () => {
    if (!selectedImage) return;

    const trimmedUrl = linkUrl.trim();

    if (trimmedUrl) {
      if (!trimmedUrl.match(/^https?:\/\//)) {
        showToast(
          "Please enter a valid URL with https:// or http:// protocol",
          "error"
        );
        return;
      }

      try {
        new URL(trimmedUrl);
      } catch {
        showToast(
          "Please enter a valid URL format (e.g., https://example.com)",
          "error"
        );
        return;
      }

      const linkElement = document.createElement("a");
      linkElement.href = trimmedUrl;
      linkElement.target = "_blank";
      linkElement.rel = "noopener noreferrer";

      selectedImage.parentNode?.replaceChild(linkElement, selectedImage);
      linkElement.appendChild(selectedImage);
    } else {
      if (selectedImage.parentElement?.tagName === "A") {
        selectedImage.parentElement.parentNode?.replaceChild(
          selectedImage,
          selectedImage.parentElement
        );
      }
    }

    const editorContainer = document.querySelector(".ql-editor");
    if (editorContainer) {
      setContent(editorContainer.innerHTML);
    }

    setShowLinkModal(false);
    setSelectedImage(null);
    setLinkUrl("");
    showToast("Image link updated successfully!", "success");
  };

  const loadDraft = async (draftId: string) => {
    try {
      const response = await axios.get<DraftResponse>(
        `/api/blog/draft?id=${draftId}`,
        getAuthHeaders()
      );
      const draft = (response.data as DraftResponse as { draft?: Draft }).draft || (response.data as Draft);
      if (!draft) {
        showToast("Draft not found", "error");
        return;
      }
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setParamlink(draft.paramlink || "");
      setSelectedDraft(draftId);
      setSelectedPublished(null);
      showToast("Draft loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to load draft:", err);
      showToast("Failed to load draft", "error");
    }
  };

  const loadPublishedBlog = async (blogId: string) => {
    try {
      const response = await axios.get<BlogResponse>(
        `/api/blog/published?id=${blogId}`,
        getAuthHeaders()
      );
      const blog = (response.data as BlogResponse as { blog?: BlogDoc }).blog || (response.data as BlogDoc);
      if (!blog) {
        showToast("Published blog not found", "error");
        return;
      }
      setTitle(blog.title || "");
      setContent(blog.content || "");
      setParamlink(blog.paramlink || "");
      setSelectedPublished(blogId);
      setSelectedDraft(null);
      showToast("Published blog loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to load published blog:", err);
      showToast("Failed to load published blog", "error");
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    // Require some content to save
    if (!title && !content) {
      showToast("Please enter at least a title or content", "warning");
      return false;
    }

    // Ensure paramlink exists by auto-generating when missing
    let effectiveParamlink = paramlink?.trim();
    if (!effectiveParamlink) {
      const base = (title || "untitled").toString();
      effectiveParamlink = slugify(base).slice(0, 60) || `untitled-${Date.now()}`;
      setParamlink(effectiveParamlink);
    }
    setParamlinkError("");

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast("Authentication required. Please login again.", "error");
      return false;
    }

    setIsLoading(true);
    try {
      if (selectedDraft) {
        await axios.put(
          `/api/blog/draft?id=${selectedDraft}`,
          {
            title: title || "Untitled Draft",
            content: ensureLinksUnderlined(content || ""),
            paramlink: effectiveParamlink,
          },
          getAuthHeaders()
        );
        setLastSaved(new Date());
        showToast("Draft updated successfully!", "success");
      } else {
        const response = await axios.post<DraftResponse>(
          "/api/blog/draft",
          {
            title: title || "Untitled Draft",
            content: ensureLinksUnderlined(content || ""),
            paramlink: effectiveParamlink,
          },
          getAuthHeaders()
        );
        const newDraft = (response.data as DraftResponse as { draft?: Draft }).draft || (response.data as Draft);
        if (newDraft && newDraft._id) {
          setSelectedDraft(newDraft._id);
        }
        setLastSaved(new Date());
        showToast("Draft created successfully!", "success");
      }
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("Paramlink already exists")) {
          setParamlinkError("Paramlink already exists. Please choose another.");
        }
        showToast(err.message, "error");
      } else {
        showToast("Failed to save draft", "error");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const publishBlog = async () => {
    if (!title || !content) {
      showToast("Title and content required", "warning");
      return;
    }
    if (!paramlink) {
      setParamlinkError("Paramlink is required");
      return;
    }
    setParamlinkError("");

    if (checkImageSizes(content)) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        "/api/blog/published",
        {
          title,
          content: ensureLinksUnderlined(content),
          paramlink,
        },
        getAuthHeaders()
      );

      // After publishing, navigate to Published Blogs page to manage/share

      showToast("Blog published successfully!", "success");
      setTitle("");
      setContent("");
      setParamlink("");
      setSelectedDraft(null);
      setSelectedPublished(null);
      // Close editor if in modal mode
      if (skipLandingPage && onClose) {
        onClose();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message?.includes("Paramlink already exists")) {
        setParamlinkError("Paramlink already exists. Please choose another.");
      } else {
        showToast("Failed to publish blog", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePublishedBlog = async () => {
    if (!selectedPublished) {
      showToast("No blog selected for update", "warning");
      return;
    }
    if (!title || !content) {
      showToast("Title and content required", "warning");
      return;
    }
    if (!paramlink) {
      setParamlinkError("Paramlink is required");
      return;
    }
    setParamlinkError("");

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast("Authentication required. Please login again.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(
        `/api/blog/published?id=${selectedPublished}`,
        {
          title,
          content: ensureLinksUnderlined(content),
          paramlink,
        },
        getAuthHeaders()
      );

      if (response.data) {
        showToast("Blog updated successfully!", "success");
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedPublished(null);
      } else {
        showToast("Failed to update blog - no response data", "error");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message?.includes("Paramlink already exists")) {
        setParamlinkError("Paramlink already exists. Please choose another.");
      } 
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await axios.delete(`/api/blog/draft?id=${draftId}`, getAuthHeaders());
      showToast("Draft deleted successfully!", "success");
      if (selectedDraft === draftId) {
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedDraft(null);
      }
    } catch (err: unknown) {
      console.error("Failed to delete draft:", err);
      showToast("Failed to delete draft", "error");
    }
  };

  const deletePublishedBlog = async (blogId: string) => {
    try {
      await axios.delete(`/api/blog/published?id=${blogId}`, getAuthHeaders());
      showToast("Blog deleted successfully!", "success");
      if (selectedPublished === blogId) {
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedPublished(null);
      }
    } catch (err: unknown) {
      console.error("Failed to delete published blog:", err);
      showToast("Failed to delete published blog", "error");
    }
  };
  // const [value, setValue] = useState("");

  const quillRef = React.useRef<{ getEditor: () => MinimalQuillEditor } | null>(null);
  const quillInstanceRef = React.useRef<MinimalQuillEditor | null>(null);
  const lastRangeRef = React.useRef<QuillRange>(null);
  
  // Store Quill instance when ref is set
  const handleQuillRef = (ref: any) => {
    quillRef.current = ref;
    if (ref) {
      try {
        // ReactQuill exposes getEditor method
        if (typeof ref.getEditor === 'function') {
          quillInstanceRef.current = ref.getEditor();
        } else if ((ref as any).editor) {
          // Sometimes the ref might have editor property
          quillInstanceRef.current = (ref as any).editor;
        } else if (ref && typeof (ref as any).getSelection === 'function') {
          // The ref might be the editor itself
          quillInstanceRef.current = ref as any;
        }
      } catch (error) {
        console.warn('Error getting Quill instance from ref:', error);
        // Quill might not be ready yet, will retry later
      }
    } else {
      quillInstanceRef.current = null;
    }
  };

  // Helper function to get Quill instance reliably
  const getQuillInstance = (): MinimalQuillEditor | null => {
    // First try cached instance
    if (quillInstanceRef.current) {
      return quillInstanceRef.current;
    }
    
    // Try to get from ref
    if (quillRef.current) {
      try {
        if (typeof quillRef.current.getEditor === 'function') {
          const instance = quillRef.current.getEditor();
          if (instance) {
            quillInstanceRef.current = instance;
            return instance;
          }
        } else if ((quillRef.current as any).editor) {
          quillInstanceRef.current = (quillRef.current as any).editor;
          return quillInstanceRef.current;
        }
      } catch (error) {
        console.warn('Error getting Quill instance from ref:', error);
      }
    }
    
    // Fallback: Try to get from DOM
    try {
      const editorElement = document.querySelector('.ql-editor');
      if (editorElement) {
        // ReactQuill stores the instance in the editor element's parent
        const quillContainer = editorElement.closest('.quill-container');
        if (quillContainer) {
          // Try to find Quill instance in the DOM
          const reactQuillEl = quillContainer.querySelector('[class*="quill"]');
          if (reactQuillEl && (reactQuillEl as any).__quill) {
            const foundQuill = (reactQuillEl as any).__quill as MinimalQuillEditor;
            if (foundQuill) {
              quillInstanceRef.current = foundQuill;
              return foundQuill;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error getting Quill instance from DOM:', error);
    }
    
    return null;
  };

  // Attach native selection-change to keep latest range from Quill itself and show floating toolbar
  useEffect(() => {
    if (!showEditor) return;
    
    // Try to get Quill instance with retry
    const tryAttachHandler = () => {
      const quill = getQuillInstance();
      if (!quill) {
        // Retry after a short delay if not ready
        setTimeout(tryAttachHandler, 100);
        return;
      }

      const updateFloatingToolbar = (range: QuillRange) => {
        if (!range || range.length === 0) {
          setShowFloatingToolbar(false);
          setCurrentFormats({});
          return;
        }

        try {
          const editorElement = document.querySelector('.ql-editor') as HTMLElement;
          if (!editorElement) {
            return;
          }

          // Get bounds of the selection
          const bounds = quill.getBounds(range.index, range.length);
          if (!bounds) {
            return;
          }

          // Get current formats at selection
          const formats = quill.getFormat(range.index, range.length);
          setCurrentFormats(formats);

          // Calculate position for floating toolbar
          const editorRect = editorElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Position toolbar above selection, centered horizontally
          const top = editorRect.top + bounds.top + scrollTop - 50;
          const left = editorRect.left + bounds.left;
          
          // Ensure toolbar stays within viewport
          const toolbarWidth = 320;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          let finalLeft = left;
          let finalTop = top;
          
          // Adjust horizontal position
          if (left + toolbarWidth / 2 > viewportWidth) {
            finalLeft = viewportWidth - toolbarWidth / 2 - 10;
          } else if (left - toolbarWidth / 2 < 0) {
            finalLeft = toolbarWidth / 2 + 10;
          }
          
          // Adjust vertical position
          if (top < 10) {
            finalTop = editorRect.top + bounds.top + scrollTop + 30; // Show below selection
          } else if (top + 50 > viewportHeight + scrollTop) {
            finalTop = viewportHeight + scrollTop - 60;
          }

          setFloatingToolbarPosition({ top: finalTop, left: finalLeft });
          setShowFloatingToolbar(true);
        } catch (error) {
          console.error('Error updating floating toolbar:', error);
        }
      };

      const handler = (range: QuillRange) => {
        if (range && range.length > 0) {
          lastRangeRef.current = range;
          updateFloatingToolbar(range);
        } else {
          setShowFloatingToolbar(false);
          setCurrentFormats({});
        }
      };

      quill.on("selection-change", handler);

      // Also listen to text selection changes with multiple event types
      const editorElement = document.querySelector('.ql-editor');
      if (editorElement) {
        const handleSelection = () => {
          setTimeout(() => {
            const quill = getQuillInstance();
            if (quill) {
              const range = quill.getSelection(true);
              if (range && range.length > 0) {
                handler(range);
              } else {
                setShowFloatingToolbar(false);
              }
            }
          }, 50);
        };

        // Listen to multiple events to catch all selection changes
        editorElement.addEventListener('mouseup', handleSelection);
        editorElement.addEventListener('keyup', handleSelection);
        editorElement.addEventListener('selectstart', handleSelection);
        
        // Also listen to text-change to update toolbar when typing
        const handleTextChange = () => {
          setTimeout(() => {
            const quill = getQuillInstance();
            if (quill) {
              const range = quill.getSelection(true);
              if (range && range.length > 0) {
                handler(range);
              }
            }
          }, 50);
        };
        
        quill.on("text-change", handleTextChange);

        return () => {
          try {
            quill.off("selection-change", handler);
            quill.off("text-change", handleTextChange);
            editorElement.removeEventListener('mouseup', handleSelection);
            editorElement.removeEventListener('keyup', handleSelection);
            editorElement.removeEventListener('selectstart', handleSelection);
          } catch {
            // ignore
          }
        };
      }

      return () => {
        try {
          quill.off("selection-change", handler);
        } catch {
          // ignore
        }
      };
    };

    const cleanup = tryAttachHandler();
    return cleanup;
  }, [content, showEditor]); // Re-run when content changes or editor opens/closes

  const formatWithQuill = (format: InlineFormat, desiredValue?: DesiredValue) => {
    try {
      const quill = getQuillInstance();
      
      if (!quill) {
        console.warn('Quill instance not found, editor may still be loading');
        return;
      }

      // Ensure we have focus
      quill.focus();
      
      // Get current selection or use last known position
      let currentRange = quill.getSelection(true);
      if (!currentRange) {
        currentRange = lastRangeRef.current;
        if (currentRange) {
          quill.setSelection(currentRange.index, currentRange.length || 0, "user");
        } else {
          // Try to get length from editor content
          const editorElement = document.querySelector('.ql-editor');
          if (editorElement) {
            const textLength = editorElement.textContent?.length || 0;
            const pos = Math.max(0, textLength - 1);
            quill.setSelection(pos, 0, "user");
            currentRange = { index: pos, length: 0 };
          } else {
            quill.setSelection(0, 0, "user");
            currentRange = { index: 0, length: 0 };
          }
        }
      }
      
      // Update last range
      lastRangeRef.current = currentRange;
      const r: QuillRange = currentRange;
      if (!r) {
        console.error('No valid range');
        return;
      }
      
      // Apply formatting based on type
      applyFormatting(quill, format, r, desiredValue);
      
      // Update floating toolbar after formatting
      setTimeout(() => {
        const updatedRange = quill.getSelection(true) || r;
        if (updatedRange && updatedRange.length > 0) {
          const formats = quill.getFormat(updatedRange.index, updatedRange.length);
          setCurrentFormats(formats);
        }
      }, 50);
    } catch (error) {
      console.error('Error in formatWithQuill:', error);
      // Don't show error toast - just log it
    }
  };

  const applyFormatting = (quill: MinimalQuillEditor, format: InlineFormat, r: QuillRange | null, desiredValue?: DesiredValue) => {
    try {
      if (!r) {
        console.error('No valid range for formatting');
        return;
      }

      // Link handling - works with selection or at cursor
      if (format === "link") {
        const r2: QuillRange = quill.getSelection(true) || r;
        if (!r2) return;
        lastRangeRef.current = r2;
        const currentFormats: StringMap = quill.getFormat(r2.index, r2.length || 0);
        setTextLinkUrl((currentFormats?.link as string) || "");
        setShowTextLinkModal(true);
        return;
      }

      // Image handling
      if (format === "image") {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            if (file.size > 998 * 1024) {
              showToast("Please upload an image smaller than 1 MB.", "warning");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const range = lastRangeRef.current || quill.getSelection(true);
              if (!range) return;
              quill.insertEmbed(range.index, "image", reader.result);
              quill.insertText(range.index + 1, "\n");
              quill.setSelection(range.index + 2, 0);
              lastRangeRef.current = { index: range.index + 2, length: 0 };
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Video handling
      if (format === "video") {
        quill.blur();
        setShowVideoModal(true);
        return;
      }

      // Undo/Redo
      if (format === "undo") {
        quill.history.undo();
        return;
      }
      if (format === "redo") {
        quill.history.redo();
        return;
      }

      // Clean formatting
      if (format === "clean") {
        const sel = quill.getSelection(true) || r;
        if (!sel) return;
        if (sel.length === 0) {
          const formats = quill.getFormat();
          Object.keys(formats || {}).forEach((k) => quill.format(k, false));
        } else {
          quill.removeFormat(sel.index, sel.length, "user");
        }
        return;
      }

      // Text alignment - works on current line/block
      if (format === "align") {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const currentAlign = current?.align || false;
        const alignments = [false, "left", "center", "right", "justify"];
        const currentIndex = alignments.indexOf(currentAlign as string | false);
        const nextAlign = alignments[(currentIndex + 1) % alignments.length];
        quill.format("align", nextAlign);
        return;
      }

      // Lists - works on current line/block
      if (format === "list") {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const currentList = current?.list || false;
        if (currentList === "bullet") {
          quill.format("list", false);
        } else if (currentList === "ordered") {
          quill.format("list", "bullet");
        } else {
          quill.format("list", "ordered");
        }
        return;
      }

      // Blockquote - works on current line/block
      if (format === "blockquote") {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const nextVal = !current?.blockquote;
        quill.format("blockquote", nextVal);
        return;
      }

      // Code block - works on current line/block
      if (format === "code-block") {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const nextVal = !current?.["code-block"];
        quill.format("code-block", nextVal);
        return;
      }

      // Indent/Outdent - works on current line/block
      if (format === "indent") {
        quill.format("indent", "+1");
        return;
      }
      if (format === "outdent") {
        quill.format("indent", "-1");
        return;
      }

      // Header - works on current line/block
      if (format === "header") {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const currentHeader = current?.header || false;
        const headers = [false, "1", "2", "3"];
        const currentIndex = headers.indexOf(currentHeader as string | false);
        const nextHeader = headers[(currentIndex + 1) % headers.length];
        quill.format("header", nextHeader);
        return;
      }

      // Color picker (text color)
      if (format === "color") {
        const colorInput = document.createElement("input");
        colorInput.setAttribute("type", "color");
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        colorInput.value = (current?.color as string) || "#000000";
        colorInput.onchange = () => {
          const currentRange = quill.getSelection(true) || r;
          if (currentRange.length > 0) {
            quill.formatText(currentRange.index, currentRange.length, { color: colorInput.value });
          } else {
            quill.format("color", colorInput.value);
          }
        };
        colorInput.click();
        return;
      }

      // Background color
      if (format === "background") {
        const colorInput = document.createElement("input");
        colorInput.setAttribute("type", "color");
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        colorInput.value = (current?.background as string) || "#ffff00";
        colorInput.onchange = () => {
          const currentRange = quill.getSelection(true) || r;
          if (currentRange.length > 0) {
            quill.formatText(currentRange.index, currentRange.length, { background: colorInput.value });
          } else {
            quill.format("background", colorInput.value);
          }
        };
        colorInput.click();
        return;
      }

      // Inline styles (bold, italic, underline) - work on selection or apply to typing
      if (["bold", "italic", "underline"].includes(format)) {
        const current: StringMap = quill.getFormat(r.index, r.length || 0);
        const nextVal = desiredValue === undefined ? !current?.[format] : desiredValue;
        
        if (r.length > 0) {
          // Apply to selection
          quill.formatText(r.index, r.length, { [format]: nextVal });
        } else {
          // Apply to current format (for typing)
          quill.format(format, nextVal);
        }
        return;
      }
    } catch (error) {
      console.error(`Error applying format ${format}:`, error);
      showToast(`Error applying ${format}. Please try again.`, 'error');
    }
  };


  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }],
          [{ size: [] }],
          ["bold", "italic", "underline"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          ["blockquote", "code-block"],
          ["link", "image", "video"],
          ["undo", "redo"],
          ["clean"],
        ],
        handlers: {
          link: function (this: { quill: MinimalQuillEditor }) {
  const sel = this.quill.getSelection(true);
  if (!sel || sel.length === 0) return;

  try {
    const formats = this.quill.getFormat(sel.index, sel.length);
    setTextLinkUrl(
      ((formats as Record<string, unknown>)?.link as string) || ""
    );
  } catch (err) {
    console.error("Error getting formats:", err);
  }

  lastRangeRef.current = sel;
  this.quill.blur();
  setShowTextLinkModal(true);
},
          image: function (this: { quill: MinimalQuillEditor }) {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();

            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                if (file.size > 998 * 1024) {
                  showToast("Please upload an image smaller than 1 MB.", "warning");
                  return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                  const range = this.quill.getSelection();
                  if (!range) return;
                  this.quill.insertEmbed(range.index, "image", reader.result);
                  this.quill.insertText(range.index + 1, "\n");
                  this.quill.setSelection(range.index + 2, 0);
                };
                reader.readAsDataURL(file);
              }
            };
          },
          video: function (this: { quill: MinimalQuillEditor }) {
            this.quill.blur();
            setShowVideoModal(true);
          },
          undo: function (this: { quill: MinimalQuillEditor }) {
            this.quill.history.undo();
          },
          redo: function (this: { quill: MinimalQuillEditor }) {
            this.quill.history.redo();
          },
          clean: function (this: { quill: MinimalQuillEditor }) {
            const sel = this.quill.getSelection(true);
            if (!sel) return;
            if (sel.length === 0) {
              // Clear formats at cursor line block + inline
              const formats = this.quill.getFormat();
              Object.keys(formats || {}).forEach((k) => this.quill.format(k, false));
            } else {
              this.quill.removeFormat(sel.index, sel.length, "user");
            }
          },
        },
      },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    }),
    []
  );

  const formats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "color",
    "background",
    "align",
    "indent",
    "list",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const QuillAny: any = ReactQuill as any;

  // Utility to get base URL
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (origin.includes("localhost")) {
       return process.env.NEXT_PUBLIC_BASE_URL;
      } else {
        return "https://zeva360.com";
      }
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[#18232b]">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between px-4 py-2.5 rounded-md shadow-lg min-w-72 max-w-sm transform transition-all duration-300 ease-in-out ${toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-white"
              }`}
          >
            <span className="text-xs font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Landing - Write Blog CTA */}
      {!skipLandingPage && !showEditor && (
        <div className="relative w-full h-screen flex items-center justify-center px-4 overflow-hidden">
          {/* Subtle Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">Zeva</div>
            </div>

            {/* Headline */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Write. Create. Publish.
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Create compelling blogs and stories with our intuitive writing platform.
              </p>
            </div>

            {/* Features */}
            <div className="mb-8">
              <div className="flex justify-center gap-6 text-sm text-slate-400">

                <span className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                  Instant Publishing
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <button
                onClick={() => setShowEditor(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" />
                Start Writing
              </button>
              <p className="mt-3 text-xs text-slate-500">Free to use</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Blog Editor Modal */}
      {showEditor && (
        skipLandingPage ? (
          // When used inside another modal, render directly without wrapper
          <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* User-Friendly Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#2D9AA5]/10 rounded-lg">
                  <FileText className="w-4 h-4 text-[#2D9AA5]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Create New Blog</h2>
                  <p className="text-xs text-gray-500">Write and publish your content</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Clear all content"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={saveDraft}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Save as draft (auto-saves every 30 seconds)"
                >
                  <Save size={14} />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={selectedPublished ? updatePublishedBlog : publishBlog}
                  disabled={isLoading || !title || !content}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#2D9AA5] text-white rounded-md hover:bg-[#257A83] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title={selectedPublished ? "Update published blog" : "Publish blog publicly"}
                >
                  <Send size={14} />
                  <span>{selectedPublished ? "Update" : "Publish"}</span>
                </button>
                <button
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      requestCloseEditor();
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Close editor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-gray-50/50">
              {/* Title and Permalink Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Blog Title */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-[#2D9AA5]" />
                    Blog Title
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTitle(value);
                      if (!isParamlinkEditable) {
                        const slug = value
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .trim()
                          .replace(/\s+/g, "-")
                          .slice(0, 60);
                        setParamlink(slug);
                      }
                    }}
                    placeholder="e.g., '10 Tips for Better Health'"
                    className="text-gray-900 w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all bg-white"
                  />
                  <p className="text-xs text-gray-500">Choose a clear, descriptive title for your blog post</p>
                </div>

                {/* Permalink */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <Link className="w-4 h-4 text-[#2D9AA5]" />
                      URL Slug
                    </label>
                    <button
                      onClick={() => setIsParamlinkEditable(!isParamlinkEditable)}
                      className="text-xs text-[#2D9AA5] hover:text-[#257A83] font-medium px-2 py-1 hover:bg-[#2D9AA5]/10 rounded transition-colors"
                    >
                      {isParamlinkEditable ? "🔒 Lock" : "✏️ Edit"}
                    </button>
                  </div>
                  <div className="flex">
                    <span className="text-xs text-gray-600 bg-gray-100 px-3 py-2.5 rounded-l-lg border-2 border-gray-300 border-r-0 flex items-center font-medium">
                      {getBaseUrl()}/blog/
                    </span>
                    <input
                      type="text"
                      value={paramlink}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 60) {
                          setParamlink(value);
                        }
                      }}
                      readOnly={!isParamlinkEditable}
                      maxLength={60}
                      className={`text-gray-900 flex-1 px-3 py-2.5 text-sm border-2 ${paramlinkError ? "border-red-500" : "border-gray-300"
                        } rounded-r-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all ${!isParamlinkEditable ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                        }`}
                      placeholder="url-slug-here"
                    />
                  </div>
                  {paramlinkError && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs">
                      <X size={12} />
                      <span>{paramlinkError}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      This will be your blog's URL: <span className="font-mono text-[#2D9AA5]">{getBaseUrl()}/blog/{paramlink || 'your-slug'}</span>
                    </p>
                    <span className={`text-xs font-medium ${paramlink.length > 50 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {paramlink.length}/60
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="text-gray-900 flex-1 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-[#2D9AA5]" />
                    Blog Content
                    <span className="text-red-500">*</span>
                  </label>
                  {lastSaved && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col relative bg-white shadow-sm hover:border-[#2D9AA5]/50 transition-colors">
                  <div className="relative quill-container flex-1 min-h-[400px]">
                    <QuillAny
                      theme="snow"
                      value={content}
                      onChange={(val: string) => setContent(val)}
                      ref={handleQuillRef}
                      modules={modules}
                      formats={formats}
                      placeholder="Start writing your blog content here... You can format text, add images, videos, and links using the toolbar above."
                      className="h-full"
                      style={{ ["--ql-primary"]: "#2D9AA5", ["--ql-image-width"]: "600px", ["--ql-image-height"]: "400px" }}
                    />
                  </div>
                  
                  {/* Floating Toolbar - appears when text is selected */}
                  {showFloatingToolbar && (
                    <div
                      ref={floatingToolbarRef}
                      className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl flex items-center gap-0.5 p-1 pointer-events-auto"
                      style={{
                        top: `${floatingToolbarPosition.top}px`,
                        left: `${floatingToolbarPosition.left}px`,
                        transform: 'translateX(-50%)',
                        position: 'fixed',
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("bold");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.bold ? 'bg-gray-700' : ''}`}
                        title="Bold (Ctrl+B)"
                      >
                        <Bold size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("italic");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.italic ? 'bg-gray-700' : ''}`}
                        title="Italic (Ctrl+I)"
                      >
                        <Italic size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("underline");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.underline ? 'bg-gray-700' : ''}`}
                        title="Underline (Ctrl+U)"
                      >
                        <Underline size={12} />
                      </button>
                      <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("link");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.link ? 'bg-gray-700' : ''}`}
                        title="Add Link"
                      >
                        <LinkIcon size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("color");
                        }}
                        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                        title="Text Color"
                      >
                        <Palette size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("background");
                        }}
                        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                        title="Highlight"
                      >
                        <Highlighter size={12} />
                      </button>
                      <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("align", "left");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'left' ? 'bg-gray-700' : ''}`}
                        title="Align Left"
                      >
                        <AlignLeft size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("align", "center");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'center' ? 'bg-gray-700' : ''}`}
                        title="Align Center"
                      >
                        <AlignCenter size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          formatWithQuill("align", "right");
                        }}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'right' ? 'bg-gray-700' : ''}`}
                        title="Align Right"
                      >
                        <AlignRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Helpful Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-blue-100 rounded">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-blue-900 mb-1">💡 Writing Tips</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>Select text to format with the floating toolbar</li>
                      <li>Your draft auto-saves every 30 seconds</li>
                      <li>Use images and videos to make your content engaging</li>
                      <li>Preview your URL slug before publishing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Standalone modal wrapper - User-friendly size
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={requestCloseEditor} />
            <div className="relative z-40 w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
              {/* User-Friendly Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#2D9AA5]/10 rounded-lg">
                    <FileText className="w-4 h-4 text-[#2D9AA5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Create New Blog</h2>
                    <p className="text-xs text-gray-500">Write and publish your content</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Clear all content"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <button
                    onClick={saveDraft}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="Save as draft (auto-saves every 30 seconds)"
                  >
                    <Save size={14} />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={selectedPublished ? updatePublishedBlog : publishBlog}
                    disabled={isLoading || !title || !content}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#2D9AA5] text-white rounded-md hover:bg-[#257A83] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title={selectedPublished ? "Update published blog" : "Publish blog publicly"}
                  >
                    <Send size={14} />
                    <span>{selectedPublished ? "Update" : "Publish"}</span>
                  </button>
                  <button
                    onClick={requestCloseEditor}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Close editor"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-gray-50/50">
                {/* Title and Permalink Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Blog Title */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-[#2D9AA5]" />
                      Blog Title
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTitle(value);
                        if (!isParamlinkEditable) {
                          const slug = value
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .trim()
                            .replace(/\s+/g, "-")
                            .slice(0, 60);
                          setParamlink(slug);
                        }
                      }}
                      placeholder="e.g., '10 Tips for Better Health'"
                      className="text-gray-900 w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all bg-white"
                    />
                    <p className="text-xs text-gray-500">Choose a clear, descriptive title for your blog post</p>
                  </div>

                  {/* Permalink */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <Link className="w-4 h-4 text-[#2D9AA5]" />
                        URL Slug
                      </label>
                      <button
                        onClick={() => setIsParamlinkEditable(!isParamlinkEditable)}
                        className="text-xs text-[#2D9AA5] hover:text-[#257A83] font-medium px-2 py-1 hover:bg-[#2D9AA5]/10 rounded transition-colors"
                      >
                        {isParamlinkEditable ? "🔒 Lock" : "✏️ Edit"}
                      </button>
                    </div>
                    <div className="flex">
                      <span className="text-xs text-gray-600 bg-gray-100 px-3 py-2.5 rounded-l-lg border-2 border-gray-300 border-r-0 flex items-center font-medium">
                        {getBaseUrl()}/blog/
                      </span>
                      <input
                        type="text"
                        value={paramlink}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 60) {
                            setParamlink(value);
                          }
                        }}
                        readOnly={!isParamlinkEditable}
                        maxLength={60}
                        className={`text-gray-900 flex-1 px-3 py-2.5 text-sm border-2 ${paramlinkError ? "border-red-500" : "border-gray-300"
                          } rounded-r-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-[#2D9AA5] transition-all ${!isParamlinkEditable ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                          }`}
                        placeholder="url-slug-here"
                      />
                    </div>
                    {paramlinkError && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs">
                        <X size={12} />
                        <span>{paramlinkError}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        This will be your blog's URL: <span className="font-mono text-[#2D9AA5]">{getBaseUrl()}/blog/{paramlink || 'your-slug'}</span>
                      </p>
                      <span className={`text-xs font-medium ${paramlink.length > 50 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {paramlink.length}/60
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div className="text-gray-900 flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-[#2D9AA5]" />
                      Blog Content
                      <span className="text-red-500">*</span>
                    </label>
                    {lastSaved && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Saved {lastSaved.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col relative bg-white shadow-sm hover:border-[#2D9AA5]/50 transition-colors">
                    <div className="relative quill-container flex-1 min-h-[400px]">
                      <QuillAny
                        theme="snow"
                        value={content}
                        onChange={(val: string) => setContent(val)}
                        ref={handleQuillRef}
                        modules={modules}
                        formats={formats}
                        placeholder="Start writing your blog content here... You can format text, add images, videos, and links using the toolbar above."
                        className="h-full"
                        style={{ ["--ql-primary"]: "#2D9AA5", ["--ql-image-width"]: "600px", ["--ql-image-height"]: "400px" }}
                      />
                    </div>
                    
                    {/* Floating Toolbar - appears when text is selected */}
                    {showFloatingToolbar && (
                      <div
                        ref={floatingToolbarRef}
                        className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl flex items-center gap-0.5 p-1 pointer-events-auto"
                        style={{
                          top: `${floatingToolbarPosition.top}px`,
                          left: `${floatingToolbarPosition.left}px`,
                          transform: 'translateX(-50%)',
                          position: 'fixed',
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("bold");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.bold ? 'bg-gray-700' : ''}`}
                          title="Bold (Ctrl+B)"
                        >
                          <Bold size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("italic");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.italic ? 'bg-gray-700' : ''}`}
                          title="Italic (Ctrl+I)"
                        >
                          <Italic size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("underline");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.underline ? 'bg-gray-700' : ''}`}
                          title="Underline (Ctrl+U)"
                        >
                          <Underline size={12} />
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("link");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.link ? 'bg-gray-700' : ''}`}
                          title="Add Link"
                        >
                          <LinkIcon size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("color");
                          }}
                          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Text Color"
                        >
                          <Palette size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("background");
                          }}
                          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Highlight"
                        >
                          <Highlighter size={12} />
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "left");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'left' ? 'bg-gray-700' : ''}`}
                          title="Align Left"
                        >
                          <AlignLeft size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "center");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'center' ? 'bg-gray-700' : ''}`}
                          title="Align Center"
                        >
                          <AlignCenter size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "right");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'right' ? 'bg-gray-700' : ''}`}
                          title="Align Right"
                        >
                          <AlignRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Helpful Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-blue-900 mb-1">💡 Writing Tips</h4>
                      <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Select text to format with the floating toolbar</li>
                        <li>Your draft auto-saves every 30 seconds</li>
                        <li>Use images and videos to make your content engaging</li>
                        <li>Preview your URL slug before publishing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* All other modals remain unchanged... */}
      {/* Text Link Modal */}
      {showTextLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Link size={18} className="text-[#2D9AA5]" />
                Insert Link
              </h3>
              <button
                onClick={() => {
                  setShowTextLinkModal(false);
                  setTextLinkUrl("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  URL
                </label>
                <input
                  type="url"
                  value={textLinkUrl}
                  onChange={(e) => setTextLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="text-gray-900 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to remove link</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowTextLinkModal(false);
                    setTextLinkUrl("");
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const quill = quillRef.current?.getEditor?.();
                    if (!quill) return;
                    const r = lastRangeRef.current || quill.getSelection(true);
                    if (!r || r.length === 0) {
                      setShowTextLinkModal(false);
                      setTextLinkUrl("");
                      return;
                    }
                    quill.focus();
                    quill.setSelection(r.index, r.length, "user");
                    const trimmed = textLinkUrl.trim();
                    if (trimmed) {
                      if (!/^https?:\/\//i.test(trimmed)) {
                        showToast("Please enter a valid URL starting with http(s)://", "error");
                        return;
                      }
                      quill.formatText(r.index, r.length, { link: trimmed });
                    } else {
                      quill.formatText(r.index, r.length, { link: false });
                    }
                    setShowTextLinkModal(false);
                    setTextLinkUrl("");
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[#2D9AA5] rounded-md hover:bg-[#257A83] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Video size={18} className="text-[#2D9AA5]" />
                Insert Video
              </h3>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl("");
                  setVideoType("youtube");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Video Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoType("youtube")}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${videoType === "youtube"
                      ? "bg-[#2D9AA5] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    YouTube
                  </button>
                  <button
                    onClick={() => setVideoType("drive")}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${videoType === "drive"
                      ? "bg-[#2D9AA5] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    Google Drive
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    videoType === "youtube"
                      ? "https://youtube.com/watch?v=..."
                      : "https://drive.google.com/file/d/.../view"
                  }
                  className="text-gray-900 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setVideoUrl("");
                    setVideoType("youtube");
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVideoInsert}
                  disabled={!videoUrl.trim()}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[#2D9AA5] rounded-md hover:bg-[#257A83] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Insert Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Editor Confirm Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Save draft before closing?</h3>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">You have unsaved content. Would you like to save it as a draft?</p>
              <div className="flex gap-2">
                <button
                  onClick={discardAndCloseEditor}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveAndCloseEditor}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[#2D9AA5] rounded-md hover:bg-[#257A83] transition-colors"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Editor Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Reset editor?</h3>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to reset the editor? This will clear the title, content, and slug.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    resetEditorFields();
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Link size={18} className="text-[#2D9AA5]" />
                Add Image Link
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedImage(null);
                  setLinkUrl("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Link URL (optional)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="text-gray-900 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to remove existing link
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedImage(null);
                    setLinkUrl("");
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[#2D9AA5] rounded-md hover:bg-[#257A83] transition-colors"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Confirm Action
              </h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete {confirmAction.title}? This
                action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Context Menu */}
      {showImageContextMenu && contextMenuImage && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-50 py-1 min-w-28"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={() => {
              openImageLinkEditor(contextMenuImage);
              setShowImageContextMenu(false);
              setContextMenuImage(null);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Link size={12} />
            Edit Link
          </button>
          <button
            onClick={removeImage}
            className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      )}

      {/* Video Context Menu */}
      {showVideoContextMenu && contextMenuVideo && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-50 py-1 min-w-28"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={removeVideo}
            className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={12} />
            Remove Video
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2D9AA5]"></div>
            <span className="text-sm text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Custom Styles for ReactQuill */}
      <style>{`
      .quill-container .ql-toolbar {
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
        border-top: 1px solid #d1d5db !important;
        border-left: 1px solid #d1d5db !important;
        border-right: 1px solid #d1d5db !important;
        border-bottom: 1px solid #d1d5db !important;
        border-radius: 3px 3px 0 0 !important;
        background: #f9fafb !important;
        margin: 0 !important;
        padding: 4px !important;
      }

      /* Compact toolbar visuals */
      .quill-container .ql-toolbar .ql-formats {
        background: #ffffff !important;
        padding: 0 !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 3px !important;
        margin-right: 4px !important;
      }

      .quill-container .ql-toolbar button {
        border-radius: 3px !important;
        padding: 2px 4px !important;
        color: #334155 !important;
        transition: background-color 0.15s ease, color 0.15s ease,
          transform 0.05s ease !important;
      }

      .quill-container .ql-toolbar button:active {
        transform: translateY(0.5px) !important;
      }

      .quill-container .ql-container {
        border-left: 1px solid #d1d5db !important;
        border-right: 1px solid #d1d5db !important;
        border-bottom: 1px solid #d1d5db !important;
        border-top: none !important;
        border-radius: 0 0 3px 3px !important;
        height: calc(100% - 32px) !important;
        transition: border-color 0.2s ease !important;
      }

      .quill-container .ql-container:focus-within {
        border-color: #2D9AA5 !important;
        box-shadow: 0 0 0 1px rgba(45, 154, 165, 0.1) !important;
      }

      .quill-container .ql-editor {
        height: 100% !important;
        overflow-y: auto !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        padding: 8px 12px !important;
        transition: all 0.2s ease !important;
        cursor: text !important;
      }

      .quill-container .ql-editor:focus {
        outline: none !important;
      }

      .quill-container .ql-editor::selection {
        background: #dbeafe !important;
        color: #1e40af !important;
      }

      .quill-container .ql-editor::-moz-selection {
        background: #dbeafe !important;
        color: #1e40af !important;
      }

      .quill-container .ql-toolbar button:hover {
        background: #e6f6f8 !important; /* light teal */
        color: #2d9aa5 !important;
        border-radius: 4px !important;
      }

      .quill-container .ql-toolbar .ql-active {
        background: #2d9aa5 !important;
        color: white !important;
        border-radius: 4px !important;
      }

      .quill-container .ql-toolbar button svg {
        width: 12px !important;
        height: 12px !important;
      }
      
      .quill-container .ql-toolbar .ql-picker-label {
        padding: 2px 4px !important;
        font-size: 11px !important;
      }
      
      .quill-container .ql-toolbar .ql-picker-options {
        font-size: 11px !important;
        padding: 3px !important;
      }

      /* Ensure Undo/Redo are clearly visible */
      .quill-container .ql-toolbar button.ql-undo,
      .quill-container .ql-toolbar button.ql-redo {
        color: #000000 !important; /* text-black */
      }
      .quill-container .ql-toolbar button.ql-undo:hover,
      .quill-container .ql-toolbar button.ql-redo:hover,
      .quill-container .ql-toolbar button.ql-undo.ql-active,
      .quill-container .ql-toolbar button.ql-redo.ql-active {
        color: #000000 !important;
      }

      .quill-container .ql-editor img {
        width: 100% !important;
        height: var(--ql-image-height, 300px) !important;
        object-fit: contain !important;
        display: block;
        margin: 8px auto;
      }

      .quill-container .ql-editor iframe,
      .quill-container .ql-editor video {
        display: block;
        margin: 12px auto;
        border-radius: 6px;
        max-width: 100%;
      }

      .quill-container .ql-snow .ql-tooltip {
        background: white !important;
        border: 1px solid #d1d5db !important;
        border-radius: 6px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        z-index: 1000 !important;
      }

      .quill-container .ql-toolbar .ql-formats {
        margin-right: 12px !important;
      }
    `}</style>
    </div>
  );
};

export default BlogEditor;
