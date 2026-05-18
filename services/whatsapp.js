import axios from "axios";
import { uploadMedia } from "./upload.js";
import Message from "../models/Message.js";

export const getWhatsappUploadId = async (
  fileLength,
  fileType,
  accessToken,
) => {
  const url = `https://graph.facebook.com/v16.0/751025339470118/uploads?file_length=${fileLength}&file_type=${encodeURIComponent(
    fileType,
  )}&access_token=${accessToken}`;

  try {
    const response = await fetch(url, {
      method: "POST",
    });

    const data = await response.json();
    console.log("whatsapp uploadId resp: ", data);
    return data.id;
  } catch (error) {
    console.error("Error getting WhatsApp upload ID:", error);
    throw error;
  }
};

export const getWhatsappHandlerId = async (
  whatsappUploadId,
  fileBuffer,
  accessToken,
) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v16.0/${whatsappUploadId}`,
      fileBuffer,
      {
        headers: {
          Authorization: `OAuth ${accessToken}`,
          "Content-Type": "text/plain", // Use actual file type
        },
      },
    );

    console.log("handler id resp: ", response.data);

    return response.data.h;
  } catch (error) {
    console.error(
      "Error getting WhatsApp handler ID:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const createWhatsAppTemplate = async (
  whatsappId,
  accessToken,
  templateData,
) => {
  console.log({ whatsappId, accessToken, templateData });
  try {
    const components = [
      templateData?.isHeader === "true" && {
        type: "HEADER",
        format: templateData.headerType.toUpperCase(),
        ...(templateData.headerType === "text"
          ? {
              text: templateData.headerText, // Use `{{1}}` for variable placeholders
              ...(templateData.headerVariableSampleValues?.length > 0
                ? {
                    example: {
                      header_text: [templateData.headerVariableSampleValues[0]],
                    },
                  }
                : {}),
            }
          : {}),
        ...(["image", "video", "document"].includes(templateData.headerType)
          ? { example: { header_handle: templateData.whatsappHandlerId } }
          : {}),
      },
      {
        type: "BODY",
        text: templateData.content,
        ...(templateData?.bodyVariableSampleValues?.length > 0
          ? {
              example: {
                body_text: [templateData.bodyVariableSampleValues],
              },
            }
          : {}),
      },
      templateData.isFooter === "true" &&
        templateData?.footer && {
          type: "FOOTER",
          text: templateData.footer,
        },
      templateData.isButton === "true" && {
        type: "BUTTONS",
        buttons: templateData?.templateButtons,
      },
    ].filter(Boolean);

    let authTemplateComponents = [
      {
        type: "BODY",
        add_security_recommendation: true,
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "OTP",
            otp_type: "COPY_CODE",
          },
        ],
      },
    ];

    console.log(JSON.stringify({ components }));

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${whatsappId}/message_templates`,
      {
        name: templateData.uniqueName,
        category: templateData.category.toUpperCase(),
        language: templateData.language,
        components:
          templateData?.category?.toLowerCase() === "authentication"
            ? authTemplateComponents
            : components,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Template Created resp:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating WhatsApp template:", error?.response?.data);
    throw error?.response?.data?.error?.message
      ? new Error(error?.response?.data?.error?.message)
      : error;
  }
};

export const updateWhatsAppTemplate = async (
  templateId,
  accessToken,
  templateData,
) => {
  console.log({ templateId, accessToken, templateData });

  try {
    const components = [
      templateData?.isHeader === "true" && {
        type: "HEADER",
        format: templateData.headerType.toUpperCase(),
        ...(templateData.headerType === "text"
          ? {
              text: templateData.headerText,
              // Only add example if we have valid sample values
              ...(templateData.headerVariableSampleValues &&
              templateData.headerVariableSampleValues[0] &&
              templateData.headerVariableSampleValues[0].trim() !== ""
                ? {
                    example: {
                      header_text: [
                        templateData.headerVariableSampleValues[0].trim(),
                      ],
                    },
                  }
                : {}),
            }
          : {}),

        ...(["image", "video", "document"].includes(templateData.headerType)
          ? { example: { header_handle: templateData.whatsappHandlerId } }
          : {}),
      },
      {
        type: "BODY",
        text: templateData.content,
        ...(templateData?.bodyVariableSampleValues &&
        Array.isArray(templateData.bodyVariableSampleValues) &&
        templateData.bodyVariableSampleValues.length > 0 &&
        templateData.bodyVariableSampleValues.every(
          (val) => val && val.trim() !== "",
        )
          ? {
              example: {
                body_text: templateData.bodyVariableSampleValues.map((val) =>
                  val.trim(),
                ),
              },
            }
          : {}),
      },
      templateData.isFooter === "true" &&
        templateData?.footer && {
          type: "FOOTER",
          text: templateData.footer,
        },
      templateData.isButton === "true" && {
        type: "BUTTONS",
        buttons: templateData?.templateButtons,
      },
    ].filter(Boolean);

    console.log({ n: JSON.stringify({ components }) });

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${templateId}`, // ✅ Correct POST request to the template ID
      {
        category: templateData.category.toUpperCase(), // Required if components are omitted
        components, // Required if category is omitted
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Template Updated resp:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating WhatsApp template:",
      error.response?.data || error.message,
    );
    throw error.response?.data?.error || error;
  }
};

export const deleteWhatsappTemplate = async (
  accessToken,
  wabaId,
  templateName,
) => {
  try {
    const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates/?name=${templateName}`;

    const response = await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("Template deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting WhatsApp template:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// helper for sending typing indicators
export const sendWhatsAppTypingIndicator = async (
  phoneNumberId,
  toPhoneNumber,
  accessToken,
  isTyping = true,
) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhoneNumber,
        type: "typing_indicator",
        typing_indicator: {
          type: isTyping ? "typing" : "paused",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(
      `Typing indicator ${
        isTyping ? "started" : "stopped"
      } for ${toPhoneNumber}`,
    );
  } catch (error) {
    console.error("Error sending typing indicator: ", error);
    // Don't throw error for typing indicator failures to not break main flow
  }
};

// main message handler
export const handleWhatsappSendMessage = async (msgData) => {
  let resData = null;
  const { credentials, to } = msgData;
  const { accessToken, phoneNumberId } = credentials;
  console.log({ msgData, credentials, accessToken, phoneNumberId });

  try {
    let apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    console.log("WhatsApp API URL: ", apiUrl);
    // 1. Send typing indicator for conversational messages
    if (msgData.type === "conversational" && !msgData.template) {
      await sendWhatsAppTypingIndicator(phoneNumberId, to, accessToken, true);
    }

    // 2. Handle message type routing
    let apiPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
    };

    // Determine payload based on message type
    if (msgData.type === "reaction") {
      // Reaction message type
      apiPayload.type = "reaction";
      apiPayload.reaction = {
        message_id: msgData.reactedMessageId, // The ID of the message being reacted to
        emoji: msgData.emoji, // Single emoji character like "👍"
      };
    } else if (msgData.mediaType) {
      // Media message types
      apiPayload.type = msgData.mediaType; // 'image', 'audio', 'document', 'video', 'sticker'
      apiPayload[msgData.mediaType] = {
        link: msgData.mediaUrl,
        ...(msgData.caption && { caption: msgData.caption }), // For images/videos
        ...(msgData.filename && { filename: msgData.filename }), // For documents
      };
    } else if (msgData.type === "location") {
      // Location message
      apiPayload.type = "location";
      apiPayload.location = msgData.location;
    } else if (msgData.type === "contacts") {
      // Contact message (vCard)
      apiPayload.type = "contacts";
      apiPayload.contacts = msgData.contacts; // Array of contact objects
    } else if (msgData.type === "interactive") {
      // Interactive message (buttons, lists)
      apiPayload.type = "interactive";
      apiPayload.interactive = msgData.interactiveData;
    } else if (msgData.template) {
      // Template message (existing logic, now categorized)
      apiPayload.type = "template";
      apiPayload.template = {
        name: msgData.template,
        language: { code: msgData.language || "en_US" },
      };

      // Add components if they exist
      if (msgData.components && msgData.components.length > 0) {
        apiPayload.template.components = msgData.components;
      }
    } else {
      // Default text message with formatting support[citation:6]
      apiPayload.type = "text";
      apiPayload.text = {
        preview_url: msgData.previewUrl || false,
        body: msgData.msg,
      };
    }

    // Add context for replies
    if (msgData.quotedMessageId) {
      apiPayload.context = {
        message_id: msgData.quotedMessageId,
      };
    }

    console.log({ msgData, apiPayload });

    // 3. Make API call to Meta
    const { data } = await axios.post(apiUrl, apiPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (data) {
      console.log("WhatsApp Message sent successfully: ", data);
      resData = data;
    }

    // 4. Stop typing indicator
    if (msgData.type === "conversational" && !msgData.template) {
      await sendWhatsAppTypingIndicator(phoneNumberId, to, accessToken, false);
    }

    return resData;
  } catch (error) {
    console.log(
      "Error in send WhatsApp message: ",
      JSON.stringify(error.response?.data || error.message),
    );
    throw error;
  }
};

export const handleSendWhatsappReplyMessage = async ({
  to,
  message,
  quotedMessageId,
  accessToken,
  phoneNumberId,
  clientMessageId,
}) => {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    context: {
      message_id: quotedMessageId,
    },
    type: "text",
    text: {
      body: message,
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("WhatsApp reply sent successfully:", data);
    const providerMessageId = data?.messages[0]?.id || "";
    await Message.findByIdAndUpdate(clientMessageId, {
      providerMessageId: providerMessageId,
    });
    return data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp reply:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const handleSendWhatsappInteractiveReplyBtnMsg = async ({
  to,
  message,
  replyButtons, // array of { type: "reply", reply: { id: string, title: string } }
  accessToken,
  phoneNumberId,
  clientMessageId,
}) => {
  console.log({
    to,
    message,
    replyButtons, // array of { type: "reply", reply: { id: string, title: string } }
    accessToken,
    phoneNumberId,
    clientMessageId,
  });
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: message,
      },
      action: {
        buttons: replyButtons,
      },
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("WhatsApp interactive reply button sent successfully:", data);

    const providerMessageId = data?.messages?.[0]?.id || "";

    if (clientMessageId) {
      await Message.findByIdAndUpdate(clientMessageId, {
        providerMessageId,
      });
    }

    return data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp interactive reply:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
export const handleSendWhatsappInteractiveListMsg = async ({
  to,
  headerText = "", // string, e.g. "Product Catalog"
  bodyText, // string, e.g. "Pick one to continue:"
  footerText = "", // string, e.g. "You can change later"
  buttonText = "Browse", // string, e.g. "Browse"
  listSections, // array of { title, rows: [{ id, title, description }] }
  accessToken,
  phoneNumberId,
  clientMessageId,
}) => {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      ...(headerText
        ? {
            header: {
              type: "text",
              text: headerText,
            },
          }
        : {}),
      body: {
        text: bodyText,
      },
      ...(footerText
        ? {
            footer: {
              text: footerText,
            },
          }
        : {}),
      action: {
        button: buttonText,
        sections: listSections,
      },
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("WhatsApp interactive list message sent successfully:", data);

    const providerMessageId = data?.messages?.[0]?.id || "";

    if (clientMessageId) {
      await Message.findByIdAndUpdate(clientMessageId, {
        providerMessageId,
      });
    }

    return data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp interactive list message:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const handleSendWhatsappCallPermissionMessage = async ({
  to,
  message,
  accessToken,
  phoneNumberId,
  clientMessageId,
}) => {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "call_permission_request",
      action: {
        name: "call_permission_request",
      },
      body: {
        text: message,
      },
    },
  };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("WhatsApp call permission request sent successfully:", data);
    const providerMessageId = data?.messages[0]?.id || "";
    await Message.findByIdAndUpdate(clientMessageId, {
      providerMessageId: providerMessageId,
    });
    return data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp call permission request:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Get whatsapp media URL
export const getWhatsappMediaUrl = async (tid, token) => {
  try {
    // 1. Fetch media details (URL & MIME type)
    const mediaDetails = await fetchMediaDetails(tid, token);
    console.log({ mediaDetails });
    if (!mediaDetails || !mediaDetails.url) return "";

    // 2. Fetch media file and try to extract filename from headers or metadata
    const { blob: mediaBlob, filename: fetchedFilename } = await fetchMediaFile(
      mediaDetails.url,
      token,
      mediaDetails,
    );
    console.log({ fetchedFilename, mediaBlob });
    if (!mediaBlob) return "";

    // 3. Get file extension from MIME type
    const ext = getMimeExtension(mediaDetails.mime_type);
    console.log({ ext });
    if (!ext) return "";

    // 4. Upload media and return URL + filename (prefer fetchedFilename)
    const uploadedUrl = await uploadMedia(
      mediaBlob,
      ext,
      fetchedFilename ||
        mediaDetails?.filename ||
        mediaDetails?.file_name ||
        undefined,
    );
    return {
      url: uploadedUrl,
      filename:
        fetchedFilename ||
        mediaDetails?.filename ||
        mediaDetails?.file_name ||
        undefined,
    };
  } catch (error) {
    console.error("Error fetching or uploading media:", error);
    return "";
  }
};

// Helper function to fetch media details from WhatsApp API
const fetchMediaDetails = async (tid, token) => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v13.0/${tid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log({ data });
    return data;
  } catch (error) {
    console.error("Error fetching media details:", error);
    return null;
  }
};

// Helper function to fetch media file as a Blob
const fetchMediaFile = async (url, token, mediaDetails) => {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "arraybuffer",
    });

    // Determine MIME type and possible filename
    const mimeType =
      response.headers["content-type"] ||
      mediaDetails?.mime_type ||
      "application/octet-stream";

    // Try to extract filename from content-disposition header
    let filename;
    const cd =
      response.headers["content-disposition"] ||
      response.headers["Content-Disposition"];
    if (cd) {
      const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      if (m && m[1]) {
        filename = decodeURIComponent(m[1].replace(/\"/g, ""));
      }
    }

    // Fallback to mediaDetails filename fields or URL
    if (!filename && mediaDetails) {
      filename =
        mediaDetails.filename || mediaDetails.file_name || mediaDetails.name;
    }
    if (!filename) {
      const urlName = url.split("/").pop().split("?")[0];
      filename = urlName;
    }

    const blob = new Blob([response.data], { type: mimeType });
    return { blob, filename };
  } catch (error) {
    console.error("Error fetching media file:", error);
    return { blob: null, filename: null };
  }
};

// Helper function to get file extension from MIME type
const getMimeExtension = (mimeType) => {
  const mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/heic": "heic",
    "image/heif": "heif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/ogg": "ogg",
    "application/pdf": "pdf",
  };
  return mimeMap[mimeType] || "";
};
