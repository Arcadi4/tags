import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";

import { parseFrontmatter } from "./frontmatter.js";
import type { SkillDef } from "./skillDef.js";

export async function loadSkillFromPath(
  absPath: string,
): Promise<SkillDef | null> {
  if (!isAbsolute(absPath)) {
    console.error(
      `[agent-tags] parse_skill_tags: path must be absolute (got: ${absPath})`,
    );
    return null;
  }

  let raw: string;
  try {
    raw = await readFile(absPath, "utf8");
  } catch (err: unknown) {
    const fsErr = err as NodeJS.ErrnoException;
    if (fsErr.code === "ENOENT" || fsErr.code === "EACCES") return null;
    throw err;
  }

  const { data, content } = parseFrontmatter(raw);
  const dir = join(dirname(absPath), "tags");
  const bundledTagsDir = await stat(dir)
    .then((s) => (s.isDirectory() ? dir : null))
    .catch(() => null);

  return {
    path: absPath,
    name: data.name ?? null,
    description: data.description ?? null,
    body: content,
    bundledTagsDir,
  };
}
