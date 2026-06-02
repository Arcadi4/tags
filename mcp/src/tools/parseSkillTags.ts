import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseSkillTagsInputShape,
  parseSkillTagsOutputShape,
} from "../schemas/parseSkillTags.js";
import { loadSkillFromPath } from "../services/loadSkillFromPath.js";
import { createSkillLocalTagSource } from "../services/skillLocalTagSource.js";
import { rewritePrompt } from "../services/promptRewriter.js";
import { PARSE_SKILL_TAGS_DESCRIPTION } from "../prompts/prompt.js";

// Path-only keeps discovery with the caller, which already knows skill locations.
// This tool does no name lookup and does not walk agent-specific skill folders.
// Missing, unreadable, or relative paths resolve to found:false via null loading.

export interface ParseSkillTagsDeps {
  useBuiltinTags: boolean;
}

export function registerParseSkillTagsTool(
  server: McpServer,
  deps: ParseSkillTagsDeps,
): void {
  server.registerTool(
    "load_skill",
    {
      title: "Load Skill with Tags",
      description: PARSE_SKILL_TAGS_DESCRIPTION,
      inputSchema: parseSkillTagsInputShape,
      outputSchema: parseSkillTagsOutputShape,
      annotations: {
        title: "Load Skill with Tags",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ path, useBuiltinTags }) => {
      const skill = await loadSkillFromPath(path);
      if (!skill) {
        return {
          content: [{ type: "text", text: `(no SKILL.md at ${path})` }],
          structuredContent: { found: false },
        };
      }

      const localSource = createSkillLocalTagSource(
        skill,
        useBuiltinTags ?? deps.useBuiltinTags,
      );
      const rewritten = await rewritePrompt(skill.body, localSource);
      const expanded =
        rewritten !== skill.body && rewritten !== "(no tags found)";
      const body = expanded ? rewritten : skill.body;

      return {
        content: [{ type: "text", text: body }],
        structuredContent: {
          found: true,
          skill: {
            path: skill.path,
            name: skill.name,
            description: skill.description,
            body,
            hasBundledTags: skill.bundledTagsDir !== null,
            expanded,
          },
        },
      };
    },
  );
}
