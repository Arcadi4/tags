#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";

function resolveStartupWorkspace(): string {
  const argv = process.argv;
  const idx = argv.indexOf("--workspace");
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  if (process.env.TAGS_WORKSPACE) return process.env.TAGS_WORKSPACE;
  return process.cwd();
}

async function main(): Promise<void> {
  const workspace = resolveStartupWorkspace();
  const flags = process.argv.slice(2);
  const useBuiltinTags = !flags.includes("--no-builtin-tags");
  const server = buildServer(workspace, { useBuiltinTags });
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error(`agent-tags MCP listening on stdio (workspace=${workspace})`);
}

main().catch((err: unknown) => {
  console.error("agent-tags fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
