import { getRiskLevel } from "@/shared/utils";
import type { RiskLevel } from "@/shared/types";

interface Props {
  score: number;
}

const levelConfig: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Low" },
  medium: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Med" },
  warning: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Warn" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", label: "Crit" },
};

export default function RiskBadge({ score }: Props) {
  const level = getRiskLevel(score);
  const config = levelConfig[level];

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
