import axios from "axios";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import WorkflowAction from "../../../../models/workflows/WorkflowAction";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const {
    actionId, // to save test result for variable mapping
    apiMethod,
    apiEndPointUrl,
    apiPayloadType,
    apiAuthType,
    apiHeaders,
    apiParameters,
  } = req.body;

  if (!apiEndPointUrl) {
    return res
      .status(400)
      .json({ success: false, message: "Endpoint URL is required" });
  }

  try {
    const headers = {};
    if (apiHeaders && Array.isArray(apiHeaders)) {
      apiHeaders.forEach((h) => {
        if (h.key && h.value) headers[h.key] = h.value;
      });
    }

    let data = {};
    if (apiParameters && Array.isArray(apiParameters)) {
      apiParameters.forEach((p) => {
        if (p.key && p.value) data[p.key] = p.value;
      });
    }

    const config = {
      method: apiMethod || "POST",
      url: apiEndPointUrl,
      headers,
      timeout: 10000, // 10 seconds timeout for tests
    };

    if (apiMethod === "POST") {
      if (apiPayloadType === "JSON") {
        config.data = data;
        config.headers["Content-Type"] = "application/json";
      } else if (apiPayloadType === "FORM_DATA") {
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) =>
          formData.append(key, value),
        );
        config.data = formData;
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    } else if (apiMethod === "GET") {
      config.params = data;
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    // save test result to workflow action
    if (actionId) {
      await WorkflowAction.findByIdAndUpdate(actionId, {
        apiResponse: response.data,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.data,
        duration,
      },
    });
  } catch (err) {
    console.error("Test API error:", err.message);
    const duration = err.config?.startTime
      ? Date.now() - err.config.startTime
      : 0;

    return res.status(200).json({
      success: false,
      data: {
        status: err.response?.status || 500,
        statusText: err.response?.statusText || "Error",
        headers: err.response?.headers || {},
        body: err.response?.data || err.message,
        duration,
      },
    });
  }
}
