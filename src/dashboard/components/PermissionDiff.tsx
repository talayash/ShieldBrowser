import { DANGEROUS_PERMISSIONS, CRITICAL_PERMISSIONS } from "@/shared/constants";

interface Props {
  permissions: string[];
  hostPermissions: string[];
}

function getPermissionColor(perm: string): string {
  if (CRITICAL_PERMISSIONS.includes(perm)) return "text-red-400";
  if (DANGEROUS_PERMISSIONS.includes(perm)) return "text-amber-400";
  return "text-gray-300";
}

function getPermBadge(perm: string): string | null {
  if (CRITICAL_PERMISSIONS.includes(perm)) return "CRITICAL";
  if (DANGEROUS_PERMISSIONS.includes(perm)) return "DANGEROUS";
  return null;
}

export default function PermissionDisplay({
  permissions,
  hostPermissions,
}: Props) {
  const allPerms = [
    ...permissions.map((p) => ({ name: p, type: "api" as const })),
    ...hostPermissions.map((p) => ({ name: p, type: "host" as const })),
  ];

  if (allPerms.length === 0) {
    return (
      <p className="text-sm text-gray-500">No permissions requested</p>
    );
  }

  return (
    <div className="space-y-1">
      {allPerms.map((perm) => {
        const badge = getPermBadge(perm.name);
        return (
          <div
            key={`${perm.type}-${perm.name}`}
            className="flex items-center gap-2 py-1"
          >
            <span
              className={`text-xs font-mono ${getPermissionColor(perm.name)}`}
            >
              {perm.name}
            </span>
            {perm.type === "host" && (
              <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1 rounded">
                HOST
              </span>
            )}
            {badge && (
              <span
                className={`text-[9px] px-1 rounded ${
                  badge === "CRITICAL"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
