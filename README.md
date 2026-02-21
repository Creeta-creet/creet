# Compass

**Never wonder which plugin to use again.**

Compass is a skill navigator for Claude Code. It scans your installed plugins, finds the best skill for your task, and runs it — all from a single command.

## The Problem

You installed 10+ plugins. That's 50+ slash commands. You can't remember them all, and you don't know which combination works best for your task.

## The Solution

```
You: /c build a login page with social auth

Compass — Skill Scan
┌────┬──────────────────┬──────────┬─────────────────────┐
│ #  │ Skill            │ Domain   │ What it does        │
├────┼──────────────────┼──────────┼─────────────────────┤
│ 1  │ /frontend-design │ Frontend │ High-quality UI     │
│ 2  │ /bkend-auth      │ Backend  │ Auth & security     │
│ 3  │ /code-review     │ Quality  │ PR code review      │
│ .. │ ...              │ ...      │ ...                 │
└────┴──────────────────┴──────────┴─────────────────────┘
Total: 12 skills from 4 plugins

Compass — Recommendation

> "Build a login page with social auth"

│ Order │ Skill            │ Reason              │
│ 1st   │ /bkend-auth      │ Social auth logic   │
│ 2nd   │ /frontend-design │ Login page UI       │

Proceed with /bkend-auth? (y/n)
```

Type `y` and Compass runs the skill immediately.

## Installation

```bash
claude plugin add github.com/livev/claude-compass
```

## Usage

```
/c <what you want to do>
```

That's it. Two characters + your request.

### Examples

| You type | Compass recommends |
|----------|-------------------|
| `/c build a dashboard` | /frontend-design |
| `/c review my PR` | /code-review → /commit-push-pr |
| `/c deploy to production` | /phase-9-deployment + /sentry-setup-tracing |
| `/c I'm new, where do I start?` | /first-claude-code |
| `/c set up error tracking` | /sentry |

## How It Works

1. **Scan** — Lists all installed skills in the current session
2. **Recommend** — Matches your request to the best skill(s)
3. **Execute** — Runs the chosen skill on your confirmation

## Features

- Works with ANY combination of installed plugins
- Compares overlapping skills and explains the difference
- Recommends execution order for multi-skill workflows
- Max 5 recommendations (no overwhelm)
- Responds in your language (EN, KO, JA, ZH, ES, FR, DE, IT)

## Requirements

- Claude Code CLI
- 2+ plugins installed (otherwise you don't need a navigator)

## License

MIT
