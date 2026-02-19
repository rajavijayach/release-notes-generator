# Release Notes Generator — Gemini CLI Extension

A Gemini CLI extension that automatically generates structured, high-quality release notes from git history. Built for founders and product teams who ship frequently.

---

## Features

- 🔍 **Automatic commit extraction** from any git range
- 🏷 **Smart classification** using conventional commits + heuristics (added / fixed / changed / removed / refactored / breaking)
- 🧹 **Deduplication** removes low-signal and repeated messages
- 📦 **Four output modes** for different audiences
- 🎯 **Marketing angles** for framing release copy
- 🔢 **Semantic version suggestions** (major / minor / patch)
- 💾 **File output** writes a ready-to-ship markdown file

---

## Installation

```bash
# Install from GitHub
gemini extensions install github.com/YOUR_ORG/release-notes-generator

# Or link locally for development
cd release-notes-generator
npm install && npm run build
gemini extensions link .
```

---

## Usage

### Natural language (recommended)

```
Generate release notes since v1.6 in store mode
```

```
What changed since the last tag? I need internal notes.
```

```
Write marketing release notes with a trust angle for v2.0
```

### Custom command shortcut

```
/release:notes v1.5
```

### Direct tool use

The model can call these tools directly:

| Tool | Description |
|------|-------------|
| `generate_release_notes` | Full pipeline → formatted output |
| `list_git_tags` | List all tags in repo |
| `get_commit_stats` | Commit breakdown + version bump suggestion |
| `write_release_notes_file` | Generate and save markdown file |

---

## Output Modes

### `default` — Developer-friendly

```markdown
## v1.7

- Added configurable focus window
- Fixed session expiration bug
- Performance improvements
```

### `store` — App store ready

```markdown
## What's New in v1.7

**🆕 New features**
• New configurable focus windows

**🛠 Fixes & reliability**
• Improved reliability for session locking
```

### `internal` — Engineering detail

```markdown
## Internal Release Notes — v1.7

### Added
- Focus duration options (10, 15, 30)

### Fixed
- Race condition in relock logic
```

### `marketing` — Outcome-driven

```markdown
## v1.7 — Release Highlights

- Strengthened session validation logic
- Improved reliability of access expiration
```

---

## Semantic Version Bumping

| Commits contain | Suggested bump |
|----------------|----------------|
| Breaking changes | **major** |
| New features | **minor** |
| Bug fixes only | **patch** |

---

## Configuration

Set optional API tokens via environment variables or the Gemini CLI settings UI:

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Fetch PR titles (optional) |
| `JIRA_TOKEN` | Fetch Jira ticket descriptions (optional) |
| `JIRA_BASE_URL` | Your Jira instance URL (optional) |

---

## Development

```bash
npm install
npm run build      # Compile TypeScript
npm run dev        # Watch mode

gemini extensions link .   # Link for local testing
```

---

## Project Structure

```
release-notes-generator/
├── gemini-extension.json       # Extension manifest
├── GEMINI.md                   # Persistent model context
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts                # MCP server (all tools)
├── commands/
│   └── release/
│       └── notes.toml          # /release:notes command
├── skills/
│   └── release-notes/
│       └── SKILL.md            # Agent skill
└── dist/                       # Compiled output (after npm run build)
```

---

## License

Apache-2.0
