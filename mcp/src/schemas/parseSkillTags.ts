import { z } from "zod";

// Why path-only? (decided 2026-05, see .sisyphus/drafts/tags-as-resources.md Round 9-10)
//
// We considered three input shapes for this tool: name-only, path-only, and { name?, path? } XOR.
//
// Name-only would force this server to own skill-discovery logic — walking ~/.agents/skills,
// ~/.claude/skills, workspace equivalents, and chasing every new convention each new agent ships
// (.opencode/skills, .cursor/skills, .codex/skills, ...). The discovery alignment burden grows
// monotonically with the agent ecosystem and is precisely the work we want to avoid duplicating.
//
// XOR (name-or-path, exactly-one-required) is appealing in theory but hostile to small models in
// practice: the model occasionally sends both fields or neither, the strict refinement returns a
// validation error, the agent retries with the same shape, and the loop confuses the conversation.
// No mainstream MCP server in the wild ships an XOR identifier shape — the official @modelcontextprotocol
// servers (filesystem, memory, fetch) all pick one identifier and commit to it.
//
// Path-only delegates discovery to the host agent, which already has accurate knowledge of its own
// skill directory conventions and exposes the SKILL.md path to the LLM as part of normal skill
// loading. Our value-add is tag-aware parsing of the SKILL.md body, not filesystem walking.
//
// Trade-off accepted: an agent that has only a skill name and no path cannot call us. In practice
// this is rare — every researched agent (Claude Code, OpenCode, Codex CLI, Cursor, Gemini CLI)
// tracks skill files by absolute path internally and surfaces those paths to its LLM.

export const parseSkillTagsInputShape = {
  path: z.string().min(1).describe(
    "Absolute filesystem path to a skill's SKILL.md file. The host agent already knows where its skill files live; pass the path verbatim. Relative paths are rejected."
  ),
  useBuiltinTags: z.boolean().optional().describe(
    "Include built-in tags (#fyi, #explore, #example, #use-skill, #btw) in the skill-local tag source. Defaults to true on the server side. Set to false for strict isolation (only skill-bundled tags)."
  ),
};

export const parseSkillTagsOutputShape = {
  found: z.boolean().describe("Whether a SKILL.md was loaded at the given path."),
  skill: z.object({
    path: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    body: z.string(),
    hasBundledTags: z.boolean(),
    expanded: z.boolean(),
  }).optional().describe("Skill content when found=true. expanded=true means #tag markers in the body were rewritten."),
};

export type ParseSkillTagsInput = { [K in keyof typeof parseSkillTagsInputShape]: z.infer<typeof parseSkillTagsInputShape[K]> };
export type ParseSkillTagsOutput = { [K in keyof typeof parseSkillTagsOutputShape]: z.infer<typeof parseSkillTagsOutputShape[K]> };
