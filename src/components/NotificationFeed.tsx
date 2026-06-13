import React from "react";
import { NotificationMessage } from "../types";
import { Bell, Check, Trash2, MailOpen, AlertTriangle, Hammer, RefreshCw, Layers } from "lucide-react";

interface NotificationFeedProps {
  notifications: NotificationMessage[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationFeed({ notifications, onMarkRead, onMarkAllRead, onClose }: NotificationFeedProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case "assignment":
        return <Hammer className="w-4 h-4 text-blue-500" />;
      case "status_update":
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <Layers className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div id="notification-hub-panel" className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-sm text-slate-800">Alerts & System Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 px-1.5 py-1 hover:bg-indigo-50 rounded"
              title="Mark all as read"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 hover:bg-slate-100 rounded"
          >
            Close
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MailOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No notifications to show</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              id={`notification-item-${notif.id}`}
              className={`p-3.5 flex gap-3 transition-colors ${notif.read ? "bg-white opacity-70" : "bg-indigo-50/40 hover:bg-indigo-50/60"}`}
            >
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                {getIcon(notif.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">
                    {notif.ticketCategory}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed break-words">{notif.message}</p>
                
                {!notif.read && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="mt-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Check className="w-2.5 h-2.5" /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-500">Live operational feed</span>
      </div>
    </div>
  );
}
