import { TagSource } from "./tagSource.js";
import { FilesystemTagSource } from "./filesystemTagSource.js";
import { MergedTagSource } from "./mergedTagSource.js";
import { BuiltinTagSource } from "./builtinTagSource.js";
import { BUILTIN_TAGS } from "../builtinTags.js";
import { globalTagsDir, workspaceTagsDir } from "../constants.js";

/**
 * Compose the default tag source chain for a given workspace.
 * Precedence (later overrides earlier on key collision): builtin < global < workspace.
 */
export function defaultSourceFactory(
  workspace: string,
  useBuiltinTags: boolean,
): TagSource {
  const sources: TagSource[] = [
    new FilesystemTagSource(globalTagsDir()),
    new FilesystemTagSource(workspaceTagsDir(workspace)),
  ];
  if (useBuiltinTags) sources.unshift(new BuiltinTagSource(BUILTIN_TAGS));
  return new MergedTagSource(sources);
}

export type SourceClassification = "builtin" | "global" | "workspace";

export function classifySource(
  sourcePath: string,
  workspace: string,
): SourceClassification {
  if (sourcePath.startsWith("builtin:")) return "builtin";
  if (sourcePath.startsWith(workspaceTagsDir(workspace))) return "workspace";
  return "global";
}
