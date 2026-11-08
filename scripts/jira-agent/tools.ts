// Tools the agent can call. Every path goes through paths.ts; the only commands
// it can run are git ls-files / git grep (read-only) and the fixed quality gate.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { tool } from 'langchain'
import { z } from 'zod'
import { formatResults, runChecks } from './checks.ts'
import { ROOT, canRead, canWrite, toRepoPath } from './paths.ts'

export type AgentResult = {
  status: 'done' | 'blocked'
  prTitle: string
  summary: string
  checksPassed: boolean
}

const MAX_LINES = 400

function git(args: string[]): string {
  const run = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  // git grep exits 1 when nothing matches.
  if (run.status !== 0 && run.status !== 1) throw new Error(run.stderr || `git ${args[0]} failed`)
  return run.stdout
}

function readable(input: string): string {
  const rel = toRepoPath(input)
  if (!canRead(rel)) throw new Error(`Not allowed to read ${rel}`)
  return rel
}

function writable(input: string): string {
  const rel = toRepoPath(input)
  if (!canWrite(rel)) throw new Error(`${rel} is protected; the agent may not change it`)
  return rel
}

export function createTools(state: { result?: AgentResult; checksPassed: boolean }) {
  const listFiles = tool(
    ({ dir }) => {
      const rel = dir ? readable(dir) : '.'
      const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '--', rel])
        .split('\n')
        .filter((f) => f && canRead(f))
      return files.length ? files.join('\n') : '(no files)'
    },
    {
      name: 'list_files',
      description: 'List files in the repo (git-tracked and new, ignoring .gitignore), optionally under a directory.',
      schema: z.object({ dir: z.string().optional().describe('Directory relative to the repo root, e.g. "server"') }),
    },
  )

  const readFile = tool(
    ({ file, offset, limit }) => {
      const rel = readable(file)
      const lines = readFileSync(path.join(ROOT, rel), 'utf8').split('\n')
      const start = Math.max(1, offset ?? 1)
      const end = Math.min(lines.length, start - 1 + (limit ?? MAX_LINES))
      const body = lines
        .slice(start - 1, end)
        .map((line, i) => `${start + i}\t${line}`)
        .join('\n')
      const more = end < lines.length ? `\n…(${lines.length - end} more lines; use offset=${end + 1})` : ''
      return body + more
    },
    {
      name: 'read_file',
      description: `Read a file with line numbers. Returns at most ${MAX_LINES} lines per call; use offset/limit for more.`,
      schema: z.object({
        file: z.string().describe('Path relative to the repo root'),
        offset: z.number().int().optional().describe('1-based first line'),
        limit: z.number().int().optional().describe('Number of lines'),
      }),
    },
  )

  const searchCode = tool(
    ({ pattern, dir }) => {
      const args = ['grep', '-n', '-I', '-E', '--untracked', '-e', pattern]
      if (dir) args.push('--', readable(dir))
      const out = git(args)
        .split('\n')
        .filter((l) => l && canRead(l.split(':')[0]))
      if (!out.length) return 'No matches.'
      return out.length > 200 ? `${out.slice(0, 200).join('\n')}\n…(${out.length - 200} more matches)` : out.join('\n')
    },
    {
      name: 'search_code',
      description: 'Search file contents with an extended regular expression (git grep -E). Returns file:line:text.',
      schema: z.object({
        pattern: z.string().describe('Extended regex'),
        dir: z.string().optional().describe('Limit the search to this directory or file'),
      }),
    },
  )

  const writeFile = tool(
    ({ file, content }) => {
      const rel = writable(file)
      const abs = path.join(ROOT, rel)
      mkdirSync(path.dirname(abs), { recursive: true })
      writeFileSync(abs, content)
      state.checksPassed = false
      return `Wrote ${rel}`
    },
    {
      name: 'write_file',
      description: 'Create a file or replace its whole content. Prefer edit_file for changes to existing files.',
      schema: z.object({ file: z.string(), content: z.string() }),
    },
  )

  const editFile = tool(
    ({ file, old_string, new_string }) => {
      const rel = writable(file)
      const abs = path.join(ROOT, rel)
      const text = readFileSync(abs, 'utf8')
      const count = text.split(old_string).length - 1
      if (count !== 1) throw new Error(`old_string must match exactly once in ${rel}; found ${count} matches`)
      writeFileSync(abs, text.replace(old_string, () => new_string))
      state.checksPassed = false
      return `Edited ${rel}`
    },
    {
      name: 'edit_file',
      description:
        'Replace one exact snippet in a file. old_string must appear exactly once (include surrounding lines to make it unique).',
      schema: z.object({ file: z.string(), old_string: z.string(), new_string: z.string() }),
    },
  )

  const deleteFile = tool(
    ({ file }) => {
      const rel = writable(file)
      const abs = path.join(ROOT, rel)
      if (!existsSync(abs)) throw new Error(`${rel} does not exist`)
      rmSync(abs)
      state.checksPassed = false
      return `Deleted ${rel}`
    },
    {
      name: 'delete_file',
      description: 'Delete a file.',
      schema: z.object({ file: z.string() }),
    },
  )

  const checks = tool(
    () => {
      const results = runChecks()
      state.checksPassed = results.every((r) => r.ok)
      return `${state.checksPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}\n\n${formatResults(results)}`
    },
    {
      name: 'run_checks',
      description: 'Run the quality gate: pnpm lint, pnpm build (tsc -b + vite build) and pnpm test when it exists. Takes a minute or two.',
      schema: z.object({}),
    },
  )

  const finish = tool(
    ({ status, pr_title, summary }) => {
      if (status === 'done' && !state.checksPassed) {
        throw new Error('Checks have not passed since your last edit. Call run_checks and fix any failure first.')
      }
      state.result = { status, prTitle: pr_title, summary, checksPassed: state.checksPassed }
      return 'Recorded. Stop now.'
    },
    {
      name: 'finish',
      description:
        'Call exactly once at the end. status "done" when the change is complete and run_checks passed after your last edit; "blocked" when the ticket is unclear, out of scope or needs a protected file.',
      schema: z.object({
        status: z.enum(['done', 'blocked']),
        pr_title: z.string().describe('Short PR title in English, without the ticket key'),
        summary: z
          .string()
          .describe('Markdown for the PR body: what changed and why, files touched, how to test manually. If blocked, explain why.'),
      }),
    },
  )

  return [listFiles, readFile, searchCode, writeFile, editFile, deleteFile, checks, finish]
}
