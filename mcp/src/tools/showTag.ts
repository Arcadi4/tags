import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { showTagInputShape, showTagOutputShape } from "../schemas/showTag.js";
import { TagSource, normalizeTagKey } from "../services/tagSource.js";
import {
  classifySource,
  defaultSourceFactory,
} from "../services/defaultSourceFactory.js";
import { SHOW_TAG_DESCRIPTION } from "../prompts/catalog.js";

export interface ShowTagDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

function stripLeadingHash(name: string): string {
  return name.startsWith("#") ? name.slice(1) : name;
}

export function registerShowTagTool(
  server: McpServer,
  deps: ShowTagDeps,
): void {
  const useBuiltinTags = deps.useBuiltinTags ?? true;
  const factory =
    deps.sourceFactory ??
    ((workspace: string) => defaultSourceFactory(workspace, useBuiltinTags));

  server.registerTool(
    "show_tag",
    {
      title: "Show Tag",
      description: SHOW_TAG_DESCRIPTION,
      inputSchema: showTagInputShape,
      outputSchema: showTagOutputShape,
      annotations: {
        title: "Show Tag",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ name, workspace }) => {
      const ws = workspace ?? deps.startupWorkspace;
      const source = factory(ws);
      const key = normalizeTagKey(stripLeadingHash(name));
      const def = await source.get(key);
      if (!def) {
        return {
          content: [{ type: "text", text: `(no tag named "${key}")` }],
          structuredContent: { found: false },
        };
      }
      const tag = {
        key: def.key,
        rawName: def.rawName,
        body: def.body,
        source: classifySource(def.sourcePath, ws),
        sourcePath: def.sourcePath,
      };
      return {
        content: [{ type: "text", text: def.body }],
        structuredContent: { found: true, tag },
      };
    },
  );
}
