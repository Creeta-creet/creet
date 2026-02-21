/**
 * Creet - Skill Scanner Module
 * Scans installed Claude Code plugins and extracts skill metadata.
 * Supports both skills/ (SKILL.md) and commands/ (.md) directory formats.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGINS_CACHE_DIR = path.join(os.homedir(), '.claude', 'plugins', 'cache');

/**
 * Scan all installed plugins and extract skill information.
 * @returns {Array<{name: string, plugin: string, description: string, triggers: string[], domain: string}>}
 */
function scanInstalledSkills() {
  const skills = [];

  if (!fs.existsSync(PLUGINS_CACHE_DIR)) {
    return skills;
  }

  const orgs = safeReadDir(PLUGINS_CACHE_DIR);

  for (const org of orgs) {
    const orgPath = path.join(PLUGINS_CACHE_DIR, org);
    if (!isDir(orgPath)) continue;

    const plugins = safeReadDir(orgPath);
    for (const plugin of plugins) {
      const pluginPath = path.join(orgPath, plugin);
      if (!isDir(pluginPath)) continue;

      const versions = safeReadDir(pluginPath);
      if (versions.length === 0) continue;

      // Use the latest version (last in sorted order)
      const latestVersion = versions.sort().pop();
      const versionPath = path.join(pluginPath, latestVersion);

      // Read plugin manifest
      const pluginName = readPluginName(versionPath) || plugin;

      // 1. Scan skills/ directory (skills/{skill-name}/SKILL.md)
      const skillsDir = path.join(versionPath, 'skills');
      if (fs.existsSync(skillsDir) && isDir(skillsDir)) {
        const skillDirs = safeReadDir(skillsDir);
        for (const skillDir of skillDirs) {
          const skillMdPath = path.join(skillsDir, skillDir, 'SKILL.md');
          if (!fs.existsSync(skillMdPath)) continue;

          const skillData = parseSkillFile(skillMdPath, pluginName);
          if (skillData) {
            skills.push(skillData);
          }
        }
      }

      // 2. Scan commands/ directory (commands/{name}.md)
      const commandsDir = path.join(versionPath, 'commands');
      if (fs.existsSync(commandsDir) && isDir(commandsDir)) {
        const commandFiles = safeReadDir(commandsDir).filter(f => f.endsWith('.md'));
        for (const cmdFile of commandFiles) {
          const cmdPath = path.join(commandsDir, cmdFile);
          const cmdName = cmdFile.replace(/\.md$/, '');

          // Skip if already found via skills/ directory (avoid duplicates)
          if (skills.some(s => s.name === cmdName && s.plugin === pluginName)) continue;

          const skillData = parseCommandFile(cmdPath, cmdName, pluginName);
          if (skillData) {
            skills.push(skillData);
          }
        }
      }
    }
  }

  return skills;
}

/**
 * Parse a SKILL.md file and extract metadata.
 */
function parseSkillFile(filePath, pluginName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Try YAML frontmatter format first
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      const data = parseFrontmatter(fmMatch[1], pluginName);
      if (data) {
        // Also extract triggers from the full content body (after frontmatter)
        const body = content.slice(fmMatch[0].length);
        if (data.triggers.length === 0) {
          data.triggers = extractTriggers(body);
        }
        return data;
      }
    }

    // Try table format (| name | description | license |)
    const tableRows = content.match(/^\|.*\|$/gm);
    if (tableRows && tableRows.length >= 3) {
      for (const row of tableRows.slice(2)) {
        if (/^\|[\s-|]+\|$/.test(row)) continue;
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 2 && !/^-+$/.test(cells[0])) {
          return {
            name: cells[0],
            plugin: pluginName,
            description: cells[1].substring(0, 80),
            triggers: extractTriggers(content),
            domain: detectDomain(cells[1])
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a command .md file (commands/{name}.md format).
 * These use YAML frontmatter with description, allowed-tools, etc.
 */
function parseCommandFile(filePath, cmdName, pluginName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      const desc = yamlValue(fmMatch[1], 'description') || '';
      const body = content.slice(fmMatch[0].length);

      return {
        name: cmdName,
        plugin: pluginName,
        description: desc.substring(0, 80),
        triggers: extractTriggers(desc + '\n' + body),
        domain: detectDomain(desc + ' ' + body.substring(0, 200))
      };
    }

    // No frontmatter — use first non-empty line as description
    const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#'));
    return {
      name: cmdName,
      plugin: pluginName,
      description: (firstLine || '').substring(0, 80),
      triggers: extractTriggers(content),
      domain: detectDomain(content.substring(0, 300))
    };
  } catch {
    return null;
  }
}

/**
 * Parse YAML frontmatter (simplified, no external deps).
 */
function parseFrontmatter(yaml, pluginName) {
  const name = yamlValue(yaml, 'name');
  const desc = yamlValue(yaml, 'description');
  if (!name) return null;

  // Extract triggers from the full frontmatter text (multi-line description often has Triggers:)
  const fullDesc = extractFullDescription(yaml);

  return {
    name,
    plugin: pluginName,
    description: (desc || '').substring(0, 80),
    triggers: extractTriggers(fullDesc || desc || ''),
    domain: detectDomain(fullDesc || desc || '')
  };
}

/**
 * Extract the full multi-line description block from YAML frontmatter.
 * This captures Triggers: lines that yamlValue() truncates.
 */
function extractFullDescription(yaml) {
  const normalized = yaml.replace(/\r\n/g, '\n');

  // Match description block scalar (| or >)
  // Empty lines are valid inside YAML block scalars, so we can't use a simple regex.
  const blockStart = normalized.match(/^description:\s*[|>]\s*\n/m);
  if (blockStart) {
    const startIdx = blockStart.index + blockStart[0].length;
    const lines = normalized.slice(startIdx).split('\n');
    const blockLines = [];
    for (const line of lines) {
      // Block ends at a non-indented, non-empty line (next YAML key)
      if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) break;
      blockLines.push(line);
    }
    return blockLines.join('\n');
  }

  // Match single-line description
  const lineMatch = normalized.match(/^description:\s*(.+)$/m);
  if (lineMatch) {
    return lineMatch[1].trim();
  }

  return null;
}

/**
 * Extract a simple YAML value (single line or first line of multi-line).
 */
function yamlValue(yaml, key) {
  const normalized = yaml.replace(/\r\n/g, '\n');

  // Multi-line block scalar (description: | or description: >)
  const multiMatch = normalized.match(new RegExp(`^${key}:\\s*[|>]\\s*\\n((?:[ \\t]+[^\\n]*\\n?)*)`, 'm'));
  if (multiMatch) {
    // Return only the first meaningful line (before Triggers:)
    const lines = multiMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    const firstLines = [];
    for (const line of lines) {
      if (/^Triggers?:/i.test(line)) break;
      if (/^argument-hint:/i.test(line)) break;
      firstLines.push(line);
    }
    return firstLines.join(' ') || lines[0] || null;
  }

  // Single-line value
  const match = normalized.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (match) {
    const val = match[1].trim().replace(/^["']|["']$/g, '');
    if (val === '|' || val === '>') return null;
    return val;
  }

  return null;
}

/**
 * Extract trigger keywords from text.
 */
function extractTriggers(text) {
  // Match "Triggers:" or "Trigger:" followed by comma-separated keywords (possibly multi-line)
  const triggerMatch = text.match(/Triggers?:\s*([\s\S]*?)(?:\n\n|\nargument-hint:|\nuser-invocable:|\nallowed-tools:|\n[A-Z#]|$)/i);
  if (!triggerMatch) return [];

  return triggerMatch[1]
    .split(/[,\n]/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length < 40 && !/^[-|]/.test(t));
}

/**
 * Auto-detect domain from description.
 */
function detectDomain(desc) {
  const lower = desc.toLowerCase();
  const domainMap = [
    [/sentry|error track|monitoring|logging|metric|tracing/i, 'Monitoring'],
    [/security|vulnerability|owasp|xss|csrf|seo.*security/i, 'Security'],
    [/deploy|ci\/cd|infrastructure|kubernetes|docker|production.*environment/i, 'DevOps'],
    [/mobile|react native|flutter|expo|ios|android/i, 'Mobile'],
    [/desktop|electron|tauri/i, 'Desktop'],
    [/pdca|plan.*design|development.*pipeline|phase|workflow|9-phase/i, 'Workflow'],
    [/fullstack|baas|bkend.*platform|dynamic.*web/i, 'Fullstack'],
    [/auth|login|signup|jwt|oauth|social login|password|rbac/i, 'Auth'],
    [/database|db |table|crud|query|data model/i, 'Database'],
    [/storage|upload|file.*stor|bucket|presigned|download.*cdn/i, 'Storage'],
    [/backend|api(?!\s*key)|server|endpoint|rest\s*api/i, 'Backend'],
    [/frontend|ui\b|component|design system|css|layout|mockup|wireframe/i, 'Frontend'],
    [/git |commit|branch|pull request|merge|pr review|push/i, 'Git'],
    [/code.?review|audit|quality|analyz|convention|coding.*rule/i, 'Quality'],
    [/test|qa |zero.?script/i, 'QA'],
    [/learn|guide|beginner|tutorial|education|onboarding|quickstart/i, 'Learning'],
    [/template|document.*template/i, 'Template'],
    [/cookbook|recipe|troubleshoot/i, 'Guide'],
    [/brand|visual.*identity|guideline.*brand/i, 'Branding'],
    [/enterprise|microservice|monorepo/i, 'Enterprise'],
    [/plugin.*help|function.*list|skill.*navigat/i, 'Navigator'],
    [/claude\.?md|project.*memory|config/i, 'Config'],
    [/schema|terminology|data.*structure|entity/i, 'Schema'],
    [/sdk|agent.*develop/i, 'SDK'],
  ];

  for (const [pattern, domain] of domainMap) {
    if (pattern.test(lower)) return domain;
  }
  return 'General';
}

/**
 * Read plugin name from manifest.
 */
function readPluginName(versionPath) {
  const paths = [
    path.join(versionPath, '.claude-plugin', 'plugin.json'),
    path.join(versionPath, 'plugin.json'),
  ];

  for (const p of paths) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return data.name || null;
    } catch {
      continue;
    }
  }
  return null;
}

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  } catch {
    return [];
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Format skills as a markdown table.
 */
function formatSkillTable(skills) {
  if (skills.length === 0) return 'No plugins detected.';

  const plugins = [...new Set(skills.map(s => s.plugin))];
  let table = `| # | Skill | Plugin | Domain | Description |\n`;
  table += `|---|-------|--------|--------|-------------|\n`;

  skills.forEach((s, i) => {
    table += `| ${i + 1} | /${s.name} | ${s.plugin} | ${s.domain} | ${s.description.substring(0, 50)} |\n`;
  });

  table += `\nTotal: ${skills.length} skills from ${plugins.length} plugins`;
  return table;
}

module.exports = { scanInstalledSkills, formatSkillTable, detectDomain };
