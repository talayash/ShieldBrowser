import type {
  MonitoredExtension,
  Alert,
  ChangelogEntry,
  NetworkEntry,
  ExtensionDomainProfile,
  ShieldSettings,
} from "./types";

// ── Request messages (popup/dashboard → background) ──

export type MessageRequest =
  | { type: "GET_EXTENSIONS" }
  | { type: "GET_EXTENSION"; extensionId: string }
  | { type: "GET_ALERTS" }
  | { type: "GET_UNREAD_ALERT_COUNT" }
  | { type: "ACKNOWLEDGE_ALERT"; alertId: string }
  | { type: "ACKNOWLEDGE_ALL_ALERTS" }
  | { type: "GET_CHANGELOG"; extensionId?: string }
  | { type: "GET_NETWORK_LOG"; date?: string; extensionId?: string }
  | { type: "GET_DOMAIN_PROFILE"; extensionId: string }
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<ShieldSettings> }
  | { type: "GET_STORAGE_STATS" }
  | { type: "PING" };

// ── Response messages ──

export type MessageResponse =
  | { ok: true; data: MonitoredExtension[] }
  | { ok: true; data: MonitoredExtension | null }
  | { ok: true; data: Alert[] }
  | { ok: true; data: number }
  | { ok: true; data: ChangelogEntry[] }
  | { ok: true; data: NetworkEntry[] }
  | { ok: true; data: ExtensionDomainProfile | null }
  | { ok: true; data: ShieldSettings }
  | { ok: true; data: StorageStats }
  | { ok: true }
  | { ok: false; error: string };

export interface StorageStats {
  totalBytes: number;
  extensionCount: number;
  alertCount: number;
  networkEntryCount: number;
  changelogCount: number;
}

// ── Helper to send typed messages ──

export async function sendMessage<T = unknown>(
  message: MessageRequest
): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
