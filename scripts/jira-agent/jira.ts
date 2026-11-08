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
