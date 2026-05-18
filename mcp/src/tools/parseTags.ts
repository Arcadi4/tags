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
      description:
        "Rewrite a user prompt by expanding #tag markers using markdown or plain text tag definitions discovered from BOTH ~/.agents/tags/ (global) and <workspace>/.agents/tags/ (workspace; overrides global on key collision). Each referenced tag's body is injected once at the top inside <tag>...</tag>; each in-prose #tag becomes <tag/> at its location. Tags inside fenced code blocks (```...```) and inline code spans (`...`) are preserved unchanged. Unknown tags are left as-is. Both #tag_name and #tag-name resolve to the same definition.",
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
