import dbConnect from "../../../../lib/database";
import WorkflowTrigger from "../../../../models/workflows/WorkflowTrigger";
import Workflow from "../../../../models/workflows/Workflow";
import { workflowQueue } from "../../../../bullmq/queue";

export default async function handler(req, res) {
  await dbConnect();

  const { triggerId, ...queryParams } = req.query;
  console.log("Webhook Query Params:", queryParams);

  const allowedMethods = ["GET", "POST", "PUT", "PATCH"];
  if (!allowedMethods.includes(req.method)) {
    res.setHeader("Allow", allowedMethods);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    // 1. Find the trigger
    const trigger = await WorkflowTrigger.findById(triggerId);
    if (!trigger) {
      return res
        .status(404)
        .json({ success: false, message: "Trigger not found" });
    }

    // 2. Verify it's a webhook type and listening
    if (trigger.type !== "webhook_received") {
      return res
        .status(400)
        .json({ success: false, message: "This trigger is not a webhook" });
    }

    if (!trigger.webhookListening) {
      return res.status(403).json({
        success: false,
        message: "Webhook is currently not listening",
      });
    }

    // 3. Find the associated workflow
    const workflow = await Workflow.findById(trigger.workflowId);
    if (!workflow || workflow.status !== "Active") {
      return res
        .status(403)
        .json({ success: false, message: "Workflow is not active" });
    }

    // 4. Capture Payload (Combine Query Params and Body)
    const payload = {
      ...queryParams,
      ...(req.body || {}),
    };

    // 5. Store the webhook payload in the database
    trigger.webhookResponse = payload;
    await trigger.save();

    // 6. Log the payload (for debugging)
    console.log("Webhook Payload:", payload);

    const workflowJob = await workflowQueue.add("workflow", {
      workflowId: workflow._id.toString(),
      payload,
    });
    console.log(`Workflow job ${workflowJob.id} added to queue`);

    // --- FUTURE: Trigger Execution Engine ---
    // Here you would call a function like triggerWorkflowExecution(workflow, payload)
    console.log(
      `Webhook (${req.method}) Triggered for Workflow: ${workflow.name}`,
      {
        triggerId,
        payload,
      },
    );

    // 5. Send Response
    return res.status(200).json({
      success: true,
      message: trigger.webhookResponse || "Webhook received successfully",
      receivedData: {
        timestamp: new Date().toISOString(),
        id: triggerId,
      },
    });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during webhook processing",
    });
  }
}
