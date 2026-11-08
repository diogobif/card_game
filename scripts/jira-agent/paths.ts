// Which files the agent may touch. Ticket text is untrusted input, so the agent
// can't change CI, deploy config, dependencies, build config (Vite config runs
// as code during the build) or its own source.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const ROOT = process.cwd()

const NO_READ = [/^\.git(\/|$)/, /^node_modules(\/|$)/, /(^|\/)\.env/]
const NO_WRITE = [
  ...NO_READ,
  /^\.github(\/|$)/,
  /^deploy(\/|$)/,
  /^scripts\/jira-agent(\/|$)/,
  /^dist(\/|$)/,
  /^Dockerfile$/,
  /^\.dockerignore$/,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^vite\.config\.ts$/,
  /^tsconfig[^/]*\.json$/,
  /^\.oxlintrc\.json$/,
]

/** Repo-relative POSIX path, or throws if it escapes the repo. */
export function toRepoPath(input: string): string {
  const abs = path.resolve(ROOT, input)
  const rel = path.relative(ROOT, abs).split(path.sep).join('/')
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path outside the repo: ${input}`)
  return rel
}

export function canRead(rel: string): boolean {
  return !NO_READ.some((re) => re.test(rel))
}

export function canWrite(rel: string): boolean {
  return rel !== '' && !NO_WRITE.some((re) => re.test(rel))
}

/** Files changed in the working tree (tracked and untracked). */
export function changedFiles(): string[] {
  const run = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '-z'], { encoding: 'utf8' })
  if (run.status !== 0) throw new Error(`git status failed: ${run.stderr}`)
  const entries = run.stdout.split('\0').filter(Boolean)
  const files: string[] = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    files.push(entry.slice(3))
    // Renames list the original path as a separate entry; check it too.
    if (entry[0] === 'R' || entry[0] === 'C') files.push(entries[++i])
  }
  return files
}

// CLI: fail if the working tree touches a protected path (run by the workflow).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = changedFiles()
  const blocked = files.filter((f) => !canWrite(f))
  if (blocked.length) {
    console.error(`Protected files changed:\n${blocked.join('\n')}`)
    process.exit(1)
  }
  console.log(files.length ? `Changed files:\n${files.join('\n')}` : 'No changes.')
}
