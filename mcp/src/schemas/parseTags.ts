import { z } from "zod";

export const parseTagsInputShape = {
  prompt: z
    .string()
    .describe(
      "The user's verbatim raw prompt for this turn. Pass it unmodified — do not strip the leading verb, summarize, paraphrase, or pre-expand any #tag markers. The tool relies on the literal text, including code fences and inline code spans, to decide what to expand and what to preserve.",
    ),
  workspace: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional absolute path to the user's current workspace. When omitted, the server-startup workspace is used (the directory the MCP server was launched from, or the path provided via --workspace / TAGS_WORKSPACE). Workspace-scoped tag definitions in <workspace>/.agents/tags/ override global tags on name collision.",
    ),
};

export const parseTagsOutputShape = {
  rewritten_prompt: z
    .string()
    .describe(
      "The effective prompt for this turn, with each referenced tag's body injected once at the top inside <name>...</name> and each in-prose #name replaced by a self-closing <name/> at its original location. Returns the literal string \"(no tags found)\" when the input contains no #tag markers in prose — treat that as a no-op and use the original prompt. Unknown tags pass through unchanged. Tags inside code fences and inline code spans are preserved verbatim.",
    ),
};

export type ParseTagsInput = { [K in keyof typeof parseTagsInputShape]: z.infer<typeof parseTagsInputShape[K]> };
export type ParseTagsOutput = { [K in keyof typeof parseTagsOutputShape]: z.infer<typeof parseTagsOutputShape[K]> };
