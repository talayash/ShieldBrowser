import { useState } from "react";
import { useAlerts } from "../hooks/useAlerts";
import type { AlertSeverity } from "@/shared/types";
import { formatRelativeTime } from "@/shared/utils";

export default function AlertHistoryPage() {
  const { alerts, loading, acknowledge, acknowledgeAll } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">(
    "all"
  );
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (!showAcknowledged && a.acknowledged) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  const severityBg: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Alert History</h1>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount} unread · {alerts.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={acknowledgeAll}
            className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {(["all", "critical", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                severityFilter === sev
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 ml-auto">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded"
          />
          Show acknowledged
        </label>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No alerts match your filters
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-gray-900 rounded-lg border border-gray-800 p-4 ${
                alert.acknowledged ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1 ${severityBg[alert.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{alert.title}</h3>
                    <span className="text-[10px] text-gray-500 uppercase">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">
                      {alert.extensionName}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
