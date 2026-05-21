/**
 * Represents the result of loading one SKILL.md from one absolute path.
 *
 * Fields mirror the SKILL.md file contents after frontmatter parsing:
 * the body excludes the YAML frontmatter, and the name/description fields
 * are extracted from it (null when absent).
 */

export interface SkillDef {
  /** Absolute path to the SKILL.md file (echoes the input path). */
  path: string;

  /** Frontmatter `name` field, or null if not present. */
  name: string | null;

  /** Frontmatter `description` field, or null if not present. */
  description: string | null;

  /** SKILL.md content after stripping the YAML frontmatter. */
  body: string;

  /**
   * Absolute path to `<dirname(path)>/tags/` if that directory exists,
   * or null if it does not.
   */
  bundledTagsDir: string | null;
}
