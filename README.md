# one-mcp

[![CI](https://github.com/samanvaya5/one-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/samanvaya5/one-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/one-mcp?color=blue)](https://www.npmjs.com/package/one-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-≥1.0-black?logo=bun)](https://bun.sh)

**Single-point proxy for Model Context Protocol servers.** One SSE endpoint.
Twelve gateway-native tools. Unlimited backend servers.

Stop wiring every AI agent to a different MCP server URL. Point them at one
gateway and get unified tool discovery, on-demand lifecycle, crash recovery,
and config hot-reload — all behind a single port.

```bash
npm install -g one-mcp && one-mcp
# Agent connects to → http://localhost:8000/sse
```

---

## What Is This?

**one-mcp** is a gateway that sits between your AI agent and any number of MCP
servers. Instead of configuring each agent with 10+ server endpoints, you
connect it once to the gateway. The gateway handles routing, spawning,
health monitoring, and tool discovery — so your agent sees one unified
toolbox instead of a scattered mess of URLs.

## Quick Start

```bash
# 1. Install (pick one)
npm install -g one-mcp        # Node.js ≥18
bun install -g one-mcp        # Bun ≥1.0 (recommended)

# 2. Run
one-mcp                       # Starts on http://localhost:8000

# 3. Connect your agent to http://localhost:8000/sse
```

> **First run** auto-creates `~/.config/one-mcp/config.json`. Edit it to add
> your backend servers, then restart. See [Configuration](#configuration).

## Agent Quick Install

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "one-mcp": {
      "command": "one-mcp",
      "args": ["--stdio"]
    }
  }
}
```

### Cursor

Settings → MCP → Add server:
- **Name:** `one-mcp`
- **Type:** `command`
- **Command:** `one-mcp --stdio`

### Grok (Cloud / SSE)

```bash
bun run expose   # Prints public URL + auth token
```

Settings → MCP Servers → Add Server:
- **Type:** `SSE`
- **URL:** the public URL ending in `/sse`
- **Headers:** `{"Authorization": "Bearer YOUR_TOKEN"}`

### Generic SSE Agent

```json
{
  "mcpServers": {
    "one-mcp": {
      "type": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

## Why one-mcp?

| Before | After |
|--------|-------|
| Configure 10+ MCP URLs in every agent | One SSE endpoint for all agents |
| Servers running 24/7 eating memory | On-demand spawn, idle kill |
| Manual restart when a server crashes | Auto crash recovery with backoff |
| Edit config → restart agent → repeat | Config hot-reload, zero downtime |
| Each agent has its own tool view | Unified namespace + BM25 search |
| No runtime tool creation | Create shell tools on the fly |

## Features

- **12 gateway-native tools** — `search_tools`, `describe_tool`, `execute_tool`,
  `list_servers`, `browse_server`, `server_status`, `manage_server`,
  `create_tool`, `list_dynamic_tools`, `delete_dynamic_tool`,
  `register_server`, `unregister_server`
- **BM25 search** — Token-aware ranking over camelCase/snake_case/kebab-case names
- **On-demand spawning** — Backend servers start when first called, die when idle
- **Persistent mode** — Always-on servers that never idle-kill
- **Health tracking** — Exponential backoff crash recovery (1s → 2s → 4s → ... → 30s)
- **Auth** — Optional Bearer token via `MCP_GATEWAY_TOKEN` env var
- **Config hot-reload** — `chokidar` watches your config file, applies diffs live
- **Dynamic tools** — Create reusable shell tools at runtime with `${param}` templates
- **ngrok expose** — `bun run expose` generates a public URL + auth token for cloud agents
- **3-step workflow** — Discover → Describe → Execute (inspired by how agents actually think)

## Architecture

```
Agent (Claude/Grok/Cursor) → http://localhost:8000/sse
                                    |
                              ┌─────▼─────┐
                              │  one-mcp  │
                              │  Gateway  │
                              │           │
                              │ 12 Native │
                              │  Tools    │
                              │           │
                              │  BM25     │
                              │  Search   │
                              │  Registry │
                              │           │
                              │  Lifecycle│
                              │  Manager  │
                              └─────┬─────┘
                                    |
                    ┌───────────────┼───────────────┐
                    |               |               |
               ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
               │  GitHub │    │  Exa2   │    │Playwright│
               │  MCP    │    │ Search  │    │ Browser  │
               └─────────┘    └─────────┘    └─────────┘
               (on-demand)   (on-demand)    (persistent)
```

The gateway exposes a single SSE endpoint at `/sse`. When an agent calls a tool,
the proxy extracts the server prefix from the namespaced tool name
(e.g. `github__search_repositories`), spawns the backend server if needed, and
routes the call. Results flow back through the same connection.

## Installation

```bash
# npm (Node.js ≥18)
npm install -g one-mcp

# Bun (recommended, ≥1.0)
bun install -g one-mcp

# From source
git clone https://github.com/samanvaya5/one-mcp.git
cd one-mcp && bun install
bun start
```

## Running

```bash
one-mcp                       # Start gateway
one-mcp --watch               # Config hot-reload enabled
one-mcp --refresh-registry    # Refresh tool cache on startup
one-mcp --stdio               # Stdio mode (for clients without SSE)
```

## Configuration

On first run, the gateway auto-creates a default config at
`~/.config/one-mcp/config.json`:

```json
{
  "port": 8000,
  "host": "127.0.0.1",
  "registryPath": "~/.config/one-mcp/tool-registry.json",
  "logPath": "~/.config/one-mcp/gateway.log",
  "servers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${HOME}/.github-token" },
      "mode": "on-demand",
      "idleTimeout": 300,
      "disabled": false
    }
  ]
}
```

### Server Modes

| Mode | Behavior |
|------|----------|
| `persistent` | Starts with gateway, runs until shutdown |
| `on-demand` | Spawns on first tool call, killed after `idleTimeout` seconds idle |

### Environment Variables

| Variable | Effect |
|----------|--------|
| `MCP_GATEWAY_CONFIG` | Path to config file (default: `~/.config/one-mcp/config.json`) |
| `MCP_GATEWAY_TOKEN` | Enable Bearer auth on all endpoints |
| `MCP_GATEWAY_NO_AUTH` | Set to `true` to disable auth |
| `PORT` | Override config port |
| `HOST` | Override config host |

## Agent Setup

### Claude Desktop (Claude for Desktop)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "one-mcp": {
      "command": "one-mcp",
      "args": ["--stdio"]
    }
  }
}
```

### Cursor

Settings → MCP → Add server:
- **Name:** `one-mcp`
- **Type:** `command`
- **Command:** `one-mcp --stdio`

### Grok (or any SSE-compatible agent)

```bash
# Start with ngrok tunnel
bun run expose
# Copy the public URL and token
```

Settings → MCP Servers → Add Server:
- **Type:** `SSE`
- **URL:** the public URL ending in `/sse`
- **Headers:** `{"Authorization": "Bearer YOUR_TOKEN"}`

### Generic SSE Agent

```json
{
  "mcpServers": {
    "one-mcp": {
      "type": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

## 12 Gateway-Native Tools

| Tool | Purpose | When to Reach For It |
|------|---------|---------------------|
| `search_tools` | Find backend tools by keyword | **Always first** |
| `describe_tool` | Show schema + examples | Before executing |
| `execute_tool` | Run any backend tool | Final step |
| `list_servers` | List configured servers | Management |
| `browse_server` | List all tools on one server | Exploring a server |
| `server_status` | Check server health + diagnostics | Debugging |
| `manage_server` | Enable/disable/restart servers | Administration |
| `create_tool` | Create a reusable shell tool | Ad-hoc automation |
| `list_dynamic_tools` | List runtime-created tools | Management |
| `delete_dynamic_tool` | Remove a dynamic tool | Cleanup |
| `register_server` | Add a new backend server at runtime | Dynamic config |
| `unregister_server` | Remove a backend server | Cleanup |

## 3-Step Workflow

```
Step 1: search_tools({"query": "github repository"})
        → ["github__search_repositories", "github__list_issues", ...]

Step 2: describe_tool({"tool": "github__search_repositories"})
        → full schema, parameters, examples

Step 3: execute_tool({"tool": "github__search_repositories",
                       "args": {"query": "ml stars:>1000"}})
        → tool execution results
```

This **Discover → Describe → Execute** flow is how agents naturally reason about
tools. The gateway makes this explicit and frictionless.

## REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Gateway status, server counts, uptime |
| `/api/servers` | GET | All servers with status |
| `/api/servers/:name` | GET | Server details, process info, diagnostics |
| `/api/servers/:name/start` | POST | Start a stopped server |
| `/api/servers/:name/stop` | POST | Stop a running server |
| `/api/servers/:name/restart` | POST | Restart (kill + spawn) |
| `/api/tools` | GET | All cached tools (namespaced) |
| `/api/tools?q=` | GET | Search cached tools |
| `/api/events` | GET | SSE stream for gateway events |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Config file not found | The gateway auto-creates a default config. Edit it to add your servers, then restart. |
| Tool not found | Use `search_tools` to find the exact namespaced name (`server__tool` format) |
| Server unhealthy | Wait 30s for auto-retry, or use `manage_server` to restart it |
| Unauthorized | Check that your `MCP_GATEWAY_TOKEN` matches, or set `MCP_GATEWAY_NO_AUTH=true` |
| Port already in use | Set `PORT=8001` (or any free port) |
| Server won't start | Check the command exists: `which npx` or `which docker` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, project
structure, and pull request guidelines. All contributions are welcome.

## License

MIT — see the [LICENSE](LICENSE) file.

---

<p align="center">
  <b>One endpoint. Every tool. Zero friction.</b><br>
  <a href="https://www.npmjs.com/package/one-mcp">npm</a> ·
  <a href="https://github.com/samanvaya5/one-mcp">GitHub</a> ·
  <a href="https://github.com/samanvaya5/one-mcp/issues">Issues</a>
</p>
