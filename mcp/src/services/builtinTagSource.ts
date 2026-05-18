import { TagDef, TagSource } from "./tagSource.js";

export class BuiltinTagSource implements TagSource {
  private readonly tags = new Map<string, TagDef>();

  constructor(builtinTags: TagDef[]) {
    this.tags = new Map(builtinTags.map((tag) => [tag.key, tag]));
  }

  async list(): Promise<TagDef[]> {
    return Array.from(this.tags.values());
  }

  async get(key: string): Promise<TagDef | null> {
    return this.tags.get(key) ?? null;
  }
}
