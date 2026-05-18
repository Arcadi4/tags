import { z } from "zod";

// Raw shape (preferred form for registerTool)
export const parseTagsInputShape = {
  workspace: z
    .string()
    .min(1)
    .describe(
      "Absolute path to the user's current workspace. Used to load workspace-scoped tag definitions from <workspace>/.agents/tags/, which override global tags on name collision. Pass the project root the user is working in; do not invent or guess a path.",
    ),
  prompt: z
    .string()
    .describe(
      "The user's verbatim raw prompt for this turn. Pass it unmodified — do not strip the leading verb, summarize, paraphrase, or pre-expand any #tag markers. The tool relies on the literal text, including code fences and inline code spans, to decide what to expand and what to preserve.",
    ),
};

export const parseTagsOutputShape = {
  rewritten_prompt: z
    .string()
    .describe(
      "The effective prompt for this turn, with each referenced tag's body injected once at the top inside <name>...</name> and each in-prose #name replaced by a self-closing <name/> at its original location. Returns the literal string \"(no tags found)\" when the input contains no #tag markers in prose — treat that as a no-op and use the original prompt. Unknown tags pass through unchanged. Tags inside code fences and inline code spans are preserved verbatim.",
    ),
};

// Type aliases derived from the shapes for handler typing.
export type ParseTagsInput = { [K in keyof typeof parseTagsInputShape]: z.infer<typeof parseTagsInputShape[K]> };
export type ParseTagsOutput = { [K in keyof typeof parseTagsOutputShape]: z.infer<typeof parseTagsOutputShape[K]> };
