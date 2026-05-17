import { z } from "zod";

// Raw shape (preferred form for registerTool)
export const parseTagsInputShape = {
  workspace: z.string().min(1).describe("Absolute path to the workspace whose .agents/tags/ directory holds tag definitions."),
  prompt: z.string().describe("The user's raw prompt potentially containing #tag markers.")
};

export const parseTagsOutputShape = {
  rewritten_prompt: z.string().describe("The prompt with referenced tag bodies injected at top and #markers replaced with <tag/> references. Unknown tags are left as-is.")
};

// Type aliases derived from the shapes for handler typing.
export type ParseTagsInput = { [K in keyof typeof parseTagsInputShape]: z.infer<typeof parseTagsInputShape[K]> };
export type ParseTagsOutput = { [K in keyof typeof parseTagsOutputShape]: z.infer<typeof parseTagsOutputShape[K]> };
