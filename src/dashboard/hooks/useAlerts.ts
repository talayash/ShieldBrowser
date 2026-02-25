import { useState, useEffect } from "react";
import type { Alert } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await sendMessage<{ ok: boolean; data: Alert[] }>({
        type: "GET_ALERTS",
      });
      if (res.ok) setAlerts(res.data);
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(alertId: string) {
    await sendMessage({ type: "ACKNOWLEDGE_ALERT", alertId });
    await refresh();
  }

  async function acknowledgeAll() {
    await sendMessage({ type: "ACKNOWLEDGE_ALL_ALERTS" });
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return { alerts, loading, refresh, acknowledge, acknowledgeAll };
}
