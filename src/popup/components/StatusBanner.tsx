import type { Alert, MonitoredExtension } from "@/shared/types";

interface Props {
  extensions: MonitoredExtension[];
  alerts: Alert[];
}

export default function StatusBanner({ extensions, alerts }: Props) {
  const unreadAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = unreadAlerts.filter((a) => a.severity === "critical");
  const highRiskExts = extensions.filter((e) => e.riskScore >= 70);

  const status =
    criticalAlerts.length > 0
      ? "critical"
      : unreadAlerts.length > 0
        ? "warning"
        : "good";

  const statusConfig = {
    critical: {
      bg: "bg-red-500/10 border-red-500/30",
      dot: "bg-red-500",
      label: "Attention Required",
      desc: `${criticalAlerts.length} critical alert${criticalAlerts.length !== 1 ? "s" : ""}`,
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/30",
      dot: "bg-amber-500",
      label: "Review Needed",
      desc: `${unreadAlerts.length} unread alert${unreadAlerts.length !== 1 ? "s" : ""}`,
    },
    good: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      dot: "bg-emerald-500",
      label: "All Clear",
      desc: `Monitoring ${extensions.length} extension${extensions.length !== 1 ? "s" : ""}`,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border p-3 ${config.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${config.dot} animate-pulse`} />
        <span className="font-semibold text-sm">{config.label}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 ml-4.5">
        {config.desc}
        {highRiskExts.length > 0 &&
          ` · ${highRiskExts.length} high-risk extension${highRiskExts.length !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
