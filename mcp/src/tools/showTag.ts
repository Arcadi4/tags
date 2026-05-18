import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  showTagInputShape,
  showTagOutputShape,
} from "../schemas/showTag.js";
import { TagSource, normalizeTagKey } from "../services/tagSource.js";
import {
  classifySource,
  defaultSourceFactory,
} from "../services/defaultSourceFactory.js";

export interface ShowTagDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

const DESCRIPTION = [
  "Return the body of a single tag from the live registry. Use this to inspect what `#name` will actually expand into — for verifying behavior, debugging, or reviewing a tag's content without rewriting a full prompt.",
  "",
  "Names are normalized the same way parse_tags normalizes them: lowercased, underscores collapsed to hyphens, optional leading '#' is stripped. So 'deny', '#deny', 'DENY', and 'de_ny' all resolve to the same definition.",
  "",
  "INPUTS:",
  "- name: the tag to look up (e.g. 'explore', '#explore', 'tag_name').",
  "- workspace (optional): absolute path to the user's project root. When omitted, the server-startup workspace is used.",
  "",
  "OUTPUT:",
  "- found: whether the tag is currently loaded.",
  "- tag (when found): { key, rawName, body, source, sourcePath } — `source` is one of 'builtin' | 'global' | 'workspace', `sourcePath` is the underlying location used to resolve it.",
  "",
  "BOUNDARY:",
  "- Returns one tag at a time. Use list_tags for the full inventory.",
  "- Read-only; does not modify any tag file.",
].join("\n");

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
      description: DESCRIPTION,
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
