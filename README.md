# Tags

Tags are active, composable, and atomic agent directions.

## Why Tags?

Tags are designed to work together with skills (or slash commands). While skills govern a complete workflow across multiple turns of conversation, tags provide more localized and nuanced control over your intent.

- Tags are human-first. The primary injection method is by actively calling the tag.
- Tags are location-aware, while commands are always scoped around the whole prompt
- All tags are composable; you can combine as many tags as you want in one prompt.
- Each tag represents an atomic intent; they do not interfere with each other and confuse the agent.

## How This Works

The original prompt with tags:

```text
Implement a management API with endpoints of /v2/admin, /v2/auth, /v2/public,
etc. #generalzite. The existing OAuth #explore should be compatible with the new API.
```

The final prompt exposed to the agent:

```xml
<generalize>
This is a demonstration by non-exhaustive examples. Please picture the
complete intent by analyzing the context and propose a complete enumeration
for the user.
</generalize>
<explore>
Explore the codebase to clarify the mentioned concept.
</explore>
Implement a new management API with endpoints of /v2/admin, /v2/auth, /v2/public,
etc. <generalize/>. The existing OAuth <explore/> should be compatible with the new API.
```

The answer should look like:

```text
According to your requirements and research on the codebase, I will implement:

- /v2/admin
- /v2/admin/management <- enumerated by conventions
- /v2/auth
- /v2/auth/login
- /v2/auth/logout
- /v2/auth/legacy <- according to the codebase evidence on OAuth
- /v2/users <- inferred from gap-analysis/skill usage
- /v2/public
- /v2/public/contents <- enumerated by conventions
```

## Implementations

### Active Interception

Integrated into the agentic tool via SDK. Intercept the prompt before sending it to the agent, parse the tags, and inject the tag content into the prompt.

### Passive MCP

A "tags" mcp exposing tool `parse_tags` to the agent. The agent calls it if tag patterns are recognized.
