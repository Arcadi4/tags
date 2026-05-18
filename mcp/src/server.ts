import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerParseTagsTool } from "./tools/parseTags.js";
import { registerListTagsTool } from "./tools/listTags.js";
import { registerShowTagTool } from "./tools/showTag.js";
import { registerLoadTagCreationSkillTool } from "./tools/loadTagCreationSkill.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";

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
    { instructions: buildInstructions() },
  );
  const deps = { useBuiltinTags, startupWorkspace: workspace };
  registerParseTagsTool(server, deps);
  registerListTagsTool(server, deps);
  registerShowTagTool(server, deps);
  registerLoadTagCreationSkillTool(server);
  return server;
}

function buildInstructions(): string {
  return [
    "This server exposes four tools:",
    "- parse_tags: always-on prompt expander. Call this every turn on the user's verbatim prompt before doing other work; if `#tag-name` markers appear in the rewritten output as `<name/>` placeholders with `<name>...body...</name>` blocks at the top, treat those bodies as authoritative directives and follow them at the location each `<name/>` appears.",
    "- list_tags: read-only inventory. Call when you need to know which tags are currently defined (e.g. user asks 'what tags do I have', or you suspect an unexpected miss). Each entry is annotated with its origin: 'builtin' | 'global' | 'workspace'. Workspace overrides global, which overrides builtin.",
    "- show_tag: inspect a single tag's body for verification or debugging. Use list_tags first if you don't know the name.",
    "- load_tag_creation_skill: preflight for tag-authoring tasks. Call this before writing or editing any `.agents/tags/*.md` file.",
    "",
    "Calling rules:",
    "- Recognize `#tag-name` (or `#tag_name`) as a syntactic marker that requires parse_tags. You do not need to know the tag inventory in advance; unknown names pass through unchanged.",
    "- The `workspace` argument on parse_tags / list_tags / show_tag is optional. When omitted, the server uses the workspace it was launched in. Pass an explicit absolute path only when the user is operating on a different project root.",
    "- The tag set is dynamic. Tag definitions live under `~/.agents/tags` (global) and `<workspace>/.agents/tags` (project) and can change between turns. The MCP tool descriptions are intentionally static — query list_tags / show_tag at runtime instead of relying on a baked-in inventory.",
    "",
    "Note: some MCP clients drop this instructions field. The per-tool descriptions therefore restate each tool's contract, but the live tag inventory is only available via list_tags / show_tag.",
  ].join("\n");
}
