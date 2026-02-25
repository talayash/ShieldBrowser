import type { MonitoredExtension } from "@/shared/types";
import RiskBadge from "./RiskBadge";

interface Props {
  ext: MonitoredExtension;
}

export default function ExtensionRow({ ext }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 hover:bg-white/5 rounded transition-colors">
      {ext.iconUrl ? (
        <img src={ext.iconUrl} alt="" className="w-6 h-6 rounded" />
      ) : (
        <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
          {ext.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{ext.name}</span>
          {!ext.enabled && (
            <span className="text-[10px] text-gray-500 uppercase">off</span>
          )}
        </div>
        <span className="text-[11px] text-gray-500">
          v{ext.version} · {ext.permissions.length} permissions
        </span>
      </div>
      <RiskBadge score={ext.riskScore} />
    </div>
  );
}
