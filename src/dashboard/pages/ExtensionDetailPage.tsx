import { useParams } from "react-router-dom";
import { useExtension } from "../hooks/useExtensions";
import { useChangelog } from "../hooks/useChangelog";
import { useNetworkLog } from "../hooks/useNetworkLog";
import { useState, useEffect } from "react";
import type { ExtensionDomainProfile } from "@/shared/types";
import { sendMessage } from "@/shared/message-types";
import RiskBadge from "../components/RiskBadge";
import PermissionDisplay from "../components/PermissionDiff";
import NetworkTable from "../components/NetworkTable";
import { formatRelativeTime } from "@/shared/utils";

export default function ExtensionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { extension, loading } = useExtension(id!);
  const { entries: changelog } = useChangelog(id);
  const { entries: networkEntries } = useNetworkLog(undefined, id);
  const [domainProfile, setDomainProfile] =
    useState<ExtensionDomainProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    "permissions" | "network" | "changelog" | "domains"
  >("permissions");

  useEffect(() => {
    if (!id) return;
    sendMessage<{ ok: boolean; data: ExtensionDomainProfile | null }>({
      type: "GET_DOMAIN_PROFILE",
      extensionId: id,
    }).then((res) => {
      if (res.ok) setDomainProfile(res.data);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!extension) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Extension not found
      </div>
    );
  }

  const tabs = [
    { key: "permissions" as const, label: "Permissions" },
    { key: "domains" as const, label: "Domains" },
    { key: "network" as const, label: "Network" },
    { key: "changelog" as const, label: "Changelog" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {extension.iconUrl ? (
          <img src={extension.iconUrl} alt="" className="w-12 h-12 rounded-lg" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-400">
            {extension.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{extension.name}</h1>
            <RiskBadge score={extension.riskScore} size="md" />
            {!extension.enabled && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                Disabled
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            v{extension.version} · {extension.installType} ·
            First seen {formatRelativeTime(extension.firstSeen)}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-emerald-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "permissions" && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3">
            Permissions ({extension.permissions.length + extension.hostPermissions.length})
          </h2>
          <PermissionDisplay
            permissions={extension.permissions}
            hostPermissions={extension.hostPermissions}
          />
        </div>
      )}

      {activeTab === "domains" && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3">
            Known Domains ({domainProfile?.knownDomains.length ?? 0})
          </h2>
          {!domainProfile || domainProfile.knownDomains.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No domains contacted yet
            </p>
          ) : (
            <div className="space-y-1">
              {domainProfile.knownDomains.map((domain) => (
                <div key={domain} className="flex items-center justify-between py-1">
                  <span className="text-sm text-emerald-400 font-mono">
                    {domain}
                  </span>
                  <span className="text-xs text-gray-500">
                    {domainProfile.domainFirstSeen[domain]
                      ? formatRelativeTime(domainProfile.domainFirstSeen[domain])
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "network" && (
        <NetworkTable entries={networkEntries} showExtension={false} />
      )}

      {activeTab === "changelog" && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3">Changelog</h2>
          {changelog.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No events recorded
            </p>
          ) : (
            <div className="space-y-3">
              {changelog.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-1 bg-gray-700 rounded" />
                  <div>
                    <p className="text-sm">{entry.summary}</p>
                    {entry.details && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.details}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
