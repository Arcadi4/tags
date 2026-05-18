import { TagDef } from "./services/tagSource.js";

export const BUILTIN_TAGS: TagDef[] = [
  {
    key: "fyi",
    body: "Silently accept this information as the latest fact for the conversation. You don't need to respond or perform any action based on this information unless explicitly asked later.",
    rawName: "fyi",
    sourcePath: "builtin:fyi",
  },
  {
    key: "explore",
    body: "Investigate this concept by searching across the codebase for relevant files, reading their contents, and identifying key symbols, patterns, or implementations. Surface concrete findings inline—file paths, line ranges, function names, and architectural context—before proceeding with your response. Do not modify code. Do not pause for confirmation; integrate discoveries directly into your reasoning and subsequent actions.",
    rawName: "explore",
    sourcePath: "builtin:explore",
  },
  {
    key: "example",
    body: "This is a non-exhaustive demonstration set. Infer the underlying pattern by analyzing these examples alongside surrounding context—naming conventions, structural patterns, domain logic, and existing codebase evidence. Propose a complete enumeration that follows the same convention. Mark each inferred item distinctly from user-provided examples and maintain consistency with the established style and architecture.",
    rawName: "example",
    sourcePath: "builtin:example",
  },
  {
    key: "use-skill",
    body: "Load the the skill if the user directly mentioned one. Or, find skills that would be suitable for this task.",
    rawName: "use-skill",
    sourcePath: "builtin:use-skill",
  },
  {
    key: "btw",
    body: "This is a side note from the main thread of conversation. Make a response if necessary, but do not let it take up more than 10% of your output or distract from the main task unless it is directly relevant.",
    rawName: "btw",
    sourcePath: "builtin:btw",
  },
];
