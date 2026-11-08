// Posts the run outcome back to the Jira ticket as a comment and moves the ticket:
// to JIRA_REVIEW_STATUS (default "Revisão") when a PR was opened, otherwise to
// JIRA_FAILURE_STATUS (default "Falha no agente").
//   ISSUE_KEY=... OUTCOME=pr|blocked|checks-failed|no-changes|error [PR_URL=...] [RESULT_PATH=...] [RUN_URL=...]
//   node scripts/jira-agent/notify.ts
import { existsSync, readFileSync } from 'node:fs'
import { addComment, isIssueKey, tryMoveToStatus } from './jira.ts'
import type { AgentResult, BlockReason } from './tools.ts'

const key = process.env.ISSUE_KEY ?? ''
const outcome = process.env.OUTCOME ?? 'error'
const runUrl = process.env.RUN_URL ?? ''
const resultPath = process.env.RESULT_PATH ?? 'agent-result.json'

if (!isIssueKey(key)) {
  console.error(`Invalid ISSUE_KEY "${key}"`)
  process.exit(1)
}

const result: Partial<AgentResult> = existsSync(resultPath)
  ? (JSON.parse(readFileSync(resultPath, 'utf8')) as AgentResult)
  : {}

const messages: Record<string, string> = {
  pr: `Agent opened a pull request for review: ${process.env.PR_URL ?? ''}`,
  blocked: 'Agent did not implement this ticket.',
  'checks-failed': 'Agent made changes but lint/build/tests failed, so no PR was opened.',
  'no-changes': 'Agent finished without changing any files, so no PR was opened.',
  error: 'Agent run failed.',
}

const BLOCK_LABELS: Record<BlockReason, string> = {
  'business-rule': 'Motivo: o pedido fere uma regra de negócio do jogo.',
  'not-feasible': 'Motivo: o pedido não pode ser implementado neste projeto.',
  unclear: 'Motivo: o pedido não está claro o suficiente para ser implementado.',
}

const parts = [messages[outcome] ?? messages.error]
if (outcome === 'blocked' && result.blockReason) parts.push(BLOCK_LABELS[result.blockReason])
if (result.summary && outcome !== 'pr') parts.push(result.summary)
if (runUrl) parts.push(`Run log: ${runUrl}`)

await addComment(key, parts.join('\n\n'))
console.log(`Commented on ${key}: ${outcome}`)

// A PR waits for review; anything else (blocked, failed checks, no changes, error) is an agent failure.
await tryMoveToStatus(
  key,
  outcome === 'pr'
    ? process.env.JIRA_REVIEW_STATUS || 'Revisão'
    : process.env.JIRA_FAILURE_STATUS || 'Falha no agente',
)
