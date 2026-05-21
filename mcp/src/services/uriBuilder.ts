/**
 * Tag URI scheme constants and helpers.
 *
 * Tag URIs use a custom "tag:" scheme with scope/key structure:
 *   tag://builtin/explore
 *
 * Custom schemes behave inconsistently across runtimes with new URL(),
 * so parsing uses simple string splitting.
 */

export const TAG_URI_SCHEME = "tag:";
export type TagScope = "builtin" | "global" | "workspace";
export const RESERVED_SCOPE_KEYWORDS: readonly string[] = [
  "skill", "skills", "system", "meta",
];
const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SCOPES = new Set(["builtin", "global", "workspace"]);
const RESERVED = new Set(RESERVED_SCOPE_KEYWORDS);

export function buildTagUri(scope: TagScope, key: string): string {
  return `tag://${scope}/${key}`;
}

export function parseTagUri(
  uri: string,
): { scope: TagScope; key: string } | null {
  const idx = uri.indexOf("://");
  if (idx === -1) return null;
  const scheme = uri.slice(0, idx);
  const rest = uri.slice(idx + 3);
  if ((scheme.endsWith(":") ? scheme : `${scheme}:`) !== TAG_URI_SCHEME)
    return null;
  const seg = rest.split("/");
  if (seg.length !== 2) return null;
  const [scope, key] = seg;
  if (!SCOPES.has(scope) || RESERVED.has(scope) || !key || !KEY_RE.test(key))
    return null;
  return { scope: scope as TagScope, key };
}

// Self-check when executed directly
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const a = (ok: unknown, msg: string) => {
    if (!ok) throw new Error(`FAIL: ${msg}`);
    console.log(`  ✓ ${msg}`);
  };
  a(buildTagUri("builtin", "explore") === "tag://builtin/explore", "buildTagUri");
  const r = parseTagUri("tag://builtin/explore");
  a(r?.scope === "builtin" && r?.key === "explore", "parseTagUri basic");
  a(parseTagUri("tag://skill/foo") === null, "reserved scope");
  a(parseTagUri("file:///x") === null, "wrong scheme");
  a(parseTagUri("tag://builtin") === null, "missing key");
  a(parseTagUri("tag://builtin/") === null, "empty key");
  a(parseTagUri("tag://builtin/UPPER") === null, "uppercase key");
  a(parseTagUri("tag://Builtin/explore") === null, "wrong-case scope");
  a(parseTagUri("tag://global/my_tag") === null, "underscore key");
  a(parseTagUri("not-uri") === null, "no scheme");
  console.log("All uriBuilder self-checks passed.");
}
