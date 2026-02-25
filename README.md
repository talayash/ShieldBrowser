<p align="center">
  <img src="public/icons/icon-128.png" alt="ShieldBrowser" width="96" height="96" />
</p>

<h1 align="center">ShieldBrowser</h1>

<p align="center">
  A meta-extension that monitors all other installed Chrome extensions for suspicious activity.<br/>
  <strong>A firewall for your browser extensions.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/react-19-61dafb" alt="React 19" />
  <img src="https://img.shields.io/badge/typescript-5.7-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwind-4-38bdf8" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/vite-6-646cff" alt="Vite 6" />
</p>

---

## Why

Chrome extensions have a critical trust crisis: **346 million users** installed dangerous extensions in a recent study, malicious updates happen silently, and no consumer tool monitors extension behavior after installation.

ShieldBrowser watches the watchers — it tracks every extension's permissions, network activity, and lifecycle changes, then alerts you when something suspicious happens.

## Features

### Network X-Ray
- Intercepts all HTTP requests made by extensions via `chrome.webRequest`
- Attributes each request to its source extension using the `initiator` field
- Tracks which domains each extension contacts over time
- Detects **domain bursts** — when an extension suddenly contacts many new domains (configurable threshold)
- Batched writes (50 entries or 5s) to avoid storage thrashing

### Permission Drift Alerts
- Snapshots every extension's permissions on install
- Detects permission changes during silent updates
- Flags **critical escalations** (debugger, nativeMessaging, proxy, `<all_urls>`)
- Flags **dangerous additions** (tabs, history, cookies, downloads, etc.)
- Generates human-readable diffs showing exactly what changed

### Behavior Changelog
- Full audit trail of every extension event: installs, removals, enables, disables, updates, permission changes, new domain contacts
- Filterable per-extension timeline
- Forensic-grade event reconstruction

### Alert System
- 3 severity levels: **info**, **warning**, **critical**
- 9 alert types covering lifecycle, permissions, and network events
- Desktop notifications for warning/critical events
- Unread count badge on the toolbar icon
- Bulk acknowledge in the dashboard

### Risk Scoring
- Every extension gets a 0–100 risk score based on its permission set
- Critical permissions (debugger, nativeMessaging, proxy) score highest
- Broad host permissions (`<all_urls>`, `*://*/*`) add additional weight
- Color-coded badges: Low / Medium / Warning / Critical

## Screenshots

### Popup (400px)
Quick-access view with health status, recent alerts, and monitored extension list with risk badges. Click **Dashboard** to open the full UI.

### Dashboard
| Page | Description |
|------|-------------|
| **Overview** | Stat cards, recent alerts, top-risk extensions |
| **Extension Detail** | Permissions (with danger labels), known domains, network table, changelog timeline |
| **Network Log** | Full sortable/filterable table with date picker |
| **Alert History** | Severity filters, bulk acknowledge |
| **Settings** | Notifications, retention, domain burst threshold, storage stats |

## Installation

### From source

```bash
git clone https://github.com/talayash/ShieldBrowser.git
cd ShieldBrowser
npm install
npm run build
```

Then load in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development

```bash
npm run dev       # Watch mode (rebuilds on file changes)
npm run build     # Production build
npm run typecheck # TypeScript validation
npm run test      # Run tests
```

## Architecture

### Build Pipeline

Two Vite configs chained via `npm-run-all2`:

| Config | Purpose | Format |
|--------|---------|--------|
| `vite.config.ts` | Popup + Dashboard (React apps) | ESM |
| `vite.background.config.ts` | Service worker | IIFE (MV3 requirement) |

### Permissions

| Permission | Why |
|-----------|-----|
| `management` | Enumerate extensions, listen to install/uninstall/enable/disable events |
| `webRequest` | Observe network requests made by other extensions (non-blocking) |
| `storage` | Persist monitoring data, alerts, settings |
| `alarms` | Schedule hourly log pruning and daily risk recalculation |
| `notifications` | Desktop alerts for warning/critical events |
| `unlimitedStorage` | Network logs can grow large over time |
| `<all_urls>` | Required to observe requests to any domain |

### Storage Model

Segmented keys for targeted reads:

```
ext:{id}           → MonitoredExtension (per extension)
snap:{id}          → PermissionSnapshot[] (history per extension)
domains:{id}       → ExtensionDomainProfile (known domains + stats)
netlog:YYYY-MM-DD  → NetworkEntry[] (segmented by date for pruning)
alerts             → Alert[]
changelog          → ChangelogEntry[]
settings           → ShieldSettings
```

### Project Structure

```
src/
├── background/                   # Service worker
│   ├── index.ts                  # Entry point, event registration
│   ├── storage-manager.ts        # All chrome.storage.local operations
│   ├── extension-tracker.ts      # Install/uninstall/enable/disable lifecycle
│   ├── permission-monitor.ts     # Permission snapshot & diff
│   ├── network-monitor.ts        # webRequest observation, domain tracking
│   ├── alert-engine.ts           # Alert evaluation rules
│   ├── changelog-builder.ts      # Human-readable changelog entries
│   └── badge-manager.ts          # Action badge count
├── shared/
│   ├── types.ts                  # All TypeScript interfaces
│   ├── constants.ts              # Dangerous permissions, storage keys, defaults
│   ├── message-types.ts          # Message passing types
│   └── utils.ts                  # Risk scoring, formatting, helpers
├── popup/
│   ├── App.tsx                   # Popup root
│   └── components/               # StatusBanner, AlertList, ExtensionList, RiskBadge
├── dashboard/
│   ├── App.tsx                   # HashRouter root
│   ├── hooks/                    # useExtensions, useAlerts, useNetworkLog, useChangelog
│   ├── pages/                    # Overview, ExtensionDetail, NetworkLog, AlertHistory, Settings
│   └── components/               # Sidebar, RiskBadge, PermissionDiff, NetworkTable
└── styles.css                    # Tailwind entry
```

## Technical Decisions

- **MV3 Service Worker**: All `chrome.*` listeners register synchronously at the top level — the SW can terminate after 30s idle, so no persistent state lives in memory beyond caches
- **Network Batching**: In-memory buffer flushes to storage every 50 entries or 5 seconds, preventing storage API thrashing during heavy traffic
- **Domain Cache**: In-memory `Set<string>` per extension provides O(1) new-domain detection on every request
- **HashRouter**: Extension pages use hash-based routing (`#/path`) — the only reliable routing for `chrome-extension://` URLs
- **Message-Based IPC**: Popup and dashboard communicate with the service worker via `chrome.runtime.sendMessage` — no direct storage access from UI code
- **Self-Exclusion**: ShieldBrowser's own extension ID is filtered from all monitoring to avoid noise
- **CSP Compliance**: `assetsInlineLimit: 0` in Vite — no inline scripts, no eval

## Tech Stack

- [React 19](https://react.dev/) — UI rendering
- [React Router 7](https://reactrouter.com/) — Dashboard navigation
- [TypeScript 5.7](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Vite 6](https://vite.dev/) — Build tooling
- [Vitest](https://vitest.dev/) — Testing
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/) — Extension platform

## License

MIT
