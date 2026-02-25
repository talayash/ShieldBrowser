import type {
  MonitoredExtension,
  PermissionDiff,
  Alert,
  AlertSeverity,
  AlertType,
} from "@/shared/types";
import { DANGEROUS_PERMISSIONS, CRITICAL_PERMISSIONS } from "@/shared/constants";
import { generateId, getRiskLevel } from "@/shared/utils";
import * as storage from "./storage-manager";

/** Create and store an alert, optionally send notification */
async function createAlert(
  extensionId: string,
  extensionName: string,
  severity: AlertSeverity,
  type: AlertType,
  title: string,
  description: string
): Promise<Alert> {
  const alert: Alert = {
    id: generateId(),
    extensionId,
    extensionName,
    severity,
    title,
    description,
    timestamp: Date.now(),
    acknowledged: false,
    type,
  };

  await storage.addAlert(alert);

  // Send notification for warning/critical
  if (severity !== "info") {
    const settings = await storage.getSettings();
    if (settings.notificationsEnabled) {
      try {
        chrome.notifications.create(alert.id, {
          type: "basic",
          iconUrl: "icons/icon-128.png",
          title: `ShieldBrowser: ${title}`,
          message: description,
          priority: severity === "critical" ? 2 : 1,
        });
      } catch (e) {
        console.warn("[ShieldBrowser] Notification failed:", e);
      }
    }
  }

  return alert;
}

/** Evaluate a newly installed extension */
export async function evaluateNewExtension(
  ext: MonitoredExtension
): Promise<void> {
  const riskLevel = getRiskLevel(ext.riskScore);

  if (riskLevel === "critical") {
    await createAlert(
      ext.id,
      ext.name,
      "critical",
      "new_extension",
      "High-Risk Extension Installed",
      `"${ext.name}" was installed with critical risk permissions (score: ${ext.riskScore}).`
    );
  } else if (riskLevel === "warning") {
    await createAlert(
      ext.id,
      ext.name,
      "warning",
      "new_extension",
      "Extension Installed with Elevated Permissions",
      `"${ext.name}" was installed with notable permissions (score: ${ext.riskScore}).`
    );
  } else {
    await createAlert(
      ext.id,
      ext.name,
      "info",
      "new_extension",
      "New Extension Installed",
      `"${ext.name}" was installed.`
    );
  }
}

/** Evaluate an extension removal */
export async function evaluateExtensionRemoved(
  ext: MonitoredExtension
): Promise<void> {
  await createAlert(
    ext.id,
    ext.name,
    "info",
    "extension_removed",
    "Extension Removed",
    `"${ext.name}" was uninstalled.`
  );
}

/** Evaluate an extension enable/disable toggle */
export async function evaluateExtensionToggle(
  ext: MonitoredExtension,
  enabled: boolean
): Promise<void> {
  const type: AlertType = enabled ? "extension_enabled" : "extension_disabled";
  await createAlert(
    ext.id,
    ext.name,
    "info",
    type,
    enabled ? "Extension Enabled" : "Extension Disabled",
    `"${ext.name}" was ${enabled ? "enabled" : "disabled"}.`
  );
}

/** Evaluate permission changes — the most important alert */
export async function evaluatePermissionDiff(
  diff: PermissionDiff
): Promise<void> {
  const allAdded = [...diff.added, ...diff.hostAdded];
  const allRemoved = [...diff.removed, ...diff.hostRemoved];

  if (allAdded.length === 0 && allRemoved.length === 0) return;

  // Check severity of added permissions
  const hasCritical = allAdded.some((p) => CRITICAL_PERMISSIONS.includes(p));
  const hasDangerous = allAdded.some((p) => DANGEROUS_PERMISSIONS.includes(p));

  if (hasCritical) {
    await createAlert(
      diff.extensionId,
      diff.extensionName,
      "critical",
      "permission_escalation",
      "Critical Permission Escalation",
      `"${diff.extensionName}" gained critical permissions: ${allAdded.join(", ")}. ` +
        (diff.oldVersion !== diff.newVersion
          ? `Updated from v${diff.oldVersion} → v${diff.newVersion}.`
          : "")
    );
  } else if (hasDangerous) {
    await createAlert(
      diff.extensionId,
      diff.extensionName,
      "warning",
      "permission_escalation",
      "Permission Escalation Detected",
      `"${diff.extensionName}" gained sensitive permissions: ${allAdded.join(", ")}.`
    );
  } else if (allAdded.length > 0) {
    await createAlert(
      diff.extensionId,
      diff.extensionName,
      "info",
      "permission_escalation",
      "New Permissions Added",
      `"${diff.extensionName}" added permissions: ${allAdded.join(", ")}.`
    );
  }

  if (allRemoved.length > 0) {
    await createAlert(
      diff.extensionId,
      diff.extensionName,
      "info",
      "permission_reduction",
      "Permissions Reduced",
      `"${diff.extensionName}" removed permissions: ${allRemoved.join(", ")}.`
    );
  }
}

/** Evaluate new domains contacted by an extension */
export async function evaluateNewDomains(
  extensionId: string,
  extensionName: string,
  newDomains: string[],
  totalKnown: number
): Promise<void> {
  if (newDomains.length === 0) return;

  const settings = await storage.getSettings();

  if (newDomains.length >= settings.domainBurstThreshold) {
    await createAlert(
      extensionId,
      extensionName,
      "critical",
      "domain_burst",
      "Domain Burst Detected",
      `"${extensionName}" suddenly contacted ${newDomains.length} new domains: ${newDomains.slice(0, 5).join(", ")}${newDomains.length > 5 ? "..." : ""}`
    );
  } else if (totalKnown > 3) {
    // Only alert on single new domains if extension already has established pattern
    for (const domain of newDomains) {
      await createAlert(
        extensionId,
        extensionName,
        "warning",
        "new_domain",
        "New Domain Contacted",
        `"${extensionName}" contacted a new domain: ${domain}`
      );
    }
  }
}
