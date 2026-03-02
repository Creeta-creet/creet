# creet — Skill navigator & plan-first execution engine for Claude Code

Scans all installed plugins (Skills, MCP tools, LSP servers), recommends the best match, and executes it. Plan-first execution with /cp.

## Version

- Current: **v1.7.1**
- Updated: 2026-03-02
- Source of truth: `.claude-plugin/plugin.json`

## Skills

| Skill | Description | Workflow |
|-------|-------------|----------|
| `/c` | Single skill navigator | Scan → Recommend → Execute → Discover |
| `/cc` | Parallel multi-agent engine | Scan → Multi-Match → Parallel Execute → Synthesize |
| `/cp` | Plan-first execution | Scan → Analyze → Generate Plan → Approve → Execute → Post-Exec Update |

- `/c <request>` picks the best one skill and runs it
- `/cc <request>` runs ALL relevant skills as parallel Task agents, then synthesizes outputs
- `/cp <request>` generates a work plan document, gets user approval, then executes
- Any command with no args shows full skill inventory

## Hooks (5)

| Hook | Event | File | When |
|------|-------|------|------|
| SessionStart | Session start (once) | `hooks/session-start.js` | Scans plugins, caches results, loads memory, inits dashboard + plans dir, injects context |
| UserPromptSubmit | Every message | `scripts/user-prompt-handler.js` | Keyword matching for auto-suggest; `/command` override for explicit invocation |
| PreToolUse | Before Task tool | `hooks/pre-tool-task.js` | Registers sub-agent as "running" in dashboard |
| PostToolUse | After Task tool | `hooks/post-tool-task.js` | Marks sub-agent "done" or "error", records duration |
| Stop | Session end | `hooks/stop.js` | Finalizes session, marks orphaned agents as error |

## Libraries (lib/)

| Module | File | Key Exports | Description |
|--------|------|-------------|-------------|
| Skill Scanner | `skill-scanner.js` | `scanInstalledSkills()`, `formatSkillTable()`, `detectDomain()` | Scans `~/.claude/plugins/cache/`. Skills, MCP, LSP, Hybrid. 24 domain patterns. 4-level env var path resolution |
| Keyword Matcher | `keyword-matcher.js` | `matchKeywords()`, `saveScanCache()`, `formatKeywordTable()` | Dynamic keyword map from scan results. Zero hardcoded mappings. Cache at `.creet-cache.json` |
| Memory Store | `memory-store.js` | `loadMemory()`, `saveMemory()`, `recordSessionStart()`, `recordSkillUsage()`, `recordPlanCreation()` | Persists at `~/.claude/creet/.creet-memory.json`. Usage counts, recent skills, plan history |
| Plugin Registry | `plugin-registry.js` | `searchRegistry()`, `KNOWN_PLUGINS` | 60+ known plugins. Suggests installable plugins when no match found |
| Agent Tracker | `agent-tracker.js` | `initSession()`, `registerAgent()`, `completeAgent()`, `endSession()` | Tracks Task agent lifecycle in `.creet/agent-dashboard.json`. Atomic writes, error logs |
| Plan Manager | `plan-manager.js` | `getPlansDir()`, `ensurePlansDir()`, `getStatePath()`, `generateSlug()`, `generateFileName()`, `generatePlanId()`, `savePlanState()`, `loadPlanState()`, `listPlans()`, `formatPlanSummary()`, `generatePlanContent()`, `parsePlanFrontmatter()`, `updatePlanStatus()`, `validatePlanStructure()`, `REQUIRED_SECTIONS` | Plan file naming (`YYYY-MM-DD-slug.md`), document generation (4-lang headers), YAML frontmatter parsing, status lifecycle management, state tracking at `.creet/plan-state.json` |

## Folder Structure

```
creet/
├── .claude-plugin/
│   ├── plugin.json            # Plugin manifest (version source of truth)
│   └── marketplace.json       # Marketplace registration
├── skills/
│   ├── c/SKILL.md             # /c — single skill navigator
│   ├── cc/SKILL.md            # /cc — parallel multi-agent engine
│   └── cp/SKILL.md            # /cp — plan-first execution
├── hooks/
│   ├── hooks.json             # Hook registration (5 hooks)
│   ├── session-start.js       # SessionStart handler
│   ├── pre-tool-task.js       # PreToolUse (Task) handler
│   ├── post-tool-task.js      # PostToolUse (Task) handler
│   └── stop.js                # Stop handler
├── scripts/
│   └── user-prompt-handler.js # UserPromptSubmit handler
├── lib/
│   ├── skill-scanner.js       # Plugin scanner (Skills, MCP, LSP)
│   ├── keyword-matcher.js     # Dynamic keyword matching
│   ├── memory-store.js        # Session memory persistence
│   ├── plugin-registry.js     # Known plugins for discovery
│   ├── agent-tracker.js       # Agent dashboard state management
│   └── plan-manager.js        # Plan document management
├── templates/                     # AI reference only — code (generatePlanContent) does NOT read these at runtime
│   ├── plan.template.md           # /cp work plan structure reference
│   ├── execution-result.template.md # Post-execution result structure reference
│   └── synthesis.template.md      # /cc synthesis output structure reference
├── docs/
│   ├── DOCUMENTATION-GUIDE.md # Documentation standards
│   └── DOCUMENT-CONVENTIONS.md # Document writing conventions
├── creet.config.json          # Runtime configuration
├── CLAUDE.md                  # This file (AI briefing)
├── CHANGELOG.md               # Version history
├── README.md                  # User-facing documentation
└── LICENSE                    # MIT
```

## Configuration (creet.config.json)

| Option | Default | Description |
|--------|---------|-------------|
| `autoRecommend` | `true` | Suggest skills via UserPromptSubmit hook |
| `showReport` | `true` | Show "Creet Tip" line when a skill matches |
| `minMatchScore` | `5` | Minimum keyword match score for auto-suggestions |
| `memoryPath` | `null` | Custom memory file path (null = `~/.claude/creet/`) |
| `customKeywords` | `[]` | Additional keyword-to-skill mappings |
| `planDir` | `null` | Custom plan file directory (null = project `docs/`) |
| `defaultPlanLanguage` | `null` | Force plan language (null = auto-detect from user) |
| `saveSynthesisResults` | `true` | Save /cc synthesis results to .creet/results/ |
| `resultsDir` | `null` | Custom results directory (null = `.creet/results/`) |

## Detection Targets

| Type | Detection Method | Example |
|------|-----------------|---------|
| Skill | `skills/*/SKILL.md`, `commands/*.md` | `/commit`, `/pdca` |
| MCP | `.mcp.json` (direct + `mcpServers` wrapper) | context7, playwright |
| LSP | `lspServers` in `plugin.json` | typescript |
| Hybrid | Skill + MCP in same plugin | Marked with `hasMcp` flag |

## Runtime Files (git-ignored)

| File | Location | Purpose |
|------|----------|---------|
| `.creet-cache.json` | Plugin root | Scan results cache for UserPromptSubmit |
| `.creet-memory.json` | `~/.claude/creet/` | Session memory (usage counts, history) |
| `agent-dashboard.json` | `.creet/` (project root) | Agent lifecycle tracking |
| `plan-state.json` | `.creet/` (project root) | Plan status tracking (draft→approved→completed) |
| `*.md` plan files | `docs/` (project root) | Work plan documents (`YYYY-MM-DD-slug.md`). Config `planDir` overrides |
| `*.md` synthesis files | `.creet/results/` | `/cc` synthesis results (when `saveSynthesisResults` is true) |

## Languages

EN, KO, JA, ZH, ES, FR, DE, IT (8 languages)

## Recent Changes

- **v1.7.1** (2026-03-02): Quality fixes — path consistency, cancelled status, 8-lang headers, YAML parser, JSON safety
- **v1.7.0** (2026-02-28): `/cp` plan-first execution, plan-manager module, planDir/defaultPlanLanguage config
- **v1.6.0** (2026-02-28): Agent dashboard, 3 new hooks (PreToolUse/PostToolUse/Stop), slash command priority override

See [CHANGELOG.md](CHANGELOG.md) for full history.

## Release Checklist

1. 코드 변경 완료 + 커밋
2. 버전 범프 (9곳 동시): `plugin.json`, `marketplace.json`, `hooks.json`, `CLAUDE.md`, `session-start.js`, `skills/c/SKILL.md`, `skills/cc/SKILL.md`, `skills/cp/SKILL.md`, `CHANGELOG.md`
3. 커밋: `chore: bump version to vX.Y.Z`
4. 태그: `git tag vX.Y.Z`
5. Push: `git push origin master --tags`
6. GitHub Release: `gh release create vX.Y.Z --title "vX.Y.Z — Title" --notes-file -`
7. marketplace.json의 `source.ref` 업데이트 (해당 태그로)

## Publishing

- Anthropic 공식 디렉토리 제출: <https://clau.de/plugin-directory-submission>
- 독립 마켓플레이스: `/plugin marketplace add Creeta-creet/creet`
- 개발용: `claude --plugin-dir ./creet`
- 상세: [docs/PUBLISHING-GUIDE.md](docs/PUBLISHING-GUIDE.md)
