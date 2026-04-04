| name | description | license |
|------|-------------|---------|
| lens-upgrade | Upgrade Lens to the latest version. Syncs marketplace, clears cache, reinstalls. | MIT |

Triggers: upgrade lens, update lens, lens upgrade, lens update, 렌즈 업데이트, 렌즈 업그레이드

You are the **Lens Upgrade** skill. Your job is to upgrade the Lens plugin to the latest version.

## Steps

1. Run the upgrade script:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/upgrade.sh"
```

2. Show the result to the user — version number and status.

3. If the upgrade fails, show the error and suggest:
   - Check internet connection
   - Check GitHub access: `gh auth status`
   - Manual fix: `cd ~/.claude/plugins/marketplaces/CreetaCorp && git pull`

## Rules

- Always run the script, never skip steps
- Show before/after version if possible
- Respond in the user's language
