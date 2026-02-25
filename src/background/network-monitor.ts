import type { NetworkEntry, ExtensionDomainProfile } from "@/shared/types";
import {
  EXTENSION_URL_PREFIX,
  NETWORK_BATCH_SIZE,
  NETWORK_FLUSH_INTERVAL_MS,
} from "@/shared/constants";
import { generateId, extractDomain, extractExtensionId } from "@/shared/utils";
import * as storage from "./storage-manager";
import { evaluateNewDomains } from "./alert-engine";
import { addChangelogEntryForNewDomain } from "./changelog-builder";

// ── In-memory state ──

/** Write buffer for batched network entry writes */
let writeBuffer: NetworkEntry[] = [];

/** In-memory domain sets per extension for O(1) lookup */
const knownDomainsCache = new Map<string, Set<string>>();

/** Extension name cache */
const extensionNameCache = new Map<string, string>();

/** Flush timer ID */
let flushTimerId: ReturnType<typeof setTimeout> | null = null;

// ── Domain cache management ──

/** Load known domains from storage into memory */
async function loadDomainCache(extensionId: string): Promise<Set<string>> {
  const cached = knownDomainsCache.get(extensionId);
  if (cached) return cached;

  const profile = await storage.getDomainProfile(extensionId);
  const domains = new Set(profile?.knownDomains ?? []);
  knownDomainsCache.set(extensionId, domains);
  return domains;
}

/** Get extension name (cached) */
async function getExtensionName(extensionId: string): Promise<string> {
  const cached = extensionNameCache.get(extensionId);
  if (cached) return cached;

  const ext = await storage.getExtension(extensionId);
  const name = ext?.name ?? "Unknown Extension";
  extensionNameCache.set(extensionId, name);
  return name;
}

// ── Batch writing ──

function scheduleFlush(): void {
  if (flushTimerId !== null) return;
  flushTimerId = setTimeout(flushBuffer, NETWORK_FLUSH_INTERVAL_MS);
}

async function flushBuffer(): Promise<void> {
  flushTimerId = null;
  if (writeBuffer.length === 0) return;

  const entries = writeBuffer;
  writeBuffer = [];

  try {
    await storage.appendNetworkEntries(entries);
  } catch (e) {
    console.error("[ShieldBrowser] Failed to flush network entries:", e);
    // Put entries back on failure (best effort)
    writeBuffer.unshift(...entries);
  }
}

function addToBuffer(entry: NetworkEntry): void {
  writeBuffer.push(entry);
  if (writeBuffer.length >= NETWORK_BATCH_SIZE) {
    flushBuffer();
  } else {
    scheduleFlush();
  }
}

// ── Request processing ──

async function processRequest(
  extensionId: string,
  url: string,
  method: string,
  type: chrome.webRequest.ResourceType
): Promise<void> {
  const domain = extractDomain(url);
  if (domain === "unknown") return;

  const extensionName = await getExtensionName(extensionId);

  // Add to write buffer
  const entry: NetworkEntry = {
    id: generateId(),
    extensionId,
    extensionName,
    url,
    domain,
    method,
    type,
    timestamp: Date.now(),
  };
  addToBuffer(entry);

  // Check for new domains
  const knownDomains = await loadDomainCache(extensionId);
  if (!knownDomains.has(domain)) {
    knownDomains.add(domain);

    // Track new domains this cycle for burst detection
    const newDomains = [domain];

    // Update domain profile in storage
    const profile = (await storage.getDomainProfile(extensionId)) ?? {
      extensionId,
      knownDomains: [],
      domainFirstSeen: {},
      totalRequests: 0,
      lastActivity: Date.now(),
    };

    profile.knownDomains = Array.from(knownDomains);
    profile.domainFirstSeen[domain] = Date.now();
    profile.totalRequests++;
    profile.lastActivity = Date.now();
    await storage.setDomainProfile(profile);

    // Evaluate for alerts
    await evaluateNewDomains(
      extensionId,
      extensionName,
      newDomains,
      profile.knownDomains.length
    );
    await addChangelogEntryForNewDomain(extensionId, extensionName, newDomains);
  } else {
    // Update request count
    const profile = await storage.getDomainProfile(extensionId);
    if (profile) {
      profile.totalRequests++;
      profile.lastActivity = Date.now();
      await storage.setDomainProfile(profile);
    }
  }
}

// ── Listener registration (MUST be called synchronously at top level) ──

export function registerNetworkListeners(): void {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // Only process requests initiated by extensions
      if (!details.initiator?.startsWith(EXTENSION_URL_PREFIX)) return;

      const extensionId = extractExtensionId(details.initiator);
      if (!extensionId) return;

      // Self-exclusion
      if (extensionId === chrome.runtime.id) return;

      processRequest(
        extensionId,
        details.url,
        details.method,
        details.type
      );
    },
    { urls: ["<all_urls>"] }
  );

  chrome.webRequest.onCompleted.addListener(
    (details) => {
      if (!details.initiator?.startsWith(EXTENSION_URL_PREFIX)) return;

      const extensionId = extractExtensionId(details.initiator);
      if (!extensionId) return;
      if (extensionId === chrome.runtime.id) return;

      // Update status code for the most recent matching entry in buffer
      const matching = writeBuffer
        .filter(
          (e) => e.extensionId === extensionId && e.url === details.url
        )
        .pop();
      if (matching) {
        matching.statusCode = details.statusCode;
      }
    },
    { urls: ["<all_urls>"] }
  );
}
