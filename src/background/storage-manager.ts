import type {
  MonitoredExtension,
  PermissionSnapshot,
  ExtensionDomainProfile,
  NetworkEntry,
  Alert,
  ChangelogEntry,
  ShieldSettings,
} from "@/shared/types";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/shared/constants";
import { storageKey, getDateKey } from "@/shared/utils";

const storage = chrome.storage.local;

// ── Generic helpers ──

async function get<T>(key: string): Promise<T | undefined> {
  const result = await storage.get(key);
  return result[key] as T | undefined;
}

async function set(key: string, value: unknown): Promise<void> {
  await storage.set({ [key]: value });
}

// ── Extensions ──

export async function getExtension(
  id: string
): Promise<MonitoredExtension | undefined> {
  return get<MonitoredExtension>(storageKey.extension(id));
}

export async function setExtension(ext: MonitoredExtension): Promise<void> {
  await set(storageKey.extension(ext.id), ext);
}

export async function removeExtension(id: string): Promise<void> {
  await storage.remove([
    storageKey.extension(id),
    storageKey.snapshot(id),
    storageKey.domains(id),
  ]);
}

export async function getAllExtensions(): Promise<MonitoredExtension[]> {
  const all = await storage.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith("ext:"))
    .map(([, value]) => value as MonitoredExtension)
    .sort((a, b) => b.riskScore - a.riskScore);
}

// ── Permission Snapshots ──

export async function getSnapshots(
  extensionId: string
): Promise<PermissionSnapshot[]> {
  return (await get<PermissionSnapshot[]>(storageKey.snapshot(extensionId))) ?? [];
}

export async function addSnapshot(snap: PermissionSnapshot): Promise<void> {
  const key = storageKey.snapshot(snap.extensionId);
  const existing = (await get<PermissionSnapshot[]>(key)) ?? [];
  existing.push(snap);
  // Keep last 50 snapshots per extension
  if (existing.length > 50) existing.splice(0, existing.length - 50);
  await set(key, existing);
}

// ── Domain Profiles ──

export async function getDomainProfile(
  extensionId: string
): Promise<ExtensionDomainProfile | null> {
  return (await get<ExtensionDomainProfile>(storageKey.domains(extensionId))) ?? null;
}

export async function setDomainProfile(
  profile: ExtensionDomainProfile
): Promise<void> {
  await set(storageKey.domains(profile.extensionId), profile);
}

// ── Network Log ──

export async function getNetworkLog(
  date?: string,
  extensionId?: string
): Promise<NetworkEntry[]> {
  const dateKey = date ?? getDateKey();
  const key = storageKey.netlog(dateKey);
  const entries = (await get<NetworkEntry[]>(key)) ?? [];
  if (extensionId) {
    return entries.filter((e) => e.extensionId === extensionId);
  }
  return entries;
}

export async function appendNetworkEntries(
  entries: NetworkEntry[]
): Promise<void> {
  if (entries.length === 0) return;
  const dateKey = getDateKey();
  const key = storageKey.netlog(dateKey);
  const existing = (await get<NetworkEntry[]>(key)) ?? [];
  existing.push(...entries);
  await set(key, existing);
}

// ── Alerts ──

export async function getAlerts(): Promise<Alert[]> {
  return (await get<Alert[]>(STORAGE_KEYS.ALERTS)) ?? [];
}

export async function addAlert(alert: Alert): Promise<void> {
  const alerts = await getAlerts();
  alerts.unshift(alert);
  // Keep last 500 alerts
  if (alerts.length > 500) alerts.splice(500);
  await set(STORAGE_KEYS.ALERTS, alerts);
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const alerts = await getAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    await set(STORAGE_KEYS.ALERTS, alerts);
  }
}

export async function acknowledgeAllAlerts(): Promise<void> {
  const alerts = await getAlerts();
  for (const alert of alerts) {
    alert.acknowledged = true;
  }
  await set(STORAGE_KEYS.ALERTS, alerts);
}

export async function getUnreadAlertCount(): Promise<number> {
  const alerts = await getAlerts();
  return alerts.filter((a) => !a.acknowledged).length;
}

// ── Changelog ──

export async function getChangelog(
  extensionId?: string
): Promise<ChangelogEntry[]> {
  const entries =
    (await get<ChangelogEntry[]>(STORAGE_KEYS.CHANGELOG)) ?? [];
  if (extensionId) {
    return entries.filter((e) => e.extensionId === extensionId);
  }
  return entries;
}

export async function addChangelogEntry(
  entry: ChangelogEntry
): Promise<void> {
  const entries = await getChangelog();
  entries.unshift(entry);
  // Keep last 1000 entries
  if (entries.length > 1000) entries.splice(1000);
  await set(STORAGE_KEYS.CHANGELOG, entries);
}

// ── Settings ──

export async function getSettings(): Promise<ShieldSettings> {
  return (await get<ShieldSettings>(STORAGE_KEYS.SETTINGS)) ?? { ...DEFAULT_SETTINGS };
}

export async function updateSettings(
  partial: Partial<ShieldSettings>
): Promise<ShieldSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await set(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// ── Pruning ──

export async function pruneOldNetworkLogs(
  retentionDays: number
): Promise<void> {
  const all = await storage.get(null);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffKey = getDateKey(cutoff);

  const keysToRemove = Object.keys(all).filter(
    (key) => key.startsWith("netlog:") && key < `netlog:${cutoffKey}`
  );

  if (keysToRemove.length > 0) {
    await storage.remove(keysToRemove);
    console.log(`[ShieldBrowser] Pruned ${keysToRemove.length} old network logs`);
  }
}

// ── Storage Stats ──

export async function getStorageStats() {
  const all = await storage.get(null);
  const keys = Object.keys(all);

  let totalBytes = 0;
  let extensionCount = 0;
  let networkEntryCount = 0;

  for (const key of keys) {
    const json = JSON.stringify(all[key]);
    totalBytes += json.length * 2; // rough UTF-16 estimate
    if (key.startsWith("ext:")) extensionCount++;
    if (key.startsWith("netlog:")) {
      networkEntryCount += (all[key] as NetworkEntry[]).length;
    }
  }

  const alerts = (all[STORAGE_KEYS.ALERTS] as Alert[] | undefined) ?? [];
  const changelog =
    (all[STORAGE_KEYS.CHANGELOG] as ChangelogEntry[] | undefined) ?? [];

  return {
    totalBytes,
    extensionCount,
    alertCount: alerts.length,
    networkEntryCount,
    changelogCount: changelog.length,
  };
}
