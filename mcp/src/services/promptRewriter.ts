// This implementation handles common cases (triple-backtick fences at line start, single-backtick inline spans),
// NOT the full CommonMark grammar (no tildes, no nested fence counts, no indented code blocks).

import { TAG_REGEX } from "../constants.js";
import { TagSource, normalizeTagKey, type TagDef } from "./tagSource.js";

type Segment = { kind: "prose" | "code"; text: string };

export async function rewritePrompt(
  prompt: string,
  source: TagSource
): Promise<string> {
  if (!prompt) return "";

  const segments = segment(prompt);
  const tagOrder: string[] = [];
  const tagDefs = new Map<string, TagDef>();

  const rewrittenSegments = await Promise.all(
    segments.map(async (seg) => {
      if (seg.kind === "code") return seg.text;

      let rewritten = seg.text;
      const regex = new RegExp(TAG_REGEX.source, TAG_REGEX.flags);
      const matches = [...seg.text.matchAll(regex)];

      for (const match of matches) {
        const rawName = match[1];
        const key = normalizeTagKey(rawName);
        const def = await source.get(key);

        if (def) {
          if (!tagDefs.has(key)) {
            tagOrder.push(key);
            tagDefs.set(key, def);
          }
          rewritten = rewritten.replace(match[0], `<${key}/>`);
        }
      }

      return rewritten;
    })
  );

  const body = rewrittenSegments.join("");
  if (tagOrder.length === 0) return body;

  const header = tagOrder.map((key) => {
    const def = tagDefs.get(key)!;
    return `<${key}>${def.body}</${key}>`;
  }).join("\n");

  return `${header}\n\n${body}`;
}

function segment(prompt: string): Segment[] {
  const segments: Segment[] = [];
  const lines = prompt.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed.startsWith("```")) {
      const fenceLines = [line];
      i++;
      while (i < lines.length) {
        fenceLines.push(lines[i]);
        if (lines[i].trim() === "```") {
          i++;
          break;
        }
        i++;
      }
      segments.push({ kind: "code", text: fenceLines.join("\n") });
      continue;
    }

    const inlineSegments = segmentInlineBackticks(line);
    segments.push(...inlineSegments);
    if (i < lines.length - 1) {
      segments.push({ kind: "prose", text: "\n" });
    }
    i++;
  }

  return segments;
}

function segmentInlineBackticks(line: string): Segment[] {
  const segments: Segment[] = [];
  let pos = 0;

  while (pos < line.length) {
    const tick = line.indexOf("`", pos);
    if (tick === -1) {
      if (pos < line.length) {
        segments.push({ kind: "prose", text: line.slice(pos) });
      }
      break;
    }

    if (tick > pos) {
      segments.push({ kind: "prose", text: line.slice(pos, tick) });
    }

    const closeTick = line.indexOf("`", tick + 1);
    if (closeTick === -1) {
      segments.push({ kind: "prose", text: line.slice(tick) });
      break;
    }

    segments.push({ kind: "code", text: line.slice(tick, closeTick + 1) });
    pos = closeTick + 1;
  }

  return segments;
}
