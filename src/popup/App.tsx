import { useEffect, useState } from "react";
import type { MonitoredExtension, Alert } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";
import StatusBanner from "./components/StatusBanner";
import AlertList from "./components/AlertList";
import ExtensionList from "./components/ExtensionList";

export default function App() {
  const [extensions, setExtensions] = useState<MonitoredExtension[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [extRes, alertRes] = await Promise.all([
          sendMessage<{ ok: boolean; data: MonitoredExtension[] }>({
            type: "GET_EXTENSIONS",
          }),
          sendMessage<{ ok: boolean; data: Alert[] }>({
            type: "GET_ALERTS",
          }),
        ]);
        if (extRes.ok) setExtensions(extRes.data);
        if (alertRes.ok) setAlerts(alertRes.data);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openDashboard() {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html"),
    });
  }

  if (loading) {
    return (
      <div className="w-[400px] h-[500px] bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[400px] min-h-[500px] max-h-[600px] bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-xs font-bold">
            S
          </div>
          <h1 className="text-sm font-bold">ShieldBrowser</h1>
        </div>
        <button
          onClick={openDashboard}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
        >
          Dashboard →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <StatusBanner extensions={extensions} alerts={alerts} />

        {/* Alerts section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Recent Alerts
          </h2>
          <AlertList alerts={alerts} />
        </div>

        {/* Extensions section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Monitored Extensions ({extensions.length})
          </h2>
          <ExtensionList extensions={extensions} />
        </div>
      </div>
    </div>
  );
}
