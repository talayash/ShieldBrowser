import type { MonitoredExtension } from "@/shared/types";
import { calculateRiskScore, generateId } from "@/shared/utils";
import * as storage from "./storage-manager";
import { evaluateNewExtension, evaluateExtensionRemoved, evaluateExtensionToggle } from "./alert-engine";
import { addChangelogEntryForEvent } from "./changelog-builder";
import { refreshBadge } from "./badge-manager";

/** Convert chrome.management.ExtensionInfo to our MonitoredExtension */
function toMonitored(ext: chrome.management.ExtensionInfo): MonitoredExtension {
  const permissions = ext.permissions ?? [];
  const hostPermissions = ext.hostPermissions ?? [];
  return {
    id: ext.id,
    name: ext.name,
    version: ext.installType === "development" ? ext.version : ext.version,
    enabled: ext.enabled,
    installType: ext.installType,
    permissions,
    hostPermissions,
    riskScore: calculateRiskScore(permissions, hostPermissions),
    firstSeen: Date.now(),
    lastUpdated: Date.now(),
    iconUrl: ext.icons?.at(-1)?.url,
  };
}

/** Check if an extension should be monitored (skip self and themes) */
function shouldMonitor(ext: chrome.management.ExtensionInfo): boolean {
  // Skip ourselves
  if (ext.id === chrome.runtime.id) return false;
  // Skip themes
  if (ext.type === "theme") return false;
  return true;
}

/** Enumerate all installed extensions and store them */
export async function enumerateExtensions(): Promise<void> {
  const extensions = await chrome.management.getAll();

  for (const ext of extensions) {
    if (!shouldMonitor(ext)) continue;

    const existing = await storage.getExtension(ext.id);
    if (!existing) {
      // New extension (first-time scan)
      const monitored = toMonitored(ext);
      await storage.setExtension(monitored);
      // Take initial permission snapshot
      await storage.addSnapshot({
        id: generateId(),
        extensionId: ext.id,
        timestamp: Date.now(),
        version: ext.version,
        permissions: ext.permissions ?? [],
        hostPermissions: ext.hostPermissions ?? [],
      });
    } else {
      // Update existing — check for version/permission changes
      const permissions = ext.permissions ?? [];
      const hostPermissions = ext.hostPermissions ?? [];
      const updated: MonitoredExtension = {
        ...existing,
        name: ext.name,
        version: ext.version,
        enabled: ext.enabled,
        permissions,
        hostPermissions,
        riskScore: calculateRiskScore(permissions, hostPermissions),
        lastUpdated: Date.now(),
        iconUrl: ext.icons?.at(-1)?.url,
      };
      await storage.setExtension(updated);
    }
  }

  console.log("[ShieldBrowser] Extension enumeration complete");
}

/** Register lifecycle listeners — MUST be called synchronously at top level */
export function registerLifecycleListeners(): void {
  chrome.management.onInstalled.addListener(async (ext) => {
    if (!shouldMonitor(ext)) return;
    console.log(`[ShieldBrowser] Extension installed: ${ext.name}`);

    const monitored = toMonitored(ext);
    await storage.setExtension(monitored);

    await storage.addSnapshot({
      id: generateId(),
      extensionId: ext.id,
      timestamp: Date.now(),
      version: ext.version,
      permissions: ext.permissions ?? [],
      hostPermissions: ext.hostPermissions ?? [],
    });

    await evaluateNewExtension(monitored);
    await addChangelogEntryForEvent("installed", monitored);
    await refreshBadge();
  });

  chrome.management.onUninstalled.addListener(async (id) => {
    console.log(`[ShieldBrowser] Extension uninstalled: ${id}`);
    const ext = await storage.getExtension(id);
    if (ext) {
      await evaluateExtensionRemoved(ext);
      await addChangelogEntryForEvent("uninstalled", ext);
    }
    await storage.removeExtension(id);
    await refreshBadge();
  });

  chrome.management.onEnabled.addListener(async (ext) => {
    if (!shouldMonitor(ext)) return;
    console.log(`[ShieldBrowser] Extension enabled: ${ext.name}`);
    const existing = await storage.getExtension(ext.id);
    if (existing) {
      existing.enabled = true;
      existing.lastUpdated = Date.now();
      await storage.setExtension(existing);
      await evaluateExtensionToggle(existing, true);
      await addChangelogEntryForEvent("enabled", existing);
      await refreshBadge();
    }
  });

  chrome.management.onDisabled.addListener(async (ext) => {
    if (!shouldMonitor(ext)) return;
    console.log(`[ShieldBrowser] Extension disabled: ${ext.name}`);
    const existing = await storage.getExtension(ext.id);
    if (existing) {
      existing.enabled = false;
      existing.lastUpdated = Date.now();
      await storage.setExtension(existing);
      await evaluateExtensionToggle(existing, false);
      await addChangelogEntryForEvent("disabled", existing);
      await refreshBadge();
    }
  });
}
