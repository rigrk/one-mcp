import { z } from "zod";
import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { homedir } from "os";
import { join } from "path";
import type { GatewayConfig } from "./types.js";

function expandPath(p: string): string {
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

export function createDefaultConfig(configPath: string): void {
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const defaultConfig = {
    port: 8000,
    host: "127.0.0.1",
    registryPath: "~/.config/one-mcp/tool-registry.json",
    logPath: "~/.config/one-mcp/gateway.log",
    servers: [],
    _comment:
      "Add your MCP servers to the 'servers' array. See the documentation for details: https://github.com/samanvaya5/one-mcp#configuration",
  };

  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + "\n");
  console.error(`Created default config at: ${configPath}`);
}

const ServerConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()),
  mode: z.enum(["persistent", "on-demand"]),
  idleTimeout: z.number().min(0),
  disabled: z.boolean(),
});

const GatewayConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  host: z.string().min(1),
  servers: z.array(ServerConfigSchema).refine(
    (servers) => {
      const names = servers.map((s) => s.name);
      return new Set(names).size === names.length;
    },
    { message: "Duplicate server names are not allowed" }
  ),
  registryPath: z.string().min(1),
  logPath: z.string().min(1),
  token: z.string().optional(),
  noAuth: z.boolean().optional().default(false),
});

export const DEFAULT_CONFIG = {
  port: 8000,
  host: "127.0.0.1",
  idleTimeout: 300,
  logPath: "/tmp/one-mcp.log",
};

function resolveEnvValue(
  value: string,
  env: Record<string, string>
): string {
  // Resolve ${VAR} patterns
  return value.replace(/\$\{([^}]+)\}/g, (_match, varName: string) => {
    if (varName.startsWith("cmd:")) {
      const command = varName.slice(4);
      try {
        return execSync(command, { encoding: "utf8" }).trim();
      } catch {
        return "";
      }
    }
    return env[varName] ?? "";
  });
}

export function loadConfig(
  path: string,
  env?: Record<string, string>
): GatewayConfig {
  const resolvedEnv = env ?? (process.env as Record<string, string>);

  const expandedPath = expandPath(path);

  if (!existsSync(expandedPath)) {
    createDefaultConfig(expandedPath);
    // Re-throw as ENOENT so the caller can give a helpful message
    const err = new Error(`Config file not found: ${expandedPath}`) as NodeJS.ErrnoException;
    err.code = "ENOENT";
    throw err;
  }

  const raw = JSON.parse(readFileSync(expandedPath, "utf8"));

  // Resolve env vars in server env fields
  if (raw.servers && Array.isArray(raw.servers)) {
    raw.servers = raw.servers.map((server: Record<string, unknown>) => {
      if (server.env && typeof server.env === "object") {
        const resolved: Record<string, string> = {};
        for (const [key, val] of Object.entries(
          server.env as Record<string, string>
        )) {
          resolved[key] = resolveEnvValue(val, resolvedEnv);
        }
        return { ...server, env: resolved };
      }
      return server;
    });
  }

  // Apply defaults for undefined fields only (0 and "" are intentional values)
  if (raw.port == null) raw.port = DEFAULT_CONFIG.port;
  if (raw.host == null) raw.host = DEFAULT_CONFIG.host;
  if (!raw.registryPath) {
    raw.registryPath = join(homedir(), ".config", "one-mcp", "tool-registry.json");
  }
  if (!raw.logPath) {
    raw.logPath = join(homedir(), ".config", "one-mcp", "gateway.log");
  }

  // Override with environment variables if present
  if (resolvedEnv.PORT) {
    const p = parseInt(resolvedEnv.PORT, 10);
    if (!isNaN(p)) raw.port = p;
  }
  if (resolvedEnv.HOST) {
    raw.host = resolvedEnv.HOST;
  }
  if (resolvedEnv.MCP_GATEWAY_TOKEN) {
    raw.token = resolvedEnv.MCP_GATEWAY_TOKEN;
  }
  if (resolvedEnv.NO_AUTH === "true" || resolvedEnv.NO_AUTH === "1") {
    raw.noAuth = true;
  }

  // Expand ~ in registryPath and logPath
  raw.registryPath = expandPath(raw.registryPath);
  raw.logPath = expandPath(raw.logPath);

  return GatewayConfigSchema.parse(raw) as GatewayConfig;
}
