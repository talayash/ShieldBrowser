import type { ShieldSettings } from "./types";

// Permissions considered dangerous or high-risk
export const DANGEROUS_PERMISSIONS: string[] = [
  "debugger",
  "declarativeNetRequest",
  "declarativeNetRequestWithHostAccess",
  "desktopCapture",
  "downloads",
  "geolocation",
  "history",
  "management",
  "nativeMessaging",
  "pageCapture",
  "privacy",
  "proxy",
  "tabs",
  "tabCapture",
  "topSites",
  "webNavigation",
  "webRequest",
  "webRequestBlocking",
  "<all_urls>",
  "cookies",
  "clipboardRead",
  "clipboardWrite",
  "bookmarks",
  "browsingData",
  "contentSettings",
];

// Permissions that represent extreme risk
export const CRITICAL_PERMISSIONS: string[] = [
  "debugger",
  "nativeMessaging",
  "webRequestBlocking",
  "<all_urls>",
  "proxy",
  "management",
];

// Storage keys
export const STORAGE_KEYS = {
  ALERTS: "alerts",
  CHANGELOG: "changelog",
  SETTINGS: "settings",
} as const;

// Default settings
export const DEFAULT_SETTINGS: ShieldSettings = {
  notificationsEnabled: true,
  retentionDays: 30,
  ignoredExtensions: [],
  monitorNetworkRequests: true,
  domainBurstThreshold: 5,
};

// Network monitoring
export const NETWORK_BATCH_SIZE = 50;
export const NETWORK_FLUSH_INTERVAL_MS = 5_000;
export const EXTENSION_URL_PREFIX = "chrome-extension://";

// Alarms
export const ALARM_PRUNE_LOGS = "shield-prune-logs";
export const ALARM_RECALC_RISK = "shield-recalc-risk";
export const PRUNE_INTERVAL_MINUTES = 60;
export const RECALC_INTERVAL_MINUTES = 1440; // daily

// Badge
export const BADGE_COLOR = "#ef4444";
