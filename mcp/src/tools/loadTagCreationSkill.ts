import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CREATE_TAG_SKILL } from "../skills/creatingTags.js";
import {
  loadTagCreationSkillInputShape,
  loadTagCreationSkillOutputShape,
} from "../schemas/loadTagCreationSkill.js";

export function registerLoadTagCreationSkillTool(server: McpServer): void {
  server.registerTool(
    "load_tag_creation_skill",
    {
      title: "Load Tag Creation Skill",
      description: [
        "REQUIRED preflight for tag-authoring tasks: load the canonical creating-tags skill before authoring #tag definitions.",
        "Call this first when the user asks to write a tag, create a tag, make a tag, add a #tag, define a tag, edit a tag, review a tag, troubleshoot a tag, or improve tag files for the Tags prompt expansion system.",
        "Typical matching requests include: 'write me a tag', 'create a #deny tag', 'make a tag for prior conclusions', or edits under .agents/tags/.",
        "Use this instead of README lookup, file search, or copying existing tag examples as the first source of tag-authoring guidance. Do not author tag content until this tool has been called.",
        "The returned skill explains tag philosophy, file locations, parser constraints, body-writing patterns, common mistakes, and smoke testing.",
      ].join("\n"),
      inputSchema: loadTagCreationSkillInputShape,
      outputSchema: loadTagCreationSkillOutputShape,
      annotations: {
        title: "Load Tag Creation Skill",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({
      content: [{ type: "text", text: CREATE_TAG_SKILL }],
      structuredContent: { skill: CREATE_TAG_SKILL },
    }),
  );
}
