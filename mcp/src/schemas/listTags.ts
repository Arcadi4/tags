import { z } from "zod";

export const listTagsInputShape = {
  workspace: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional absolute path to the user's workspace. When omitted, the server-startup workspace is used (the directory the MCP server was launched from, or the path provided via --workspace / TAGS_WORKSPACE).",
    ),
};

export const listTagsOutputShape = {
  tags: z
    .array(
      z.object({
        key: z.string(),
        source: z.enum(["builtin", "global", "workspace"]),
      }),
    )
    .describe(
      "Currently loaded tags for the resolved workspace, each annotated with its origin: 'builtin' (bundled), 'global' (~/.agents/tags), or 'workspace' (<workspace>/.agents/tags). Reflects merge precedence — workspace overrides global, which overrides builtin.",
    ),
};

export type ListTagsInput = {
  [K in keyof typeof listTagsInputShape]: z.infer<
    typeof listTagsInputShape[K]
  >;
};
export type ListTagsOutput = {
  [K in keyof typeof listTagsOutputShape]: z.infer<
    typeof listTagsOutputShape[K]
  >;
};
