// ShieldBrowser Service Worker
// All listeners MUST register synchronously at top level (MV3 requirement)

import * as storageManager from "./storage-manager";
import { registerLifecycleListeners, enumerateExtensions } from "./extension-tracker";
import { checkForPermissionChanges } from "./permission-monitor";
import { registerNetworkListeners } from "./network-monitor";
import { refreshBadge } from "./badge-manager";
import type { MessageRequest } from "@/shared/message-types";
import {
  ALARM_PRUNE_LOGS,
  ALARM_RECALC_RISK,
  PRUNE_INTERVAL_MINUTES,
  RECALC_INTERVAL_MINUTES,
} from "@/shared/constants";

console.log("[ShieldBrowser] Service worker starting");

// ── Synchronous listener registration (MV3 requirement) ──

// Lifecycle listeners
registerLifecycleListeners();

// Network request listeners
registerNetworkListeners();

// ── Installation handler ──
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[ShieldBrowser] Installed:", details.reason);
  await enumerateExtensions();
  await refreshBadge();

  // Set up periodic alarms
  chrome.alarms.create(ALARM_PRUNE_LOGS, {
    periodInMinutes: PRUNE_INTERVAL_MINUTES,
  });
  chrome.alarms.create(ALARM_RECALC_RISK, {
    periodInMinutes: RECALC_INTERVAL_MINUTES,
  });
});

// ── Startup handler (SW restart) ──
chrome.runtime.onStartup.addListener(async () => {
  console.log("[ShieldBrowser] Browser startup");
  await enumerateExtensions();
  await refreshBadge();
});

// ── Alarm handler ──
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_PRUNE_LOGS) {
    const settings = await storageManager.getSettings();
    await storageManager.pruneOldNetworkLogs(settings.retentionDays);
  } else if (alarm.name === ALARM_RECALC_RISK) {
    await checkForPermissionChanges();
  }
});

// ── Message handler (popup/dashboard → background) ──
chrome.runtime.onMessage.addListener(
  (message: MessageRequest, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => {
        console.error("[ShieldBrowser] Message handler error:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // keep channel open for async response
  }
);

async function handleMessage(message: MessageRequest) {
  switch (message.type) {
    case "PING":
      return { ok: true };

    case "GET_EXTENSIONS":
      return { ok: true, data: await storageManager.getAllExtensions() };

    case "GET_EXTENSION":
      return {
        ok: true,
        data: (await storageManager.getExtension(message.extensionId)) ?? null,
      };

    case "GET_ALERTS":
      return { ok: true, data: await storageManager.getAlerts() };

    case "GET_UNREAD_ALERT_COUNT":
      return { ok: true, data: await storageManager.getUnreadAlertCount() };

    case "ACKNOWLEDGE_ALERT":
      await storageManager.acknowledgeAlert(message.alertId);
      await refreshBadge();
      return { ok: true };

    case "ACKNOWLEDGE_ALL_ALERTS":
      await storageManager.acknowledgeAllAlerts();
      await refreshBadge();
      return { ok: true };

    case "GET_CHANGELOG":
      return {
        ok: true,
        data: await storageManager.getChangelog(message.extensionId),
      };

    case "GET_NETWORK_LOG":
      return {
        ok: true,
        data: await storageManager.getNetworkLog(
          message.date,
          message.extensionId
        ),
      };

    case "GET_DOMAIN_PROFILE":
      return {
        ok: true,
        data: await storageManager.getDomainProfile(message.extensionId),
      };

    case "GET_SETTINGS":
      return { ok: true, data: await storageManager.getSettings() };

    case "UPDATE_SETTINGS":
      return {
        ok: true,
        data: await storageManager.updateSettings(message.settings),
      };

    case "GET_STORAGE_STATS":
      return { ok: true, data: await storageManager.getStorageStats() };

    default:
      return { ok: false, error: "Unknown message type" };
  }
}

console.log("[ShieldBrowser] Service worker ready");
