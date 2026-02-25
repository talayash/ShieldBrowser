import { useState, useEffect } from "react";
import type { MonitoredExtension } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";

export function useExtensions() {
  const [extensions, setExtensions] = useState<MonitoredExtension[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await sendMessage<{ ok: boolean; data: MonitoredExtension[] }>({
        type: "GET_EXTENSIONS",
      });
      if (res.ok) setExtensions(res.data);
    } catch (e) {
      console.error("Failed to load extensions:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { extensions, loading, refresh };
}

export function useExtension(extensionId: string) {
  const [extension, setExtension] = useState<MonitoredExtension | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await sendMessage<{
          ok: boolean;
          data: MonitoredExtension | null;
        }>({ type: "GET_EXTENSION", extensionId });
        if (res.ok) setExtension(res.data);
      } catch (e) {
        console.error("Failed to load extension:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [extensionId]);

  return { extension, loading };
}
