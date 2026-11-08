// Moves a Jira ticket to a status by name; a failure is only a warning on the run.
//   node scripts/jira-agent/move.ts <ISSUE-KEY> <status>
import { isIssueKey, tryMoveToStatus } from './jira.ts'

const [key = '', status = ''] = process.argv.slice(2)
if (!isIssueKey(key) || !status) {
  console.error('Usage: move.ts <ISSUE-KEY> <status>')
  process.exit(1)
}
await tryMoveToStatus(key, status)
