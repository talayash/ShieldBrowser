import type { Alert } from "@/shared/types";
import { formatRelativeTime } from "@/shared/utils";

interface Props {
  alerts: Alert[];
}

const severityIcon: Record<string, string> = {
  critical: "!",
  warning: "!",
  info: "i",
};

const severityColor: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export default function AlertList({ alerts }: Props) {
  const recent = alerts.slice(0, 5);

  if (recent.length === 0) {
    return (
      <p className="text-xs text-gray-500 py-2 text-center">No recent alerts</p>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-2 py-1.5 px-1 rounded text-xs ${
            alert.acknowledged ? "opacity-50" : ""
          }`}
        >
          <span
            className={`flex-shrink-0 w-4 h-4 rounded-full ${severityColor[alert.severity]} text-white text-[10px] font-bold flex items-center justify-center mt-0.5`}
          >
            {severityIcon[alert.severity]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{alert.title}</p>
            <p className="text-gray-500 truncate">{alert.extensionName}</p>
          </div>
          <span className="text-gray-600 text-[10px] whitespace-nowrap">
            {formatRelativeTime(alert.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
