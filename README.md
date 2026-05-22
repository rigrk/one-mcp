```
  ___             __  __  ___
 / _ \ _ __   ___|  \/  |/ _ \   One endpoint.
| | | | '_ \ / _ \ |\/| | | | |  Every tool.
| |_| | | | |  __/ |  | | |_| |  Zero friction.
 \___/|_| |_|\___|_|  |_|\___/
```

**Connect your AI agent to every MCP tool. With one command.**

[![CI](https://github.com/samanvaya5/one-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/samanvaya5/one-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/one-mcp)](https://www.npmjs.com/package/one-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%E2%9C%93-f472b6?logo=bun)](https://bun.sh)

```bash
npm install -g one-mcp && one-mcp
```

---

## Still wiring your agent to 10 different servers?

### The old way

```
Your agent's config file:
├── GitHub MCP    → http://localhost:3001  (crashed again?)
├── Exa Search    → http://localhost:3002  (forgot to start it)
├── Playwright    → http://localhost:3003  (draining battery)
├── Context7      → http://localhost:3004  (new URL, update config)
├── Firebase      → http://localhost:3005  (which port was it?)
├── Slack         → http://localhost:3006  (oh right, 3006)
├── Brave Search  → http://localhost:3007  (out of ports...)
├── ...and 3 more you keep forgetting about
```

Each server: a different URL to configure. A different process to babysit. A different crash to restart at 2 AM.

Your agent's context window? Bloated with 500 tool descriptions it doesn't need right now.

Your config file? A graveyard of ports, tokens, and URLs you've copy-pasted from 7 different READMEs.

### The new way

```
Your agent's config file:
├── one-mcp → http://localhost:8000/sse
└── Done. ✓
```

**That's it.** One URL. Every tool. Zero friction.

---

## What changes when you switch

| Instead of... | You get... |
|---|---|
| Editing 10+ config files every time you add a server | Add one line. Save. It just works. |
| Servers running 24/7 draining your laptop battery | Servers wake up when called, sleep when idle |
| Restarting crashed servers at 2 AM | Automatic crash recovery with smart backoff |
| Your agent choking on 500 tool descriptions | Smart search finds the right tool instantly |
| Rebuilding your agent for every config change | Config changes apply live — zero downtime |
| Hunting for the right port, URL, or token | One endpoint. Bearer auth. Secure by default. |

---

## See it in action

Your agent wants to search GitHub repos. Here's what happens:

```
> Agent: search_tools({"query": "github search"})
  ↓ 8ms
  ← Found: github__search_repositories, github__list_issues, github__get_file...

> Agent: describe_tool({"tool": "github__search_repositories"})
  ← Schema: query (string, required), perPage, sort...

> Agent: execute_tool({"tool": "github__search_repositories",
                       "args": {"query": "ml stars:>1000"}})
  ← [Results]
```

No config changes. No server restarts. No URL hunting. It just works.

---

## 30 seconds to productive

```bash
# Install (pick one)
npm install -g one-mcp        # Node.js >=18
bun install -g one-mcp        # Bun >=1.0 (recommended)

# Run
one-mcp

# On first run, a default config is auto-created at:
# ~/.config/one-mcp/config.json
# Edit it to add your servers. That's it.
```

---

## Connect your agent

**Claude Desktop:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "one-mcp": {
      "command": "one-mcp",
      "args": ["--stdio"]
    }
  }
}
```

**Cursor:** Settings -> MCP -> Add server -> Name: `one-mcp`, Command: `one-mcp --stdio`

**Grok (cloud):** `bun run expose` -> copy public URL + token

**Any SSE agent:** Connect to `http://localhost:8000/sse`

---

## How it works

```
 +-----------------------------------------+
 |         Your AI Agent                   |
 |    (Claude / Cursor / Grok / ...)       |
 +--------------+--------------------------+
                |  One connection
                v
 +-----------------------------------------+
 |          one-mcp Gateway                |
 |  +----------+ +---------+ +----------+ |
 |  |  search  | | describe| | execute  | |
 |  |  _tools  | | _tool   | | _tool    | |
 |  +----------+ +---------+ +----------+ |
 |  +----------+ +---------+ +----------+ |
 |  |  browse  | |  list   | |  manage  | |
 |  | _server  | |_servers | | _server  | |
 |  +----------+-+---------+-+----------+ |
 |  |       BM25 Search & Registry       | |
 |  |     On-Demand Spawn & Recovery     | |
 |  +------------------------------------+ |
 +-----------+-----------------------------+
             |
     +-------+-------+  +--------+--------+
     |   GitHub      |  |   Exa 2         |
     |   MCP Srv     |  |   Search        |
     +---------------+  +-----------------+
   (starts on call)   (starts on call)
```

1. Your agent connects to **one** SSE endpoint: `http://localhost:8000/sse`
2. Built-in tools let your agent **search**, **discover**, and **execute** any capability
3. Each backend server starts **on demand**, runs while needed, and shuts down when idle
4. If a server crashes, it's **auto-restarted** with exponential backoff
5. Your config file changes are picked up **without restarting** anything

---

## Everything that's included

| Benefit | What's actually happening (for the curious) |
|---|---|
| **One URL, every tool** | Your agent connects to a single SSE endpoint and gets access to every registered MCP server. No more config juggling across ports. |
| **Tools that find tools** | Built-in `search_tools` uses BM25 ranking so your agent discovers the right capability in milliseconds instead of scrolling through hundreds of descriptions. |
| **Servers that manage themselves** | On-demand servers start when called and shut down when idle. Your battery lasts longer. Your fans stay quiet. |
| **Crashes that fix themselves** | Automatic health monitoring with exponential backoff recovery. A server dies? It's back before your agent notices. |
| **Config changes without restarts** | Edit `config.json`. Save. Changes apply instantly. Zero downtime. Zero "did you restart the gateway?" |
| **Dynamic tool creation** | Build reusable shell tools on the fly with `create_tool`. No restarts. No redeploys. Just create and call. |
| **Secure by default** | Optional Bearer token authentication means your exposed endpoints stay protected. Set `MCP_GATEWAY_TOKEN` and you're done. |
| **Cloud-ready** | Built-in `bun run expose` wraps ngrok so cloud agents like Grok can reach your tools securely. |
| **12 built-in tools** | `search_tools`, `describe_tool`, `execute_tool`, `list_servers`, `browse_server`, `server_status`, `manage_server`, `create_tool`, `list_dynamic_tools`, `delete_dynamic_tool`, `register_server`, `unregister_server` |

---

## Configuration

The default config (auto-created on first run):

```json
{
  "port": 8000,
  "host": "127.0.0.1",
  "servers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token" },
      "mode": "on-demand",
      "idleTimeout": 300
    }
  ]
}
```

**Server modes:**

| Mode | When it runs | Best for |
|---|---|---|
| `on-demand` | Starts on first call, stops after `idleTimeout` | Most servers. Saves battery, keeps things clean. |
| `persistent` | Always on from startup | Servers you hit constantly and need instant response. |

**Environment variables:**

| Variable | What it does |
|---|---|
| `MCP_GATEWAY_TOKEN` | Sets the Bearer token for SSE endpoint auth |
| `MCP_GATEWAY_NO_AUTH` | Disables auth (default for local dev) |
| `PORT` | Overrides the config port |
| `HOST` | Overrides the config host |

---

## REST API

Your agent (or any client) can call these directly:

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/api/health` | Gateway status, server counts, uptime |
| `GET` | `/api/servers` | List all registered servers with status |
| `GET` | `/api/servers/:name` | Server details, process info, diagnostics |
| `POST` | `/api/servers/:name/start` | Start a stopped server |
| `POST` | `/api/servers/:name/stop` | Stop a running server |
| `POST` | `/api/servers/:name/restart` | Restart a server (kill + respawn) |
| `GET` | `/api/tools` | All cached tools (namespaced). Add `?q=` to search |
| `GET` | `/api/events` | SSE stream for real-time gateway events |

Most interactions happen through the SSE endpoint (`/sse`) — your agent
discovers tools naturally through `search_tools`, `describe_tool`, and `execute_tool`.

---

## Troubleshooting

**"Port 8000 is already in use"**
Set `PORT=8001` or add `"port": 8001` to your config.

**"My server says it's registered but I can't see its tools"**
Check the server is started (`server_status`) or set its mode to `persistent`.

**"Auth is failing"**
Set `MCP_GATEWAY_TOKEN=your-secret` and include `Authorization: Bearer your-secret` in requests. Or disable with `MCP_GATEWAY_NO_AUTH=1` for local dev.

**"Config changes aren't showing up"**
one-mcp watches your config file. If editing on a network drive, restart once: `one-mcp`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, project
structure, and pull request guidelines. All contributions are welcome.

## License

MIT - see [LICENSE](LICENSE)

---

<p align="center">
  <b>One endpoint. Every tool. Zero friction.</b><br>
  <a href="https://www.npmjs.com/package/one-mcp">npm</a> &middot;
  <a href="https://github.com/samanvaya5/one-mcp">GitHub</a> &middot;
  <a href="https://github.com/samanvaya5