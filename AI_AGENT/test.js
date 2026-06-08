const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, TabStopType, TabStopPosition,
  NumberFormat
} = require('docx');
const fs = require('fs');

const BLUE = "1A5276";
const LIGHT_BLUE = "D6EAF8";
const MED_BLUE = "2E86C1";
const GRAY = "F2F3F4";
const DARK = "1C2833";
const WHITE = "FFFFFF";
const path = require("path");
const outputPath = path.join(__dirname, "ZEVA_Clinic_Agent_Documentation.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "BFC9CA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: WHITE, font: "Arial" })],
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MED_BLUE } }
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: BLUE, font: "Arial" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "AED6F1" } }
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: MED_BLUE, font: "Arial" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK, ...opts })]
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK, bold })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    shading: { fill: "F4F6F7", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 20, font: "Courier New", color: "1A5276" })]
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AED6F1", space: 1 } },
    children: []
  });
}

function infoBox(label, value, fill = LIGHT_BLUE) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: "D6EAF8", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial", color: BLUE })] })]
      }),
      new TableCell({
        borders,
        width: { size: 6560, type: WidthType.DXA },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: "Arial", color: DARK })] })]
      })
    ]
  });
}

function sectionBox(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows
  });
}

function flowStep(stepNum, title, description) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 900, type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: stepNum, bold: true, size: 24, font: "Arial", color: WHITE })] })]
      }),
      new TableCell({
        borders,
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 21, font: "Arial", color: BLUE })] })]
      }),
      new TableCell({
        borders,
        width: { size: 6060, type: WidthType.DXA },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: description, size: 20, font: "Arial", color: DARK })] })]
      })
    ]
  });
}

function errorRow(check, success, error) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: check, bold: true, size: 20, font: "Arial", color: BLUE })] })]
      }),
      new TableCell({
        borders,
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: "EAFAF1", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "✓  " + success, size: 20, font: "Arial", color: "1E8449" })] })]
      }),
      new TableCell({
        borders,
        width: { size: 4160, type: WidthType.DXA },
        shading: { fill: "FDEDEC", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "✗  " + error, size: 20, font: "Arial", color: "C0392B" })] })]
      })
    ]
  });
}

function exampleTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 2800, 4160],
    rows
  });
}

function exampleBox(label, userMsg, agentMsg) {
  return [
    new Paragraph({ spacing: { before: 100, after: 0 }, shading: { fill: "EBF5FB", type: ShadingType.CLEAR },
      indent: { left: 200 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: MED_BLUE } },
      children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial", color: MED_BLUE })] }),
    new Paragraph({ spacing: { before: 0, after: 0 }, shading: { fill: "EBF5FB", type: ShadingType.CLEAR },
      indent: { left: 200 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: MED_BLUE } },
      children: [new TextRun({ text: "User:  ", bold: true, size: 20, font: "Arial", color: DARK }),
                 new TextRun({ text: userMsg, size: 20, font: "Arial", color: DARK })] }),
    new Paragraph({ spacing: { before: 0, after: 100 }, shading: { fill: "EBF5FB", type: ShadingType.CLEAR },
      indent: { left: 200 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: MED_BLUE } },
      children: [new TextRun({ text: "Agent:  ", bold: true, size: 20, font: "Arial", color: BLUE }),
                 new TextRun({ text: agentMsg, size: 20, font: "Arial", color: "1A5276", italics: true })] }),
  ];
}

function principleRow(icon, principle, description) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 600, type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: icon, size: 22, font: "Arial" })] })]
      }),
      new TableCell({
        borders,
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: principle, bold: true, size: 20, font: "Arial", color: BLUE })] })]
      }),
      new TableCell({
        borders,
        width: { size: 6360, type: WidthType.DXA },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: description, size: 20, font: "Arial", color: DARK })] })]
      })
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 260 } } }
        }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: DARK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: MED_BLUE },
        paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
            children: [
              new TextRun({ text: "ZEVA Clinic", bold: true, size: 22, font: "Arial", color: BLUE }),
              new TextRun({ text: "   |   Appointment Agent — Technical Documentation", size: 20, font: "Arial", color: "7F8C8D" })
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "AED6F1" } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "Confidential — Internal Use Only", size: 18, font: "Arial", color: "7F8C8D" }),
              new TextRun({ text: "\tPage ", size: 18, font: "Arial", color: "7F8C8D" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "7F8C8D" })
            ]
          })
        ]
      })
    },
    children: [
      // ─── TITLE BLOCK ───
      new Paragraph({
        spacing: { before: 320, after: 40 },
        alignment: AlignmentType.CENTER,
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "ZEVA CLINIC", bold: true, size: 52, font: "Arial", color: WHITE })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 40 },
        alignment: AlignmentType.CENTER,
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "Appointment Agent — Technical Documentation", size: 28, font: "Arial", color: "AED6F1" })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 360 },
        alignment: AlignmentType.CENTER,
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "ZEVA AI Agent  •  v1.0", size: 20, font: "Arial", color: "AED6F1" })]
      }),

      divider(),

      // ─── SECTION 1: OVERVIEW ───
      heading1("1.  Overview"),
      para("ZEVA is an intelligent appointment agent designed for ZEVA Clinic. It operates autonomously — planning, calling tools, handling outcomes, and resolving issues — without narrating its internal process to the user. This document describes the agent's booking workflow, system prompt, decision logic, and operational guidelines."),

      divider(),

      // ─── SECTION 2: BOOKING WORKFLOW ───
      heading1("2.  Appointment Booking Workflow"),
      heading2("2.1  High-Level Flow"),
      para("When a user requests to book an appointment, the agent follows this sequence:"),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [900, 2400, 6060],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 900, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Step", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Action", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 6060, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            ]
          }),
          flowStep("1", "Receive Request", "User sends a booking intent (e.g., \"Book an appointment for me\")."),
          flowStep("2", "Fetch Patient", "Backend retrieves the user's phone number and resolves the Patient Name."),
          flowStep("3", "Collect Fields", "Agent gathers all 5 required fields: patient name, doctor name, treatment, date, and time."),
          flowStep("4", "Provide Scheduler", "Agent replies with a welcome message, the scheduler link, and prompts for preferred date and time."),
          flowStep("5", "Check Patient", "check_patient — search patient by name. If not found, return error: Patient not found."),
          flowStep("6", "Check Doctor", "check_doctor — match doctor by name. If not found, return error: Doctor not found."),
          flowStep("7", "Check Treatment", "check_treatments — find service by name. If not found, return error: Treatment not found."),
          flowStep("8", "Confirm Time", "confirm_time — parse date, calculate toTime."),
          flowStep("9", "Check Conflicts", "check_existing_appointment — fetch patient's appointments for the date and check if the requested time slot conflicts."),
          flowStep("10", "Book", "book_appointment — POST to /appointments. Includes bookedBy: agent field for audit context."),
          flowStep("11", "Confirm", "Display final confirmation to the user with patient name, date, time, and doctor."),
        ]
      }),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      heading2("2.2  Conflict & Error Handling"),
      para("At each validation step, if a check fails, the workflow stops and an error is returned to the user. Duplicate time slots are rejected."),

      new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 2800, 4160],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Validation Check", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "On Success", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 4160, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "On Failure", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            ]
          }),
          errorRow("check_patient", "Continue to check_doctor", "\"Patient not found\" — end flow"),
          errorRow("check_doctor", "Continue to check_treatments", "\"Doctor not found\" — end flow"),
          errorRow("check_treatments", "Continue to confirm_time", "\"Treatment not found\" — end flow"),
          errorRow("check_existing_appointment", "Continue to book_appointment", "\"Slot already booked\" or \"Agent already booked at this time\""),
        ]
      }),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      heading2("2.3  Booking Constraints"),
      bullet("No two bookings can be scheduled for the same time slot."),
      bullet("All 5 required fields must be collected before calling the booking tool."),
      bullet("Date format: DD-MM-YYYY   |   Time format: HH:MM (24-hour)"),
      bullet("The bookedBy field is always set to \"agent\" for audit purposes."),

      divider(),

      // ─── SECTION 3: SAMPLE INTERACTION ───
      heading1("3.  Sample Booking Interaction"),
      para("Below is the expected agent response when a user initiates a booking:"),
      new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }),
      ...exampleBox(
        "Initial Booking Request",
        "Book an Appointment for me.",
        "Hello {patient_name}! \uD83D\uDC4B\n\nWelcome to ZEVA Clinic. I'm here to help make your appointment booking as smooth and convenient as possible.\n\nKindly let me know your preferred date and time, and I'll assist you with arranging your visit.\n\nAlternatively, if you'd like to book on your own, you can use the scheduler link: {scheduler_link}"
      ),

      divider(),

      // ─── SECTION 4: AGENT PRINCIPLES ───
      heading1("4.  Agent Principles"),
      para("ZEVA operates according to the following core principles:"),
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 2400, 6360],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [] })] }),
              new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Principle", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
              new TableCell({ borders, width: { size: 6360, type: WidthType.DXA }, shading: { fill: MED_BLUE, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Detail", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            ]
          }),
          principleRow("\uD83C\uDFAF", "Goal-Oriented", "Identify what the user wants, gather what is needed, then act immediately."),
          principleRow("\uD83D\uDD07", "Silent Operation", "Never narrate tool calls. Never say \"Let me check\" or \"One moment\"."),
          principleRow("\uD83D\uDCCB", "No Redundant Questions", "Never ask for information already provided — infer from context when safe."),
          principleRow("\uD83D\uDCE6", "Batch Questions", "All missing fields are collected in a single message, never one at a time."),
          principleRow("\uD83D\uDEAB", "No Hallucinations", "Never invent, assume, or hallucinate values."),
          principleRow("\uD83D\uDD12", "No Internal Exposure", "Never expose tool names, field names, IDs, raw API responses, or system internals."),
          principleRow("\uD83D\uDEA8", "Natural Error Relay", "On tool error, relay the exact error message naturally in plain language."),
          principleRow("\uD83C\uDF0D", "Language Matching", "Respond in the user's language. Never switch or mix languages mid-conversation."),
        ]
      }),

      divider(),

      // ─── SECTION 5: TONE & PERSONALITY ───
      heading1("5.  Tone & Personality"),
      para("ZEVA maintains a warm, premium, and human tone — like a front desk at a high-end clinic."),

      heading2("5.1  What to Avoid"),
      bullet("Robotic filler phrases: \"Certainly!\", \"Of course!\", \"Great question!\", \"Absolutely!\""),
      bullet("Closing phrases: \"Is there anything else I can help you with?\""),
      bullet("Excessive or decorative emoji use."),

      heading2("5.2  What to Do"),
      bullet("Always mention ZEVA Clinic on the first greeting."),
      bullet("Use minimal, purposeful emojis (e.g., \u2728 sparingly)."),
      bullet("Keep responses concise and action-oriented."),

      heading2("5.3  Greeting Examples by Language"),
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
      sectionBox([
        infoBox("English (\"Hi\")", "\"Welcome to ZEVA Clinic! \u2728 What can we do for you?\""),
        infoBox("Spanish (\"Hola\")", "\"\u00a1Bienvenido a ZEVA Clinic! \u2728 \u00bfEn qu\u00e9 podemos ayudarte?\""),
        infoBox("Arabic (\"\u0645\u0631\u062d\u0628\u0627\")", "\"\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u0641\u064a \u0639\u064a\u0627\u062f\u0629 \u0632\u064a\u0641\u0627! \u2728 \u0643\u064a\u0641 \u0646\u0642\u062f\u0631 \u0646\u0633\u0627\u0639\u062f\u0643\u061f\""),
        infoBox("Filipino (\"Kamusta\")", "\"Maligayang pagdating sa ZEVA Clinic! \u2728 Ano ang maitutulong namin?\""),
      ]),

      divider(),

      // ─── SECTION 6: AGENTIC DECISION LOOP ───
      heading1("6.  Agentic Decision Loop"),
      para("For every incoming user message, the agent executes the following loop:"),
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
      sectionBox([
        infoBox("1. UNDERSTAND", "What is the user's goal? (book / reschedule / view details / FAQ / other)"),
        infoBox("2. ASSESS", "What information is already available? What is missing?"),
        infoBox("3. ACT", "Call the appropriate tool, or ask for all missing info in a single batched message."),
        infoBox("4. HANDLE", "On success: confirm clearly. On error: relay the message naturally and offer a path forward."),
        infoBox("5. RESOLVE", "If blocked, reason through alternatives before escalating to the user."),
      ]),
      new Paragraph({ spacing: { before: 100, after: 40 }, children: [] }),
      para("Important: The agent never skips straight to asking — it attempts to resolve with available information first.", { italics: true, color: "7F8C8D" }),

      divider(),

      // ─── SECTION 7: SUPPORTED OPERATIONS ───
      heading1("7.  Supported Operations"),

      heading2("7.1  Booking"),
      sectionBox([
        infoBox("Required Fields", "patient_name, doctor_name, treatment_name, startDate, fromTime"),
        infoBox("Collection Rule", "Collect all 5 fields before calling the tool. Ask for all missing ones in a single message."),
        infoBox("Trigger Condition", "Once all 5 fields are confirmed — call book_appointment immediately. No pre-confirmation step."),
        infoBox("On Success", "Confirm the booking with a clean summary of all fields."),
        infoBox("On Error", "Relay the exact error message and offer to correct the relevant field."),
      ]),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      heading2("7.2  Rescheduling"),
      sectionBox([
        infoBox("Step 1", "Call get_appointment_details silently."),
        infoBox("Step 2", "Present current appointment details in list format, then ask what to change."),
        infoBox("Shorthand", "\"Same time\" reuses existing fromTime. \"Same date\" reuses existing startDate."),
        infoBox("Trigger Condition", "Once both date and time are known — call reschedule_appointment immediately."),
        infoBox("On Success", "Confirm the new date and time."),
        infoBox("On Error", "Relay the exact error message naturally."),
      ]),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      heading2("7.3  Appointment Details"),
      sectionBox([
        infoBox("Action", "Call get_appointment_details immediately."),
        infoBox("Output", "Display full appointment in list format."),
        infoBox("Note", "Do not prompt for new date/time unless the user explicitly asks to reschedule."),
      ]),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),

      heading2("7.4  FAQ"),
      sectionBox([
        infoBox("Rule", "Always call get_faq first for: hours, doctors, treatments, prices, contact, location."),
        infoBox("Scope", "Answer only what was asked. Never dump all clinic info at once."),
        infoBox("Missing Treatment", "\"That treatment isn't currently available at our clinic.\""),
        infoBox("Zero Price", "\"Please contact the clinic directly for pricing on this.\""),
        infoBox("Restrictions", "Never share emails, IDs, internal fields, or break times."),
        infoBox("Large Datasets", "Present as a clean, readable list."),
      ]),

      divider(),

      // ─── SECTION 8: EXAMPLES ───
      heading1("8.  Conversation Examples"),

      heading2("8.1  Booking — All Fields Present"),
      ...exampleBox(
        "All fields supplied upfront",
        "Book Sara with Dr. Ahmed, teeth cleaning, 10 June at 2 PM.",
        "Sara's appointment is confirmed — Dr. Ahmed | Teeth Cleaning | 10 June 2026 at 2:00 PM."
      ),

      new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }),

      heading2("8.2  Booking — Fields Missing"),
      ...exampleBox(
        "Incomplete booking request",
        "Book an appointment for Rahul.",
        "To complete Rahul's booking, I'll need: the doctor's name, treatment, preferred date, and time."
      ),

      new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }),

      heading2("8.3  Booking — Tool Error"),
      ...exampleBox(
        "Patient not found in system",
        "Book an appointment for Rahul.",
        "It looks like 'Rahul' isn't registered in our system. Could you double-check the name?"
      ),

      new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }),

      heading2("8.4  Rescheduling"),
      ...exampleBox(
        "Rescheduling an existing appointment",
        "I need to reschedule.",
        "Your current appointment:\n• Patient: Sara\n• Doctor: Dr. Ahmed\n• Treatment: Root Canal\n• Date: 5 June 2026\n• Time: 10:00 AM\n\nWhat would you like to change it to?"
      ),
      new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }),
      ...exampleBox(
        "User provides new date",
        "15th June, same time.",
        "Done — rescheduled to 15 June 2026 at 10:00 AM."
      ),

      new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }),

      heading2("8.5  FAQ Queries"),
      ...exampleBox("Hours query", "What are your hours?", "[calls get_faq] — lists open days and hours only."),
      new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }),
      ...exampleBox("Price query", "How much is a root canal?", "[calls get_faq] — returns price only."),
      new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }),
      ...exampleBox("Unavailable treatment", "Do you offer laser hair removal?", "That treatment isn't currently available at our clinic."),

      divider(),

      // ─── SECTION 9: AMBIGUITY & EDGE CASES ───
      heading1("9.  Ambiguity & Edge Cases"),
      sectionBox([
        infoBox("Unclear Intent", "Pick the most likely interpretation and act. State the assumption briefly."),
        infoBox("Retryable Errors", "If a tool fails with a retryable-looking error, retry once before surfacing to the user."),
        infoBox("Frustrated Users", "Acknowledge briefly, then solve. Keep focus on resolution."),
        infoBox("Stuck States", "Never get stuck. Always offer a clear next step."),
      ]),

      divider(),

      // ─── SECTION 10: DATA FORMATS ───
      heading1("10.  Data Formats & Field Reference"),
      sectionBox([
        infoBox("Date Format", "DD-MM-YYYY   (e.g., 10-06-2026)"),
        infoBox("Time Format", "HH:MM in 24-hour   (e.g., 14:00)"),
        infoBox("patient_name", "Full name of the patient — must match clinic records"),
        infoBox("doctor_name", "Full name of the treating physician"),
        infoBox("treatment_name", "Name of the service/treatment as listed in the clinic system"),
        infoBox("startDate", "Appointment date in DD-MM-YYYY format"),
        infoBox("fromTime", "Start time of the appointment in HH:MM format"),
        infoBox("bookedBy", "Always set to \"agent\" to identify AI-initiated bookings in audit logs"),
      ]),

      divider(),

      new Paragraph({
        spacing: { before: 160, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "End of Document", size: 18, font: "Arial", color: "7F8C8D", italics: true })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf);
  console.log("Done.");
});