import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseTagsInputShape,
  parseTagsOutputShape,
} from "../schemas/parseTags.js";
import { TagSource } from "../services/tagSource.js";
import { rewritePrompt } from "../services/promptRewriter.js";
import { defaultSourceFactory } from "../services/defaultSourceFactory.js";
import { PARSE_TAGS_DESCRIPTION } from "../prompts/catalog.js";

export interface ParseTagsDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

export function registerParseTagsTool(
  server: McpServer,
  deps: ParseTagsDeps,
): void {
  const useBuiltinTags = deps.useBuiltinTags ?? true;
  const factory =
    deps.sourceFactory ??
    ((workspace: string) => defaultSourceFactory(workspace, useBuiltinTags));

  server.registerTool(
    "parse_tags",
    {
      title: "Parse Tags",
      description: PARSE_TAGS_DESCRIPTION,
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
    async ({ prompt, workspace }) => {
      const source = factory(workspace ?? deps.startupWorkspace);
      const rewritten_prompt = await rewritePrompt(prompt, source);
      return {
        content: [{ type: "text", text: rewritten_prompt }],
        structuredContent: { rewritten_prompt },
      };
    },
  );
}
