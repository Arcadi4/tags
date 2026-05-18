import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerParseTagsTool } from "./tools/parseTags.js";
import { FilesystemTagSource } from "./services/filesystemTagSource.js";
import { MergedTagSource } from "./services/mergedTagSource.js";
import {
  SERVER_NAME,
  SERVER_VERSION,
  globalTagsDir,
  workspaceTagsDir,
} from "./constants.js";
import { BuiltinTagSource } from "./services/builtinTagSource.js";
import { BUILTIN_TAGS } from "./builtinTags.js";
import { USE_BUILTIN_TAGS } from "./index.js";
import { TagSource } from "./services/tagSource.js";

export async function buildServer(
  workspaceForInstructions: string,
): Promise<McpServer> {
  const instructions = await buildInstructions(workspaceForInstructions);
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions },
  );
  registerParseTagsTool(server);
  return server;
}

async function buildInstructions(workspace: string): Promise<string> {
  let tagSources : TagSource[] = [
    new FilesystemTagSource(globalTagsDir()),
    new FilesystemTagSource(workspaceTagsDir(workspace)),
  ];
  if (USE_BUILTIN_TAGS) {
    tagSources.unshift(new BuiltinTagSource(BUILTIN_TAGS)); // ensure built-in tags have lowest precedence so they can be overridden by user-defined tags without needing to disable them entirely
  }

  const source = new MergedTagSource(tagSources);
  const tags = await source.list();
  const intro =
    "This server expands inline #tag markers in user prompts into XML directives. " +
    "Tags are atomic, composable, location-aware. Each tag is a markdown or plain text file: " +
    "global tags at ~/.agents/tags/<name>.md|txt, workspace tags at <workspace>/.agents/tags/<name>.md|txt " +
    "(workspace overrides global on name collision).";
  const directive =
    "When a user prompt contains any #tag-name marker (underscores are tolerated, e.g., #my_tag), " +
    "call the parse_tags tool with the workspace path and the raw prompt; " +
    "use its rewritten_prompt as the effective prompt.";
  const tagList = tags.length === 0
    ? "No tags are currently defined (neither global nor workspace)."
    : "Available tags: " + tags.map(t => t.key).sort().join(", ") + ".";
  return [intro, directive, tagList].join("\n\n");
}
