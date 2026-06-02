import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  listTagsInputShape,
  listTagsOutputShape,
} from "../schemas/listTags.js";
import { TagSource } from "../services/tagSource.js";
import {
  classifySource,
  defaultSourceFactory,
} from "../services/defaultSourceFactory.js";
import { LIST_TAGS_DESCRIPTION } from "../prompts/prompt.js";

export interface ListTagsDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

export function registerListTagsTool(
  server: McpServer,
  deps: ListTagsDeps,
): void {
  const useBuiltinTags = deps.useBuiltinTags ?? true;
  const factory =
    deps.sourceFactory ??
    ((workspace: string) => defaultSourceFactory(workspace, useBuiltinTags));

  server.registerTool(
    "list_tags",
    {
      title: "List Tags",
      description: LIST_TAGS_DESCRIPTION,
      inputSchema: listTagsInputShape,
      outputSchema: listTagsOutputShape,
      annotations: {
        title: "List Tags",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ workspace }) => {
      const ws = workspace ?? deps.startupWorkspace;
      const source = factory(ws);
      const defs = await source.list();
      const tags = defs
        .map((def) => ({
          key: def.key,
          source: classifySource(def.sourcePath, ws),
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
      const text =
        tags.length === 0
          ? "(no tags loaded)"
          : tags.map((t) => `#${t.key} [${t.source}]`).join("\n");
      return {
        content: [{ type: "text", text }],
        structuredContent: { tags },
      };
    },
  );
}
