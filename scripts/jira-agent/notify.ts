// Posts the run outcome back to the Jira ticket as a comment.
//   ISSUE_KEY=... OUTCOME=pr|blocked|checks-failed|no-changes|error [PR_URL=...] [RESULT_PATH=...] [RUN_URL=...]
//   node scripts/jira-agent/notify.ts
import { existsSync, readFileSync } from 'node:fs'
import { addComment, isIssueKey } from './jira.ts'

const key = process.env.ISSUE_KEY ?? ''
const outcome = process.env.OUTCOME ?? 'error'
const runUrl = process.env.RUN_URL ?? ''
const resultPath = process.env.RESULT_PATH ?? 'agent-result.json'

if (!isIssueKey(key)) {
  console.error(`Invalid ISSUE_KEY "${key}"`)
  process.exit(1)
}

const result = existsSync(resultPath)
  ? (JSON.parse(readFileSync(resultPath, 'utf8')) as { summary?: string })
  : {}

const messages: Record<string, string> = {
  pr: `Agent opened a pull request for review: ${process.env.PR_URL ?? ''}`,
  blocked: 'Agent did not implement this ticket.',
  'checks-failed': 'Agent made changes but lint/build/tests failed, so no PR was opened.',
  'no-changes': 'Agent finished without changing any files, so no PR was opened.',
  error: 'Agent run failed.',
}

const parts = [messages[outcome] ?? messages.error]
if (result.summary && outcome !== 'pr') parts.push(result.summary)
if (runUrl) parts.push(`Run log: ${runUrl}`)

await addComment(key, parts.join('\n\n'))
console.log(`Commented on ${key}: ${outcome}`)
