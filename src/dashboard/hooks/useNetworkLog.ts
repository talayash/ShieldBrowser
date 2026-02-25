import { useState, useEffect } from "react";
import type { NetworkEntry } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";
import { getDateKey } from "@/shared/utils";

export function useNetworkLog(date?: string, extensionId?: string) {
  const [entries, setEntries] = useState<NetworkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await sendMessage<{ ok: boolean; data: NetworkEntry[] }>({
        type: "GET_NETWORK_LOG",
        date: date ?? getDateKey(),
        extensionId,
      });
      if (res.ok) setEntries(res.data);
    } catch (e) {
      console.error("Failed to load network log:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [date, extensionId]);

  return { entries, loading, refresh };
}
