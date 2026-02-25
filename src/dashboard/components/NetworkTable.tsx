import { useState, useMemo } from "react";
import type { NetworkEntry } from "@/shared/types";
import { formatRelativeTime } from "@/shared/utils";

interface Props {
  entries: NetworkEntry[];
  showExtension?: boolean;
}

type SortField = "timestamp" | "domain" | "extensionName" | "method" | "type";
type SortDir = "asc" | "desc";

export default function NetworkTable({
  entries,
  showExtension = true,
}: Props) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return entries.filter(
      (e) =>
        !q ||
        e.domain.toLowerCase().includes(q) ||
        e.extensionName.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q)
    );
  }, [entries, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va ?? "");
      const sb = String(vb ?? "");
      return sortDir === "asc"
        ? sa.localeCompare(sb)
        : sb.localeCompare(sa);
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortHeader({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <th
        className="text-left py-2 px-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-white select-none"
        onClick={() => toggleSort(field)}
      >
        {children}
        {sortField === field && (
          <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No network requests captured yet
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Filter by domain, extension, or URL..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 mb-3 focus:outline-none focus:border-gray-600"
      />
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <SortHeader field="timestamp">Time</SortHeader>
              {showExtension && (
                <SortHeader field="extensionName">Extension</SortHeader>
              )}
              <SortHeader field="domain">Domain</SortHeader>
              <SortHeader field="method">Method</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {sorted.slice(0, 200).map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2 px-3 text-gray-400 text-xs whitespace-nowrap">
                  {formatRelativeTime(entry.timestamp)}
                </td>
                {showExtension && (
                  <td className="py-2 px-3 text-xs truncate max-w-[150px]">
                    {entry.extensionName}
                  </td>
                )}
                <td className="py-2 px-3 text-xs text-emerald-400 truncate max-w-[200px]">
                  {entry.domain}
                </td>
                <td className="py-2 px-3 text-xs">
                  <span className="bg-gray-800 rounded px-1.5 py-0.5 font-mono">
                    {entry.method}
                  </span>
                </td>
                <td className="py-2 px-3 text-xs text-gray-400">
                  {entry.type}
                </td>
                <td className="py-2 px-3 text-xs">
                  {entry.statusCode ? (
                    <span
                      className={
                        entry.statusCode >= 400
                          ? "text-red-400"
                          : "text-emerald-400"
                      }
                    >
                      {entry.statusCode}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && (
          <div className="text-center py-2 text-xs text-gray-500 bg-gray-900">
            Showing 200 of {sorted.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
