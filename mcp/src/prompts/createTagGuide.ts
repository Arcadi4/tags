import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CREATE_TAG_GUIDE } from "./catalog.js";

export function registerCreateTagGuidePrompt(server: McpServer): void {
  server.registerPrompt(
    "create-tag-guide",
    {
      title: "Create Tag Guide",
      description:
        "Canonical guide for creating, editing, reviewing, troubleshooting, or improving reusable #tag definitions for the Tags prompt expansion system.",
    },
    () => ({
      description: "Canonical guide for creating reusable #tag definitions.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: CREATE_TAG_GUIDE,
          },
        },
      ],
    }),
  );
}
