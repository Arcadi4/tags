import type { TagDef, TagKey, TagSource } from "./tagSource.js";

/**
 * Compose tag sources. Later sources OVERRIDE earlier ones on key collision.
 * Convention: pass [global, workspace] so workspace wins.
 */
export class MergedTagSource implements TagSource {
  private merged: Map<TagKey, TagDef> | null = null;

  // overwrite priority follows the array order: later sources override earlier ones on key collision
  constructor(private sources: ReadonlyArray<TagSource>) {}

  private async ensureLoaded(): Promise<Map<TagKey, TagDef>> {
    if (this.merged) return this.merged;

    const merged = new Map<TagKey, TagDef>();
    for (const source of this.sources) {
      const tags = await source.list();
      for (const tag of tags) {
        const existing = merged.get(tag.key);
        if (existing) {
          console.warn(
            `[agent-tags] cross-source override on "${tag.key}": ${existing.sourcePath} → ${tag.sourcePath}`,
          );
        }
        merged.set(tag.key, tag);
      }
    }

    this.merged = merged;
    return merged;
  }

  async list(): Promise<TagDef[]> {
    const merged = await this.ensureLoaded();
    return Array.from(merged.values());
  }

  async get(key: TagKey): Promise<TagDef | null> {
    const merged = await this.ensureLoaded();
    return merged.get(key) ?? null;
  }
}
