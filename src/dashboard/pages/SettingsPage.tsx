import { useState, useEffect } from "react";
import type { ShieldSettings } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";
import type { StorageStats } from "@/shared/message-types";
import { formatBytes } from "@/shared/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShieldSettings | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      sendMessage<{ ok: boolean; data: ShieldSettings }>({
        type: "GET_SETTINGS",
      }),
      sendMessage<{ ok: boolean; data: StorageStats }>({
        type: "GET_STORAGE_STATS",
      }),
    ]).then(([settingsRes, statsRes]) => {
      if (settingsRes.ok) setSettings(settingsRes.data);
      if (statsRes.ok) setStats(statsRes.data);
    });
  }, []);

  async function updateSetting(partial: Partial<ShieldSettings>) {
    setSaving(true);
    try {
      const res = await sendMessage<{ ok: boolean; data: ShieldSettings }>({
        type: "UPDATE_SETTINGS",
        settings: partial,
      });
      if (res.ok) setSettings(res.data);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure ShieldBrowser behavior
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm">Desktop notifications</p>
            <p className="text-xs text-gray-500">
              Show alerts for warning and critical events
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) =>
              updateSetting({ notificationsEnabled: e.target.checked })
            }
            className="rounded"
          />
        </label>
      </div>

      {/* Network Monitoring */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Network Monitoring</h2>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm">Monitor network requests</p>
            <p className="text-xs text-gray-500">
              Track domains contacted by extensions
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.monitorNetworkRequests}
            onChange={(e) =>
              updateSetting({ monitorNetworkRequests: e.target.checked })
            }
            className="rounded"
          />
        </label>
        <div>
          <label className="text-sm">Domain burst threshold</label>
          <p className="text-xs text-gray-500 mb-2">
            Alert when an extension contacts this many new domains at once
          </p>
          <input
            type="number"
            min={2}
            max={50}
            value={settings.domainBurstThreshold}
            onChange={(e) =>
              updateSetting({
                domainBurstThreshold: parseInt(e.target.value) || 5,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-20 focus:outline-none focus:border-gray-600"
          />
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Data Retention</h2>
        <div>
          <label className="text-sm">Keep network logs for</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min={1}
              max={365}
              value={settings.retentionDays}
              onChange={(e) =>
                updateSetting({
                  retentionDays: parseInt(e.target.value) || 30,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-20 focus:outline-none focus:border-gray-600"
            />
            <span className="text-sm text-gray-400">days</span>
          </div>
        </div>
      </div>

      {/* Storage stats */}
      {stats && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3">Storage Usage</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Total size:</span>{" "}
              {formatBytes(stats.totalBytes)}
            </div>
            <div>
              <span className="text-gray-400">Extensions:</span>{" "}
              {stats.extensionCount}
            </div>
            <div>
              <span className="text-gray-400">Alerts:</span>{" "}
              {stats.alertCount}
            </div>
            <div>
              <span className="text-gray-400">Network entries:</span>{" "}
              {stats.networkEntryCount}
            </div>
            <div>
              <span className="text-gray-400">Changelog:</span>{" "}
              {stats.changelogCount}
            </div>
          </div>
        </div>
      )}

      {saving && (
        <p className="text-xs text-gray-500">Saving...</p>
      )}
    </div>
  );
}
