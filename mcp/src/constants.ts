import os from "node:os";
import path from "node:path";

export const SERVER_NAME = "agent-tags";
export const SERVER_VERSION = "0.1.0";
export const DEFAULT_TAGS_DIR = ".agents/tags";
// Matches #tag-name at word boundary, not preceded by word char — e.g. matches "#explore" but not "x#explore"
export const TAG_REGEX = /(?<!\w)#([A-Za-z][A-Za-z0-9_-]*)(?=\b|$)/g;
export const TAG_FILE_EXT = ".md";

export function globalTagsDir(): string {
  return path.join(os.homedir(), DEFAULT_TAGS_DIR);
}

export function workspaceTagsDir(workspaceAbsPath: string): string {
  return path.join(workspaceAbsPath, DEFAULT_TAGS_DIR);
}
