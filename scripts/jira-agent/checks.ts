// The project's quality gate: lint, type-check, production build and, once a
// `test` script exists in package.json, the test suite.
// Used by the agent's run_checks tool and, independently, by the workflow
// before any PR is opened (`node scripts/jira-agent/checks.ts`).
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export type CheckResult = { name: string; ok: boolean; output: string }

const SECRET_ENV = /TOKEN|SECRET|PASSWORD|API_KEY|JIRA|ANTHROPIC|^GH_/i
const MAX_OUTPUT = 6000

// Checks run code from the repo (Vite config, tests), so they never see secrets.
function cleanEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => !SECRET_ENV.test(name)))
}

function checkList(): { name: string; args: string[] }[] {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  const checks = [
    { name: 'lint', args: ['lint'] },
    { name: 'build (tsc -b + vite build)', args: ['build'] },
  ]
  if (pkg.scripts?.test) checks.push({ name: 'test', args: ['test'] })
  return checks
}

function tail(text: string): string {
  return text.length > MAX_OUTPUT ? `…(truncated)\n${text.slice(-MAX_OUTPUT)}` : text
}

export function runChecks(): CheckResult[] {
  return checkList().map(({ name, args }) => {
    const run = spawnSync('pnpm', args, {
      encoding: 'utf8',
      env: cleanEnv(),
      shell: process.platform === 'win32',
      timeout: 10 * 60_000,
    })
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? String(run.error) : ''}`
    return { name, ok: run.status === 0, output: tail(output) }
  })
}

export function formatResults(results: CheckResult[]): string {
  return results
    .map((r) => `## ${r.name}: ${r.ok ? 'PASS' : 'FAIL'}${r.ok ? '' : `\n${r.output}`}`)
    .join('\n\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = runChecks()
  console.log(formatResults(results))
  process.exit(results.every((r) => r.ok) ? 0 : 1)
}
