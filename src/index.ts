/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Release Notes Generator - MCP Server
 *
 * Exposes tools for extracting git history, classifying commits,
 * deduplicating messages, suggesting version bumps, and formatting
 * output into audience-specific release notes.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execSync } from 'child_process';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CommitCategory = 'added' | 'fixed' | 'changed' | 'removed' | 'refactored' | 'breaking';
type OutputMode = 'default' | 'store' | 'internal' | 'marketing';
type Angle = 'trust' | 'performance' | 'stability' | 'growth';
type VersionBump = 'major' | 'minor' | 'patch';

interface RawCommit {
  hash: string;
  subject: string;
  body: string;
  files: string[];
}

interface ClassifiedCommit {
  hash: string;
  subject: string;
  category: CommitCategory;
  isBreaking: boolean;
}

interface ReleaseNotesResult {
  version: string | null;
  suggested_bump: VersionBump;
  sections: Record<CommitCategory, string[]>;
  breaking_changes: string[];
  formatted: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Git
// ─────────────────────────────────────────────────────────────────────────────

function runGit(args: string, cwd: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Resolves the previous tag to determine the starting point for the log.
 * If `since` is provided, uses that tag. Otherwise falls back to the
 * most recent tag reachable from HEAD.
 */
function resolveSinceRef(since: string | undefined, cwd: string): string | null {
  if (since) return since;
  const tag = runGit('describe --tags --abbrev=0 HEAD~1 2>/dev/null || git rev-list --max-parents=0 HEAD', cwd);
  return tag || null;
}

/**
 * Fetches raw commits between `since` and HEAD.
 * Each commit is emitted as: HASH|||SUBJECT|||BODY|||FILES
 */
function fetchCommits(since: string | null, cwd: string): RawCommit[] {
  const range = since ? `${since}..HEAD` : 'HEAD';

  // Collect subjects + bodies
  const logOutput = runGit(
    `log ${range} --no-merges --pretty=format:"%H|||%s|||%b|||ENDCOMMIT"`,
    cwd,
  );

  if (!logOutput) return [];

  const rawEntries = logOutput.split('|||ENDCOMMIT').filter(Boolean);

  return rawEntries.map((entry) => {
    const parts = entry.trim().split('|||');
    const hash = (parts[0] ?? '').trim();
    const subject = (parts[1] ?? '').trim();
    const body = (parts[2] ?? '').trim();

    // Files changed in this commit
    const filesRaw = runGit(`diff-tree --no-commit-id -r --name-only ${hash}`, cwd);
    const files = filesRaw ? filesRaw.split('\n').filter(Boolean) : [];

    return { hash, subject, body, files };
  }).filter((c) => c.hash && c.subject);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Classification
// ─────────────────────────────────────────────────────────────────────────────

const TRIVIAL_PATTERNS = [
  /^wip\b/i,
  /^fixup!/i,
  /^squash!/i,
  /^merge\s/i,
  /^bump\s+version/i,
  /^update\s+changelog/i,
  /^update\s+readme/i,
  /^\s*$/,
];

const CONVENTIONAL_MAP: Record<string, CommitCategory> = {
  feat: 'added',
  feature: 'added',
  add: 'added',
  fix: 'fixed',
  bugfix: 'fixed',
  hotfix: 'fixed',
  chore: 'refactored',
  refactor: 'refactored',
  perf: 'changed',
  improve: 'changed',
  change: 'changed',
  remove: 'removed',
  delete: 'removed',
  deprecate: 'removed',
  style: 'refactored',
  docs: 'refactored',
  test: 'refactored',
  ci: 'refactored',
  build: 'refactored',
};

function isTrivial(commit: RawCommit): boolean {
  return TRIVIAL_PATTERNS.some((p) => p.test(commit.subject));
}

function detectBreaking(commit: RawCommit): boolean {
  return (
    commit.subject.includes('BREAKING CHANGE') ||
    commit.subject.includes('!:') ||
    commit.body.includes('BREAKING CHANGE')
  );
}

function classifyCategory(commit: RawCommit): CommitCategory {
  // Conventional commits: feat:, fix:, feat!:, etc.
  const conventional = /^(\w+)(\(.+\))?(!)?:\s/.exec(commit.subject);
  if (conventional) {
    const prefix = conventional[1].toLowerCase();
    const bang = conventional[3];
    if (bang) return 'breaking';
    return CONVENTIONAL_MAP[prefix] ?? 'changed';
  }

  // Heuristic: keyword scan on subject
  const lower = commit.subject.toLowerCase();
  if (/\badd(ed|ing)?\b/.test(lower) || /\bnew\b/.test(lower) || /\bintroduce/.test(lower)) return 'added';
  if (/\bfix(ed|es|ing)?\b/.test(lower) || /\bresolv/.test(lower) || /\bpatch/.test(lower)) return 'fixed';
  if (/\bremov(e|ed|ing)\b/.test(lower) || /\bdelet/.test(lower) || /\bdrop\b/.test(lower)) return 'removed';
  if (/\brefactor/.test(lower) || /\bclean/.test(lower) || /\bextract/.test(lower)) return 'refactored';

  // File path heuristics
  const paths = commit.files.join(' ');
  if (/\btest(s)?\b/.test(paths) && !commit.files.some((f) => !f.match(/test/i))) return 'refactored';

  return 'changed';
}

function classifyCommits(commits: RawCommit[]): ClassifiedCommit[] {
  return commits
    .filter((c) => !isTrivial(c))
    .map((c) => ({
      hash: c.hash,
      subject: cleanSubject(c.subject),
      category: detectBreaking(c) ? 'breaking' : classifyCategory(c),
      isBreaking: detectBreaking(c),
    }));
}

/** Strip conventional prefix from display subject. */
function cleanSubject(subject: string): string {
  return subject
    .replace(/^(\w+)(\(.+\))?!?:\s*/, '')
    .replace(/^[A-Z]+-\d+\s+/, '') // Jira ticket prefix
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Deduplication
// ─────────────────────────────────────────────────────────────────────────────

function deduplicate(commits: ClassifiedCommit[]): ClassifiedCommit[] {
  const seen = new Set<string>();
  return commits.filter((c) => {
    // Normalise for similarity: lowercase, remove punctuation
    const key = c.subject.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Version bump suggestion
// ─────────────────────────────────────────────────────────────────────────────

function suggestVersionBump(commits: ClassifiedCommit[]): VersionBump {
  if (commits.some((c) => c.isBreaking || c.category === 'breaking')) return 'major';
  if (commits.some((c) => c.category === 'added')) return 'minor';
  return 'patch';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: Formatting
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Apply marketing angle rewording to a single line. */
function applyAngle(line: string, angle: Angle): string {
  const map: Record<Angle, [RegExp, string][]> = {
    trust: [
      [/\bfix(ed)?\b/i, 'Strengthened'],
      [/\badd(ed)?\b/i, 'Enhanced'],
      [/\bimprove(d)?\b/i, 'Improved reliability of'],
      [/\bvalidat/i, 'Strengthened validation of'],
    ],
    performance: [
      [/\bfix(ed)?\b/i, 'Optimised'],
      [/\badd(ed)?\b/i, 'Accelerated'],
      [/\bimprove(d)?\b/i, 'Sped up'],
    ],
    stability: [
      [/\bfix(ed)?\b/i, 'Stabilised'],
      [/\badd(ed)?\b/i, 'Strengthened'],
      [/\bimprove(d)?\b/i, 'Enhanced stability of'],
    ],
    growth: [
      [/\bfix(ed)?\b/i, 'Improved'],
      [/\badd(ed)?\b/i, 'Introduced'],
      [/\bimprove(d)?\b/i, 'Expanded'],
    ],
  };

  let result = line;
  for (const [pattern, replacement] of map[angle]) {
    result = result.replace(pattern, replacement);
  }
  return capitalize(result);
}

function formatDefault(sections: Record<CommitCategory, string[]>, version: string | null): string {
  const v = version ? `v${version}` : 'Latest updates';
  const lines: string[] = [`## ${v}\n`];

  const sectionOrder: CommitCategory[] = ['added', 'fixed', 'changed', 'removed', 'refactored'];
  for (const cat of sectionOrder) {
    const items = sections[cat];
    if (items.length === 0) continue;
    for (const item of items) {
      lines.push(`- ${capitalize(item)}`);
    }
  }

  if (sections.breaking.length > 0) {
    lines.push('\n### ⚠️ Breaking Changes\n');
    for (const item of sections.breaking) {
      lines.push(`- ${capitalize(item)}`);
    }
  }

  return lines.join('\n');
}

function formatStore(sections: Record<CommitCategory, string[]>, version: string | null): string {
  const v = version ? `v${version}` : null;
  const header = v ? `## What's New in ${v}\n` : `## What's New\n`;
  const lines: string[] = [header];

  const categoryLabels: Partial<Record<CommitCategory, string>> = {
    added: '🆕 New features',
    fixed: '🛠 Fixes & reliability',
    changed: '⚡ Improvements',
    removed: '🗑 Removed',
  };

  for (const [cat, label] of Object.entries(categoryLabels) as [CommitCategory, string][]) {
    const items = sections[cat];
    if (items.length === 0) continue;
    lines.push(`\n**${label}**`);
    for (const item of items) {
      lines.push(`• ${capitalize(item)}`);
    }
  }

  return lines.join('\n');
}

function formatInternal(sections: Record<CommitCategory, string[]>, version: string | null): string {
  const v = version ? `v${version}` : 'Unreleased';
  const lines: string[] = [`## Internal Release Notes — ${v}\n`];

  const allCats: CommitCategory[] = ['added', 'fixed', 'changed', 'removed', 'refactored', 'breaking'];
  for (const cat of allCats) {
    const items = sections[cat];
    if (items.length === 0) continue;
    lines.push(`\n### ${capitalize(cat)}`);
    for (const item of items) {
      lines.push(`- ${capitalize(item)}`);
    }
  }

  return lines.join('\n');
}

function formatMarketing(sections: Record<CommitCategory, string[]>, version: string | null, angle: Angle): string {
  const v = version ? `v${version}` : 'Latest Release';
  const lines: string[] = [`## ${v} — Release Highlights\n`];

  const relevant: CommitCategory[] = ['added', 'fixed', 'changed'];
  for (const cat of relevant) {
    for (const item of sections[cat]) {
      lines.push(`- ${applyAngle(capitalize(item), angle)}`);
    }
  }

  return lines.join('\n');
}

function buildSections(commits: ClassifiedCommit[]): Record<CommitCategory, string[]> {
  const sections: Record<CommitCategory, string[]> = {
    added: [],
    fixed: [],
    changed: [],
    removed: [],
    refactored: [],
    breaking: [],
  };
  for (const c of commits) {
    sections[c.category].push(c.subject);
  }
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core orchestration
// ─────────────────────────────────────────────────────────────────────────────

function generateReleaseNotes(params: {
  cwd: string;
  since?: string;
  version?: string;
  mode: OutputMode;
  angle: Angle;
}): ReleaseNotesResult {
  const { cwd, since, version, mode, angle } = params;

  const sinceRef = resolveSinceRef(since, cwd);
  const rawCommits = fetchCommits(sinceRef, cwd);
  const classified = classifyCommits(rawCommits);
  const deduped = deduplicate(classified);
  const sections = buildSections(deduped);
  const suggestedBump = suggestVersionBump(deduped);

  let formatted: string;
  switch (mode) {
    case 'store':
      formatted = formatStore(sections, version ?? null);
      break;
    case 'internal':
      formatted = formatInternal(sections, version ?? null);
      break;
    case 'marketing':
      formatted = formatMarketing(sections, version ?? null, angle);
      break;
    default:
      formatted = formatDefault(sections, version ?? null);
  }

  return {
    version: version ?? null,
    suggested_bump: suggestedBump,
    sections,
    breaking_changes: sections.breaking,
    formatted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'release-notes-generator',
  version: '1.0.0',
});

// ── Tool: generate_release_notes ─────────────────────────────────────────────

server.registerTool(
  'generate_release_notes',
  {
    description:
      'Generates structured, audience-specific release notes from git history. ' +
      'Classifies commits, deduplicates messages, suggests a semantic version bump, ' +
      'and formats output for the requested audience mode.',
    inputSchema: z.object({
      cwd: z.string().describe('Absolute path to the git repository root.'),
      since: z
        .string()
        .optional()
        .describe('Git tag or ref to start from (e.g. v1.5). Defaults to the previous tag.'),
      version: z
        .string()
        .optional()
        .describe('Version string to use in the output (e.g. 1.7.0). If omitted, a bump is suggested.'),
      mode: z
        .enum(['default', 'store', 'internal', 'marketing'])
        .optional()
        .default('default')
        .describe('Output mode: default | store | internal | marketing.'),
      angle: z
        .enum(['trust', 'performance', 'stability', 'growth'])
        .optional()
        .default('trust')
        .describe('Marketing angle applied when mode=marketing.'),
      json: z.boolean().optional().default(false).describe('Return raw JSON instead of formatted markdown.'),
    }).shape,
  },
  async (input) => {
    const { cwd, since, version, mode = 'default', angle = 'trust', json: asJson = false } = input as {
      cwd: string;
      since?: string;
      version?: string;
      mode?: OutputMode;
      angle?: Angle;
      json?: boolean;
    };

    const result = generateReleaseNotes({ cwd, since, version, mode, angle });

    const text = asJson ? JSON.stringify(result, null, 2) : result.formatted;

    return {
      content: [{ type: 'text', text }],
    };
  },
);

// ── Tool: list_git_tags ──────────────────────────────────────────────────────

server.registerTool(
  'list_git_tags',
  {
    description: 'Lists all git tags in the repository, sorted by version. Useful for choosing a --since value.',
    inputSchema: z.object({
      cwd: z.string().describe('Absolute path to the git repository root.'),
    }).shape,
  },
  async (input) => {
    const { cwd } = input as { cwd: string };
    const tags = runGit('tag --sort=-version:refname', cwd);
    return {
      content: [{ type: 'text', text: tags || '(No tags found in this repository)' }],
    };
  },
);

// ── Tool: get_commit_stats ───────────────────────────────────────────────────

server.registerTool(
  'get_commit_stats',
  {
    description:
      'Returns a summary of commits between two refs: total count, breakdown by category, and any breaking changes detected.',
    inputSchema: z.object({
      cwd: z.string().describe('Absolute path to the git repository root.'),
      since: z.string().optional().describe('Starting ref/tag.'),
    }).shape,
  },
  async (input) => {
    const { cwd, since } = input as { cwd: string; since?: string };

    const sinceRef = resolveSinceRef(since, cwd);
    const rawCommits = fetchCommits(sinceRef, cwd);
    const classified = classifyCommits(rawCommits);
    const deduped = deduplicate(classified);
    const sections = buildSections(deduped);
    const suggestedBump = suggestVersionBump(deduped);

    const stats = {
      total_commits: rawCommits.length,
      after_filtering: deduped.length,
      suggested_bump: suggestedBump,
      breakdown: Object.fromEntries(
        Object.entries(sections).map(([k, v]) => [k, v.length]),
      ),
      breaking_changes: sections.breaking,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
    };
  },
);

// ── Tool: write_release_notes_file ──────────────────────────────────────────

server.registerTool(
  'write_release_notes_file',
  {
    description:
      'Generates release notes and writes them to a markdown file. ' +
      'Returns the path of the file written.',
    inputSchema: z.object({
      cwd: z.string().describe('Absolute path to the git repository root.'),
      since: z.string().optional().describe('Git tag or ref to start from.'),
      version: z.string().optional().describe('Version string for the output filename and content.'),
      mode: z.enum(['default', 'store', 'internal', 'marketing']).optional().default('default'),
      angle: z.enum(['trust', 'performance', 'stability', 'growth']).optional().default('trust'),
      output_path: z
        .string()
        .optional()
        .describe('Custom file path for the output. Defaults to RELEASE_NOTES_<version>.md in cwd.'),
    }).shape,
  },
  async (input) => {
    const { cwd, since, version, mode = 'default', angle = 'trust', output_path } = input as {
      cwd: string;
      since?: string;
      version?: string;
      mode?: OutputMode;
      angle?: Angle;
      output_path?: string;
    };

    const result = generateReleaseNotes({ cwd, since, version, mode, angle });

    const filename =
      output_path ??
      `${cwd}/RELEASE_NOTES_${result.version ?? result.suggested_bump.toUpperCase()}.md`;

    const { writeFileSync } = await import('fs');
    writeFileSync(filename, result.formatted, 'utf8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Release notes written to: ${filename}\n\nSuggested version bump: **${result.suggested_bump}**`,
        },
      ],
    };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
