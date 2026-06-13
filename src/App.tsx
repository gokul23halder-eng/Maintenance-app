import React, { useState, useEffect } from "react";
import {
  MaintenanceTicket,
  Technician,
  NotificationMessage,
  MaintenanceCategory,
  IssueSeverity,
  TicketStatus,
  ActivityLog,
} from "./types";
import { DashboardStats } from "./components/DashboardStats";
import { NotificationFeed } from "./components/NotificationFeed";
import { ExcelImporter } from "./components/ExcelImporter";
import {
  Wrench,
  User,
  Shield,
  PlusCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  Phone,
  Mail,
  Home,
  CheckCircle,
  FileSpreadsheet,
  XCircle,
  Bell,
  Search,
  Filter,
  Check,
  ClipboardList,
  Flame,
  Info
} from "lucide-react";

export default function App() {
  // State
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  
  // UI Panels
  const [activeTab, setActiveTab] = useState<"resident" | "admin">("resident");
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [showNotificationFeed, setShowNotificationFeed] = useState(false);
  const [showExcelImporter, setShowExcelImporter] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // New Ticket Form State
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [buildingBlock, setBuildingBlock] = useState("Block A");
  const [category, setCategory] = useState<MaintenanceCategory>(MaintenanceCategory.INTERNAL_WATER_LINE);
  const [severity, setSeverity] = useState<IssueSeverity>(IssueSeverity.MEDIUM);
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [residentEmail, setResidentEmail] = useState("");
  
  // Real-time AI Diagnosis Assistant Preview
  const [aiDiagnosisPreview, setAiDiagnosisPreview] = useState<any | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisFeedback, setDiagnosisFeedback] = useState("");

  // Scheduling Form
  const [selectedTechId, setSelectedTechId] = useState("");
  const [schTime, setSchTime] = useState("");
  const [schNotes, setSchNotes] = useState("");

  // Resolution Form
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [closingRemarks, setClosingRemarks] = useState("");

  // Load Data
  const fetchData = async () => {
    try {
      const ticketsRes = await fetch("/api/tickets");
      if (ticketsRes.ok) {
        const data = await ticketsRes.ok ? await ticketsRes.json() : [];
        setTickets(data);
      }

      const techRes = await fetch("/api/technicians");
      if (techRes.ok) {
        const data = await techRes.json();
        setTechnicians(data);
      }

      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error pulling server data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll notifications/tickets every 10 seconds for real-time compliance feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Trigger real-time AI diagnosis preview while resident is typing (Debounced or on manual trigger)
  const handleTriggerAIDiagnosis = async () => {
    if (!description || description.trim().length < 15) {
      setDiagnosisFeedback("Please write a descriptions of at least 15 characters first so the AI can diagnose properly.");
      return;
    }
    setIsDiagnosing(true);
    setDiagnosisFeedback("");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          severity,
          apartmentNumber: `${buildingBlock}-${apartmentNumber || "TBD"}`
        })
      });
      if (res.ok) {
        const result = await res.json();
        setAiDiagnosisPreview(result);
      } else {
        setDiagnosisFeedback("Could not extract diagnosis. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setDiagnosisFeedback("Diagnosis request timeout.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Submit standard complaint ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartmentNumber || !description || !contactNumber || !residentEmail) {
      alert("Please fill in all apartment details, brief descriptions, and valid contact numbers!");
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentNumber,
          buildingBlock,
          category,
          severity,
          description,
          contactNumber,
          residentEmail
        })
      });

      if (res.ok) {
        const newTicket = await res.json();
        setTickets([newTicket, ...tickets]);
        
        // Reset form
        setApartmentNumber("");
        setDescription("");
        setContactNumber("");
        setResidentEmail("");
        setAiDiagnosisPreview(null);
        setSelectedTicket(newTicket);
        
        // Trigger fresh notifications
        fetchData();
        
        alert(`Success! Created ticket ${newTicket.id} with instant AI Diagnostic recommendation!`);
      } else {
        alert("Failed to submit request to server.");
      }
    } catch (err) {
      console.error(err);
      alert("Network failure submitting complaint.");
    }
  };

  // Assign and schedule technician
  const handleCommitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !selectedTechId || !schTime) {
      alert("Specify technician and scheduled time.");
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId: selectedTechId,
          scheduledTime: schTime,
          notes: schNotes
        })
      });

      if (res.ok) {
        const updated = await res.json();
        // Update local ticket list
        setTickets(tickets.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);
        
        // Reset small schedule fields
        setSelectedTechId("");
        setSchTime("");
        setSchNotes("");
        fetchData(); // Refresh info
        alert(`Technician booked successfully for ticket ${updated.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Status / Progress internally
  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    
    let bodyData: any = { status, remarks: closingRemarks || "Status verified and updated." };
    if (status === TicketStatus.RESOLVED) {
      bodyData.materialsUsed = materialsUsed || "Standard maintenance toolkit";
      bodyData.resolutionNotes = resolutionNotes || "Repaired and structurally tested.";
    }

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        const updated = await res.json();
        setTickets(tickets.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);
        setClosingRemarks("");
        setMaterialsUsed("");
        setResolutionNotes("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post simple log comment
  const handlePostLog = async (text: string, author: string) => {
    if (!selectedTicket || !text.trim()) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author })
      });
      if (res.ok) {
        const newLog = await res.json();
        const updatedTicket = { ...selectedTicket };
        updatedTicket.activityLogs.push(newLog);
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Excel import finishing hook
  const handleBulkImportComplete = (newImportedTickets: any[]) => {
    setTickets([...newImportedTickets, ...tickets]);
    setShowExcelImporter(false);
    fetchData(); // pull notifications feed
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Calculation statistics filtered
  const filteredTickets = tickets.filter((t) => {
    // 1. Status Filter (from top stats click)
    if (statusFilter === TicketStatus.SUBMITTED && t.status !== TicketStatus.SUBMITTED && t.status !== TicketStatus.UNDER_REVIEW) {
      return false;
    } else if (statusFilter === TicketStatus.SCHEDULED && t.status !== TicketStatus.SCHEDULED) {
      return false;
    } else if (statusFilter === TicketStatus.IN_PROGRESS && t.status !== TicketStatus.IN_PROGRESS) {
      return false;
    } else if (statusFilter === TicketStatus.RESOLVED && t.status !== TicketStatus.RESOLVED) {
      return false;
    } else if (statusFilter === ("Emergency" as any)) {
      if ((t.severity !== IssueSeverity.EMERGENCY && t.severity !== IssueSeverity.HIGH) || t.status === TicketStatus.RESOLVED) {
        return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter !== "All" && t.category !== categoryFilter) {
      return false;
    }

    // 3. Severity Filter
    if (severityFilter !== "All" && t.severity !== severityFilter) {
      return false;
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.apartmentNumber.toLowerCase().includes(q) ||
        t.buildingBlock.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.residentEmail.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div id="maintenance-portal-root" className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Professional Header Bar */}
      <header id="main-portal-header" className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-inner flex items-center justify-center">
              <Wrench className="w-5 h-5 text-indigo-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">Apartment Maintenance Manager</h1>
                <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide border border-emerald-500/20 uppercase">
                  Active Complex
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Sewerage • External &amp; Internal Pipes • Drainage Culverts</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Direct Switch Portal Tabs */}
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex gap-1">
              <button
                id="tab-resident-view"
                onClick={() => {
                  setActiveTab("resident");
                  setSelectedTicket(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "resident"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Resident Portal
              </button>
              <button
                id="tab-admin-view"
                onClick={() => {
                  setActiveTab("admin");
                  setSelectedTicket(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "admin"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Staff Admin &amp; Schedulers
              </button>
            </div>

            {/* Notification Portal Bell Icon */}
            <div className="relative">
              <button
                id="notif-portal-trigger"
                onClick={() => setShowNotificationFeed(!showNotificationFeed)}
                className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-4 min-w-[16px] px-1 font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {showNotificationFeed && (
                <NotificationFeed
                  notifications={notifications}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onClose={() => setShowNotificationFeed(false)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Bulk importer panel when requested */}
        {showExcelImporter && (
          <ExcelImporter
            onImportComplete={handleBulkImportComplete}
            onClose={() => setShowExcelImporter(false)}
          />
        )}

        {/* Global Statistics Grid (Always available for Admin, hides on simple form fill to keep clean) */}
        {activeTab === "admin" && (
          <DashboardStats
            tickets={tickets}
            onFilterStatusClick={(status) => {
              setStatusFilter(status);
            }}
            activeFilter={statusFilter as any}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDE AREA: Varies by tab ROLE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ROLE 1: RESIDENT COMPLAINTS AREA */}
            {activeTab === "resident" && (
              <div id="resident-submission-dashboard" className="space-y-6">
                
                {/* Visual Guidelines Banner */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm border border-slate-800 flex items-start gap-4">
                  <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-white mb-1">
                      Welcome to the Resident Property Maintenance Portal
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Report internal water or sewerage leakage immediately. File external pipeline flaws or culvert foliage blockages. Every ticket triggers an instantaneous <strong>AI Diagnosis report</strong> offering real-time isolation advice to shelter your flat until expert tradespersons arrive on the scene.
                    </p>
                    <div className="flex gap-2.5 mt-3">
                      <button
                        onClick={() => {
                          setCategory(MaintenanceCategory.INTERNAL_WATER_LINE);
                          setSeverity(IssueSeverity.EMERGENCY);
                          setApartmentNumber("405");
                          setBuildingBlock("Block A");
                          setDescription("Clean water is spraying with force from the toilet shutoff line. Bathroom floor is beginning to overflow outward.");
                        }}
                        className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30 transition"
                      >
                        ⚡ Prefill Emergency Test Case
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Maintenance Form */}
                <form id="complaint-submission-form" onSubmit={handleSubmitTicket} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-indigo-600" />
                      <h2 className="font-bold text-slate-800">Lodge New Maintenance Complaint</h2>
                    </div>
                    <span className="text-slate-400 text-xs">All fields required</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Apartment Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Apartment No.*</label>
                      <input
                        type="text"
                        value={apartmentNumber}
                        onChange={(e) => setApartmentNumber(e.target.value)}
                        placeholder="e.g. 304, Penthouse East"
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Building Block */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Building Block*</label>
                      <select
                        value={buildingBlock}
                        onChange={(e) => setBuildingBlock(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Block A">Block A (North Tower)</option>
                        <option value="Block B">Block B (South Heights)</option>
                        <option value="Block C">Block C (Central Block)</option>
                        <option value="Block D">Block D (Lawnside)</option>
                        <option value="Common Grounds">Common Grounds / Parking Lot</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category of Issue*</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value={MaintenanceCategory.SEWERAGE}>Sewerage (Common/Flat toilet lines)</option>
                        <option value={MaintenanceCategory.EXTERNAL_PIPE}>External Pipe (Mains riser, meter leakages)</option>
                        <option value={MaintenanceCategory.INTERNAL_WATER_LINE}>Internal Water Line (Basin taps, kitchen sink pipes)</option>
                        <option value={MaintenanceCategory.DRAIN_CULVERT}>Drain Culvert (Storm drains, yard gutters)</option>
                        <option value={MaintenanceCategory.OTHERS}>Others (General physical failures)</option>
                      </select>
                    </div>

                    {/* Urgency/Severity */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Assessment*</label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as any)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value={IssueSeverity.LOW}>Low - Nuisance, but functional (leak-free)</option>
                        <option value={IssueSeverity.MEDIUM}>Medium - Affecting standard routine slightly</option>
                        <option value={IssueSeverity.HIGH}>High - Active structural threat or complete loss of utility</option>
                        <option value={IssueSeverity.EMERGENCY}>Emergency - Continuous flooding, pipe bursting, severe odor</option>
                      </select>
                    </div>
                  </div>

                  {/* Complaint Description Description */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Issue Description / Failure Symptoms*
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (aiDiagnosisPreview) setAiDiagnosisPreview(null);
                      }}
                      placeholder="Symptoms: E.g., The pipes in kitchen partition are making heavy vibrating noise, then clean stream water started spurting behind plaster wall. It's pooling fast onto laminate floorboards."
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                      required
                    ></textarea>
                  </div>

                  {/* Contact Number and Resident Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Mobile / Contact Line*</label>
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+1 (555) 01XX-XXXX"
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Resident Registered Email*</label>
                      <input
                        type="email"
                        value={residentEmail}
                        onChange={(e) => setResidentEmail(e.target.value)}
                        placeholder="you@apartment-residence.com"
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Live AI Diagnosis Preview Area */}
                  <div className="mt-4 p-4 border border-indigo-100 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                        <h4 className="text-xs font-semibold text-indigo-950">Property AI Triage Advisor Preview</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerAIDiagnosis}
                        disabled={isDiagnosing}
                        className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 border border-indigo-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded transition"
                      >
                        {isDiagnosing ? "Analyzing symptoms..." : "✨ Pre-Analyze Diagnostics & DIY Steps"}
                      </button>
                    </div>

                    {diagnosisFeedback && (
                      <p className="text-[11px] text-amber-600 font-medium">{diagnosisFeedback}</p>
                    )}

                    {aiDiagnosisPreview ? (
                      <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-white border border-indigo-50 rounded-lg text-[11px]">
                          <div className="md:col-span-8">
                            <span className="font-bold text-indigo-900 block mb-0.5">Physical Cause (AI Analysis):</span>
                            <span className="text-slate-600 leading-relaxed">{aiDiagnosisPreview.possibleCause}</span>
                          </div>
                          <div className="md:col-span-4 border-l border-slate-100 pl-3">
                            <span className="font-semibold text-slate-800 block">Est. Duration:</span>
                            <span className="text-indigo-600 font-mono font-bold text-xs">{aiDiagnosisPreview.estimatedEffortHours} Hrs</span>
                            <span className="font-semibold text-slate-800 block mt-1.5">Best specialist trade:</span>
                            <span className="text-indigo-600 font-bold">{aiDiagnosisPreview.recommendedSpecialization}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100/50">
                            <span className="font-bold text-red-800 text-[10px] tracking-wide uppercase flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Environmental Hazard warnings
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-700">
                              {aiDiagnosisPreview.hazardWarnings.map((hw: string, i: number) => (
                                <li key={i}>{hw}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100/50">
                            <span className="font-bold text-emerald-800 text-[10px] tracking-wide uppercase flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Actionable DIY Damage Limiters
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-700">
                              {aiDiagnosisPreview.diyMitigation.map((dy: string, i: number) => (
                                <li key={i}>{dy}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        Type in details describing leaks, floorboards damage, sewage gas smells and press "Pre-Analyze Diagnostics". The system will use AI to isolate the issue prior to submission.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      id="submit-ticket-btn"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all hover:shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                      Submit to Maintenance Office
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* ROLE 2: ADMIN / PROPERTY MANAGER TABLE AREA */}
            {activeTab === "admin" && (
              <div id="admin-triage-dashboard" className="space-y-4">
                
                {/* Advanced Multi-Selector filter controls */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    
                    {/* Search Field */}
                    <div className="relative flex-grow md:flex-grow-0 md:w-56">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search apt, email, logs..."
                        className="w-full bg-slate-50 text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      />
                    </div>

                    {/* Filter Category selection */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Filter className="w-3.5 h-3.5 opacity-65" /> Category:
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs focus:outline-none"
                      >
                        <option value="All">All Categories</option>
                        <option value={MaintenanceCategory.SEWERAGE}>{MaintenanceCategory.SEWERAGE}</option>
                        <option value={MaintenanceCategory.EXTERNAL_PIPE}>{MaintenanceCategory.EXTERNAL_PIPE}</option>
                        <option value={MaintenanceCategory.INTERNAL_WATER_LINE}>{MaintenanceCategory.INTERNAL_WATER_LINE}</option>
                        <option value={MaintenanceCategory.DRAIN_CULVERT}>{MaintenanceCategory.DRAIN_CULVERT}</option>
                        <option value={MaintenanceCategory.OTHERS}>{MaintenanceCategory.OTHERS}</option>
                      </select>
                    </div>

                    {/* Severity selection */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" /> Urgency:
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs focus:outline-none"
                      >
                        <option value="All">All Severities</option>
                        <option value={IssueSeverity.LOW}>{IssueSeverity.LOW}</option>
                        <option value={IssueSeverity.MEDIUM}>{IssueSeverity.MEDIUM}</option>
                        <option value={IssueSeverity.HIGH}>{IssueSeverity.HIGH}</option>
                        <option value={IssueSeverity.EMERGENCY}>{IssueSeverity.EMERGENCY}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {/* Clear Status filter if any */}
                    {statusFilter && (
                      <button
                        onClick={() => setStatusFilter(null)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                      >
                        Reset Status Filter
                      </button>
                    )}

                    {/* Open Bulk Excel Importer Trigger */}
                    <button
                      id="bulk-excel-import-btn"
                      onClick={() => setShowExcelImporter(true)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Bulk Excel Import
                    </button>
                  </div>
                </div>

                {/* Table / List representation of Filtered complaints */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-xs text-slate-700 tracking-wider uppercase">Active Work Queue ({filteredTickets.length})</h3>
                    <span className="text-slate-500 text-[10px]">Click any complaint to schedule technicians or update status</span>
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-45" />
                      <p className="text-xs font-semibold">No tickets match active database queries.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Adjust filter dropdowns or create new sample resident tasks to test workflows.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredTickets.map((ticket) => {
                        const isChosen = selectedTicket?.id === ticket.id;
                        return (
                          <div
                            key={ticket.id}
                            id={`ticket-row-${ticket.id}`}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 transition-all duration-150 cursor-pointer flex gap-4 ${
                              isChosen ? "bg-indigo-50/50 border-l-4 border-indigo-600" : "hover:bg-slate-50 border-l-4 border-transparent"
                            }`}
                          >
                            {/* Diagnostic Badge / Log icon color matching category */}
                            <div className="shrink-0 pt-1">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                ticket.severity === IssueSeverity.EMERGENCY || ticket.severity === IssueSeverity.HIGH
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                {ticket.category === MaintenanceCategory.SEWERAGE ? "💩" : 
                                 ticket.category === MaintenanceCategory.EXTERNAL_PIPE ? "🚰" : 
                                 ticket.category === MaintenanceCategory.INTERNAL_WATER_LINE ? "🚿" : "🛠️"}
                              </span>
                            </div>

                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-700 font-mono tracking-tight bg-slate-100 px-1.5 py-0.5 rounded leading-none shrink-0 border border-slate-200">
                                    {ticket.id}
                                  </span>
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {ticket.buildingBlock} • Apartment {ticket.apartmentNumber}
                                  </span>
                                </div>
                                
                                {/* Status badges */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase ${
                                    ticket.severity === IssueSeverity.EMERGENCY ? "bg-red-100 text-red-700" :
                                    ticket.severity === IssueSeverity.HIGH ? "bg-orange-100 text-orange-700" :
                                    ticket.severity === IssueSeverity.MEDIUM ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {ticket.severity}
                                  </span>

                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                                    ticket.status === TicketStatus.RESOLVED ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    ticket.status === TicketStatus.IN_PROGRESS ? "bg-purple-50 text-purple-700 border-purple-200" :
                                    ticket.status === TicketStatus.SCHEDULED ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    ticket.status === TicketStatus.UNDER_REVIEW ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                                    "bg-zinc-50 text-zinc-700 border-zinc-200"
                                  }`}>
                                    {ticket.status}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2 line-clamp-2">
                                {ticket.description}
                              </p>

                              <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {ticket.contactNumber}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5" />
                                    {ticket.residentEmail}
                                  </span>
                                </div>
                                <span className="text-slate-400 shrink-0 select-none">
                                  Logged: {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Small assigned tag */}
                              {ticket.scheduling && (
                                <div className="mt-2 text-[10px] font-semibold text-slate-600 bg-blue-50 border border-blue-100/50 inline-flex items-center gap-1 py-0.5 px-2 rounded-md">
                                  <Calendar className="w-3 h-3 text-blue-600" />
                                  <span>Assigned to: <strong className="text-blue-800">{ticket.scheduling.technicianName}</strong></span>
                                  <span className="text-slate-400">•</span>
                                  <span>Time: {new Date(ticket.scheduling.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center">
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SHARED COMPONENT: MY LOGGED COMPLAINTS (Available in Resident view to see updates) */}
            {activeTab === "resident" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">Your Apartment’s Lodged Complaints &amp; Status Logs</h3>
                  <button
                    onClick={fetchData}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tickets.slice(0, 8).map((ticket) => (
                    <div
                      key={ticket.id}
                      id={`resident-ticket-${ticket.id}`}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all border-l-4 ${
                        selectedTicket?.id === ticket.id ? "ring-2 ring-indigo-500 border-indigo-600" : "border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-[10px] text-slate-500 font-mono tracking-tight bg-slate-50 px-1 py-0.5 rounded border">
                              {ticket.id}
                            </span>
                            <span className="text-xs font-bold text-slate-800">Apt {ticket.apartmentNumber} ({ticket.buildingBlock})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          ticket.status === TicketStatus.RESOLVED ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          ticket.status === TicketStatus.IN_PROGRESS ? "bg-purple-50 text-purple-700 border-purple-100" :
                          ticket.status === TicketStatus.SCHEDULED ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-amber-50 text-amber-700 border-amber-130 animate-pulse"
                        }`}>
                          {ticket.status}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        {ticket.category}
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {ticket.description}
                      </p>

                      {ticket.scheduling ? (
                        <div className="text-[10px] bg-slate-50 border border-slate-200/60 rounded-lg p-2 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Scheduled Technician</span>
                            <span className="font-bold text-slate-700">{ticket.scheduling.technicianName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Arrival Slot</span>
                            <span className="font-bold text-slate-600">{new Date(ticket.scheduling.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          Awaiting Technician Allocation
                        </span>
                      )}
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="col-span-2 p-10 bg-white border border-slate-200 rounded-2xl text-center text-slate-400">
                      <Home className="w-8 h-8 mx-auto mb-2 opacity-35" />
                      <p className="text-xs">No complaints logged from your suite yet.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Fill out the lodging form above to submit your first report.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================================== */}
          {/* RIGHT SIDE DETAILS AREA: Expended Inspection, Logs &amp; Scheduler */}
          {/* ============================================================================== */}
          <div className="lg:col-span-4">
            
            {selectedTicket ? (
              <div id="inspector-side-panel" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 sticky top-20">
                
                {/* Header section */}
                <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 border px-1.5 py-0.5 rounded">
                        {selectedTicket.id}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedTicket.status === TicketStatus.RESOLVED ? "bg-emerald-50 text-emerald-800" : "bg-indigo-50 text-indigo-700"
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Apartment {selectedTicket.apartmentNumber} ({selectedTicket.buildingBlock})
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded"
                  >
                    Close Panel
                  </button>
                </div>

                {/* Complaint Details Info Box */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Reported Symptom Category</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                      {selectedTicket.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Original Complaint</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150/50 mt-1 whitespace-pre-line">
                      "{selectedTicket.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide">Contact</span>
                      <div className="font-semibold text-slate-800 truncate">{selectedTicket.contactNumber}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide">Email Id</span>
                      <div className="font-semibold text-slate-800 truncate">{selectedTicket.residentEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Live AI Diagnostics Assistant Section */}
                {selectedTicket.diagnosis && (
                  <div className="bg-indigo-900 text-slate-100 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <h4 className="text-xs font-bold text-white tracking-wide uppercase">AI Triage Diagnostics Advice</h4>
                    </div>

                    <div className="space-y-2 text-[11px] leading-relaxed">
                      <div>
                        <strong className="text-amber-200">Deemed Underlying Trigger:</strong>
                        <p className="text-slate-300 mt-0.5">{selectedTicket.diagnosis.possibleCause}</p>
                      </div>

                      <div className="border-t border-indigo-950 pt-2 grid grid-cols-2 gap-2">
                        <div>
                          <strong className="text-indigo-300 block">Recommended Action:</strong>
                          <span className="font-bold text-white leading-none">{selectedTicket.diagnosis.recommendedSpecialization}</span>
                        </div>
                        <div>
                          <strong className="text-indigo-300 block">Est. labor Time:</strong>
                          <span className="font-mono font-bold text-white">{selectedTicket.diagnosis.estimatedEffortHours} hr(s)</span>
                        </div>
                      </div>

                      {selectedTicket.diagnosis.hazardWarnings && (
                        <div className="border-t border-indigo-950 pt-2">
                          <strong className="text-rose-300 block">⚠️ Crucial Fire / Bio Hazard Warning:</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-rose-200">
                            {selectedTicket.diagnosis.hazardWarnings.slice(0, 2).map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedTicket.diagnosis.diyMitigation && (
                        <div className="border-t border-indigo-950 pt-2">
                          <strong className="text-emerald-300 block">🛠️ Actionable DIY Triage:</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-emerald-200">
                            {selectedTicket.diagnosis.diyMitigation.slice(0, 2).map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WORKER SCHEDULE SUB-WIDGET (Only for Admin to allocate / dispatch) */}
                {activeTab === "admin" && (selectedTicket.status === TicketStatus.SUBMITTED || selectedTicket.status === TicketStatus.UNDER_REVIEW) && (
                  <form onSubmit={handleCommitSchedule} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Schedule Technical Specialist</h4>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Select Crew Handler*</label>
                      <select
                        required
                        value={selectedTechId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
                      >
                        <option value="">-- Choose Specialist / Plumber --</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.specialty}) - status: {t.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Scheduled On-Site Dispatch Arrival*</label>
                      <input
                        type="datetime-local"
                        required
                        value={schTime}
                        onChange={(e) => setSchTime(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Special Dispatch Directives (Notes)</label>
                      <input
                        type="text"
                        value={schNotes}
                        onChange={(e) => setSchNotes(e.target.value)}
                        placeholder="e.g. bring replacement sleeve couplers, check ceiling"
                        className="w-full text-xs border border-slate-300 rounded-md p-1.5 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md transition"
                    >
                      Book Dispatch &amp; Notify Resident
                    </button>
                  </form>
                )}

                {/* TECHNICIAN PROGRESS ACTIONS (Mark 'In Progress' or 'Resolved') */}
                {selectedTicket.status !== TicketStatus.RESOLVED && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight block">Update Complaint Progress</span>
                    
                    <div className="flex gap-2">
                      {selectedTicket.status === TicketStatus.SCHEDULED && (
                        <button
                          onClick={() => handleUpdateStatus(TicketStatus.IN_PROGRESS)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-1.5 rounded"
                        >
                          🛠️ Start Repair Work (In Progress)
                        </button>
                      )}

                      {/* If submitted, we can also manually mark in progress */}
                      {(selectedTicket.status === TicketStatus.SUBMITTED || selectedTicket.status === TicketStatus.UNDER_REVIEW) && (
                        <button
                          onClick={() => handleUpdateStatus(TicketStatus.IN_PROGRESS)}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-1.5 rounded"
                        >
                          ⚡ Bypass to 'In Progress'
                        </button>
                      )}
                    </div>

                    {/* Completion Form fields */}
                    {selectedTicket.status === TicketStatus.IN_PROGRESS ? (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-purple-800 block">Close Complaint Sheet (Set Resolved)</span>
                        
                        <div>
                          <label className="block text-[9px] text-slate-500 mb-0.5">Physical Materials Consumed*</label>
                          <input
                            type="text"
                            value={materialsUsed}
                            onChange={(e) => setMaterialsUsed(e.target.value)}
                            placeholder="e.g. 2-inch PVC coupler elbow, thread compound"
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-500 mb-0.5">Resolution Field Report Summary*</label>
                          <textarea
                            rows={2}
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="e.g. Cut away corroded coupling sections, re-threaded and installed stainless socket connectors. Tested at 4.2 bar pressure - no leak."
                            className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                          />
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(TicketStatus.RESOLVED)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded transition"
                        >
                          ✅ Confirm Resolved &amp; Archival Close
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* HISTORICAL WORK RECORD DISPLAY (If already resolved) */}
                {selectedTicket.status === TicketStatus.RESOLVED && (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2 text-xs">
                    <span className="font-bold text-emerald-800 text-[10px] tracking-wide uppercase block flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Closeout Field Report Verified
                    </span>
                    <div>
                      <strong className="text-emerald-950 block text-[10px]">Materials Consumed:</strong>
                      <span className="text-slate-700 leading-normal block">{selectedTicket.materialsUsed || "Not explicitly recorded"}</span>
                    </div>
                    <div className="border-t border-emerald-200/50 pt-1.5">
                      <strong className="text-emerald-950 block text-[10px]">Technical resolution notes:</strong>
                      <span className="text-slate-600 leading-relaxed block">{selectedTicket.resolutionNotes || "Completed by building maintenance crew"}</span>
                    </div>
                  </div>
                )}

                {/* Chronology Log Audit Trail */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Audit Trail Chronology ({selectedTicket.activityLogs?.length || 0})</span>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedTicket.activityLogs?.map((log, idx) => (
                      <div key={log.id || idx} className="text-[11px] p-2 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-0.5">
                          <span>{log.author}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700 leading-snug">{log.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add direct log commentary input */}
                  <div className="flex gap-1">
                    <input
                      id="log-commentary-input"
                      type="text"
                      placeholder="Add simple staff progress text..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          handlePostLog(input.value, activeTab === "admin" ? "Staff Admin" : "Resident Agent");
                          input.value = "";
                        }
                      }}
                      className="w-full text-[11px] border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("log-commentary-input") as HTMLInputElement;
                        if (input && input.value) {
                          handlePostLog(input.value, activeTab === "admin" ? "Staff Admin" : "Resident Agent");
                          input.value = "";
                        }
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 select-none text-[11px] font-semibold px-2 rounded-md"
                    >
                      Audit
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-100/50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400 sticky top-20">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-xs text-slate-700">Audit &amp; Dispatch Inspector Close</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Select any active maintenance ticket card in the complaint ledger list to invoke real-time status updates, schedule technicians, or review the custom AI Triage Diagnostic warnings.
                </p>
              </div>
            )}

            {/* QUICK TECHNICIAN STATUS ROSTER PANEL (Always available to keep eye on staff load) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mt-5 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">Available Technician Duty Roster</span>
              <div className="grid grid-cols-1 gap-2.5">
                {technicians.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                    <div>
                      <span className="font-bold text-slate-800 block">{t.name}</span>
                      <span className="text-[10px] text-indigo-600 block font-medium leading-none mt-0.5">{t.specialty}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === "Available" ? "bg-emerald-100 text-emerald-800" :
                      t.status === "Busy" ? "bg-purple-100 text-purple-800 font-mono" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Modern Compact Footer */}
      <footer className="bg-slate-950 text-slate-500 border-t border-slate-900 py-6 text-center text-xs mt-12">
        <p>© 2026 Apartment Maintenance Portal. All rights reserved.</p>
        <p className="text-[10px] mt-1 text-slate-600">
          Powered securely by **Gemini 3.5 Flash** for deep structural diagnostics, damage mitigation guides, and hazard alerts.
        </p>
      </footer>
    </div>
  );
}
