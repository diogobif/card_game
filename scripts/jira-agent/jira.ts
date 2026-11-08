// Minimal Jira Cloud REST client (basic auth with an API token).
// Uses REST v2 so the description comes back as plain text/wiki markup
// instead of Atlassian Document Format JSON.

export type JiraIssue = {
  key: string
  summary: string
  description: string
  issueType: string
  priority: string
  labels: string[]
  url: string
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

function jiraRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const base = env('JIRA_URL').replace(/\/+$/, '')
  const auth = Buffer.from(`${env('JIRA_EMAIL')}:${env('JIRA_TOKEN')}`).toString('base64')
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

export function isIssueKey(key: string): boolean {
  return /^[A-Z][A-Z0-9_]+-\d+$/.test(key)
}

export async function getIssue(key: string): Promise<JiraIssue> {
  const fields = 'summary,description,issuetype,priority,labels'
  const res = await jiraRequest(`/rest/api/2/issue/${encodeURIComponent(key)}?fields=${fields}`)
  if (!res.ok) throw new Error(`Jira GET ${key} failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    key: string
    fields: {
      summary?: string
      description?: string | null
      issuetype?: { name?: string }
      priority?: { name?: string } | null
      labels?: string[]
    }
  }
  return {
    key: data.key,
    summary: data.fields.summary ?? '',
    description: data.fields.description ?? '',
    issueType: data.fields.issuetype?.name ?? 'Unknown',
    priority: data.fields.priority?.name ?? 'None',
    labels: data.fields.labels ?? [],
    url: `${env('JIRA_URL').replace(/\/+$/, '')}/browse/${data.key}`,
  }
}

export async function addComment(key: string, body: string): Promise<void> {
  const res = await jiraRequest(`/rest/api/2/issue/${encodeURIComponent(key)}/comment`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  if (!res.ok) throw new Error(`Jira comment on ${key} failed: ${res.status} ${await res.text()}`)
}

// "Revisão", "revisao" and "REVISÃO" all match.
function sameName(a: string, b: string): boolean {
  const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
  return norm(a) === norm(b)
}

/**
 * Moves the issue to the status with this name, using whichever workflow
 * transition leads there from its current status. Returns false when it is
 * already in that status.
 */
export async function moveToStatus(key: string, status: string): Promise<boolean> {
  const path = `/rest/api/2/issue/${encodeURIComponent(key)}`
  const issueRes = await jiraRequest(`${path}?fields=status`)
  if (!issueRes.ok) throw new Error(`Jira GET ${key} failed: ${issueRes.status} ${await issueRes.text()}`)
  const issue = (await issueRes.json()) as { fields: { status?: { name?: string } } }
  if (sameName(issue.fields.status?.name ?? '', status)) return false

  const listRes = await jiraRequest(`${path}/transitions`)
  if (!listRes.ok) throw new Error(`Jira transitions of ${key} failed: ${listRes.status} ${await listRes.text()}`)
  const { transitions } = (await listRes.json()) as { transitions: { id: string; name: string; to: { name: string } }[] }
  const transition = transitions.find((t) => sameName(t.to.name, status))
  if (!transition) {
    const available = transitions.map((t) => `"${t.to.name}"`).join(', ') || 'none'
    throw new Error(
      `No transition from "${issue.fields.status?.name}" to "${status}" for ${key}. Available: ${available}`,
    )
  }

  const res = await jiraRequest(`${path}/transitions`, {
    method: 'POST',
    body: JSON.stringify({ transition: { id: transition.id } }),
  })
  if (!res.ok) throw new Error(`Jira transition of ${key} failed: ${res.status} ${await res.text()}`)
  return true
}

/** moveToStatus that never throws: a failed move shows as a warning on the Actions run. */
export async function tryMoveToStatus(key: string, status: string): Promise<void> {
  try {
    const moved = await moveToStatus(key, status)
    console.log(moved ? `Moved ${key} to "${status}"` : `${key} is already in "${status}"`)
  } catch (error) {
    console.log(`::warning::Could not move ${key} to "${status}": ${error instanceof Error ? error.message : String(error)}`)
  }
}
