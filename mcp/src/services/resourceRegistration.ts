import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { TagDef, TagSource } from "./tagSource.js";
import { buildTagUri } from "./uriBuilder.js";
import { classifySource } from "./defaultSourceFactory.js";

const RESERVED_SCOPES = new Set(["skill", "skills", "system", "meta"]);

export function mimeTypeForTag(def: TagDef): string {
  if (def.sourcePath.startsWith("builtin:")) return "text/markdown";
  if (def.sourcePath.endsWith(".txt")) return "text/plain";
  return "text/markdown";
}

export async function registerTagResources(
  server: McpServer,
  sourceFactory: (workspace: string) => TagSource,
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
        resources: listedTags.flatMap((def) => {
          const scope = classifySource(def.sourcePath, startupWorkspace);
          if (RESERVED_SCOPES.has(scope)) return [];
          const mimeType = mimeTypeForTag(def);
          return [
            {
              uri: buildTagUri(scope, def.key),
              name: `tag-${scope}-${def.key}`,
              description: "Tag definition",
              mimeType,
            },
          ];
        }),
      };
    },
  });

  server.registerResource(
    "tag-template",
    template,
    { description: "Tag definition", mimeType: "text/markdown" },
    async (_uri, variables) => {
      const scope = String(variables.scope);
      const key = String(variables.name);
      const def = (await source.list()).find((candidate) => {
        const candidateScope = classifySource(
          candidate.sourcePath,
          startupWorkspace,
        );
        return candidateScope === scope && candidate.key === key;
      });

      return {
        contents: def
          ? [
              {
                uri: buildTagUri(scope as ReturnType<typeof classifySource>, key),
                mimeType: mimeTypeForTag(def),
                text: def.body,
              },
            ]
          : [],
      };
    },
  );
}
