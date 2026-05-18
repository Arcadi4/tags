import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseTagsInputShape,
  parseTagsOutputShape,
} from "../schemas/parseTags.js";
import { TagSource } from "../services/tagSource.js";
import { rewritePrompt } from "../services/promptRewriter.js";
import { defaultSourceFactory } from "../services/defaultSourceFactory.js";

export interface ParseTagsDeps {
  sourceFactory?: (workspace: string) => TagSource;
  useBuiltinTags?: boolean;
  startupWorkspace: string;
}

const DESCRIPTION = [
  "Expand inline `#tag` markers (e.g. `#explore`, `#fyi`, `#example`, `#btw`, `#deny`) in a user prompt into XML directives. For each recognized `#name` in prose, the tool injects `<name>...body...</name>` once at the top of the rewritten prompt and replaces each `#name` with a self-closing `<name/>` at its original location. The marker can sit anywhere — opening (`#btw the previous...`), middle (`...handles `#tag_name` resolution...`), end (`...check the regex specifics #explore`), or scattered across multiple clauses. Tags inside fenced code blocks (```) and inline code spans (`) are preserved verbatim. Unknown `#tags` (no matching definition) pass through unchanged. `#tag_name` and `#tag-name` resolve to the same definition. Returns the literal sentinel \"(no tags found)\" when no recognized `#tag` markers appear in prose.",
  "",
  "EXAMPLES:",
  "",
  "  user: ok thanks, continue",
  "  call: parse_tags({ prompt: \"ok thanks, continue\" })",
  "  result: (no tags found)",
  "",
  "  user: walk me through how the prompt rewriter handles edge cases #explore",
  "  call: parse_tags({ prompt: \"walk me through how the prompt rewriter handles edge cases #explore\" })",
  "  result:",
  "    <explore>...explore body...</explore>",
  "",
  "    walk me through how the prompt rewriter handles edge cases <explore/>",
  "",
  "  user: explain how this server discovers tag definitions",
  "  call: parse_tags({ prompt: \"explain how this server discovers tag definitions\" })",
  "  result: (no tags found)",
  "",
  "  user: what's the #deny tag for?",
  "  call: parse_tags({ prompt: \"what's the #deny tag for?\" })",
  "  result:",
  "    <deny>...deny body...</deny>",
  "",
  "    what's the <deny/> tag for?",
  "",
  "  user: Compare FilesystemTagSource and MergedTagSource #explore. The merging behavior #fyi is intentional.",
  "  call: parse_tags({ prompt: \"Compare FilesystemTagSource and MergedTagSource #explore. The merging behavior #fyi is intentional.\" })",
  "  result:",
  "    <explore>...explore body...</explore>",
  "    <fyi>...fyi body...</fyi>",
  "",
  "    Compare FilesystemTagSource and MergedTagSource <explore/>. The merging behavior <fyi/> is intentional.",
  "",
  "  user: just answer directly, no tools — what's the difference between #fyi and #btw?",
  "  call: parse_tags({ prompt: \"just answer directly, no tools — what's the difference between #fyi and #btw?\" })",
  "  result:",
  "    <fyi>...fyi body...</fyi>",
  "    <btw>...btw body...</btw>",
  "",
  "    just answer directly, no tools — what's the difference between <fyi/> and <btw/>?",
  "",
  "  user: add a tag for discarding objects (file/function/modules etc. #example)",
  "  call: parse_tags({ prompt: \"add a tag for discarding objects (file/function/modules etc. #example)\" })",
  "  result:",
  "    <example>...example body...</example>",
  "",
  "    add a tag for discarding objects (file/function/modules etc. <example/>)",
  "",
  "  user (code fence with tag inside):",
  "    ```",
  "    # comment containing #fyi",
  "    ```",
  "    what does the snippet do?",
  "  call: parse_tags({ prompt: <verbatim including the code fence> })",
  "  result: (no tags found)        # tags inside code fences are escape hatches, not directives",
  "",
  "  user: explain the `TAG_REGEX` const, reference it with #explore",
  "  call: parse_tags({ prompt: \"explain the `TAG_REGEX` const, reference it with #explore\" })",
  "  result:",
  "    <explore>...explore body...</explore>",
  "",
  "    explain the `TAG_REGEX` const, reference it with <explore/>",
  "",
  "  user: I want to use #somemadeuptagname here",
  "  call: parse_tags({ prompt: \"I want to use #somemadeuptagname here\" })",
  "  result: I want to use #somemadeuptagname here     # unknown tag passes through unchanged, no header injected",
  "",
  "  user: in promptRewriter.ts, what's the difference between how line 70 detects fenced code blocks versus how line 96 detects inline backticks? include the regex/string-matching specifics #explore",
  "  call: parse_tags({ prompt: \"in promptRewriter.ts, what's the difference between how line 70 detects fenced code blocks versus how line 96 detects inline backticks? include the regex/string-matching specifics #explore\" })",
  "  result:",
  "    <explore>...explore body...</explore>",
  "",
  "    in promptRewriter.ts, what's the difference between how line 70 detects fenced code blocks versus how line 96 detects inline backticks? include the regex/string-matching specifics <explore/>",
  "  # long, technically dense prompts still get parsed first — the visual weight of the question doesn't change the routine",
  "",
  "  user: #btw the previous test session was useful — now show me how `BuiltinTagSource` is wired into the merged source chain, and infer where future remote sources would plug in #example",
  "  call: parse_tags({ prompt: \"#btw the previous test session was useful — now show me how `BuiltinTagSource` is wired into the merged source chain, and infer where future remote sources would plug in #example\" })",
  "  result:",
  "    <btw>...btw body...</btw>",
  "    <example>...example body...</example>",
  "",
  "    <btw/> the previous test session was useful — now show me how `BuiltinTagSource` is wired into the merged source chain, and infer where future remote sources would plug in <example/>",
  "  # multiple tags across one prompt are all parsed in a single call; conversational lead-ins (`#btw`) and substantive directives (`#example`) coexist",
  "",
  "  user: now look at how `MergedTagSource.get()` resolves collisions between global and workspace tags, then explain why `BuiltinTagSource` ends up at the start of the source array even though it's the lowest precedence #explore",
  "  call: parse_tags({ prompt: \"now look at how `MergedTagSource.get()` resolves collisions between global and workspace tags, then explain why `BuiltinTagSource` ends up at the start of the source array even though it's the lowest precedence #explore\" })",
  "  result:",
  "    <explore>...explore body...</explore>",
  "",
  "    now look at how `MergedTagSource.get()` resolves collisions between global and workspace tags, then explain why `BuiltinTagSource` ends up at the start of the source array even though it's the lowest precedence <explore/>",
  "  # multi-clause technical asks with a trailing tag still trigger the call before any code is read; the routine fires regardless of how the prompt opens",
  "",
  "INPUTS:",
  "- prompt: the user's verbatim message for the turn. Pass it unmodified — the rewriter relies on the literal text, including code fences and inline code spans, to decide what to expand and what to preserve.",
  "- workspace (optional): absolute path to the user's project root. Used to load workspace-scoped tag definitions (which override global tags on name collision). When omitted, the server-startup workspace is used.",
  "",
  "OUTPUT:",
  "- For tag-bearing prompts: the rewritten prompt with `<name>...body...</name>` directive blocks prepended and `<name/>` placeholders in prose at the original locations. Each `<name/>` directive applies at the location it appears, not globally.",
  "- For tag-free prompts: the literal sentinel string \"(no tags found)\".",
  "- For prompts with only unknown `#tags`: the prompt is returned unchanged, with the `#name` markers preserved verbatim.",
  "",
  "BOUNDARY:",
  "- The tool's rewritten output is the single source of truth for tag bodies. Read the injected `<name>...body...</name>` content rather than guessing what each `#name` means based on its label alone.",
  "- The presence, position, or visual weight of a `#tag` does not change the routine — `#explore` at the end of a long technical question, `#btw` opening a casual aside, `#fyi` mid-clause, and `#somemadeup` (unknown) all flow through the same call.",
].join("\n");

export function registerParseTagsTool(
  server: McpServer,
  deps: ParseTagsDeps,
): void {
  const useBuiltinTags = deps.useBuiltinTags ?? true;
  const factory =
    deps.sourceFactory ??
    ((workspace: string) => defaultSourceFactory(workspace, useBuiltinTags));

  server.registerTool(
    "parse_tags",
    {
      title: "Parse Tags",
      description: DESCRIPTION,
      inputSchema: parseTagsInputShape,
      outputSchema: parseTagsOutputShape,
      annotations: {
        title: "Parse Tags",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ prompt, workspace }) => {
      const source = factory(workspace ?? deps.startupWorkspace);
      const rewritten_prompt = await rewritePrompt(prompt, source);
      return {
        content: [{ type: "text", text: rewritten_prompt }],
        structuredContent: { rewritten_prompt },
      };
    },
  );
}
