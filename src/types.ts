/**
 * Types and interfaces for the Apartment Maintenance Portal.
 */

export enum MaintenanceCategory {
  SEWERAGE = "Sewerage",
  EXTERNAL_PIPE = "External Pipe",
  INTERNAL_WATER_LINE = "Internal Water Line",
  DRAIN_CULVERT = "Drain Culvert",
  OTHERS = "Others"
}

export enum IssueSeverity {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  EMERGENCY = "Emergency"
}

export enum TicketStatus {
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "Under Review",
  SCHEDULED = "Scheduled",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved"
}

export interface ActivityLog {
  id: string;
  ticketId: string;
  text: string;
  author: string; // "Resident", "Admin", "Technician: Carlos"
  timestamp: string;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  status: "Available" | "Busy" | "Off-duty";
}

export interface SchedulingDetails {
  technicianId: string;
  technicianName: string;
  scheduledTime: string; // ISO string
  notes?: string;
}

export interface AIDiagnosisResult {
  possibleCause: string;
  hazardWarnings: string[];
  diyMitigation: string[];
  recommendedSpecialization: string;
  estimatedEffortHours: number;
}

export interface MaintenanceTicket {
  id: string;
  apartmentNumber: string;
  buildingBlock: string;
  category: MaintenanceCategory;
  severity: IssueSeverity;
  status: TicketStatus;
  description: string;
  contactNumber: string;
  residentEmail: string;
  createdAt: string;
  resolvedAt?: string;
  diagnosis?: AIDiagnosisResult | null;
  scheduling?: SchedulingDetails | null;
  activityLogs: ActivityLog[];
  materialsUsed?: string;
  resolutionNotes?: string;
}

export interface NotificationMessage {
  id: string;
  ticketId: string;
  ticketCategory: string;
  message: string;
  type: "status_update" | "assignment" | "alert" | "feedback";
  timestamp: string;
  read: boolean;
}
