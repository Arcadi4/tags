import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerParseTagsTool } from "./tools/parseTags.js";
import { registerLoadTagCreationSkillTool } from "./tools/loadTagCreationSkill.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";

export interface ServerOptions {
  useBuiltinTags?: boolean;
}

export async function buildServer(
  workspace: string,
  options: ServerOptions = {},
): Promise<McpServer> {
  const useBuiltinTags = options.useBuiltinTags ?? true;
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: buildInstructions() },
  );
  await registerParseTagsTool(server, { useBuiltinTags, workspace });
  registerLoadTagCreationSkillTool(server);
  return server;
}

function buildInstructions(): string {
  return (
    "This server exposes two tools: parse_tags (always-on prompt expander) and load_tag_creation_skill (preflight for tag-authoring tasks). " +
    "The full protocol contract — when to call each tool, calling rules, and the live tag inventory — lives in each tool's own description. " +
    "Read the descriptions carefully and follow them on every user turn. " +
    "Note: some MCP clients drop this instructions field, which is why the contract is duplicated onto the tools themselves."
  );
}
