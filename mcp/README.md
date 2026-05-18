# @agent-tags/mcp

The MCP server behind [Tags](../README.md). Expands `#tag` markers in user prompts into XML directives so agents receive composable, location-aware instructions.

The server exposes four tools:

- **`parse_tags`** — always-on prompt expander. Replaces `#tag` markers with `<tag/>` references and prepends each tag's directive body once at the top.
- **`list_tags`** — read-only inventory. Returns the currently loaded tags, each annotated with its origin (`builtin` / `global` / `workspace`).
- **`show_tag`** — inspect a single tag's body. Useful for verifying what `#name` will expand to without rewriting a full prompt.
- **`load_tag_creation_skill`** — preflight for tag-authoring tasks. Returns the canonical guide for writing new `.agents/tags/*.md` files.

The `workspace` argument on `parse_tags`, `list_tags`, and `show_tag` is optional. When omitted the server uses the workspace it was launched in (resolved per [Workspace Resolution](#workspace-resolution)).

For end-user install instructions across OpenCode, Claude Code, Codex, Gemini CLI, Qoder, etc., see the [project README](../README.md). This document is for running the server directly, configuring a local checkout, or contributing.

## Quick Use (Published Package)

The published package is `@agent-tags/mcp`. Most agents only need one line of config pointing at `npx`:

```jsonc
{
  "mcpServers": {
    "tags": {
      "command": "npx",
      "args": ["-y", "@agent-tags/mcp@latest"]
    }
  }
}
```

The server defaults `workspace` to `process.cwd()`, which the agent sets to the project root. No env var or flag is required for normal use.

### Using Without `npx`

You may also install the MCP as a global package. This can make the config simpler. The local binary will be linked as `tags-mcp`:

```bash
npm install -g @agent-tags/mcp
```

Then, point your agent config to `tags-mcp` instead of `npx`:

```jsonc
{
  "mcpServers": {
    "tags": {
      "command": "tags-mcp"
    }
  }
}
```

## Workspace Resolution

Resolved in this order, first match wins:

1. `--workspace <abs-path>` CLI flag
2. `TAGS_WORKSPACE` environment variable
3. `process.cwd()`

Tags are then discovered from two locations:

- `~/.agents/tags/*.{md,txt}` — global, available everywhere
- `<workspace>/.agents/tags/*.{md,txt}` — project-scoped, shadows globals on name collision

Filename = tag name. File body = directive content. Both `#tag_name` and `#tag-name` resolve to the same definition.

## CLI Flags

| Flag | Effect |
| --- | --- |
| `--workspace <path>` | Override the workspace root. Useful when stdio cwd is unreliable. |
| `--no-builtin-tags` | Disable the bundled tags below. Project / global tags still load. |

## Built-in Tags

Bundled by default. Override by writing a global or project tag with the same name; disable entirely with `--no-builtin-tags`.

| Tag | Purpose |
| --- | --- |
| `#fyi` | Accept information silently as latest fact; don't act on it. |
| `#explore` | Investigate the marked concept across the codebase before continuing. |
| `#example` | Treat the list as non-exhaustive and infer the underlying pattern. |
| `#use-skill` | Load a skill mentioned by the user, or find a relevant one. |
| `#btw` | Incidental aside; keep as background, don't treat as a topic switch. |

## Limits

- One-pass non-recursive expansion — tags inside tag bodies are not expanded.
- Code-fence stripping is basic CommonMark (triple backticks and inline backticks); tilde fences and indented code blocks are not recognized.
- No YAML frontmatter parsing; the entire file body becomes the directive.
- No file watching or hot reload; restart the server after editing tag files.
- stdio transport only.
