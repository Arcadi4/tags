/**
 * Tag source extensibility seam.
 *
 * Provides the contract for loading tag definitions from arbitrary
 * locations (filesystem, network, etc.). Implementations are registered
 * elsewhere and composed to serve the full tag catalog.
 */

export type TagKey = string;

export interface TagDef {
  key: TagKey;
  rawName: string;
  body: string;
  sourcePath: string;
}

export function normalizeTagKey(name: string): TagKey {
  return name.toLowerCase().replace(/_/g, "-");
}

export interface TagSource {
  list(): Promise<TagDef[]>;
  get(key: TagKey): Promise<TagDef | null>;
}
