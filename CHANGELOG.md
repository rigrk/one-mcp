# Changelog

All notable changes to one-mcp (formerly MCP Gateway) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] — 2026-05-22

### Fixed
- **Critical: Idle timer was not killing on-demand servers** — `ensureIdleCheckInterval()`
  had an empty loop body and never called `killIfIdle()`. Now properly iterates through
  all on-demand servers and kills idle ones. Added `idleTimeout` to `ServerEntry` so the
  interval callback has access to timeout values without the original config.
- **Version mismatch** — `mcp-server.ts` hardcoded version "1.0.0" while `package.json`
  declared "1.1.0". Now dynamically imports version from `package.json`.
- **Graceful shutdown** — Added a 500ms grace period before `process.exit(0)` to allow
  in-flight requests to complete. Previously, active requests could be abruptly terminated.

### Added
- **Auto-create default config on first run** — If the config file doesn't exist,
  `loadConfig()` now creates a default config with sensible defaults (port 8000,
  host 127.0.0.1, empty servers array, helpful comment pointing to docs) instead of
  crashing with a confusing error.
- **Default paths for `registryPath` and `logPath`** — When not specified in config,
  these now default to `~/.config/one-mcp/tool-registry.json` and
  `~/.config/one-mcp/gateway.log` respectively, instead of failing validation.
- **`MCP_GATEWAY_TOKEN` environment variable support** — The config loader now reads
  the auth token from this env var, matching the documented behavior.
- **Path expansion (`~` → home directory)** — Config path, `registryPath`, and `logPath`
  now support `~` shorthand for the user's home directory.
- **Shebang for CLI execution** — Added `#!/usr/bin/env bun` to `src/index.ts` for
  direct executable support.

### Changed
- **Package overhaul for production readiness**:
  - `bin` entry now points to `./dist/index.js` (compiled output)
  - Added `build` script: `bun build --target=bun --outdir=dist src/index.ts`
  - Added `prepublishOnly` script for auto-build on publish
  - Added `exports` field for programmatic usage
  - Expanded `engines` to support Node.js ≥18 in addition to Bun ≥1.0
  - Expanded `keywords` from 5 to 13 for better discoverability
  - Added `preferGlobal: true` to indicate CLI tool nature
- **Complete README rewrite** — World-class documentation with:
  - Hero section with badges and one-line install
  - "Agent Quick Install" section for Claude, Cursor, Grok, and generic SSE
  - Before/After comparison table
  - Architecture diagram
  - Complete 12-tool reference table
  - 3-step workflow with examples
  - Troubleshooting guide

## [1.1.0] — 2026-05-20

### Added
- **BM25 full-text search** (`src/bm25.ts`): Token-aware ranking with camelCase,
  snake_case, and kebab-case splitting. Replaces naive substring search in tool
  discovery. Registry and `search_tools` now use BM25 scoring with IDF weighting.
- **Dynamic tools** (`src/dynamic-tools.ts`): Three new gateway-native tools —
  `create_tool` (define reusable shell tools with `${param}` template syntax at
  runtime), `list_dynamic_tools` (list all registered dynamic tools), and
  `delete_dynamic_tool` (remove a dynamic tool by name). Backed by
  `~/.sisyphus/dynamic-tools.json` for persistence across restarts.
- **Bearer token authentication**: `MCP_GATEWAY_TOKEN` env var enables
  token-required mode for all API and SSE endpoints (except `/api/health`).
  `MCP_GATEWAY_NO_AUTH=true` bypasses auth for trusted environments.
- **ngrok expose scripts**: `bun run expose` auto-generates a random token,
  starts the gateway + ngrok tunnel, and prints a public URL ready for Grok or
  other cloud agents. `bun run expose:open` for no-auth mode.
- **5 new gateway-native tools** (12 total):
  - `browse_server` — list all tools on a server grouped by naming pattern
  - `register_server` — dynamically add a new MCP server to the running config
  - `unregister_server` — remove a server and kill its process
  - `list_dynamic_tools` — surface dynamically created shell tools
  - `delete_dynamic_tool` — remove a dynamic tool by name
- **PORT/HOST env var overrides**: `PORT` and `HOST` environment variables now
  override the config file values.
- **Duplicate server name validation**: Config loading rejects duplicate server
  names with a clear error message.
- **SHA-256 version hashing**: Registry now uses content hashes for stale
  detection instead of timestamp-only comparison.
- **Auth test suite** (`tests/auth.test.ts`): 6 tests covering token required,
  token invalid, no-auth mode, and health endpoint exemption.
- **BM25 test suite** (`tests/bm25.test.ts`): 19 tests for tokenizer, ranking,
  IDF computation, server filtering, and edge cases.

### Changed
- **Gateway-native tools grew from 7 to 12**: `browse_server`, `create_tool`,
  `list_dynamic_tools`, `delete_dynamic_tool`, `register_server`, and
  `unregister_server` are now available alongside the original 6.
- **`handleToolsList` now returns 12 tools** instead of 7 (tests updated
  accordingly).
- **Registry search uses BM25** instead of substring matching, giving better
  relevance for partial and multi-word queries.
- **Config hot-reload**: Improved debounce timing and diff logging.
- **API middleware**: Added auth middleware, `server_status` endpoint, and SSE
  event stream improvements.
- **HealthTracker mock** in tests now includes `getHealth` and `getRetryDelay`
  methods.

### Fixed
- `migrate-config` tests now use `test.skipIf` to gracefully skip on machines
  without full plist server setup (previously hard-failed).

### Tests
- 156 pass, 3 skip (env-specific), 0 fail across 15 test files

## [1.0.0] — 2026-05-19

### Added
- Initial public release as MCP Gateway
- Renamed to `one-mcp` in v1.1.0
- Single-point SSE proxy for 10+ MCP backend servers
- On-demand server spawning with configurable idle timeout
- Persistent server mode for always-on servers
- Health tracking with exponential backoff crash recovery
- Config hot-reload via chokidar filesystem watcher
- Transparent MCP protocol proxy: `tools/list`, `tools/call` with
  `server__tool` namespacing
- 7 gateway-native tools: `search_tools`, `describe_tool`, `execute_tool`,
  `list_servers`, `server_status`, `manage_server`
- REST API at `/api/*`: health checks, server management, tool discovery,
  SSE event streaming
- Tool registry with disk caching (1-hour TTL)
- Spawn lock (async mutex) preventing concurrent spawn attempts for the
  same server
- CLI: `bun start` (production), `bun dev` (watch mode), `bun test`
- Pre-configured for 10 servers: chrome-devtools, context7, exa2, firebase,
  framer, github, gitlab, pencil, playwright, subtext
- 10mlaunchd service support for macOS
- MIT license
