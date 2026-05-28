import React, { useRef, useState, useEffect } from "react";
import {
  Paperclip,
  X,
  FileText,
  File,
  Image,
  Film,
  Music,
  FileArchive,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";

type Props = {
  attachedFile?: File | null;
  setAttachedFile?: (file: File | null) => void;
  setAttachedFiles?: (files: File[]) => void;
  attachedFiles?: File[];
  mediaUrl?: string;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Function to get file type icon
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // Image types
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return Image;
  }

  // Video types
  if (["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"].includes(extension)) {
    return Film;
  }

  // Audio types
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(extension)) {
    return Music;
  }

  // Document types
  if (["pdf"].includes(extension)) {
    return FileText;
  }

  if (["doc", "docx"].includes(extension)) {
    return FileText;
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (["ppt", "pptx"].includes(extension)) {
    return File;
  }

  if (["zip", "rar", "tar", "gz", "7z"].includes(extension)) {
    return FileArchive;
  }

  if (["txt", "rtf", "md"].includes(extension)) {
    return FileText;
  }

  if (
    ["js", "jsx", "ts", "tsx", "html", "css", "json", "xml"].includes(extension)
  ) {
    return FileCode;
  }

  // Default
  return File;
};

// Check if file is an image
const isImage = (fileName: string) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return imageExtensions.includes(extension);
};

// Check if file is a video
const isVideo = (fileName: string) => {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return videoExtensions.includes(extension);
};

export default function AttachmentModal({
  attachedFile,
  setAttachedFile,
  setAttachedFiles,
  attachedFiles,
  mediaUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>(
    attachedFiles || (attachedFile ? [attachedFile] : []),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFiles(attachedFiles || (attachedFile ? [attachedFile] : []));
  }, [attachedFiles, attachedFile]);

  useEffect(() => {
    // build previews for image files
    const next: Record<string, string> = {};
    files.forEach((f) => {
      if (f.type.startsWith("image/")) {
        next[f.name] = URL.createObjectURL(f);
      }
    });
    // revoke previous previews
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews(next);
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dt = e.dataTransfer;
      if (dt?.files?.length) {
        const f = Array.from(dt.files);
        setFiles((prev) => [...prev, ...f]);
        setAttachedFiles?.([...files, ...f]);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("drop", handleDrop as any);
    el.addEventListener("dragover", handleDragOver as any);
    return () => {
      el.removeEventListener("drop", handleDrop as any);
      el.removeEventListener("dragover", handleDragOver as any);
    };
  }, [setAttachedFile]);

  const onFileSelect = (selected?: FileList | null) => {
    if (!selected) return;
    const f = Array.from(selected);
    setFiles((prev) => {
      const next = [...prev, ...f];
      setAttachedFiles?.(next);
      // keep backward compat by setting single attachedFile to last selected
      setAttachedFile?.(next[next.length - 1] || null);
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center cursor-pointer gap-2 p-2.5 rounded-lg hover:shadow-sm border transition-all duration-200 ${
          (attachedFiles && attachedFiles.length > 0) || mediaUrl
            ? "bg-green-200 border-green-500 hover:border-green-600 text-green-800"
            : "bg-white border-gray-300 hover:border-gray-400 text-gray-700"
        }`}
        title="Attach file"
      >
        <Paperclip className="h-5 w-5" />
        {((attachedFiles && attachedFiles?.length > 0) || mediaUrl) && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full flex items-center justify-center w-4 h-4 text-xs font-semibold">
            {attachedFiles?.length || 1}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed  inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-xl mx-4 mb-8 md:mb-0 bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-b-gray-200">
              <h3 className="font-semibold text-gray-800">Attach file</h3>
              <div className="flex items-center gap-2">
                {attachedFile && (
                  <div className="text-sm text-gray-600">
                    {attachedFile.name?.length > 20
                      ? attachedFile.name.slice(0, 20) + "..."
                      : attachedFile.name}{" "}
                    ({formatBytes(attachedFile.size)})
                  </div>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div
                ref={dropRef}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-gray-300 transition-colors"
              >
                <div className="text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16V4m0 0L3 8m4-4 4 4M17 8v8a4 4 0 01-4 4H9"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    Drag & drop files here
                  </p>
                  <p className="text-xs text-gray-400">or</p>
                </div>

                <div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => onFileSelect(e.target.files)}
                  />
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    Choose files
                  </button>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {files.map((f) => {
                    const FileIcon = getFileIcon(f.name);
                    const fileIsImage = isImage(f.name);
                    const fileIsVideo = isVideo(f.name);

                    return (
                      <div
                        key={f.name}
                        className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md border border-gray-300"
                      >
                        {/* File Preview/Icon */}
                        <div className="relative">
                          {fileIsImage && previews[f.name] ? (
                            // Image Preview
                            <img
                              src={previews[f.name]}
                              className="h-16 w-16 object-cover rounded-md"
                              alt={f.name}
                            />
                          ) : fileIsVideo && previews[f.name] ? (
                            // Video Preview with Play Icon Overlay
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-black">
                              <video
                                src={previews[f.name]}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Film className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            // File Icon
                            <div className="h-16 w-16 rounded-md border border-gray-300 bg-white flex flex-col items-center justify-center text-gray-500">
                              <FileIcon className="h-7 w-7" />
                              <span className="text-[10px] mt-1 font-medium truncate max-w-full px-1">
                                {f.name.split(".").pop()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 truncate">
                            {f.name?.length > 30
                              ? f.name.slice(0, 30) + "..."
                              : f.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatBytes(f.size)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next = files.filter((x) => x !== f);
                              setFiles(next);
                              setAttachedFiles?.(next);
                              // keep backward compat
                              setAttachedFile?.(next[next.length - 1] || null);
                            }}
                            className="text-sm cursor-pointer text-red-600 bg-white hover:bg-gray-50 p-2 rounded-md border border-gray-300 hover:underline"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-t-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // propagate files to parent
                  setAttachedFiles?.(files);
                  setAttachedFile?.(files[files.length - 1] || null);
                  setOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
