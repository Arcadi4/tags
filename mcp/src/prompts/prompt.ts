import dedent from "dedent";

// Server instructions are unreliable in practice — many clients
// (OpenCode confirmed) drop them entirely. The full picture lives in
// per-tool descriptions and resource metadata, which clients render
// reliably. Keep this string short and meta-cognitive.
export const SERVER_INSTRUCTIONS = dedent`
  This MCP server introduces a new concept: tags. Tags are user-defined prompt annotations that expand into directives. They are defined in plain .md or .txt files under ~/.agents/tags (global) and <workspace>/.agents/tags (project), and they are invoked inline in user prompts with #tag-name markers. You should call tools provided by this server per the descriptions.

  Calling rules:
  - The tag set is dynamic. Definitions live under \`~/.agents/tags\` (global) and \`<workspace>/.agents/tags\` (project) and may change between turns. Use the live tool and resource surface, not baked-in knowledge.
  - \`#tag-name\` and \`#tag_name\` resolve to the same tag.
`;

export const PARSE_TAGS_DESCRIPTION =
  "Expands tags in the input prompt. Use this whenever you see the `#` marker in a prompt. You are allowed to skip sections of the prompt that are clearly not direct human instructions (e.g., code blocks, a long system-injected prompt, logs, etc.).";

export const LIST_TAGS_DESCRIPTION =
  "Lists available tags and their short descriptions.";

export const SHOW_TAG_DESCRIPTION = "Shows the content of a specific tag.";

export const PARSE_SKILL_TAGS_DESCRIPTION =
  "Load a skill with tags parsed. Never use the default skill loading tool from now on. You must use this tool instead. If you already loaded a skill that contains `#` markers, you must reload it with this tool.";

export const CREATE_TAG_GUIDE = dedent`
  # Creating Tags

  ## Overview

  Tags are proactive, composable, minimized agent directions. Use them as intent amplifiers: a tag should annotate one local part of a prompt with one atomic intent.

  Skills and commands govern broader workflows. Tags provide precise, human-called control inside the prompt, exactly where the user writes \`#tag-name\`.

  ## When to Use

  Create or edit a tag when the user wants to reuse a small prompt annotation such as:

  - \`#fyi\` for information that should not cause over-response
  - \`#explore\` for local codebase investigation
  - \`#example\` for non-exhaustive examples that imply a broader pattern
  - \`#btw\` for low-salience side notes
  - A project-specific convention, domain hint, or repeated instruction that should compose with other tags

  Do not create a tag for a full multi-turn workflow. Use an agent skill, slash command, or other workflow primitive for that.

  ## Tag Anatomy

  A tag is a plain \`.md\` or \`.txt\` file. The filename is the tag name. The entire file content is the tag body.

  Locations:

  | Scope | Path | Behavior |
  | --- | --- | --- |
  | Global | \`~/.agents/tags/<tag-name>.md\` | Available across workspaces |
  | Workspace | \`<workspace>/.agents/tags/<tag-name>.md\` | Available only in that workspace; overrides global |

  Naming:

  - Start with a letter.
  - Use letters, numbers, hyphens, or underscores.
  - Prefer kebab-case: \`deep-debug.md\`.
  - \`#tag_name\` and \`#tag-name\` resolve to the same tag key.

  Current parser limits:

  - Optional YAML frontmatter is permitted but not required. All fields are optional. The body of the tag is whatever follows the closing \`---\`. Tags without frontmatter are treated as body-only (existing behavior).
  - Frontmatter fields are not interpreted by the parser today. They serve as author-facing metadata only (e.g., notes, version markers, audience hints).
  - No semantic Markdown parsing. Headings are just body text.
  - Keep ordinary tags under about 600 characters.
  - Tags in inline code spans and triple-backtick code fences are not expanded.
  - Tag bodies are currently expanded one pass; do not rely on nested \`#other-tag\` references unless recursive expansion is explicitly supported.

  ## Skill-Bundled Tags

  Skills can ship their own tags under \`<skill-dir>/tags/*.{md,txt}\`. These tags are scoped to the skill — they are NOT visible to the user's global or workspace tag inventory, and they do NOT shadow tags with the same name elsewhere.

  When \`parse_skill_tags\` loads a skill, the skill's own tag vocabulary is composed with the built-in tags only. Skill authors can therefore rely on the following built-in tags being available inside their skill bodies:

  - \`#fyi\` — accept information silently
  - \`#explore\` — investigate locally
  - \`#example\` — non-exhaustive demonstration set
  - \`#use-skill\` — load a relevant skill
  - \`#btw\` — incidental aside

  User-defined global and workspace tags are intentionally not visible to skill bodies. This isolation prevents user tag conventions from contaminating skill semantics.

  A skill-bundled tag with the same name as a built-in shadows the built-in within that skill's expansion only.


  ## Core Pattern

  Write the body as direct instructions to the agent. Define the trigger, the behavior, the evidence or output expected, and one boundary.

  Good tag body:

  \`\`\`markdown
  This is a non-exhaustive demonstration set. Infer the underlying pattern from the examples and surrounding context: naming conventions, structure, domain logic, and codebase evidence. Propose the complete relevant set. Mark inferred items distinctly from user-provided examples. Do not treat the examples as a closed list unless the user says they are exhaustive.
  \`\`\`

  Bad tag body:

  \`\`\`markdown
  ---
  name: example
  requires: [explore, systematic-debugging]
  recursive: true
  ---

  # Example Tag

  Use many steps, templates, sections, completion criteria, and long workflow rules...
  \`\`\`

  Why bad: the parser treats metadata and headings as literal tag body, not configuration. Long workflow rules do not belong in tags.

  ## Quick Reference

  | Do | Avoid |
  | --- | --- |
  | One atomic intent | Bundled workflow with many phases |
  | Short imperative body | Long tutorial or checklist |
  | Local annotation semantics | Whole-conversation command semantics |
  | Clear output/evidence expectation | Vague "be better" guidance |
  | One explicit boundary | Unsupported metadata or dependency fields |
  | Smoke-test with \`parse_tags\` | Assuming the client loaded it dynamically |

  ## Writing Checklist

  1. Choose the smallest reusable intent.
  2. Pick a kebab-case filename under the correct tags directory.
  3. Write only the tag body; no frontmatter.
  4. Keep the body concise and composable with other tags.
  5. Include what to do and what not to overdo.
  6. Smoke-test with \`parse_tags\` using a prompt that contains \`#tag-name\`.

  ## Common Mistakes

  **Mistake: Writing a workflow as a tag.**
  If the instruction needs phases, tools, verification gates, or multi-turn discipline, do not make it a tag. A tag should be a local intent annotation.


  **Mistake: Making one tag depend on another.**
  Prefer composing tags in the user prompt: \`#example #explore\`. Do not hide required composition inside a tag body unless recursive expansion is implemented and documented.

  **Mistake: Making the tag too broad.**
  \`#careful\` is vague. \`#verify-output-shape\` or \`#infer-examples\` gives the agent a concrete intent.

  ## Smoke Test

  After writing \`<workspace>/.agents/tags/infer-examples.md\`, test:

  \`\`\`text
  Create handlers for auth, billing, notifications, etc. #infer-examples
  \`\`\`

  Expected behavior: \`parse_tags\` prepends an \`<infer-examples>...</infer-examples>\` block and replaces the inline marker with \`<infer-examples/>\` while preserving the rest of the prompt.
`;
