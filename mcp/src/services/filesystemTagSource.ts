import { readFile, readdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { TAG_FILE_EXT } from "../constants.js";
import {
  type TagDef,
  type TagKey,
  type TagSource,
  normalizeTagKey,
} from "./tagSource.js";

export class FilesystemTagSource implements TagSource {
  private loaded = false;
  private readonly tags = new Map<TagKey, TagDef>();

  constructor(private readonly tagsDir: string) {
    if (!isAbsolute(tagsDir)) {
      throw new Error("FilesystemTagSource requires an absolute tags directory");
    }
  }

  async list(): Promise<TagDef[]> {
    await this.ensureLoaded();
    return Array.from(this.tags.values());
  }

  async get(key: TagKey): Promise<TagDef | null> {
    await this.ensureLoaded();
    return this.tags.get(normalizeTagKey(key)) ?? null;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;

    let entries: string[];
    try {
      entries = await readdir(this.tagsDir);
    } catch (err: unknown) {
      const fsErr = err as NodeJS.ErrnoException;
      if (fsErr.code === "ENOENT") {
        this.loaded = true;
        return;
      }
      throw err;
    }

    for (const entry of entries) {
      if (!entry.endsWith(TAG_FILE_EXT)) continue;

      const rawName = entry.slice(0, -TAG_FILE_EXT.length);
      if (!rawName) continue;

      const key = normalizeTagKey(rawName);
      const sourcePath = join(this.tagsDir, entry);
      const body = await readFile(sourcePath, "utf8");

      if (this.tags.has(key)) {
        console.error(
          `[agent-tags] intra-source tag key collision on ${key}: ${sourcePath}`,
        );
        continue;
      }

      this.tags.set(key, { key, rawName, body, sourcePath });
    }

    this.loaded = true;
  }
}
