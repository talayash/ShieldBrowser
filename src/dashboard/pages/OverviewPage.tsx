import { useExtensions } from "../hooks/useExtensions";
import { useAlerts } from "../hooks/useAlerts";
import { useChangelog } from "../hooks/useChangelog";
import RiskBadge from "../components/RiskBadge";
import { formatRelativeTime, getRiskLevel } from "@/shared/utils";
import { Link } from "react-router-dom";
import type { Alert } from "@/shared/types";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const severityBg: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${severityBg[alert.severity]}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs text-gray-500 truncate">{alert.description}</p>
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        {formatRelativeTime(alert.timestamp)}
      </span>
    </div>
  );
}

export default function OverviewPage() {
  const { extensions, loading: extLoading } = useExtensions();
  const { alerts, loading: alertLoading } = useAlerts();
  const { entries: changelog, loading: clLoading } = useChangelog();

  const loading = extLoading || alertLoading || clLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalExts = extensions.filter((e) => getRiskLevel(e.riskScore) === "critical");
  const recentAlerts = alerts.slice(0, 8);
  const topRisk = [...extensions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Overview</h1>
        <p className="text-sm text-gray-400 mt-1">
          Extension security dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Extensions"
          value={extensions.length}
          sub={`${extensions.filter((e) => e.enabled).length} active`}
        />
        <StatCard
          label="Unread Alerts"
          value={unreadAlerts.length}
          sub={`${alerts.length} total`}
        />
        <StatCard
          label="Critical Risk"
          value={criticalExts.length}
          sub="extensions"
        />
        <StatCard
          label="Changes"
          value={changelog.length}
          sub="total events"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent alerts */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Alerts</h2>
            <Link
              to="/alerts"
              className="text-xs text-gray-400 hover:text-white"
            >
              View all →
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No alerts yet
            </p>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Top risk extensions */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3">
            Highest Risk Extensions
          </h2>
          {topRisk.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No extensions monitored
            </p>
          ) : (
            <div className="space-y-2">
              {topRisk.map((ext) => (
                <Link
                  key={ext.id}
                  to={`/extension/${ext.id}`}
                  className="flex items-center justify-between py-2 px-2 rounded hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {ext.iconUrl ? (
                      <img
                        src={ext.iconUrl}
                        alt=""
                        className="w-6 h-6 rounded"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {ext.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm truncate">{ext.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {ext.permissions.length} permissions
                      </p>
                    </div>
                  </div>
                  <RiskBadge score={ext.riskScore} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
