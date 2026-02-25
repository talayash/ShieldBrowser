// ── Risk levels ──
export type RiskLevel = "low" | "medium" | "warning" | "critical";
export type AlertSeverity = "info" | "warning" | "critical";

// ── Extension data ──
export interface MonitoredExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  installType: string;
  permissions: string[];
  hostPermissions: string[];
  riskScore: number;
  firstSeen: number;
  lastUpdated: number;
  iconUrl?: string;
}

export interface PermissionSnapshot {
  id: string;
  extensionId: string;
  timestamp: number;
  version: string;
  permissions: string[];
  hostPermissions: string[];
}

export interface PermissionDiff {
  extensionId: string;
  extensionName: string;
  timestamp: number;
  oldVersion: string;
  newVersion: string;
  added: string[];
  removed: string[];
  hostAdded: string[];
  hostRemoved: string[];
}

// ── Network monitoring ──
export interface NetworkEntry {
  id: string;
  extensionId: string;
  extensionName: string;
  url: string;
  domain: string;
  method: string;
  type: chrome.webRequest.ResourceType;
  timestamp: number;
  statusCode?: number;
}

export interface ExtensionDomainProfile {
  extensionId: string;
  knownDomains: string[];
  domainFirstSeen: Record<string, number>;
  totalRequests: number;
  lastActivity: number;
}

// ── Alerts ──
export interface Alert {
  id: string;
  extensionId: string;
  extensionName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: number;
  acknowledged: boolean;
  type: AlertType;
}

export type AlertType =
  | "new_extension"
  | "extension_removed"
  | "extension_enabled"
  | "extension_disabled"
  | "permission_escalation"
  | "permission_reduction"
  | "new_domain"
  | "domain_burst"
  | "suspicious_domain"
  | "version_change";

// ── Changelog ──
export interface ChangelogEntry {
  id: string;
  extensionId: string;
  extensionName: string;
  timestamp: number;
  type: ChangelogType;
  summary: string;
  details?: string;
}

export type ChangelogType =
  | "installed"
  | "uninstalled"
  | "enabled"
  | "disabled"
  | "updated"
  | "permissions_changed"
  | "new_domain_contacted";

// ── Settings ──
export interface ShieldSettings {
  notificationsEnabled: boolean;
  retentionDays: number;
  ignoredExtensions: string[];
  monitorNetworkRequests: boolean;
  domainBurstThreshold: number;
}

// ── Storage key types ──
export type StorageKeyPrefix =
  | "ext"
  | "snap"
  | "domains"
  | "netlog"
  | "alerts"
  | "changelog"
  | "settings";
