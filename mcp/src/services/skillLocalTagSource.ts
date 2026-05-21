import { SkillDef } from "./skillDef.js";
import { TagSource } from "./tagSource.js";
import { FilesystemTagSource } from "./filesystemTagSource.js";
import { BuiltinTagSource } from "./builtinTagSource.js";
import { MergedTagSource } from "./mergedTagSource.js";
import { BUILTIN_TAGS } from "../builtinTags.js";

export function createSkillLocalTagSource(
  skill: SkillDef,
  useBuiltinTags: boolean,
): TagSource {
  const sources: TagSource[] = [];

  if (useBuiltinTags) {
    sources.push(new BuiltinTagSource(BUILTIN_TAGS));
  }

  if (skill.bundledTagsDir) {
    sources.push(new FilesystemTagSource(skill.bundledTagsDir));
  }

  if (sources.length === 0) {
    return { list: async () => [], get: async () => null };
  }

  return new MergedTagSource(sources);
}
