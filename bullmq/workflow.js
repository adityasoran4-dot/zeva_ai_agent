import Workflow from "../models/workflows/Workflow.js";
import WorkflowTrigger from "../models/workflows/WorkflowTrigger.js";
import WorkflowAction from "../models/workflows/WorkflowAction.js";
import WorkflowCondition from "../models/workflows/WorkflowCondition.js";
import WorkflowHistory from "../models/workflows/WorkflowHistory.js";
import {
  addTagActionQueue,
  addToSegmentActionQueue,
  aiComposerActionQueue,
  assignOwnerActionQueue,
  bookAppointmentActionQueue,
  delayActionQueue,
  restApiActionQueue,
  sendEmailActionQueue,
  sendSmsActionQueue,
  sendWhatsappActionQueue,
  workflowQueue,
} from "./queue.js";
import Lead from "../models/Lead.js";
import Clinic from "../models/Clinic.js";
import Message from "../models/Message.js";
import PatientRegistration from "../models/PatientRegistration.js";
import Referral from "../models/Referral.js";
import { generateEmrNumber } from "../lib/generateEmrNumber.js";
import Appointment from "../models/Appointment.js";
import Room from "../models/Room.js";
import Users from "../models/Users.js";

export const WORKFLOW_ENTITY_TYPE = {
  LEAD: "Lead",
  PATIENT: "Patient",
  APPOINTMENT: "Appointment",
  WEBHOOK: "Webhook",
  MESSAGE: "Message",
};

export const WORKFLOW_TRIGGER_TYPE = {
  NEW_LEAD: "new_lead",
  UPDATE_LEAD: "update_lead",
  CREATE_OR_UPDATE_LEAD: "create_or_update_lead",
  RECORD_CREATED: "record_created",
  RECORD_UPDATED: "record_updated",
  RECORD_CREATE_OR_UPDATE: "record_create_or_update",
  WEBHOOK_RECEIVED: "webhook_received",
  INCOMING_MESSAGE: "incoming_message",
  BOOKED_APPOINTMENT: "booked_appointment",
};

export const executeWorkflows = async (payload) => {
  /*
    1. Extract entity, trigger, and clinicId from payload
    2. Find active workflows for the clinic, entity, and trigger
    3. Iterate over each workflow
    4. Find the trigger node in the workflow nodes
    5. Check if the trigger node exists
    6. Validate trigger type mismatch
    7. Execute the workflow if trigger type matches

    Process:
      1. Find the trigger node in the workflow nodes
      2. Check if the trigger node exists
      3. Validate trigger type mismatch
      4. Execute the workflow if trigger type matches

      Payload:
        {
          entity: "Lead",
          trigger: "new_lead",
          leadId: "65f0a0a0a0a0a0a0a0a0a0a0",
          clinicId: "65f0a0a0a0a0a0a0a0a0a0a0",
        }

      Patient Payload:
        {
          entity: "Patient",
          trigger: "record_create_or_update",
          patientId: "65f0a0a0a0a0a0a0a0a0a0a0",
          clinicId: "65f0a0a0a0a0a0a0a0a0a0a0",
        }

      Booked_Appointment Payload:
        {
          entity: "Appointment",
          trigger: "record_create_or_update",
          appointmentId: "65f0a0a0a0a0a0a0a0a0a0a0",
          patientId: "65f0a0a0a0a0a0a0a0a0a0a0",
          clinicId: "65f0a0a0a0a0a0a0a0a0a0a0",
        }

        Incoming Message Payload:
        {
          entity: "Message",
          trigger: "incoming_message",
          leadId: "65f0a0a0a0a0a0a0a0a0a0a0",
          channel: "whatsapp",
          providerId: "65f0a0a0a0a0a0a0a0a0a0a0",
          messageId: "65f0a0a0a0a0a0a0a0a0a0a0",
          conversationId: "65f0a0a0a0a0a0a0a0a0a0a0",
        }
  */
  const { entity, trigger, clinicId } = payload;
  console.log({ payload });
  const workflows = await Workflow.find({ clinicId, entity, status: "Active" });
  console.log({ workflows });
  for (const workflow of workflows) {
    const workflowTriggerData = workflow.nodes.find(
      (node) => node.type === "trigger",
    );
    const workflowTriggerNodeId = workflowTriggerData?.data?.id || null;
    let workflowTrigger;
    if (workflowTriggerNodeId) {
      workflowTrigger = await WorkflowTrigger.findById(workflowTriggerNodeId);
    }
    if (!workflowTrigger) {
      console.log(`Workflow trigger not found: ${workflowTriggerNodeId}`);
      continue;
    }
    if (trigger !== workflowTrigger.type) {
      console.log(
        `Workflow trigger type mismatch: ${trigger} !== ${workflowTrigger.type}`,
      );
      continue;
    }

    // Execute the workflow
    try {
      await executeWorkflow(workflow._id, payload);
    } catch (error) {
      console.error(
        `Error executing workflow ${workflow._id}: ${error.message}`,
      );
    }
  }
};

export const executeWorkflow = async (workflowId, payload) => {
  /*
    1. Find the workflow by ID
    2. Check if the workflow exists
    3. Extract entity and trigger from payload
    4. Validate entity type mismatch
    5. Find the trigger node in the workflow nodes
    6. Check if the trigger node exists
    7. Validate trigger type mismatch
    8. Process the workflow

    Payload:
      {
        entity: "Lead",
        trigger: "new_lead",
        leadId: "65f0a0a0a0a0a0a0a0a0a0a0",
        channel: "sms",
        providerId: "65f0a0a0a0a0a0a0a0a0a0a0",
      }

      Incoming Payload:
      {
        entity: "Message",
        trigger: "incoming_message",
        leadId: "65f0a0a0a0a0a0a0a0a0a0a0",
        channel: "sms",
        providerId: "65f0a0a0a0a0a0a0a0a0a0a0",
      }

      Booked_Appointment Payload:
      {
        entity: "Appointment",
        trigger: "record_create_or_update",
        appointmentId: "65f0a0a0a0a0a0a0a0a0a0a0",
        patientId: "65f0a0a0a0a0a0a0a0a0a0a0",
        clinicId: "65f0a0a0a0a0a0a0a0a0a0a0",
      }
  */
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  const { entity, trigger } = payload;
  if (entity !== workflow.entity) {
    throw new Error(
      `Workflow entity type mismatch: ${entity} !== ${workflow.entity}`,
    );
  }
  const workflowNodes = workflow.nodes || [];
  const workflowTriggerData = workflowNodes.find(
    (node) => node.type === "trigger",
  );
  const workflowTriggerNodeId = workflowTriggerData?.data?.id || null;
  let workflowTrigger;
  if (workflowTriggerNodeId) {
    workflowTrigger = await WorkflowTrigger.findById(workflowTriggerNodeId);
  }
  if (!workflowTrigger) {
    throw new Error(`Workflow trigger not found: ${workflowTriggerNodeId}`);
  }
  if (trigger !== workflowTrigger.type) {
    throw new Error(
      `Workflow trigger type mismatch: ${trigger} !== ${workflowTrigger.type}`,
    );
  }

  // If Trigger is incoming message, then add providerId to payload
  if (trigger === WORKFLOW_TRIGGER_TYPE.INCOMING_MESSAGE) {
    const channel = workflowTrigger.channel;
    const providerId = workflowTrigger.providerId?.toString();
    if (!channel || !providerId) {
      throw new Error(
        `Workflow trigger channel or providerId is missing: ${channel}, ${providerId}`,
      );
    }
    console.log({ channel, providerId, payload });
    if (channel !== payload.channel || providerId !== payload.providerId) {
      throw new Error(
        `Workflow trigger channel or providerId mismatch: ${channel}, ${providerId} !== ${payload.channel}, ${payload.providerId}`,
      );
    }
  }

  const workflowJob = await workflowQueue.add("workflow", {
    workflowId,
    ...payload,
  });
  console.log(`Workflow job added: ${JSON.stringify({ workflowJob })}`);
};

export async function processWorkflow(workflowData) {
  const { nodes, edges, startNodeId, ...rest } = workflowData;

  // 1. Find the starting node
  let currentNode;

  if (startNodeId) {
    // Resume from a specific node (e.g., after a delay)
    currentNode = nodes.find((n) => n.id === startNodeId);
    console.log(`Resuming workflow from node: ${startNodeId}`);
  } else {
    // Start from the trigger node
    currentNode = nodes.find((n) => n.type === "trigger");
    console.log("Starting workflow from trigger node");
  }

  // 2. If no start/trigger node found, use the first node in the array as a fallback
  if (!currentNode && nodes.length > 0) {
    console.log(
      "No specific start or trigger node found, falling back to nodes[0]",
    );
    currentNode = nodes[0];
  }

  while (currentNode) {
    console.log(`Executing: ${currentNode.data.label}`);

    // Perform the actual action logic here (e.g., Send Message, Wait, etc.)
    let result;
    if (
      currentNode.type === "action" &&
      (currentNode.data.subType === "delay" ||
        currentNode.data.subType === "rest_api" ||
        currentNode.data.subType === "ai_composer")
    ) {
      // Delay Action Node Dont perform any action right now
      result = true;
    } else {
      result = await performNodeAction({ node: currentNode, ...rest });
    }

    // 2. Find the Next Node
    let nextEdge;

    if (currentNode.type === "condition") {
      // Branching logic: result of performNodeAction determines 'true' or 'false'
      const handleToFollow = result ? "true" : "false";
      nextEdge = edges.find(
        (e) => e.source === currentNode.id && e.sourceHandle === handleToFollow,
      );
    } else {
      // Sequential logic: just find the next connected node
      nextEdge = edges.find((e) => e.source === currentNode.id);
    }

    console.log({ currentNode, nextEdge });

    //3. If Delay Action Node
    if (currentNode.type === "action" && currentNode.data.subType === "delay") {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }
      const delayTime = workflowAction.parameters.delayTime || 0; // Default 1 second
      const delayFormat =
        workflowAction.parameters.delayFormat || "milliseconds";
      const delayInMs = calculateDelayInMs(delayTime, delayFormat);

      console.log({ delayTime, delayFormat, delayInMs });

      // 1. Make an entry in Workflow History
      const history = await WorkflowHistory.create({
        workflowId: workflowAction.workflowId,
        actionId,
        status: "waiting",
        type: "action",
        executedAt: new Date(),
      });

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      if (!nextNodeId) {
        console.log("No next node after delay, workflow finishes");
        break;
      }

      // 4. Create a job in the delayActionQueue
      const delayActionJob = await delayActionQueue.add(
        "delay",
        {
          ...currentNode.data,
          delayInMs,
          historyId: history._id,
          nodes, // pass full nodes
          edges, // pass full edges
          startNodeId: nextNodeId, // resume from the target of the next edge
          ...rest, // pass original payload
        },
        {
          delay: delayInMs,
          removeOnComplete: true,
        },
      );
      break;
    }

    // 4. If REST API Action Node
    if (
      currentNode.type === "action" &&
      currentNode.data.subType === "rest_api"
    ) {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // 1. Make an entry in Workflow History
      const history = await WorkflowHistory.create({
        workflowId: workflowAction.workflowId,
        actionId,
        status: "in-progress",
        type: "action",
        executedAt: new Date(),
      });

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      history.payload = {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      };
      await history.save();

      if (!nextNodeId) {
        console.log("No next node after rest_api, workflow finishes");
        break;
      }

      // 4. Create a job in the restApiActionQueue
      const restApiActionJob = await restApiActionQueue.add("rest_api", {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      });
      console.log({ restApiActionJob });
      break;
    }

    // 5. If AI Composer Action Node
    if (
      currentNode.type === "action" &&
      currentNode.data.subType === "ai_composer"
    ) {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // 1. Make an entry in Workflow History
      const history = await WorkflowHistory.create({
        workflowId: workflowAction.workflowId,
        actionId,
        status: "in-progress",
        type: "action",
        executedAt: new Date(),
      });

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      history.payload = {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      };
      await history.save();

      if (!nextNodeId) {
        console.log("No next node after ai_composer, workflow finishes");
        break;
      }

      // 4. Create a job in the aiComposerActionQueue
      const aiComposerActionJob = await aiComposerActionQueue.add(
        "ai_composer",
        {
          ...currentNode.data,
          historyId: history._id,
          nodes, // pass full nodes
          edges, // pass full edges
          startNodeId: nextNodeId, // resume from the target of the next edge
          ...rest, // pass original payload
        },
      );
      break;
    }

    // 4. Move to the next node or stop if no more edges
    if (nextEdge) {
      currentNode = nodes.find((n) => n.id === nextEdge.target);
    } else {
      currentNode = null; // Workflow finished
    }
  }
}
export async function processRetryWorkflow(workflowData) {
  const { nodes, edges, startNodeId, ...rest } = workflowData;

  // 1. Find the starting node
  let currentNode;

  if (startNodeId) {
    // Resume from a specific node (e.g., after a delay)
    currentNode = nodes.find((n) => n.id === startNodeId);
    console.log(`Resuming workflow from node: ${startNodeId}`);
  } else {
    // Start from the trigger node
    currentNode = nodes.find((n) => n.type === "trigger");
    console.log("Starting workflow from trigger node");
  }

  // 2. If no start/trigger node found, use the first node in the array as a fallback
  if (!currentNode && nodes.length > 0) {
    console.log(
      "No specific start or trigger node found, falling back to nodes[0]",
    );
    currentNode = nodes[0];
  }

  while (currentNode) {
    console.log(`Executing: ${currentNode.data.label}`);

    // Perform the actual action logic here (e.g., Send Message, Wait, etc.)
    let result;
    if (
      currentNode.type === "action" &&
      (currentNode.data.subType === "delay" ||
        currentNode.data.subType === "rest_api" ||
        currentNode.data.subType === "ai_composer")
    ) {
      // Delay Action Node Dont perform any action right now
      result = true;
    } else {
      result = await performNodeAction({ node: currentNode, ...rest });
    }

    // 2. Find the Next Node
    let nextEdge;

    if (currentNode.type === "condition") {
      // Branching logic: result of performNodeAction determines 'true' or 'false'
      const handleToFollow = result ? "true" : "false";
      nextEdge = edges.find(
        (e) => e.source === currentNode.id && e.sourceHandle === handleToFollow,
      );
    } else {
      // Sequential logic: just find the next connected node
      nextEdge = edges.find((e) => e.source === currentNode.id);
    }

    console.log({ currentNode, nextEdge });

    //3. If Delay Action Node
    if (currentNode.type === "action" && currentNode.data.subType === "delay") {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }
      const delayTime = workflowAction.parameters.delayTime || 0; // Default 1 second
      const delayFormat =
        workflowAction.parameters.delayFormat || "milliseconds";
      const delayInMs = calculateDelayInMs(delayTime, delayFormat);

      console.log({ delayTime, delayFormat, delayInMs });

      // 1. Make an entry in Workflow History or update existing entry
      let history;
      if (rest?.historyId) {
        history = await WorkflowHistory.findById(rest.historyId);
        history.status = "waiting";
        await history.save();
      } else {
        history = await WorkflowHistory.create({
          workflowId: workflowAction.workflowId,
          actionId,
          status: "waiting",
          type: "action",
          executedAt: new Date(),
        });
      }

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      if (!nextNodeId) {
        console.log("No next node after delay, workflow finishes");
        break;
      }

      // 4. Create a job in the delayActionQueue
      const delayActionJob = await delayActionQueue.add(
        "delay",
        {
          ...currentNode.data,
          delayInMs,
          historyId: history._id,
          nodes, // pass full nodes
          edges, // pass full edges
          startNodeId: nextNodeId, // resume from the target of the next edge
          ...rest, // pass original payload
        },
        {
          delay: delayInMs,
          removeOnComplete: true,
        },
      );
      break;
    }

    // 4. If REST API Action Node
    if (
      currentNode.type === "action" &&
      currentNode.data.subType === "rest_api"
    ) {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // 1. Make an entry in Workflow History or update existing entry
      let history;
      if (rest?.historyId) {
        history = await WorkflowHistory.findById(rest.historyId);
        history.status = "waiting";
        await history.save();
      } else {
        history = await WorkflowHistory.create({
          workflowId: workflowAction.workflowId,
          actionId,
          status: "waiting",
          type: "action",
          executedAt: new Date(),
        });
      }

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      history.payload = {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      };
      await history.save();

      if (!nextNodeId) {
        console.log("No next node after rest_api, workflow finishes");
        break;
      }

      // 4. Create a job in the restApiActionQueue
      const restApiActionJob = await restApiActionQueue.add("rest_api", {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      });
      break;
    }

    // 5. If AI Composer Action Node
    if (
      currentNode.type === "action" &&
      currentNode.data.subType === "ai_composer"
    ) {
      const actionId = currentNode.data.id;
      const workflowAction = await WorkflowAction.findById(actionId);
      if (!workflowAction) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // 1. Make an entry in Workflow History or update existing entry
      let history;
      if (rest?.historyId) {
        history = await WorkflowHistory.findById(rest.historyId);
        history.status = "waiting";
        await history.save();
      } else {
        history = await WorkflowHistory.create({
          workflowId: workflowAction.workflowId,
          actionId,
          status: "waiting",
          type: "action",
          executedAt: new Date(),
        });
      }

      // 3. Prepare resumption from the next node
      const nextNodeId = nextEdge ? nextEdge.target : null;

      history.payload = {
        ...currentNode.data,
        historyId: history._id,
        nodes, // pass full nodes
        edges, // pass full edges
        startNodeId: nextNodeId, // resume from the target of the next edge
        ...rest, // pass original payload
      };
      await history.save();

      if (!nextNodeId) {
        console.log("No next node after ai_composer, workflow finishes");
        break;
      }

      // 4. Create a job in the aiComposerActionQueue
      const aiComposerActionJob = await aiComposerActionQueue.add(
        "ai_composer",
        {
          ...currentNode.data,
          historyId: history._id,
          nodes, // pass full nodes
          edges, // pass full edges
          startNodeId: nextNodeId, // resume from the target of the next edge
          ...rest, // pass original payload
        },
      );
      break;
    }

    // 4. Move to the next node or stop if no more edges
    if (nextEdge) {
      currentNode = nodes.find((n) => n.id === nextEdge.target);
    } else {
      currentNode = null; // Workflow finished
    }
  }
}

export const performNodeAction = async ({ node, ...rest }) => {
  const { type, data } = node;
  console.log({ type, data });

  switch (type) {
    case "trigger":
      // Handle trigger actions (e.g., start a conversation)
      return await handleTriggerAction({ data, ...rest });
    case "condition":
      // Evaluate condition logic (e.g., check if a field is present)
      return await evaluateCondition({ data, ...rest });
    case "action":
      // Perform an action (e.g., send a message, update a field)
      return await executeAction({ data, ...rest });
    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
};

export const handleTriggerAction = async ({ data: triggerData, ...rest }) => {
  const { id: triggerId } = triggerData;
  const trigger = await WorkflowTrigger.findById(triggerId);
  const workflow = await Workflow.findById(trigger.workflowId);

  if (!workflow) {
    throw new Error(`Workflow not found: ${trigger.workflowId}`);
  }

  // Make an entry in Workflow History
  const history = await WorkflowHistory.create({
    workflowId: workflow._id,
    triggerId: trigger._id,
    type: "trigger",
    status: "completed",
    executedAt: new Date(),
    ...(trigger.type === "webhook_received" && {
      response: rest.payload || {},
    }),
  });
  // Logic to start a conversation or send a message
  return { success: true, message: "Trigger action performed" };
};

export const evaluateCondition = async ({ data: conditionData, ...rest }) => {
  const { label, subType, id: conditionId } = conditionData;
  const workflowCondition = await WorkflowCondition.findById(conditionId);

  if (!workflowCondition) {
    throw new Error(`Condition not found: ${conditionId}`);
  }
  const workflow = await Workflow.findById(workflowCondition.workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowCondition.workflowId}`);
  }

  const history = await WorkflowHistory.create({
    workflowId: workflow._id,
    conditionId: workflowCondition._id,
    type: "condition",
    status: "in-progress",
    executedAt: new Date(),
  });

  const conditions = workflowCondition.conditions;

  // Evaluate the conditions based on the workflow condition type
  if (workflowCondition.type === "if_else") {
    // For if_else type, we need to evaluate all condition groups
    const result = await evaluateIfElseConditions({ conditions, ...rest });
    // Update Workflow History with result
    await WorkflowHistory.findByIdAndUpdate(history._id, {
      status: "completed",
      conditionResult: result,
    });
    return result;
  } else if (workflowCondition.type === "filter") {
    // For filter type, we might have different logic
    const result = await evaluateFilterConditions({ conditions, ...rest });
    // Update Workflow History with result
    await WorkflowHistory.findByIdAndUpdate(history._id, {
      status: "completed",
      conditionResult: result,
    });
    return result;
  }

  return false;
};

const evaluateIfElseConditions = async ({ conditions, ...rest }) => {
  // For if_else type, we have an array of condition groups
  // Each group has andConditions and orConditions
  const leadPayload = rest.leadId ? await getLeadDetails(rest.leadId) : {};
  const patientPayload = rest.patientId
    ? await getPatientDetails(rest.patientId)
    : {};
  const messagePayload = rest.messageId
    ? await getMessageDetails(rest.messageId)
    : {};
  const appointmentPayload = rest.appointmentId
    ? await getAppointmentDetails(rest.appointmentId)
    : {};
  const systemPayload = getSystemDetails(rest.systemId);

  for (const conditionGroup of conditions) {
    const { andConditions = [], orConditions = [] } = conditionGroup;

    // Evaluate AND conditions (all must be true)
    const andResult = evaluateAndConditions({
      conditions: andConditions,
      leadPayload,
      patientPayload,
      messagePayload,
      appointmentPayload,
      systemPayload,
      ...rest,
    });

    // Evaluate OR conditions (at least one must be true)
    const orResult = evaluateOrConditions({
      conditions: orConditions,
      leadPayload,
      patientPayload,
      messagePayload,
      appointmentPayload,
      systemPayload,
      ...rest,
    });

    // If there are both AND and OR conditions, we need to combine them
    // This depends on your business logic. Here's one approach:
    if (andConditions.length > 0 && orConditions.length > 0) {
      // If both exist, both groups must be satisfied
      return andResult && orResult;
    } else if (andConditions.length > 0) {
      // Only AND conditions exist
      return andResult;
    } else if (orConditions.length > 0) {
      // Only OR conditions exist
      return orResult;
    }
  }

  // If no conditions, return false or true based on your requirement
  return true;
};

const evaluateFilterConditions = async ({ conditions, ...rest }) => {
  // For filter type, you might want to evaluate all conditions with AND logic
  // or different logic based on your requirements
  const leadPayload = rest.leadId ? await getLeadDetails(rest.leadId) : {};
  const patientPayload = rest.patientId
    ? await getPatientDetails(rest.patientId)
    : {};
  const messagePayload = rest.messageId
    ? await getMessageDetails(rest.messageId)
    : {};
  const appointmentPayload = rest.appointmentId
    ? await getAppointmentDetails(rest.appointmentId)
    : {};
  const systemPayload = getSystemDetails(rest.systemId);

  for (const conditionGroup of conditions) {
    const { andConditions = [], orConditions = [] } = conditionGroup;

    // Example: For filter, maybe we want all AND conditions to be true
    // and at least one OR condition to be true
    const andResult = evaluateAndConditions({
      conditions: andConditions,
      leadPayload,
      patientPayload,
      messagePayload,
      appointmentPayload,
      systemPayload,
      ...rest,
    });
    const orResult = evaluateOrConditions({
      conditions: orConditions,
      leadPayload,
      patientPayload,
      messagePayload,
      appointmentPayload,
      systemPayload,
      ...rest,
    });

    if (andConditions.length > 0 && orConditions.length > 0) {
      return andResult && orResult;
    } else if (andConditions.length > 0) {
      return andResult;
    } else if (orConditions.length > 0) {
      return orResult;
    }
  }

  return false;
};

const evaluateAndConditions = ({ conditions, ...rest }) => {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    return evaluateSingleCondition({ condition, ...rest });
  });
};

const evaluateOrConditions = ({ conditions, ...rest }) => {
  if (conditions.length === 0) return false;

  return conditions.some((condition) => {
    return evaluateSingleCondition({ condition, ...rest });
  });
};

const evaluateSingleCondition = ({ condition, ...rest }) => {
  let { field, operator, value } = condition;

  const webhookPayload = rest.payload || {};
  const restApiPayload = rest.api_response || {};

  const leadPayload = rest.leadPayload || {};
  const patientPayload = rest.patientPayload || {};
  const messagePayload = rest.messagePayload || {};
  const appointmentPayload = rest.appointmentPayload || {};
  const systemPayload = rest.systemPayload || {};

  // Replace with webhook payload
  field = replaceVariableInString(field, "lead", webhookPayload);
  value = replaceVariableInString(value, "lead", webhookPayload);

  // Replace with rest api response
  field = replaceVariableInString(field, "rest_api", restApiPayload);
  value = replaceVariableInString(value, "rest_api", restApiPayload);

  // Replace with lead payload
  field = replaceVariableInString(field, "lead", leadPayload);
  value = replaceVariableInString(value, "lead", leadPayload);

  // Replace with patient payload
  field = replaceVariableInString(field, "patient", patientPayload);
  value = replaceVariableInString(value, "patient", patientPayload);

  // Replace with message payload
  field = replaceVariableInString(field, "incoming_message", messagePayload);
  value = replaceVariableInString(value, "incoming_message", messagePayload);

  // Replace with appointment payload
  field = replaceVariableInString(field, "appointment", appointmentPayload);
  value = replaceVariableInString(value, "appointment", appointmentPayload);

  // Replace with system payload
  field = replaceVariableInString(field, "system", systemPayload);
  value = replaceVariableInString(value, "system", systemPayload);

  console.log({
    field,
    operator,
    value,
  });

  //   Evaluate the condition based on the field, operator, and value
  //   This is a placeholder for actual evaluation logic
  //   You would need to implement the logic based on your data structure

  /*
    eg: 
    field: "{{lead.age}}"
    operator: "greater_than"
    value: 

    field: "{{lead.email}}"
    operator: "contains"
    value: "@example.com" or it can be any string or a variable
  */

  // Here you would implement the actual evaluation logic
  // based on your field values (this depends on what you're evaluating against)

  switch (operator) {
    case "equal":
      return field === value || parseFloat(field) === parseFloat(value);

    case "not_equal":
      return field !== value && parseFloat(field) !== parseFloat(value);

    case "contains":
      return (
        field.includes(value) ||
        field?.toLowerCase().includes(value?.toLowerCase())
      );

    case "not_contains":
      return (
        !field.includes(value) &&
        !field?.toLowerCase().includes(value?.toLowerCase())
      );

    case "exists":
      return field !== undefined && field !== null;

    case "not_exists":
      return field === undefined || field === null;

    case "is_empty":
      return field === "" || field === null || field === undefined;

    case "is_not_empty":
      return field !== "" && field !== null && field !== undefined;

    case "starts_with":
      return field.startsWith(value);

    case "not_starts_with":
      return !field.startsWith(value);

    case "ends_with":
      return field.endsWith(value);

    case "not_ends_with":
      return !field.endsWith(value);

    case "less_than":
      return parseFloat(field) < parseFloat(value);

    case "greater_than":
      return parseFloat(field) > parseFloat(value);

    case "less_than_or_equal":
      return parseFloat(field) <= parseFloat(value);

    case "greater_than_or_equal":
      return parseFloat(field) >= parseFloat(value);

    default:
      return false;
  }
};

export const executeAction = async ({ data: actionData, ...rest }) => {
  const { subType, id: actionId } = actionData;
  console.log({ actionData: JSON.stringify(actionData) });
  const action = await WorkflowAction.findById(actionId);

  if (!action) {
    throw new Error(`Action not found: ${actionId}`);
  }
  const workflow = await Workflow.findById(action.workflowId);

  if (!workflow) {
    throw new Error(`Workflow not found: ${action.workflowId}`);
  }

  // 1. Make an entry in Workflow History or update existing entry in case of retry
  let history;
  if (rest?.historyId) {
    history = await WorkflowHistory.findById(rest.historyId);
    history.status = "waiting";
    await history.save();
  } else {
    history = await WorkflowHistory.create({
      workflowId: workflow._id,
      actionId: actionId,
      type: "action",
      status: "in-progress",
    });
    history.payload = {
      // for retry purpose
      ...rest,
      ...actionData,
      historyId: history._id,
    };
    await history.save();
  }

  // Logic to perform the action (e.g., send a message, update a field)
  switch (subType) {
    case "send_whatsapp":
      return await sendWhatsappActionQueue.add("send_whatsapp", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "send_email":
      return await sendEmailActionQueue.add("send_email", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "send_sms":
      return await sendSmsActionQueue.add("send_sms", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "rest_api":
      return await restApiActionQueue.add("rest_api", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "add_to_segment":
      return await addToSegmentActionQueue.add("add_to_segment", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "assign_owner":
      return await assignOwnerActionQueue.add("assign_owner", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "add_tag":
      return await addTagActionQueue.add("add_tag", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "ai_composer":
      return await aiComposerActionQueue.add("ai_composer", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
    case "book_appointment": {
      console.log("Adding to bookAppointmentActionQueue: ", actionData);
      const job = await bookAppointmentActionQueue.add("book_appointment", {
        ...rest,
        ...actionData,
        historyId: history._id,
      });
      console.log(`Job added to bookAppointmentActionQueue with ID: ${job.id}`);
      return job;
    }
    default:
      return { success: true, message: "Action performed" };
  }
};

// execute retry action
export const executeRetryAction = async ({ ...rest }) => {
  const { subType, id: actionId } = rest;
  console.log({ rest });
  const action = await WorkflowAction.findById(actionId);

  if (!action) {
    throw new Error(`Action not found: ${actionId}`);
  }
  const workflow = await Workflow.findById(action.workflowId);

  if (!workflow) {
    throw new Error(`Workflow not found: ${action.workflowId}`);
  }

  // 1. Make an entry in Workflow History or update existing entry in case of retry
  let history;
  if (rest?.historyId) {
    history = await WorkflowHistory.findById(rest.historyId);
    history.status = "in-progress";
    history.error = "";
    history.retryCount++;
    await history.save();
  } else {
    history = await WorkflowHistory.create({
      workflowId: workflow._id,
      actionId: actionId,
      type: "action",
      status: "in-progress",
      error: "",
    });
    history.payload = {
      // for retry purpose
      ...rest,
      historyId: history._id,
    };
    await history.save();
  }

  // Logic to perform the action (e.g., send a message, update a field)
  switch (subType) {
    case "send_whatsapp":
      return await sendWhatsappActionQueue.add("send_whatsapp", {
        ...rest,
        historyId: history._id,
      });
    case "send_email":
      return await sendEmailActionQueue.add("send_email", {
        ...rest,
        historyId: history._id,
      });
    case "send_sms":
      return await sendSmsActionQueue.add("send_sms", {
        ...rest,
        historyId: history._id,
      });
    case "rest_api":
      return await restApiActionQueue.add("rest_api", {
        ...rest,
        historyId: history._id,
      });
    case "add_to_segment":
      return await addToSegmentActionQueue.add("add_to_segment", {
        ...rest,
        historyId: history._id,
      });
    case "assign_owner":
      return await assignOwnerActionQueue.add("assign_owner", {
        ...rest,
        historyId: history._id,
      });
    case "add_tag":
      return await addTagActionQueue.add("add_tag", {
        ...rest,
        historyId: history._id,
      });
    case "ai_composer":
      return await aiComposerActionQueue.add("ai_composer", {
        ...rest,
        historyId: history._id,
      });
    case "book_appointment": {
      console.log("Adding to bookAppointmentActionQueue: ", actionData);
      const job = await bookAppointmentActionQueue.add("book_appointment", {
        ...rest,
        historyId: history._id,
      });
      console.log(`Job added to bookAppointmentActionQueue with ID: ${job.id}`);
      return job;
    }
    default:
      return { success: true, message: "Action performed" };
  }
};

export const calculateDelayInMs = (delayTime, delayFormat) => {
  if (delayFormat === "seconds") {
    return delayTime * 1000;
  } else if (delayFormat === "minutes") {
    return delayTime * 60 * 1000;
  } else if (delayFormat === "hours") {
    return delayTime * 60 * 60 * 1000;
  } else if (delayFormat === "days") {
    return delayTime * 24 * 60 * 60 * 1000;
  } else {
    return delayTime; // Default to milliseconds
  }
};

// Replacing variables utilities
export const replaceVariableInObject = (
  obj,
  moduleName = "",
  moduleData = {},
) => {
  // Handle primitive values
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings - variable replacement
  if (typeof obj === "string") {
    return obj.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      const parts = field.trim().split(".");

      // Check if module matches
      if (parts[0] === moduleName) {
        const fieldPath = parts.slice(1).join(".");

        // Safe value extraction
        let value = moduleData;
        for (const key of fieldPath.split(".")) {
          if (value && typeof value === "object" && key in value) {
            value = value[key];
          } else {
            return match; // Path not found
          }
        }

        return value !== undefined && value !== null ? String(value) : match;
      }

      return match;
    });
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      replaceVariableInObject(item, moduleName, moduleData),
    );
  }

  // Handle objects
  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceVariableInObject(value, moduleName, moduleData);
    }
    return result;
  }

  // Handle numbers, booleans, etc.
  return obj;
};

export const replaceVariableInString = (
  str,
  moduleName = "",
  moduleData = {},
) => {
  if (typeof str !== "string") {
    return str;
  }

  return str.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
    const trimmedField = field.trim();

    // Check if this is a numeric-only placeholder like {{1}}, {{2}}, etc.
    const isNumericPlaceholder = /^\d+$/.test(trimmedField);

    if (isNumericPlaceholder) {
      // For numeric placeholders, check moduleData directly
      if (moduleData[trimmedField] !== undefined) {
        return moduleData[trimmedField];
      }
      // Also check with the original match {{1}}
      if (moduleData[match] !== undefined) {
        return moduleData[match];
      }
      return match;
    }

    // Original logic for moduleName.field pattern
    const parts = trimmedField.split(".");

    if (parts[0] === moduleName) {
      const fieldPath = parts.slice(1).join(".");
      const value = fieldPath
        .split(".")
        .reduce(
          (data, key) => (data && data[key] !== undefined ? data[key] : match),
          moduleData,
        );
      return value !== undefined ? value : match;
    }

    return match;
  });
};
// ------------------------ GET Lead Details ------------------------ //
export const getLeadDetails = async (leadId) => {
  let leadData = {};
  try {
    const lead = await Lead.findById(leadId).exec();
    if (!lead) {
      console.log("Lead not found");
      return leadData;
    }
    const clinic = await Clinic.findById(lead.clinicId).exec();
    leadData = {
      _id: lead._id,
      clinicId: lead.clinicId,
      clinicName: clinic?.name || "",
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      gender: lead.gender,
      age: lead.age,
      source: lead.source,
      customSource: lead.customSource || "",
      offerTag: lead.offerTag || "",
      status: lead.status,
      customStatus: lead.customStatus || "",
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
    return leadData;
  } catch (error) {
    console.log(`Error fetching lead details: ${error.message}`);
    return leadData;
  }
};

export const getMessageDetails = async (messageId) => {
  let messageData = {};
  try {
    const message = await Message.findById(messageId).exec();
    if (!message) {
      console.log("Message not found");
      return messageData;
    }
    messageData = {
      _id: message._id,
      clinicId: message.clinicId,
      leadId: message.leadId,
      message: message.content,
      type: message.messageType,
      channel: message.channel,
      direction: message.direction,
      subject: message.subject,
      preheader: message.preheader,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      status: "incoming",
      source: message.source,
      error_code: message.errorCode,
      error_message: message.errorMessage,
      sentAt: message.updatedAt,
      receivedAt: message.createdAt,
    };
    return messageData;
  } catch (error) {
    console.log(`Error fetching message details: ${error.message}`);
    return messageData;
  }
};

export const getPatientDetails = async (patientId) => {
  let patientData = {};
  try {
    const patient = await PatientRegistration.findById(patientId).exec();
    if (!patient) {
      console.log("Patient not found");
      return patientData;
    }

    patientData = {
      _id: patient._id,
      invoiceNumber: patient.invoiceNumber,
      invoicedDate: patient.invoicedDate,
      invoicedBy: patient.invoicedBy,
      userId: patient.userId,
      clinicId: patient.clinicId,
      leadId: patient.leadId,

      // Patient Details
      emrNumber: patient.emrNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
      name: `${patient.firstName} ${patient.lastName}`.trim(), // Full name for compatibility
      gender: patient.gender,
      email: patient.email,
      phone: patient.mobileNumber, // Map mobileNumber to phone for compatibility
      mobileNumber: patient.mobileNumber,
      referredBy: patient.referredBy,
      patientType: patient.patientType,

      // Insurance Section
      insurance: patient.insurance,
      insuranceType: patient.insuranceType,
      advanceGivenAmount: patient.advanceGivenAmount,
      coPayPercent: patient.coPayPercent,
      needToPay: patient.needToPay,
      advanceClaimStatus: patient.advanceClaimStatus,
      advanceClaimReleaseDate: patient.advanceClaimReleaseDate,
      advanceClaimReleasedBy: patient.advanceClaimReleasedBy,
      advanceClaimCancellationRemark: patient.advanceClaimCancellationRemark,

      // Status & Notes
      membership: patient.membership,
      membershipStartDate: patient.membershipStartDate,
      membershipEndDate: patient.membershipEndDate,
      membershipId: patient.membershipId,
      package: patient.package,
      packageId: patient.packageId,
      notes: patient.notes,
      rejectionNote: patient.rejectionNote,

      // Payment History
      paymentHistory: patient.paymentHistory,
      memberships: patient.memberships,
      packages: patient.packages,
      membershipTransfers: patient.membershipTransfers,
      packageTransfers: patient.packageTransfers,
      hasTransferredOut: patient.hasTransferredOut,
      transferredOutMembershipPriority:
        patient.transferredOutMembershipPriority,

      // Legacy fields for backward compatibility
      source: patient.source, // If source field exists, otherwise null
      customSource: patient.customSource || "",
      offerTag: patient.offerTag || "",
      status: patient.status,
      customStatus: patient.customStatus || "",

      // Timestamps
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };

    return patientData;
  } catch (error) {
    console.log(`Error fetching patient details: ${error.message}`);
    return patientData;
  }
};

export const getPatientByLeadId = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return null;

    // 1. If lead already has a patientId, return that patient
    if (lead.patientId) {
      const patient = await PatientRegistration.findById(lead.patientId);
      if (patient) return patient;
    }

    // 2. Check if patient with same mobile number exists (as per add-patient.js logic)
    const existingPatient = await PatientRegistration.findOne({
      mobileNumber: lead.phone,
    });

    if (existingPatient) {
      // Link existing patient to lead
      lead.patientId = existingPatient._id;
      await lead.save();
      return existingPatient;
    }

    // 3. Create new patient (similar to add-patient.js)
    // Generate invoice number
    let invoiceNumber;
    let attempts = 0;
    let invoiceExists = true;
    while (invoiceExists && attempts < 10) {
      invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      invoiceExists = await PatientRegistration.findOne({ invoiceNumber });
      attempts++;
    }

    // Generate EMR number
    const finalEmrNumber = await generateEmrNumber();

    // Handle referral
    let referredByName = lead.referredBy || "";
    let finalReferredById = lead.referredById || null;
    if (finalReferredById) {
      try {
        const ref = await Referral.findById(finalReferredById).lean();
        if (ref) {
          referredByName = [ref.firstName, ref.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          finalReferredById = ref._id;
        }
      } catch (err) {
        console.error("Error fetching referral in getPatientByLeadId:", err);
      }
    }

    // Create new patient
    const firstName = lead.name.split(" ")[0] || "";
    const lastName = lead.name.split(" ")[1] || "";
    const patientData = {
      invoiceNumber,
      invoicedDate: new Date(),
      invoicedBy: "Workflow Engine",
      userId: lead.ownerId || null, // Or some default
      emrNumber: finalEmrNumber,
      firstName: firstName,
      lastName: lastName || "",
      gender: lead.gender || "Other",
      email: lead.email || "",
      mobileNumber: lead.phone,
      referredById: finalReferredById,
      referredBy: referredByName,
      patientType: "New",
      leadId: lead._id,
    };
    const newPatient = await PatientRegistration.create(patientData);

    // Update lead with new patientId
    lead.patientId = newPatient._id;
    await lead.save();

    return newPatient;
  } catch (error) {
    console.error("Error in getPatientByLeadId:", error);
    return null;
  }
};

// Get booked appointment details
export const getAppointmentDetails = async (appointmentId) => {
  let appointmentData = {};
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId")
      .populate("doctorId")
      .populate("roomId")
      .exec();
    appointmentData = {
      patientId: appointment.patientId?.toString(),
      doctorId: appointment.doctorId?.toString(),
      roomId: appointment.roomId?.toString(),
      patientName:
        `${appointment.patientId?.firstName || ""} ${appointment.patientId?.lastName || ""}`?.trim() ||
        "",
      patientFirstName:
        `${appointment.patientId?.firstName || "" || ""}`?.trim() || "",
      patientLastName:
        `${appointment.patientId?.lastName || "" || ""}`?.trim() || "",
      patientGender:
        `${appointment.patientId?.gender || "" || ""}`?.trim() || "",
      patientEmail: `${appointment.patientId?.email || "" || ""}`?.trim() || "",
      patientPhone:
        `${appointment.patientId?.mobileNumber || "" || ""}`?.trim() || "",
      patientMobileNumber:
        `${appointment.patientId?.mobileNumber || "" || ""}`?.trim() || "",
      patientType:
        `${appointment.patientId?.patientType || "" || ""}`?.trim() || "",
      doctorName: appointment.doctorId?.name || "",
      doctorEmail: appointment.doctorId?.email || "",
      doctorPhone: appointment.doctorId?.phone || "",
      doctorGender: appointment.doctorId?.gender || "",
      doctorAge: appointment.doctorId?.age || "",
      doctorDob: appointment.doctorId?.dateOfBirth || "",
      roomName: appointment.roomId?.name || "",
      id: appointment._id?.toString(),
      date: appointment.startDate?.toISOString()?.split("T")[0],
      time: `${appointment.fromTime || ""} - ${appointment.toTime || ""}` || "",
      followType: appointment.appointmentFollowType,
      status: appointment.status,
      cancellationReason: appointment.cancellationReason,
      referral: appointment.referral,
      notes: appointment.notes,
      treatment: appointment.treatment,
    };
    if (!appointmentData) return null;
    return appointmentData;
  } catch (error) {
    console.error("Error in getBookedAppointmentDetails:", error);
    return appointmentData;
  }
};

// Get system variables
export const getSystemDetails = () => {
  return {
    date: new Date().toISOString()?.split("T")[0],
    time: new Date().toISOString()?.split("T")[1]?.split("Z")[0],
    user: "System",
  };
};
