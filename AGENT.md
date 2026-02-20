# AGENT.md — Vercel CLI for AI Agents

This document explains how to use the Vercel CLI as an AI agent.

## Overview

The `vercel` CLI provides programmatic access to the Vercel API. Use it for managing deployments, projects, domains, and retrieving logs.

## Prerequisites

```bash
vercel config set --token <token>
```

Get a token at: https://vercel.com/account/tokens

## All Commands

### Config

```bash
vercel config set --token <token>
vercel config set --team <teamId>
vercel config show
```

### Deployments

```bash
vercel deployments list                          # List recent deployments
vercel deployments list --limit 50               # Custom limit
vercel deployments list --project prj_xxxxx      # Filter by project
vercel deployments list --state READY            # Filter by state
vercel deployments list --target production      # Filter by target
vercel deployments list --team team_xxxxx        # Team account
vercel deployments list --json                   # JSON output

vercel deployments get <deployment-id>           # Get deployment details
vercel deployments get <deployment-id> --json
```

**States:** `BUILDING`, `ERROR`, `INITIALIZING`, `QUEUED`, `READY`, `CANCELED`

**Targets:** `production`, `staging`, `preview`

### Projects

```bash
vercel projects list                             # List projects
vercel projects list --limit 50
vercel projects list --search "my-app"
vercel projects list --team team_xxxxx
vercel projects list --json

vercel projects get <project-id>                 # Get project details
vercel projects get <project-id> --json
```

### Domains

```bash
vercel domains list                              # List domains
vercel domains list --limit 50
vercel domains list --team team_xxxxx
vercel domains list --json
```

### Logs

```bash
vercel logs get <deployment-id>                  # Get deployment logs
vercel logs get <deployment-id> --limit 200
vercel logs get <deployment-id> --builds         # Include build events
vercel logs get <deployment-id> --json
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. Use `vercel deployments list --json` to get structured deployment data
3. Filter deployments by state to find failed/ready deployments
4. Use `vercel logs get` to debug deployment issues
5. Team ID can be set globally or per-command with `--team`
6. Most list commands default to 20 results - use `--limit` for more
7. Deployment IDs start with `dpl_`, project IDs with `prj_`
8. The `uid` or `id` field contains the deployment/project identifier

## JSON Response Fields

### Deployments List
- `deployments[]` — Array of deployments
- `uid` — Deployment ID
- `name` — Deployment name
- `state` — Current state
- `target` — Environment (production/staging/preview)
- `url` — Deployment URL
- `created` — Creation timestamp

### Deployment Details
- `uid` — Deployment ID
- `name` — Deployment name
- `url` — Full URL
- `state` — Current state
- `target` — Environment
- `projectId` — Associated project
- `meta.githubCommitSha` — Git commit
- `alias[]` — Domain aliases

### Projects List
- `projects[]` — Array of projects
- `id` — Project ID
- `name` — Project name
- `framework` — Detected framework
- `updatedAt` — Last update timestamp

### Project Details
- `id` — Project ID
- `name` — Project name
- `framework` — Framework (nextjs, vite, etc.)
- `buildCommand` — Build command
- `devCommand` — Dev command
- `link.repo` — Git repository
- `link.productionBranch` — Production branch

### Domains List
- `domains[]` — Array of domains
- `name` — Domain name
- `verified` — Verification status (boolean)
- `createdAt` — Creation timestamp

### Logs
- Array of events or `events[]`
- `type` / `name` — Event type
- `created` — Timestamp
- `payload` / `text` — Event message
