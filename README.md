# Creet

**Never wonder which plugin to use again.**

Creet is a skill navigator for Claude Code by [Creeta](https://www.creeta.com). It scans your installed plugins, finds the best skill for your task, and runs it — all from a single command.

## The Problem

You installed 10+ plugins. That's 50+ slash commands, MCP tools, and LSP servers. You can't remember them all, and you don't know which combination works best for your task.

## The Solution

```
You: /c build a login page with social auth

Creet — Skill Scan
| #  | Name             | Type  | Plugin   | Domain   |
|----|------------------|-------|----------|----------|
| 1  | /frontend-design | Skill | f-d      | Frontend |
| 2  | /bkend-auth      | Skill | bkit     | Auth     |
| 3  | context7         | MCP   | context7 | Backend  |
| 4  | typescript       | LSP   | ts-lsp   | LSP      |
| .. | ...              | ...   | ...      | ...      |

Total: 48 skills, 4 MCP tools, 2 LSP servers from 15 plugins

Creet — Recommendation

> "Build a login page with social auth"

Which skill should I run?
  /bkend-auth (Recommended) — Social auth logic
  /frontend-design — Login page UI
  Other
```

Select a skill and Creet runs it immediately.

## Installation

### Option 1: Load directly from GitHub (Recommended)

Clone the repo and load it with `--plugin-dir`:

```bash
git clone https://github.com/Creeta-creet/creet.git
claude --plugin-dir ./creet
```

Then use `/creet:c` inside Claude Code.

### Option 2: Copy to your commands (Quick setup)

Copy the skill file to your user-level commands for a shorter `/c` command:

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/c.md https://raw.githubusercontent.com/Creeta-creet/creet/main/skills/c/SKILL.md
```

Restart Claude Code, then use `/c` directly.

### Option 3: Load as a local plugin

If you already cloned the repo:

```bash
claude --plugin-dir /path/to/creet
```

## Usage

```
/c <what you want to do>
```

### Examples

| You type | Creet recommends |
|----------|-------------------|
| `/c build a dashboard` | /frontend-design |
| `/c review my PR` | /code-review → /commit-push-pr |
| `/c deploy to production` | /phase-9-deployment + /sentry-setup-tracing |
| `/c I'm new, where do I start?` | /first-claude-code |
| `/c set up error tracking` | /sentry |
| `/c` (no args) | Full skill inventory |

## How It Works

1. **Scan** — Detects all installed skills, MCP tools, and LSP servers
2. **Recommend** — Matches your request to the best skill(s) via AskUserQuestion
3. **Execute** — Runs the chosen skill immediately
4. **Discover** — If no match, suggests installable plugins from registry

## Scanner

Creet's skill scanner automatically detects all plugin types:

| Type | Detection | Example |
|------|-----------|---------|
| **Skill** | `skills/*/SKILL.md` and `commands/*.md` | /commit, /pdca, /frontend-design |
| **MCP** | `.mcp.json` (direct and mcpServers wrapper) | context7, github, supabase, playwright |
| **LSP** | `lspServers` in `plugin.json` | typescript, intelephense (PHP) |
| **Hybrid** | Skill + MCP in same plugin | sentry (7 skills + MCP server) |

### Scanner Details

- Scans `~/.claude/plugins/cache/` for all installed plugins
- Supports YAML frontmatter and markdown table formats for skill metadata
- Extracts trigger keywords (multi-line, 8 languages)
- Auto-detects domain from 24 pattern categories
- Hybrid plugins are marked with `hasMcp` flag

## Features

- Auto-scans all installed plugins at session start via SessionStart hook
- Detects Skills, MCP tools, and LSP servers from plugin cache
- Auto-recommends skills based on keyword matching (8 languages)
- Uses AskUserQuestion for interactive skill selection
- Works with ANY combination of installed plugins
- Compares overlapping skills and explains the difference
- Recommends execution order for multi-skill workflows
- Max 5 recommendations (no overwhelm)
- Responds in your language (EN, KO, JA, ZH, ES, FR, DE, IT)
- Session memory — remembers your most used skills across sessions
- Plugin Discovery — suggests installable plugins when no match found

## Architecture

```
creet/
  .claude-plugin/
    plugin.json          # Plugin manifest
    marketplace.json     # Marketplace registration
  skills/c/
    SKILL.md             # Main /c skill definition
  hooks/
    hooks.json           # Hook registration (SessionStart, UserPromptSubmit)
    session-start.js     # Session startup: scan + memory + context injection
  scripts/
    user-prompt-handler.js  # Per-message keyword matching
  lib/
    skill-scanner.js     # Core scanner (Skills, MCP, LSP detection)
    keyword-matcher.js   # Multi-language keyword matching
    memory-store.js      # Session memory persistence
    plugin-registry.js   # Known plugins registry for discovery
  creet.config.json      # Configuration
```

## Configuration

`creet.config.json`:

```json
{
  "version": "1.2.0",
  "autoRecommend": true,
  "showReport": true,
  "minMatchScore": 5,
  "memoryPath": null,
  "customKeywords": []
}
```

| Option           | Default | Description                                       |
|------------------|---------|---------------------------------------------------|
| `autoRecommend`  | `true`  | Show skill suggestions in responses               |
| `showReport`     | `true`  | Show Creet tip line when skill matches            |
| `minMatchScore`  | `5`     | Minimum keyword match score for recommendations   |
| `memoryPath`     | `null`  | Custom path for memory file (null = plugin root)  |
| `customKeywords` | `[]`    | Additional keyword-to-skill mappings              |

## Requirements

- Claude Code v1.0.33+
- 2+ plugins installed (otherwise you don't need a navigator)

## License

MIT
