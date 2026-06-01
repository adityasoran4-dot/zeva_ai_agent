import axios from "axios";
import FormDataNode from "form-data";

// Upload media file to server (Node environment)
export const uploadMedia = async (mediaBlob, ext, originalName) => {
  try {
    // Build filename from originalName when provided, otherwise fallback to timestamp
    const safeExt = ext ? `.${ext.replace(/^[.]/, "")}` : "";
    let filename;
    if (originalName) {
      // sanitize original name (remove path, query, and unsafe chars)
      const base = originalName.split("/").pop().split("?")[0];
      const nameOnly = base.replace(/\.[^/.]+$/, "");
      const sanitized = nameOnly
        .replace(/[^a-zA-Z0-9-_\.]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
      filename = `${sanitized || Date.now()}${
        safeExt || (base.includes(".") ? "" : safeExt)
      }`;
    } else {
      filename = `${Date.now()}${safeExt}`;
    }

    // Normalize to Node Buffer
    let nodeBuffer;
    let contentType = "application/octet-stream";

    if (Buffer.isBuffer(mediaBlob)) {
      nodeBuffer = mediaBlob;
    } else if (mediaBlob && typeof mediaBlob.arrayBuffer === "function") {
      const buffer = await mediaBlob.arrayBuffer();
      nodeBuffer = Buffer.from(buffer);
      if (mediaBlob.type) contentType = mediaBlob.type;
    } else if (mediaBlob && mediaBlob.data && Buffer.isBuffer(mediaBlob.data)) {
      // sometimes libraries return { data: <Buffer> }
      nodeBuffer = mediaBlob.data;
      if (mediaBlob.type) contentType = mediaBlob.type;
    } else {
      throw new Error("Unsupported mediaBlob type for upload");
    }

    const formData = new FormDataNode();
    formData.append("file", nodeBuffer, {
      filename,
      contentType,
    });
    formData.append("source", "zeva_server");

    const getBaseUrl = () => {
      if (typeof window !== "undefined") return ""; // Use relative on client
      return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    };

    const uploadResponse = await axios.post(
      `${getBaseUrl()}/api/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    return uploadResponse.data?.url || "";
  } catch (error) {
    console.error("Error uploading media:", error);
    return "";
  }
};
