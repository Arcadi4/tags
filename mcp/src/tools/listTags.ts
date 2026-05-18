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

export interface ListTagsDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

const DESCRIPTION = [
  "Return the live tag inventory for a workspace. Use this when you need to know exactly which `#tag-name` markers parse_tags will currently recognize — for example when the user asks 'what tags do I have', when debugging unexpected (non-)expansion, or before recommending a tag.",
  "",
  "Each entry includes the normalized tag key (lowercase, hyphens) and its origin scope:",
  "- 'builtin'   — bundled with @agent-tags/mcp",
  "- 'global'    — ~/.agents/tags",
  "- 'workspace' — <workspace>/.agents/tags",
  "",
  "Workspace tags override global, which override builtin; the returned `source` reflects which definition won.",
  "",
  "INPUTS:",
  "- workspace (optional): absolute path to the user's project root. When omitted, the server-startup workspace is used.",
  "",
  "OUTPUT:",
  "- tags: array of { key, source }, sorted by key.",
  "",
  "BOUNDARY:",
  "- Does not return tag bodies. Use show_tag for that.",
  "- Does not change which tags parse_tags recognizes; this is read-only inspection.",
].join("\n");

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
      description: DESCRIPTION,
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
