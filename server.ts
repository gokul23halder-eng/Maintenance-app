import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with client options if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY or placeholder found. The app will use rule-based fallback diagnostics.");
}

// In-Memory Database for demonstration and runtime persistence
let tickets = [
  {
    id: "TKT-1001",
    apartmentNumber: "502",
    buildingBlock: "Block B",
    category: "Sewerage",
    severity: "High",
    status: "Under Review",
    description: "Main sewer line junction behind the building has a minor backup, causing sluggish drainage in lower floor toilets and a strong sewer gas odor around the backyard garbage enclosure.",
    contactNumber: "+1 (555) 0192-342",
    residentEmail: "b502.resident@example.com",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
    activityLogs: [
      {
        id: "log-1",
        ticketId: "TKT-1001",
        text: "Complaint registered in the portal.",
        author: "Resident (Apt 502)",
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: "log-2",
        ticketId: "TKT-1001",
        text: "Assigned for administrator verification.",
        author: "System Audit",
        timestamp: new Date(Date.now() - 3.8 * 3600000).toISOString()
      }
    ],
    diagnosis: {
      possibleCause: "Solid debris or root intrusion at the external inspection chamber junction.",
      hazardWarnings: [
        "Biohazard risk from raw sewage contact",
        "Sewer gas hazard (contains hydrogen sulfide)"
      ],
      diyMitigation: [
        "Minimize flushing toilets in Lower Block B unit",
        "Keep back yard window closed to block incoming gas odors"
      ],
      recommendedSpecialization: "Sewerage & Mainline Specialist",
      estimatedEffortHours: 3
    },
    scheduling: null
  },
  {
    id: "TKT-1002",
    apartmentNumber: "Ground Level-East",
    buildingBlock: "Block D",
    category: "External Pipe",
    severity: "Medium",
    status: "Scheduled",
    description: "Cold water riser pipe running along the external wall of Block D is showing a persistent spray-mist leak near the ground floor meter junction. Soil around the area is water-logged.",
    contactNumber: "+1 (555) 0184-592",
    residentEmail: "d.block.manager@example.com",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
    activityLogs: [
      {
        id: "log-3",
        ticketId: "TKT-1002",
        text: "External leakage reported.",
        author: "Resident Agent",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: "log-4",
        ticketId: "TKT-1002",
        text: "Technician Carlos Ruiz scheduled for site inspection.",
        author: "Admin Portal",
        timestamp: new Date(Date.now() - 22 * 3600000).toISOString()
      }
    ],
    diagnosis: {
      possibleCause: "Corrosion expansion on the joints under fluctuating exterior temperatures.",
      hazardWarnings: [
        "Slip and fall hazard due to wet paving in proximity",
        "Soil erosion risk near building footing if unchecked"
      ],
      diyMitigation: [
        "Avoid parking vehicles within 5 feet of the Block D east side exterior riser.",
        "Ensure children do not play in the saturated lawn patch."
      ],
      recommendedSpecialization: "Commercial Pipe Fitter",
      estimatedEffortHours: 1.5
    },
    scheduling: {
      technicianId: "TECH-01",
      technicianName: "Carlos Ruiz",
      scheduledTime: new Date(Date.now() + 5 * 3600000).toISOString(), // 5h in future
      notes: "Carry standard 2-inch sleeve clamps and thread sealant."
    }
  },
  {
    id: "TKT-1003",
    apartmentNumber: "405",
    buildingBlock: "Block A",
    category: "Internal Water Line",
    severity: "Emergency",
    status: "In Progress",
    description: "The flexi-hose connection under the master bathroom wash basin ruptured completely. Water is pouring onto the floor tiles and potentially leaking into Apartment 305's ceiling below.",
    contactNumber: "+1 (555) 0147-234",
    residentEmail: "jane.doe@example.com",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
    activityLogs: [
      {
        id: "log-5",
        ticketId: "TKT-1003",
        text: "Emergency ticket lodged by resident.",
        author: "Jane Doe (Resident)",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
      },
      {
        id: "log-6",
        ticketId: "TKT-1003",
        text: "AI Assistant generated instant safety tips: 'Shut off the inline angle valve under the basin immediately.'",
        author: "AI Assistant",
        timestamp: new Date(Date.now() - 1.95 * 3600000).toISOString()
      },
      {
        id: "log-7",
        ticketId: "TKT-1003",
        text: "Technician dispatched post phone conformation.",
        author: "Staff Admin",
        timestamp: new Date(Date.now() - 1.8 * 3600000).toISOString()
      },
      {
        id: "log-8",
        ticketId: "TKT-1003",
        text: "Technician Asha Patel arrived on site, commenced isolation process.",
        author: "Asha Patel (Technician)",
        timestamp: new Date(Date.now() - 1.2 * 3600000).toISOString()
      }
    ],
    diagnosis: {
      possibleCause: "Age-hardened stainless steel braided sheath fatigue on flexible supply run.",
      hazardWarnings: [
        "Water damage to hardwood and ceiling drywall below (Suite 305)",
        "Slippery wet tiled surface in master suite bathroom",
        "Potential short-circuit if water enters the floor-level outlet"
      ],
      diyMitigation: [
        "Shut off the brass angle valve under the bathroom basin immediately clockwise.",
        "Mop up standing water on tiles and use old towels to dam the master bedroom transition."
      ],
      recommendedSpecialization: "Emergency Plumber",
      estimatedEffortHours: 1
    },
    scheduling: {
      technicianId: "TECH-02",
      technicianName: "Asha Patel",
      scheduledTime: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      notes: "Resident sounds extremely distressed. Expedited response required."
    }
  },
  {
    id: "TKT-1004",
    apartmentNumber: "South Gate Inlet",
    buildingBlock: "Block C",
    category: "Drain Culvert",
    severity: "Low",
    status: "Submitted",
    description: "The concrete drainage culvert path near the southern entrance gate is heavily filled with storm debris, fallen autumn leaves, and silt buildup structure, hindering surface water clearing.",
    contactNumber: "+1 (555) 0163-122",
    residentEmail: "security.gate.south@example.com",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    activityLogs: [
      {
        id: "log-9",
        ticketId: "TKT-1004",
        text: "Silt blockage notified by duty security guard.",
        author: "Duty Guard (Staff)",
        timestamp: new Date(Date.now() - 48 * 3600000).toISOString()
      }
    ],
    diagnosis: {
      possibleCause: "Accumulation of natural leaf litter and loose road-base gravel washed down during recent rains.",
      hazardWarnings: [
        "Minor roadway hydroplaning hazard during incoming rainy spell",
        "Mosquito breeding in stagnant puddles if left uncleared"
      ],
      diyMitigation: [
        "Ensure storm grates are not overlaid by trash bins.",
        "Do not dump lawn trimmings nearby."
      ],
      recommendedSpecialization: "Groundskeeping & Drainage Maintenance",
      estimatedEffortHours: 2.5
    },
    scheduling: null
  }
];

// Technicians list
let technicians = [
  { id: "TECH-01", name: "Carlos Ruiz", specialty: "External Pipe & Masonry", phone: "+1 (555) 0192-231", status: "Available" },
  { id: "TECH-02", name: "Asha Patel", specialty: "Emergency Plumbing & Internal lines", phone: "+1 (555) 0177-449", status: "Busy" },
  { id: "TECH-03", name: "Marcus Brody", specialty: "Sewerage & Trenching Services", phone: "+1 (555) 0122-803", status: "Available" },
  { id: "TECH-04", name: "Li Na Wei", specialty: "General Drainage & Groundskeeping", phone: "+1 (555) 0155-772", status: "Off-duty" }
];

// In-Memory Notifications feed
let notifications = [
  {
    id: "NOTIF-01",
    ticketId: "TKT-1003",
    ticketCategory: "Internal Water Line",
    message: "Water line emergency on Block A, Apt 405 set to 'In Progress'. Technician Asha Patel is on site.",
    type: "status_update",
    timestamp: new Date(Date.now() - 1.2 * 3600000).toISOString(),
    read: false
  },
  {
    id: "NOTIF-02",
    ticketId: "TKT-1002",
    ticketCategory: "External Pipe",
    message: "Carlos Ruiz scheduled to repair Block D External Pipe leak tomorrow morning.",
    type: "assignment",
    timestamp: new Date(Date.now() - 22 * 3600000).toISOString(),
    read: true
  }
];

// Rule-based backup diagnostic generator in case Gemini key is missing or fails
function getFallbackDiagnosis(category: string, description: string): any {
  const cat = category.toLowerCase();
  const desc = description.toLowerCase();

  let possibleCause = "Standard wear and tear of residential infrastructure fittings.";
  let hazardWarnings = [
    "Potential moisture seepage into flooring or shared concrete walls",
    "Minor slip danger near vicinity of leak"
  ];
  let diyMitigation = [
    "Wipe up standing water with absorbing pads",
    "Identify isolating sub-valve nearby if safe to reach"
  ];
  let recommendedSpecialization = "General Maintenance technician";
  let estimatedEffortHours = 2;

  if (cat.includes("sewerage")) {
    possibleCause = desc.includes("smell") || desc.includes("odor")
      ? "Sewerage pipe seal fatigue releasing hydrogen sulfide and methane."
      : "Grease deposition or sanitary item buildup restricting flow in common waste lines.";
    hazardWarnings = [
      "Exposure to biological pathogens, coliform bacteria, and contaminants",
      "Corrosion stimulation on brass or metal plumbing nearby by sewer fumes"
    ];
    diyMitigation = [
      "Limit use of garbage disposals and stop down-drain flushing",
      "Open adjacent windows to secure continuous cross-ventilation"
    ];
    recommendedSpecialization = "Drainage & Sewerage Systems Specialist";
    estimatedEffortHours = 3.5;
  } else if (cat.includes("external pipe")) {
    possibleCause = "Galvanized joint threading corrosion or high thermal ground expansion stress.";
    hazardWarnings = [
      "Surface marsh formation and potential concrete path settling",
      "Sudden pressure dropping inside apartments served by the local riser line"
    ];
    diyMitigation = [
      "Redirect pedestrian paths away from damp external soil margins",
      "Place safety warning cones around saturated pavements"
    ];
    recommendedSpecialization = "Commercial Civil Pipe Welder";
    estimatedEffortHours = 2.5;
  } else if (cat.includes("internal water line")) {
    possibleCause = desc.includes("under sink") || desc.includes("basin")
      ? "Rupture of flexible polymer hose tailpiece or cracked locknut."
      : "Thermal expansion damage to concealed copper coupling.";
    hazardWarnings = [
      "Severe structural decay and ceiling panel collapse risks for lower flats",
      "Substandard electrical water contamination inside low-lying cabinetry"
    ];
    diyMitigation = [
      "Turn off primary chromium tap valve situated under your fixture immediately",
      "Keep standard pressure relief valve or main home entry valve secure"
    ];
    recommendedSpecialization = "Emergency Residential Plumber";
    estimatedEffortHours = 1.5;
  } else if (cat.includes("drain culvert")) {
    possibleCause = "Heavy accumulation of storm run-off debris, leaf build-up, or plastic wrapper blockages.";
    hazardWarnings = [
      "Run-off flooding near peripheral roads or landscape zones during heavy rainfall",
      "Pest and mosquito nesting in stagnant pockets"
    ];
    diyMitigation = [
      "Clear obvious drift-logs or visible floating plastic from primary storm grate surface",
      "Report persistent backup before the onset of visual rainstorm cycles"
    ];
    recommendedSpecialization = "Civil Drainage & Sweeper Crew";
    estimatedEffortHours = 2.0;
  }

  return {
    possibleCause,
    hazardWarnings,
    diyMitigation,
    recommendedSpecialization,
    estimatedEffortHours
  };
}

// REST API Routes

// 1. Get all tickets
app.get("/api/tickets", (req, res) => {
  res.json(tickets);
});

// 2. Get single ticket
app.get("/api/tickets/:id", (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json(ticket);
});

// 3. Diagnose using Gemini (or fallback)
async function performDiagnosis(category: string, description: string, severity: string, apartment: string) {
  if (ai) {
    try {
      const prompt = `You are an expert civil and buildings maintenance consultant specializing in residential apartment blocks.
      You are analyzing a resident's complaint:
      - Apartment: ${apartment}
      - Category of Issue: ${category}
      - Reported Urgency/Severity: ${severity}
      - Detailed Description: "${description}"

      Please analyze the system blockages, water pressure variations, or sewer leaks to output a formal, structured response.
      Respond strictly in JSON format matching this schema:
      - possibleCause: A concise diagnosis (1-2 sentences) of what is physically triggering this behavior.
      - hazardWarnings: An array of 2-3 critical risks (e.g. electrocution, drywall collapse, pathogen contamination, slip hazards, biohazards).
      - diyMitigation: An array of 2-3 immediate, actionable tasks the resident can safely do right now to limit damage or ensure safety (e.g., shutting down individual isolator, cleaning surface drains, restricting water usage).
      - recommendedSpecialization: The exact professional trade required (e.g., Trenching Contractor, High-Pressure jetting plumber, Residential leak detection tech).
      - estimatedEffortHours: A reasonable estimate of work time in hours on-site (as a decimal number, e.g. 1.5 or 3.0).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              possibleCause: { type: Type.STRING },
              hazardWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              diyMitigation: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedSpecialization: { type: Type.STRING },
              estimatedEffortHours: { type: Type.NUMBER }
            },
            required: ["possibleCause", "hazardWarnings", "diyMitigation", "recommendedSpecialization", "estimatedEffortHours"]
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (e) {
      console.error("Gemini diagnosis failed, falling back to rule-based: ", e);
    }
  }
  return getFallbackDiagnosis(category, description);
}

// Route to get AI Diagnosis advice before committing / submitting a ticket (to assist the resident)
app.post("/api/diagnose", async (req, res) => {
  const { category, description, severity, apartmentNumber } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: "Category and description are required for diagnosis." });
  }
  const result = await performDiagnosis(category, description, severity || "Medium", apartmentNumber || "N/A");
  res.json(result);
});

// 4. Create new ticket (Resident submission or Admin entry)
app.post("/api/tickets", async (req, res) => {
  const { apartmentNumber, buildingBlock, category, severity, description, contactNumber, residentEmail, skipAI } = req.body;

  if (!apartmentNumber || !buildingBlock || !category || !severity || !description || !contactNumber || !residentEmail) {
    return res.status(400).json({ error: "Missing required complaint fields." });
  }

  const id = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Set up loading log
  const initialLogs = [
    {
      id: `log-${Date.now()}-1`,
      ticketId: id,
      text: `Maintenance ticket successfully created by Resident. Assigned status: Submitted.`,
      author: "Resident Portal",
      timestamp: new Date().toISOString()
    }
  ];

  // Try to generate diagnosis immediately if not explicitly skipped
  let diagnosis = null;
  if (!skipAI) {
    try {
      diagnosis = await performDiagnosis(category, description, severity, `${buildingBlock} - Apt ${apartmentNumber}`);
      initialLogs.push({
        id: `log-${Date.now()}-2`,
        ticketId: id,
        text: `AI Assistant generated real-time triage tips and hazard assessment.`,
        author: "AI Assistant",
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Unable to execute initial AI diagnosis: ", e);
    }
  }

  const newTicket = {
    id,
    apartmentNumber,
    buildingBlock,
    category,
    severity,
    status: "Submitted",
    description,
    contactNumber,
    residentEmail,
    createdAt: new Date().toISOString(),
    activityLogs: initialLogs,
    diagnosis,
    scheduling: null
  };

  tickets.unshift(newTicket as any);

  // Generate automated in-app Notification
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    ticketId: id,
    ticketCategory: category,
    message: `⚠️ New ${severity} alert: ${category} reported in ${buildingBlock} Apartment ${apartmentNumber}.`,
    type: "alert" as const,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifications.unshift(newNotif);

  res.status(201).json(newTicket);
});

// 5. Schedule / Assign Technician to a ticket
app.post("/api/tickets/:id/schedule", (req, res) => {
  const { technicianId, scheduledTime, notes } = req.body;
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const tech = technicians.find(t => t.id === technicianId);
  if (!tech) {
    return res.status(400).json({ error: "Specified technician not found" });
  }

  // Update original status and assign details
  const ticket = tickets[ticketIndex];
  ticket.status = "Scheduled";
  ticket.scheduling = {
    technicianId,
    technicianName: tech.name,
    scheduledTime: scheduledTime || new Date(Date.now() + 24 * 3600000).toISOString(),
    notes: notes || ""
  };

  // Mark technician busy
  tech.status = "Busy";

  // Add activity log
  ticket.activityLogs.push({
    id: `log-${Date.now()}`,
    ticketId: ticket.id,
    text: `Technician scheduled. Assigned helper: ${tech.name}. Scheduled time: ${new Date(scheduledTime).toLocaleString()}. Notes: ${notes || "No extra notes."}`,
    author: "Admin Portal",
    timestamp: new Date().toISOString()
  });

  // Add in-app Notification
  notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    ticketId: ticket.id,
    ticketCategory: ticket.category,
    message: `📅 Appointment: ${tech.name} has been assigned and scheduled for ticket ${ticket.id} (${ticket.category}).`,
    type: "assignment",
    timestamp: new Date().toISOString(),
    read: false
  });

  res.json(ticket);
});

// 6. Update Status of a ticket (Resident close, Tech progress, etc.)
app.post("/api/tickets/:id/status", (req, res) => {
  const { status, remarks, materialsUsed, resolutionNotes } = req.body;
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const ticket: any = tickets[ticketIndex];
  const oldStatus = ticket.status;
  ticket.status = status;

  let author = "Staff Admin";
  if (status === "In Progress" || status === "Resolved") {
    author = ticket.scheduling?.technicianName ? `Technician (${ticket.scheduling.technicianName})` : "Technician Assigned";
  }

  // Handle technician details
  if (materialsUsed !== undefined) {
    ticket.materialsUsed = materialsUsed;
  }
  if (resolutionNotes !== undefined) {
    ticket.resolutionNotes = resolutionNotes;
  }

  if (status === "Resolved") {
    ticket.resolvedAt = new Date().toISOString();
    // Re-verify technician availability
    if (ticket.scheduling?.technicianId) {
      const tech = technicians.find(t => t.id === ticket.scheduling!.technicianId);
      if (tech) tech.status = "Available";
    }
  }

  // Create log entry based on change
  ticket.activityLogs.push({
    id: `log-${Date.now()}`,
    ticketId: ticket.id,
    text: `Status updated from "${oldStatus}" to "${status}". ${remarks ? `Remarks: ${remarks}` : ""}`,
    author: author,
    timestamp: new Date().toISOString()
  });

  // Generate automated in-app Notification
  notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    ticketId: ticket.id,
    ticketCategory: ticket.category,
    message: `🔧 Ticket ${ticket.id} (${ticket.category}) status updated to: ${status}.`,
    type: "status_update",
    timestamp: new Date().toISOString(),
    read: false
  });

  res.json(ticket);
});

// 7. Add Custom Activity Log
app.post("/api/tickets/:id/logs", (req, res) => {
  const { text, author } = req.body;
  const ticket = tickets.find(t => t.id === req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const newLog = {
    id: `log-${Date.now()}`,
    ticketId: ticket.id,
    text,
    author: author || "Staff Admin",
    timestamp: new Date().toISOString()
  };

  ticket.activityLogs.push(newLog);
  res.status(201).json(newLog);
});

// 8. Get Technicians List
app.get("/api/technicians", (req, res) => {
  res.json(technicians);
});

// 9. Get Notifications Feed
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

// 10. Mark Notification as Read or clear them
app.post("/api/notifications/read", (req, res) => {
  const { id, all } = req.body;
  if (all) {
    notifications.forEach(n => n.read = true);
  } else if (id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }
  res.json({ success: true, count: notifications.filter(n => !n.read).length });
});


// Vite middleware integrating express
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build delivery
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Apartment Maintenance Server running on http://localhost:${PORT}`);
  });
}

startServer();
