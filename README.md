![Banner](https://raw.githubusercontent.com/ktmcp-cli/vercel/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Vercel CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with Vercel.

A production-ready command-line interface for the [Vercel API](https://vercel.com/docs/rest-api) — manage deployments, projects, domains, and logs from your terminal.

## Features

- **Deployments** — List, filter, and inspect deployments
- **Projects** — Browse and manage Vercel projects
- **Domains** — View registered domains and verification status
- **Logs** — Retrieve deployment events and logs
- **Team Support** — Work with personal or team accounts
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk

## Installation

```bash
npm install -g @ktmcp-cli/vercel
```

## Quick Start

```bash
# Get an API token at https://vercel.com/account/tokens
vercel config set --token YOUR_TOKEN

# Optional: set default team
vercel config set --team team_xxxxxx

# List deployments
vercel deployments list

# Get deployment details
vercel deployments get dpl_xxxxx

# List projects
vercel projects list
```

## Commands

### Config

```bash
vercel config set --token <token>
vercel config set --team <teamId>
vercel config show
```

### Deployments

```bash
vercel deployments list
vercel deployments list --limit 50
vercel deployments list --project prj_xxxxx
vercel deployments list --state READY
vercel deployments list --target production
vercel deployments list --team team_xxxxx

vercel deployments get <deployment-id>
vercel deployments get <deployment-id> --json
```

**Available states:** `BUILDING`, `ERROR`, `INITIALIZING`, `QUEUED`, `READY`, `CANCELED`

**Available targets:** `production`, `staging`, `preview`

### Projects

```bash
vercel projects list
vercel projects list --limit 50
vercel projects list --search "my-app"
vercel projects list --team team_xxxxx

vercel projects get <project-id>
vercel projects get <project-id> --json
```

### Domains

```bash
vercel domains list
vercel domains list --limit 50
vercel domains list --team team_xxxxx
vercel domains list --json
```

### Logs

```bash
vercel logs get <deployment-id>
vercel logs get <deployment-id> --limit 200
vercel logs get <deployment-id> --builds
vercel logs get <deployment-id> --json
```

## Team Support

All commands support the `--team <teamId>` flag to work with team accounts:

```bash
vercel deployments list --team team_xxxxx
vercel projects list --team team_xxxxx
vercel domains list --team team_xxxxx
```

You can also set a default team in your config:

```bash
vercel config set --team team_xxxxx
```

## JSON Output

All commands support `--json` for structured output:

```bash
vercel deployments list --json | jq '.[0].uid'
vercel projects list --json | jq '.projects[] | select(.framework == "nextjs")'
vercel domains list --json | jq '.domains[] | select(.verified == true)'
```

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.
