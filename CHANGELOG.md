# Changelog

## [1.2.0] - 2026-02-22

### Added
- **MCP tool detection** — Scanner now detects `.mcp.json` files and lists MCP tool servers (context7, github, supabase, playwright, etc.)
- **LSP server detection** — Scanner reads `lspServers` from `plugin.json` for language servers (typescript, intelephense)
- **Hybrid plugin support** — Plugins with both Skills and MCP (e.g. sentry) are marked with `hasMcp` flag
- **Type column** in scan output — Each entry shows its type: Skill, MCP, or LSP
- **`mcpServers` wrapper format** — Handles both direct `{"server": {...}}` and wrapped `{"mcpServers": {"server": {...}}}` formats
- **Language extraction** for LSP entries from `extensionToLanguage` mappings
- **`readPluginDescription()`** helper for MCP/LSP entries without skill metadata
- **`parseMcpFile()`** and **`parseLspPlugin()`** functions in skill-scanner.js

### Changed
- `scanInstalledSkills()` now returns entries with `type` field (`'skill'`, `'mcp'`, `'lsp'`)
- `formatSkillTable()` shows Type column and breakdown summary (e.g. "48 skills, 4 MCP tools, 2 LSP servers")
- `commands/` directory scanning — Previously only scanned `skills/`, now scans both
- `extractFullDescription()` — Fixed YAML block scalar parsing for empty lines
- `extractTriggers()` — Improved regex to handle multi-line triggers and YAML keys
- `yamlValue()` — Stops at `Triggers:` and `argument-hint:` to avoid polluting descriptions
- Domain detection expanded from 14 to 24 patterns (added Workflow, Fullstack, Database, Storage, QA, Branding, Enterprise, Navigator, Config, Schema, SDK)

### Fixed
- Triggers were always empty (0/48) due to YAML block scalar regex not handling empty lines
- `commands/*.md` files were not being scanned (only `skills/*/SKILL.md` was scanned)
- Domain misclassification (e.g. `/dynamic` classified as Auth instead of Fullstack)

## [1.1.0] - 2026-02-21

### Added
- Session hooks (SessionStart, UserPromptSubmit)
- Multilingual keyword matching (EN, KO, JA, ZH, ES, FR, DE, IT)
- Session memory persistence
- Plugin discovery registry
- Creet suggestion line in responses
- `creet.config.json` for configuration

### Changed
- Rebranded from Compass to Creet
- 4-phase workflow: Scan → Recommend → Execute → Discover

## [1.0.0] - 2026-02-20

### Added
- Initial release as Compass
- Basic skill scanning from `skills/` directory
- Simple keyword matching
- Skill recommendation
