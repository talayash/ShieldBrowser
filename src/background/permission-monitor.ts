import type { PermissionDiff, MonitoredExtension } from "@/shared/types";
import { generateId, calculateRiskScore } from "@/shared/utils";
import * as storage from "./storage-manager";
import { evaluatePermissionDiff } from "./alert-engine";
import { addChangelogEntryForPermissionChange } from "./changelog-builder";
import { refreshBadge } from "./badge-manager";

/** Check all extensions for permission/version changes */
export async function checkForPermissionChanges(): Promise<void> {
  const extensions = await chrome.management.getAll();

  for (const ext of extensions) {
    if (ext.id === chrome.runtime.id) continue;
    if (ext.type === "theme") continue;

    const monitored = await storage.getExtension(ext.id);
    if (!monitored) continue;

    const currentPermissions = ext.permissions ?? [];
    const currentHostPermissions = ext.hostPermissions ?? [];

    // Check for changes
    const permChanged =
      !arraysEqual(monitored.permissions, currentPermissions) ||
      !arraysEqual(monitored.hostPermissions, currentHostPermissions);
    const versionChanged = monitored.version !== ext.version;

    if (permChanged || versionChanged) {
      const diff = computeDiff(monitored, ext);

      // Update stored extension
      const updated: MonitoredExtension = {
        ...monitored,
        version: ext.version,
        permissions: currentPermissions,
        hostPermissions: currentHostPermissions,
        riskScore: calculateRiskScore(currentPermissions, currentHostPermissions),
        lastUpdated: Date.now(),
      };
      await storage.setExtension(updated);

      // Store new snapshot
      await storage.addSnapshot({
        id: generateId(),
        extensionId: ext.id,
        timestamp: Date.now(),
        version: ext.version,
        permissions: currentPermissions,
        hostPermissions: currentHostPermissions,
      });

      // Evaluate and alert
      if (diff.added.length > 0 || diff.removed.length > 0 ||
          diff.hostAdded.length > 0 || diff.hostRemoved.length > 0) {
        await evaluatePermissionDiff(diff);
        await addChangelogEntryForPermissionChange(diff, updated);
        await refreshBadge();
      }
    }
  }
}

function computeDiff(
  monitored: MonitoredExtension,
  current: chrome.management.ExtensionInfo
): PermissionDiff {
  const currentPermissions = current.permissions ?? [];
  const currentHostPermissions = current.hostPermissions ?? [];

  return {
    extensionId: monitored.id,
    extensionName: monitored.name,
    timestamp: Date.now(),
    oldVersion: monitored.version,
    newVersion: current.version,
    added: currentPermissions.filter((p) => !monitored.permissions.includes(p)),
    removed: monitored.permissions.filter((p) => !currentPermissions.includes(p)),
    hostAdded: currentHostPermissions.filter(
      (p) => !monitored.hostPermissions.includes(p)
    ),
    hostRemoved: monitored.hostPermissions.filter(
      (p) => !currentHostPermissions.includes(p)
    ),
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}
