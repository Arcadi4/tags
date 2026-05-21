import matter from "gray-matter";

export interface FrontmatterResult {
  data: { name?: string; description?: string };
  content: string;
}

export function parseFrontmatter(raw: string): FrontmatterResult {
  if (!raw) return { data: {}, content: raw };

  try {
    const result = matter(raw);
    return {
      data: {
        name: typeof result.data.name === "string" ? result.data.name : undefined,
        description:
          typeof result.data.description === "string"
            ? result.data.description
            : undefined,
      },
      content: result.content,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[agent-tags] frontmatter fallback engaged: ${reason}`);
    return inlineFallback(raw);
  }
}

function inlineFallback(raw: string): FrontmatterResult {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw };
  }

  const rest = raw.slice(4);
  const closeIdx = rest.indexOf("\n---\n");
  if (closeIdx === -1) {
    return { data: {}, content: raw };
  }

  const frontLines = rest.slice(0, closeIdx).split("\n");
  const content = rest.slice(closeIdx + 5);

  const data: { name?: string; description?: string } = {};
  for (const line of frontLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key === "name") data.name = val;
    else if (key === "description") data.description = val;
  }

  return { data, content };
}
