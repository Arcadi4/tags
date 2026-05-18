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
import { TagSource } from "./services/tagSource.js";

export interface ServerOptions {
  useBuiltinTags?: boolean;
}

export async function buildServer(
  workspaceForInstructions: string,
  options: ServerOptions = {},
): Promise<McpServer> {
  const useBuiltinTags = options.useBuiltinTags ?? true;
  const instructions = await buildInstructions(
    workspaceForInstructions,
    useBuiltinTags,
  );
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions },
  );
  registerParseTagsTool(server, { useBuiltinTags });
  return server;
}

async function buildInstructions(
  workspace: string,
  useBuiltinTags: boolean,
): Promise<string> {
  let tagSources: TagSource[] = [
    new FilesystemTagSource(globalTagsDir()),
    new FilesystemTagSource(workspaceTagsDir(workspace)),
  ];
  if (useBuiltinTags) {
    tagSources.unshift(new BuiltinTagSource(BUILTIN_TAGS)); // ensure built-in tags have lowest precedence so they can be overridden by user-defined tags without needing to disable them entirely
  }

  const source = new MergedTagSource(tagSources);
  const tags = await source.list();

  const role =
    "ROLE: This server is the user's intent amplifier. It expands inline #tag markers in user prompts " +
    "into XML directives that carry each tag's full body. Tags are atomic, composable, and location-aware. " +
    "Definitions live in ~/.agents/tags/<name>.md|txt (global) and <workspace>/.agents/tags/<name>.md|txt " +
    "(workspace; overrides global on name collision).";

  const contract =
    "CONTRACT (applies to every user turn):\n" +
    "1. Call the parse_tags tool before forming any response. Pass the workspace path and the user's verbatim prompt.\n" +
    "2. Use the returned rewritten_prompt as the effective prompt for this turn.\n" +
    "3. If rewritten_prompt is the literal string \"(no tags found)\", proceed normally with the original prompt.\n" +
    "4. Otherwise, the differences are deliberate user directives — honor them in scope and at the location they appear.";

  const example =
    "EXAMPLE: Given the prompt\n" +
    "    \"Implement /v2/admin and /v2/auth, etc. #generalize. The OAuth #explore should be compatible.\"\n" +
    "parse_tags returns:\n" +
    "    <generalize>...generalize body...</generalize>\n" +
    "    <explore>...explore body...</explore>\n" +
    "\n" +
    "    Implement /v2/admin and /v2/auth, etc. <generalize/>. The OAuth <explore/> should be compatible.\n" +
    "The opening block carries the directive bodies. Each <name/> self-closing tag marks the exact scope " +
    "where the user invoked that directive — apply the directive there, not globally.";

  const rules =
    "RULES:\n" +
    "- Call parse_tags every turn, even when no `#` is visible. The tool is cheap; missed calls break the protocol.\n" +
    "- Do not expand, infer, or paraphrase tag bodies yourself. The tool is the single source of truth.\n" +
    "- Tags inside fenced code blocks (```) and inline code spans (`) are preserved verbatim — those are escape hatches, not directives.\n" +
    "- Unknown #tags pass through unchanged — do not invent meaning for them.\n" +
    "- `#tag_name` and `#tag-name` resolve to the same definition.";

  const tagList =
    tags.length === 0
      ? "AVAILABLE TAGS: none currently defined (neither global nor workspace). Still call parse_tags every turn — definitions can change between turns."
      : "AVAILABLE TAGS: " +
        tags
          .map((t) => t.key)
          .sort()
          .join(", ") +
        ".";

  return [role, contract, example, rules, tagList].join("\n\n");
}
