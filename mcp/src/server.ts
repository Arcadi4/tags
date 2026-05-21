import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerParseTagsTool } from "./tools/parseTags.js";
import { registerListTagsTool } from "./tools/listTags.js";
import { registerShowTagTool } from "./tools/showTag.js";
import { registerCreateTagGuidePrompt } from "./prompts/createTagGuide.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { SERVER_INSTRUCTIONS } from "./prompts/catalog.js";

export interface ServerOptions {
  useBuiltinTags?: boolean;
}

export function buildServer(
  workspace: string,
  options: ServerOptions = {},
): McpServer {
  const useBuiltinTags = options.useBuiltinTags ?? true;
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  const deps = { useBuiltinTags, startupWorkspace: workspace };
  registerParseTagsTool(server, deps);
  registerListTagsTool(server, deps);
  registerShowTagTool(server, deps);
  registerCreateTagGuidePrompt(server);
  return server;
}

