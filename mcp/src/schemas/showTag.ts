import { z } from "zod";

export const showTagInputShape = {
  name: z
    .string()
    .min(1)
    .describe(
      "Tag name to inspect. Accepts '#name', 'name', or 'name_with_underscores'; resolved via the same normalization parse_tags uses ('#tag_name' and '#tag-name' map to the same definition).",
    ),
  workspace: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional absolute path to the user's workspace. When omitted, the server-startup workspace is used.",
    ),
};

export const showTagOutputShape = {
  found: z
    .boolean()
    .describe("Whether a tag with this name is currently loaded."),
  tag: z
    .object({
      key: z.string(),
      rawName: z.string(),
      body: z.string(),
      source: z.enum(["builtin", "global", "workspace"]),
      sourcePath: z.string(),
    })
    .optional()
    .describe(
      "The loaded tag definition annotated with source. Omitted when found=false.",
    ),
};

export type ShowTagInput = {
  [K in keyof typeof showTagInputShape]: z.infer<typeof showTagInputShape[K]>;
};
export type ShowTagOutput = {
  [K in keyof typeof showTagOutputShape]: z.infer<typeof showTagOutputShape[K]>;
};
