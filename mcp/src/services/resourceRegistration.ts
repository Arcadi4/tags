import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { TagDef, TagSource } from "./tagSource.js";
import { buildTagUri } from "./uriBuilder.js";
import { classifySource, defaultSourceFactory } from "./defaultSourceFactory.js";

const RESERVED_SCOPES = new Set(["skill", "skills", "system", "meta"]);
const TAG_SCOPES = new Set(["builtin", "global", "workspace"]);
type SourceFactory = (workspace: string) => TagSource;
type TagScope = ReturnType<typeof classifySource>;

function notFound(uri: URL): never {
  throw new McpError(ErrorCode.InvalidParams, `Resource not found: ${uri.toString()}`);
}

function isTagScope(value: string | string[] | undefined): value is TagScope {
  return typeof value === "string" && TAG_SCOPES.has(value);
}

function tagResource(def: TagDef, startupWorkspace: string) {
  const scope = classifySource(def.sourcePath, startupWorkspace);
  if (RESERVED_SCOPES.has(scope)) return null;
  const mimeType = mimeTypeForTag(def);
  return {
    uri: buildTagUri(scope, def.key),
    name: `tag-${scope}-${def.key}`,
    description: "Tag definition",
    mimeType,
  };
}

export function mimeTypeForTag(def: TagDef): string {
  if (def.sourcePath.startsWith("builtin:")) return "text/markdown";
  if (def.sourcePath.endsWith(".txt")) return "text/plain";
  return "text/markdown";
}

export async function registerTagResources(
  server: McpServer,
  sourceFactory: SourceFactory = (workspace) => defaultSourceFactory(workspace, true),
  startupWorkspace: string,
): Promise<void> {
  const source = sourceFactory(startupWorkspace);
  const tags = await source.list();

  for (const def of tags) {
    const scope = classifySource(def.sourcePath, startupWorkspace);
    if (RESERVED_SCOPES.has(scope)) continue;

    const uri = buildTagUri(scope, def.key);
    const mimeType = mimeTypeForTag(def);

    server.registerResource(
      `tag-${scope}-${def.key}`,
      uri,
      { title: `#${def.key}`, mimeType },
      async () => ({
        contents: [{ uri, mimeType, text: def.body }],
      }),
    );
  }

  const template = new ResourceTemplate("tag://{scope}/{name}", {
    list: async () => {
      const listedTags = await source.list();
      return {
        resources: listedTags
          .map((def) => tagResource(def, startupWorkspace))
          .filter((resource) => resource !== null),
      };
    },
  });

  server.registerResource(
    "tag-template",
    template,
    { description: "Tag definition", mimeType: "text/markdown" },
    async (uri, variables) => {
      const { scope, name } = variables;
      if (!isTagScope(scope) || typeof name !== "string") notFound(uri);

      const def = (await source.list()).find((candidate) => {
        const candidateScope = classifySource(
          candidate.sourcePath,
          startupWorkspace,
        );
        return candidateScope === scope && candidate.key === name;
      });

      if (!def) notFound(uri);

      const resourceUri = buildTagUri(scope, name);
      const mimeType = mimeTypeForTag(def);
      return {
        contents: [{ uri: resourceUri, mimeType, text: def.body }],
      };
    },
  );
}
