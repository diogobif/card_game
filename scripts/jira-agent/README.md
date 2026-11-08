# Jira agent

When a Jira ticket is created, a LangChain agent running Claude (`claude-opus-5-5`) implements it and opens a PR for review.

```
Jira "issue created" ──► GitHub workflow_dispatch ──► .github/workflows/jira-agent.yml
   1. fetch ticket (summary + description)            jira.ts
   2. agent investigates + edits code, runs checks   index.ts, tools.ts
   3. CI re-checks: protected files, lint, build, test   paths.ts, checks.ts (no secrets in env)
   4. all green → branch agent/<KEY> + PR             workflow
   5. comment on the ticket (PR link or reason)       notify.ts
```

**Only a human merges.** The agent itself never commits or pushes. The workflow only pushes a new `agent/<KEY>` branch and opens a PR; it never pushes to `main`, merges, approves or deploys. You review and merge the PR, and that merge is what deploys (`deploy.yml` runs on push to `main`). GitHub enforces this with the `main` ruleset below, so it holds even if the workflow code is changed.

## Setup

### 1. GitHub secrets and variables (Settings → Secrets and variables → Actions)

| Name | Kind | Value |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | secret | Claude API key |
| `JIRA_EMAIL` | secret | Email of the Jira account the agent uses |
| `JIRA_TOKEN` | secret | API token for that account (id.atlassian.com → Security → API tokens) |
| `JIRA_URL` | secret | e.g. `https://your-site.atlassian.net` |
| `AGENT_MODEL` | variable, optional | Override the model (default `claude-opus-5-5`) |

Also enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**, or `gh pr create` fails. (GitHub only offers create and approve as one setting; the workflow never approves, and a bot can't approve its own PR.)

### 2. Protect `main` (Settings → Rules → Rulesets → New branch ruleset)

- Name `main`, enforcement **Active**, target **Default branch**.
- Bypass list: **Repository admin** only (you can still push to `main` directly as before).
- Rules: **Restrict deletions**, **Block force pushes**, **Require a pull request before merging** with **1 required approval**.

Everyone outside the bypass list, including the `github-actions[bot]` token the workflow uses, can then neither push to `main` nor merge a PR without a human approval, and the bot can't approve its own PRs.

### 3. Jira Automation rule

Project settings → Automation → Create rule:

- **Trigger:** Issue created (add a condition such as a label or issue type if only some tickets should go to the agent).
- **Action:** Send web request
  - URL: `https://api.github.com/repos/diogobif/card_game/actions/workflows/jira-agent.yml/dispatches`
  - Method: `POST`
  - Headers:
    - `Authorization`: `Bearer <fine-grained GitHub PAT>` (this repo only, permission **Actions: Read and write**, nothing else; it can start workflows but can't read or push code)
    - `Accept`: `application/vnd.github+json`
  - Body (custom data):
    ```json
    { "ref": "main", "inputs": { "issue_key": "{{issue.key}}" } }
    ```

To try it without Jira Automation: Actions → Jira agent → Run workflow → enter an issue key.

## Running locally

```sh
export ANTHROPIC_API_KEY=... JIRA_URL=... JIRA_EMAIL=... JIRA_TOKEN=...
pnpm agent:jira CG-12          # edits your working tree; writes agent-result.json
pnpm check                     # the same gate CI runs
```

## Safety

Anyone who can create tickets can steer the agent, so:

- Tools are limited to listing, reading, searching and editing files inside the repo, plus the fixed check commands. No shell.
- It cannot read `.git/`, `.env*` or `node_modules/`, and cannot change CI, deploy files, `Dockerfile`, `package.json`, the lockfile, Vite/TS/oxlint config or its own code. CI re-checks this after the run.
- The checks run with secrets stripped from the environment, and the checkout keeps the GitHub token out of `.git/config` until the PR step.
- Each run is capped at 120 model calls (`AGENT_MAX_MODEL_CALLS`) and 60 minutes.

## Tests

`checks.ts` runs `pnpm lint`, `pnpm build` (type-check + production build) and `pnpm test` (Vitest: game engine, combat, card data and component tests). A PR is only opened when all of them pass.
