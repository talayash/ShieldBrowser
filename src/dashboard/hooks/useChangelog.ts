import { useState, useEffect } from "react";
import type { ChangelogEntry } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";

export function useChangelog(extensionId?: string) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await sendMessage<{ ok: boolean; data: ChangelogEntry[] }>({
        type: "GET_CHANGELOG",
        extensionId,
      });
      if (res.ok) setEntries(res.data);
    } catch (e) {
      console.error("Failed to load changelog:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [extensionId]);

  return { entries, loading, refresh };
}
