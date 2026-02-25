import { getRiskLevel } from "@/shared/utils";
import type { RiskLevel } from "@/shared/types";

interface Props {
  score: number;
  size?: "sm" | "md";
}

const levelConfig: Record<
  RiskLevel,
  { bg: string; text: string; label: string }
> = {
  low: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Low Risk" },
  medium: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Medium Risk" },
  warning: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Warning" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", label: "Critical" },
};

export default function RiskBadge({ score, size = "sm" }: Props) {
  const level = getRiskLevel(score);
  const config = levelConfig[level];
  const sizeClasses =
    size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase ${config.bg} ${config.text} ${sizeClasses}`}
    >
      {config.label}
      <span className="opacity-60">{score}</span>
    </span>
  );
}
