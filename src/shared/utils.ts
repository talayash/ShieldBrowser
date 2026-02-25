import { DANGEROUS_PERMISSIONS, CRITICAL_PERMISSIONS } from "./constants";
import type { RiskLevel } from "./types";

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Extract domain from URL */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

/** Extract extension ID from chrome-extension:// URL */
export function extractExtensionId(url: string): string | null {
  const match = url.match(/^chrome-extension:\/\/([a-z]{32})/);
  return match ? match[1] : null;
}

/** Get today's date key for network log storage */
export function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Storage key generators */
export const storageKey = {
  extension: (id: string) => `ext:${id}`,
  snapshot: (id: string) => `snap:${id}`,
  domains: (id: string) => `domains:${id}`,
  netlog: (date: string) => `netlog:${date}`,
};

/** Calculate risk score (0-100) for an extension's permissions */
export function calculateRiskScore(
  permissions: string[],
  hostPermissions: string[]
): number {
  let score = 0;
  const allPerms = [...permissions, ...hostPermissions];

  for (const perm of allPerms) {
    if (CRITICAL_PERMISSIONS.includes(perm)) {
      score += 20;
    } else if (DANGEROUS_PERMISSIONS.includes(perm)) {
      score += 10;
    } else {
      score += 2;
    }
  }

  // Broad host permissions
  if (
    hostPermissions.some(
      (h) => h === "<all_urls>" || h === "*://*/*" || h === "http://*/*"
    )
  ) {
    score += 15;
  }

  return Math.min(score, 100);
}

/** Map risk score to risk level */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 45) return "warning";
  if (score >= 20) return "medium";
  return "low";
}

/** Format timestamp to relative time */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/** Format bytes to human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
