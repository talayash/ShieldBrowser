import { useState } from "react";
import { useNetworkLog } from "../hooks/useNetworkLog";
import NetworkTable from "../components/NetworkTable";
import { getDateKey } from "@/shared/utils";

export default function NetworkLogPage() {
  const [date, setDate] = useState(getDateKey());
  const { entries, loading, refresh } = useNetworkLog(date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Network Log</h1>
          <p className="text-sm text-gray-400 mt-1">
            All network requests made by extensions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gray-600"
          />
          <button
            onClick={refresh}
            className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading...
        </div>
      ) : (
        <NetworkTable entries={entries} />
      )}
    </div>
  );
}
