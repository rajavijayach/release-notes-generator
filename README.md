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

## 📋 Prerequisites

Before installing the Release Notes Generator, ensure you have:

1. **Gemini CLI** installed and configured
   - [Installation guide](https://github.com/google-gemini/gemini-cli)
   - Verify with: `gemini --version`

2. **Node.js 18+** and npm
   - Check your version: `node --version`
   - Download from [nodejs.org](https://nodejs.org)

3. **Git repository** with commit history
   - The extension works on any git repository
   - Tags are recommended for version-based releases

4. **Optional API tokens** (for enhanced features)
   - `GITHUB_TOKEN` — Fetch PR titles from GitHub
   - `JIRA_TOKEN` & `JIRA_BASE_URL` — Fetch Jira ticket details

---

## 🚀 Installation

### Option 1: Install from GitHub (Recommended)

```bash
# Install the extension
gemini extensions install https://github.com/rajavijayach/release-notes-generator

# Restart Gemini CLI to activate
# Press Ctrl+C to exit, then restart your session
```

### Option 2: Local Development Setup

For local development or customization:

```bash
# Clone the repository
git clone https://github.com/rajavijayach/release-notes-generator.git
cd release-notes-generator

# Install dependencies and build
npm install
npm run build

# Link to Gemini CLI
gemini extensions link .

# Restart Gemini CLI to activate
```

### Verify Installation

After restarting Gemini CLI, verify the extension is loaded:

```bash
# The /release:notes command should be available
# Try: /release:notes

# Or ask naturally:
# "List available extensions"
```

---

## ✅ Activation

After installation, **restart your Gemini CLI session** to activate the extension.

### What's Available

Once activated, you'll have access to:

- **`/release:notes`** command — Quick release notes generation
- **Natural language interface** — Ask for release notes conversationally
- **Four specialized tools** — For programmatic access

### Quick Test

Navigate to a git repository and try:

```bash
# Using the custom command
/release:notes

# Or natural language
"Generate release notes for the latest changes"
```

If the command isn't recognized, ensure you've restarted Gemini CLI after installation.

---

## 💡 Usage

The extension offers multiple ways to generate release notes, from quick commands to detailed natural language requests.

### 🎯 Quick Command (Fastest)

```bash
# Generate notes since the last tag
/release:notes

# Generate notes since a specific tag
/release:notes v1.5

# Generate notes since a commit
/release:notes abc123f
```

### 🗣 Natural Language (Recommended)

Ask naturally and specify your needs:

```bash
# Quick release with auto-detection
"Generate release notes since the last tag"

# Specific version range
"What changed between v1.5 and v1.6?"

# Output mode selection
"Generate release notes since v2.0 in store mode"
"I need internal engineering notes for the latest release"
"Write marketing release notes with a trust angle for v3.0"

# Save to file
"Generate release notes since v1.8 and save to RELEASE.md"
"Create marketing notes for v2.0 and write to file"
```

### 📊 Common Scenarios

**Before tagging a new release:**
```bash
"What commits do we have since v1.2? Should this be a major, minor, or patch?"
"Show me commit stats since the last tag"
```

**For app store updates:**
```bash
"Generate release notes in store mode since v2.1"
```

**For internal team communication:**
```bash
"Generate internal release notes with full technical details"
```

**For marketing announcements:**
```bash
"Write marketing release notes with a growth angle"
"Create release highlights focusing on performance improvements"
```

### 🔧 Available Tools

The Gemini model can call these tools directly when you use natural language:

| Tool | Purpose |
|------|---------|
| `generate_release_notes` | Full pipeline: extract → classify → format |
| `list_git_tags` | Show all tags in repo (helps choose a starting point) |
| `get_commit_stats` | Commit breakdown + suggested version bump |
| `write_release_notes_file` | Generate and save to markdown file |

---

## 📦 Output Modes

Choose the right format for your audience. All modes include the suggested semantic version bump.

### `default` — Developer-Friendly

```markdown
## v1.7

- Added configurable focus window
- Fixed session expiration bug
- Performance improvements
```

### `store` — App Store Ready

```markdown
## What's New in v1.7

**🆕 New features**
• New configurable focus windows

**🛠 Fixes & reliability**
• Improved reliability for session locking
```

### `internal` — Engineering Detail

```markdown
## Internal Release Notes — v1.7

### Added
- Focus duration options (10, 15, 30)

### Fixed
- Race condition in relock logic
```

### `marketing` — Outcome-Driven

```markdown
## v1.7 — Release Highlights

- Strengthened session validation logic
- Improved reliability of access expiration
```

---

## 📖 Examples

### Example 1: Quick Hotfix Release

**Scenario:** You fixed a critical bug and need to ship patch release notes quickly.

```bash
# Check what changed
"What commits do we have since v2.1.3?"

# Generate patch notes
/release:notes v2.1.3
```

**Output (default mode):**
```markdown
## v2.1.4

### Fixed
- Fixed critical authentication timeout bug
- Resolved memory leak in session handler

**Suggested version bump:** patch
```

---

### Example 2: Feature Release for App Store

**Scenario:** New features ready for App Store submission. Need user-friendly copy.

```bash
"Generate release notes in store mode since v2.0"
```

**Output (store mode):**
```markdown
## What's New in v2.1

**🆕 New Features**
• Dark mode support across the entire app
• Export data to CSV and JSON formats
• Customizable notification preferences

**🛠 Improvements & Fixes**
• Faster app launch time
• More reliable cloud sync
• Fixed crash when viewing large datasets

**Suggested version bump:** minor
```

---

### Example 3: Internal Engineering Notes

**Scenario:** Team standup tomorrow. Need detailed technical notes for engineering.

```bash
"Generate internal release notes since v3.0 with full details"
```

**Output (internal mode):**
```markdown
## Internal Release Notes — v3.1

### Added
- OAuth2 integration with refresh token support
- Redis caching layer for API responses
- Comprehensive logging with structured JSON output
- Feature flags for gradual rollout control

### Changed
- Migrated from REST to GraphQL for user endpoints
- Updated dependencies: React 18.2 → 18.3, TypeScript 5.0 → 5.3
- Refactored authentication middleware for better testability

### Fixed
- Race condition in concurrent user sessions
- SQL injection vulnerability in search queries (CVE-2024-XXXX)
- Memory leak in WebSocket connection pool

### Breaking Changes
⚠️ API v2 endpoints removed (deprecated in v2.8)
⚠️ Changed response format for /api/users endpoint

**Suggested version bump:** major (breaking changes detected)
```

---

### Example 4: Marketing Release Highlights

**Scenario:** Product launch announcement for newsletter and social media.

```bash
"Write marketing release notes with a trust angle for v4.0"
```

**Output (marketing mode with trust angle):**
```markdown
## v4.0 — Release Highlights

**Built for Security & Reliability**

We've strengthened the foundation of our platform with enterprise-grade security:

- End-to-end encryption for all data transmission
- SOC 2 Type II compliant infrastructure
- 99.9% uptime SLA with automatic failover
- Comprehensive audit logging for compliance teams

**Trust-First Features**

- Two-factor authentication now mandatory for admin accounts
- Granular permission controls for team management
- Automated security scanning for uploaded files
- Real-time breach detection and alerts

Every feature in this release was designed with your data security in mind.

**Suggested version bump:** major
```

---

### Example 5: Checking Version Bump Before Tagging

**Scenario:** Commits ready, but unsure whether this should be major, minor, or patch.

```bash
"Show me commit stats since v1.8 and suggest the version bump"
```

**Output:**
```
Commit Stats (since v1.8.0):

📊 Total commits: 23

🏷 By category:
  - Added: 5 commits (new features)
  - Fixed: 12 commits (bug fixes)
  - Changed: 4 commits (modifications)
  - Breaking: 0 commits

💡 Suggested version bump: minor

Reasoning: New features detected (5 added), but no breaking changes.
Next version should be: v1.9.0
```

---

## 🔢 Semantic Version Bumping

The extension automatically suggests version bumps based on commit analysis:

| Commits contain | Suggested bump |
|----------------|----------------|
| Breaking changes | **major** |
| New features | **minor** |
| Bug fixes only | **patch** |

---

## ⚙️ Configuration

Enhance the extension with optional API integrations for richer release notes.

### Environment Variables

### Environment Variables

Set these via your shell profile or the Gemini CLI settings UI:

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Fetch PR titles and descriptions from GitHub |
| `JIRA_TOKEN` | Fetch Jira ticket details for commit references |
| `JIRA_BASE_URL` | Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`) |

**Example setup:**
```bash
export GITHUB_TOKEN="ghp_your_token_here"
export JIRA_BASE_URL="https://yourcompany.atlassian.net"
export JIRA_TOKEN="your_jira_token_here"
```

---

## 🛠 Development

Want to customize or contribute? Here's how to set up a local development environment.

### Build Commands

### Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode for active development
npm run clean        # Remove compiled output

gemini extensions link .   # Link for testing in Gemini CLI
```

### Development Workflow

1. Make changes in `src/` or `commands/`
2. Run `npm run dev` for automatic rebuilds
3. Restart Gemini CLI to test changes
4. Run `npm run build` before committing

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

## 🔧 Troubleshooting

### Extension Not Found

**Problem:** `/release:notes` command not recognized after installation.

**Solution:**
1. Ensure you restarted Gemini CLI after installation
2. Verify extension is installed: `gemini extensions list`
3. Check extension directory exists: `~/.gemini/extensions/release-notes-generator/`

---

### No Commits Found

**Problem:** "No commits found since [tag]"

**Solution:**
- Verify you're in a git repository: `git status`
- Check the tag exists: `git tag -l`
- Ensure there are commits after the specified tag: `git log v1.0..HEAD`
- Try omitting the tag to use the last tag automatically

---

### Commands Not Recognized

**Problem:** Natural language requests aren't triggering the extension.

**Solution:**
- Be explicit: "Generate release notes using the release notes generator"
- Use the `/release:notes` command directly
- Ensure you're in a directory with git history

---

### Version Bump Confusion

**Problem:** Suggested version bump doesn't match expectations.

**Solution:**
- Use conventional commits for accurate classification (`feat:`, `fix:`, `BREAKING CHANGE:`)
- Check commit stats: "Show me commit stats since v1.0"
- The suggestion is based on detected changes:
  - **major**: Breaking changes found
  - **minor**: New features, no breaking changes
  - **patch**: Bug fixes only

---

### Build Errors (Local Development)

**Problem:** `npm run build` fails with TypeScript errors.

**Solution:**
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

Ensure Node.js 18+ is installed: `node --version`

---

## License

Apache-2.0
