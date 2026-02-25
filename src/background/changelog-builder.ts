import type {
  MonitoredExtension,
  PermissionDiff,
  ChangelogEntry,
  ChangelogType,
} from "@/shared/types";
import { generateId } from "@/shared/utils";
import * as storage from "./storage-manager";

/** Add a changelog entry for a lifecycle event */
export async function addChangelogEntryForEvent(
  type: ChangelogType,
  ext: MonitoredExtension
): Promise<void> {
  const summaryMap: Record<string, string> = {
    installed: `"${ext.name}" was installed (v${ext.version})`,
    uninstalled: `"${ext.name}" was uninstalled`,
    enabled: `"${ext.name}" was enabled`,
    disabled: `"${ext.name}" was disabled`,
  };

  const entry: ChangelogEntry = {
    id: generateId(),
    extensionId: ext.id,
    extensionName: ext.name,
    timestamp: Date.now(),
    type,
    summary: summaryMap[type] ?? `${type} event for "${ext.name}"`,
    details:
      type === "installed"
        ? `Permissions: ${ext.permissions.join(", ") || "none"}. Host permissions: ${ext.hostPermissions.join(", ") || "none"}.`
        : undefined,
  };

  await storage.addChangelogEntry(entry);
}

/** Add a changelog entry for permission changes */
export async function addChangelogEntryForPermissionChange(
  diff: PermissionDiff,
  ext: MonitoredExtension
): Promise<void> {
  const parts: string[] = [];

  if (diff.oldVersion !== diff.newVersion) {
    parts.push(`Updated from v${diff.oldVersion} to v${diff.newVersion}.`);
  }

  if (diff.added.length > 0) {
    parts.push(`Added permissions: ${diff.added.join(", ")}.`);
  }
  if (diff.removed.length > 0) {
    parts.push(`Removed permissions: ${diff.removed.join(", ")}.`);
  }
  if (diff.hostAdded.length > 0) {
    parts.push(`Added host access: ${diff.hostAdded.join(", ")}.`);
  }
  if (diff.hostRemoved.length > 0) {
    parts.push(`Removed host access: ${diff.hostRemoved.join(", ")}.`);
  }

  const entry: ChangelogEntry = {
    id: generateId(),
    extensionId: ext.id,
    extensionName: ext.name,
    timestamp: Date.now(),
    type: diff.oldVersion !== diff.newVersion ? "updated" : "permissions_changed",
    summary: `"${ext.name}" permissions changed`,
    details: parts.join(" "),
  };

  await storage.addChangelogEntry(entry);
}

/** Add a changelog entry for new domain contact */
export async function addChangelogEntryForNewDomain(
  extensionId: string,
  extensionName: string,
  domains: string[]
): Promise<void> {
  const entry: ChangelogEntry = {
    id: generateId(),
    extensionId,
    extensionName,
    timestamp: Date.now(),
    type: "new_domain_contacted",
    summary: `"${extensionName}" contacted ${domains.length} new domain${domains.length > 1 ? "s" : ""}`,
    details: `New domains: ${domains.join(", ")}`,
  };

  await storage.addChangelogEntry(entry);
}
