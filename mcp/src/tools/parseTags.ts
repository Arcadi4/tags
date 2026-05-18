import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseTagsInputShape,
  parseTagsOutputShape,
} from "../schemas/parseTags.js";
import { TagSource } from "../services/tagSource.js";
import { FilesystemTagSource } from "../services/filesystemTagSource.js";
import { MergedTagSource } from "../services/mergedTagSource.js";
import { rewritePrompt } from "../services/promptRewriter.js";
import { globalTagsDir, workspaceTagsDir } from "../constants.js";
import { BuiltinTagSource } from "../services/builtinTagSource.js";
import { BUILTIN_TAGS } from "../builtinTags.js";

export interface ParseTagsDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
}

function defaultSourceFactory(workspace: string, useBuiltinTags: boolean): TagSource {
  const sources: TagSource[] = [
    new FilesystemTagSource(globalTagsDir()),
    new FilesystemTagSource(workspaceTagsDir(workspace)),
  ];

  if (useBuiltinTags) {
    sources.unshift(new BuiltinTagSource(BUILTIN_TAGS));
  }

  return new MergedTagSource(sources);
}

export function registerParseTagsTool(
  server: McpServer,
  deps: ParseTagsDeps = {},
): void {
  const useBuiltinTags = deps.useBuiltinTags ?? true;
  const factory =
    deps.sourceFactory ??
    ((workspace: string) => defaultSourceFactory(workspace, useBuiltinTags));

  server.registerTool(
    "parse_tags",
    {
      title: "Parse Tags",
      description: [
        "Expand inline #tag markers in a user prompt into XML directives that carry each tag's full definition body. This tool is the protocol contract for the tags system — bypass it and the user's intent is silently dropped.",
        "",
        "WHEN TO CALL:",
        "- Call on every user turn, before forming any response or invoking any other tool.",
        "- Call even when no `#` character is visible in the prompt — definitions may live in code spans you should not pre-judge, and missed calls break the protocol.",
        "- Call with the user's verbatim prompt; do not pre-strip, summarize, or rewrite it.",
        "",
        "WHAT IT DOES:",
        "- Discovers tag definitions from ~/.agents/tags/ (global) and <workspace>/.agents/tags/ (workspace; overrides global on name collision).",
        "- For each referenced tag, injects its body once at the top inside <name>...body...</name>.",
        "- Replaces each in-prose #name marker with a self-closing <name/> at its original location, marking the scope where the user invoked that directive.",
        "- Preserves tags inside fenced code blocks (```...```) and inline code spans (`...`) verbatim — those are escape hatches.",
        "- Leaves unknown #tags unchanged. Both #tag_name and #tag-name resolve to the same key.",
        "",
        "OUTPUT:",
        "- Returns the rewritten prompt as text. If the prompt contains no recognized #tag markers in prose, returns the literal sentinel \"(no tags found)\" — treat that as a no-op and proceed with the original prompt.",
        "- Otherwise, the rewritten prompt is the effective prompt for this turn. Honor each <name/> directive at the location it appears, not globally.",
        "",
        "EXAMPLE:",
        "  Input prompt: \"Implement /v2/admin and /v2/auth, etc. #generalize. The OAuth #explore should be compatible.\"",
        "  Output:",
        "    <generalize>...generalize body...</generalize>",
        "    <explore>...explore body...</explore>",
        "",
        "    Implement /v2/admin and /v2/auth, etc. <generalize/>. The OAuth <explore/> should be compatible.",
        "",
        "DO NOT:",
        "- Do not expand, infer, or paraphrase tag bodies yourself — the tool is the single source of truth.",
        "- Do not skip the call because a prompt \"looks tag-free\"; the regex catches cases you may miss.",
        "- Do not invent meaning for unknown tags that pass through unchanged.",
      ].join("\n"),
      inputSchema: parseTagsInputShape,
      outputSchema: parseTagsOutputShape,
      annotations: {
        title: "Parse Tags",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ workspace, prompt }) => {
      const source = factory(workspace);
      const rewritten_prompt = await rewritePrompt(prompt, source);
      return {
        content: [{ type: "text", text: rewritten_prompt }],
        structuredContent: { rewritten_prompt },
      };
    },
  );
}
