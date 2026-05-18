import { z } from "zod";

export const loadTagCreationSkillInputShape = {};

export const loadTagCreationSkillOutputShape = {
  skill: z
    .string()
    .describe(
      "The authoritative required instructions for the current tag-authoring task. Follow this before using README guidance or modifying any .agents/tags file.",
    ),
};

export type LoadTagCreationSkillInput = Record<string, never>;
export type LoadTagCreationSkillOutput = {
  [K in keyof typeof loadTagCreationSkillOutputShape]: z.infer<
    typeof loadTagCreationSkillOutputShape[K]
  >;
};
