import React from "react";
import { MaintenanceTicket, TicketStatus, IssueSeverity } from "../types";
import { AlertCircle, CheckCircle2, Clock, CalendarRange, ListChecks } from "lucide-react";

interface DashboardStatsProps {
  tickets: MaintenanceTicket[];
  onFilterStatusClick?: (status: TicketStatus | null) => void;
  activeFilter?: string | null;
}

export function DashboardStats({ tickets, onFilterStatusClick, activeFilter }: DashboardStatsProps) {
  const total = tickets.length;
  
  const emergency = tickets.filter(
    (t) => (t.severity === IssueSeverity.EMERGENCY || t.severity === IssueSeverity.HIGH) && t.status !== TicketStatus.RESOLVED
  ).length;

  const scheduled = tickets.filter((t) => t.status === TicketStatus.SCHEDULED).length;
  const inProgress = tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
  const resolved = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length;
  const pendingReview = tickets.filter((t) => t.status === TicketStatus.SUBMITTED || t.status === TicketStatus.UNDER_REVIEW).length;

  const cards = [
    {
      title: "Total Logged Tasks",
      value: total,
      sub: "Historical database",
      color: "bg-slate-50 border-slate-200 text-slate-700",
      icon: ListChecks,
      statusFilter: null,
    },
    {
      title: "Critical & Emergencies",
      value: emergency,
      sub: "Requires immediate attention",
      color: emergency > 0 ? "bg-red-50 border-red-200 text-red-700 animate-pulse" : "bg-zinc-50 border-zinc-200 text-zinc-600",
      icon: AlertCircle,
      statusFilter: "Emergency",
    },
    {
      title: "Pending Allocation",
      value: pendingReview,
      sub: "In queue for dispatching",
      color: "bg-amber-50 border-amber-200 text-amber-700",
      icon: Clock,
      statusFilter: TicketStatus.SUBMITTED,
    },
    {
      title: "Scheduled Work",
      value: scheduled,
      sub: "Technicians booked on-site",
      color: "bg-blue-50 border-blue-200 text-blue-700",
      icon: CalendarRange,
      statusFilter: TicketStatus.SCHEDULED,
    },
    {
      title: "Active In-Progress",
      value: inProgress,
      sub: "Under investigation / repair",
      color: "bg-purple-50 border-purple-200 text-purple-700",
      icon: Clock,
      statusFilter: TicketStatus.IN_PROGRESS,
    },
    {
      title: "Successfully Resolved",
      value: resolved,
      sub: "Repairs verified & closed",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: CheckCircle2,
      statusFilter: TicketStatus.RESOLVED,
    },
  ];

  return (
    <div id="dashboard-statistics-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.statusFilter;
        return (
          <div
            key={idx}
            id={`stat-card-${idx}`}
            onClick={() => onFilterStatusClick && onFilterStatusClick(card.statusFilter as any)}
            className={`border rounded-xl p-3.5 transition-all duration-200 ${card.color} ${
              onFilterStatusClick ? "cursor-pointer hover:shadow-sm" : ""
            } ${isActive ? "ring-2 ring-indigo-500 scale-[1.02] shadow-sm" : ""}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold tracking-wider uppercase opacity-80">{card.title}</span>
              <Icon className="w-4 h-4 opacity-70" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight">{card.value}</span>
            </div>
            <p className="text-[10px] mt-1 opacity-75 truncate">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
