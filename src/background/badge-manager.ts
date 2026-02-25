import { BADGE_COLOR } from "@/shared/constants";
import * as storage from "./storage-manager";

/** Update the extension action badge with unread alert count */
export async function refreshBadge(): Promise<void> {
  try {
    const count = await storage.getUnreadAlertCount();
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    await chrome.action.setBadgeText({
      text: count > 0 ? (count > 99 ? "99+" : String(count)) : "",
    });
  } catch (e) {
    console.warn("[ShieldBrowser] Badge update failed:", e);
  }
}

/** Clear badge (e.g., when popup opens) */
export async function clearBadge(): Promise<void> {
  try {
    await chrome.action.setBadgeText({ text: "" });
  } catch (e) {
    console.warn("[ShieldBrowser] Badge clear failed:", e);
  }
}
