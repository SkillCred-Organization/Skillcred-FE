export type DetailKey =
  | 'projectType' | 'techStack' | 'whatYouBuilt' | 'testingAndDocs'
  | 'tools' | 'research' | 'outcome' | 'caseStudyUrl'
  | 'dataset' | 'question' | 'keyInsight'
  | 'teamAndMethod' | 'frameworks' | 'roadmapUrl'

export type DetailField = {
  key: DetailKey
  label: string
  kind: 'text' | 'long' | 'list' | 'link'
  placeholder: string
}

export const detailFields: Record<string, DetailField[]> = {
  software_engineering: [
    { key: 'projectType', label: 'Project type', kind: 'text', placeholder: 'e.g. Web API' },
    { key: 'techStack', label: 'Tech stack', kind: 'list', placeholder: 'Node.js, Express, PostgreSQL' },
    { key: 'whatYouBuilt', label: 'What you built', kind: 'long', placeholder: 'e.g. Designed the schema and built the auth endpoints.' },
    { key: 'testingAndDocs', label: 'Testing and docs', kind: 'long', placeholder: 'e.g. Integration tests, OpenAPI docs' },
  ],
  product_design: [
    { key: 'tools', label: 'Tools', kind: 'list', placeholder: 'Figma, Maze' },
    { key: 'research', label: 'Research', kind: 'long', placeholder: 'e.g. 5 usability sessions' },
    { key: 'outcome', label: 'Outcome', kind: 'long', placeholder: 'e.g. Stock check time dropped from 6 to 2 minutes' },
    { key: 'caseStudyUrl', label: 'Case study link', kind: 'link', placeholder: 'https://' },
  ],
  data_analysis: [
    { key: 'dataset', label: 'Dataset', kind: 'text', placeholder: 'e.g. Shop sales, 2024 (50k rows)' },
    { key: 'tools', label: 'Tools', kind: 'list', placeholder: 'Python, pandas, Power BI' },
    { key: 'question', label: 'Question answered', kind: 'long', placeholder: 'What did you set out to find?' },
    { key: 'keyInsight', label: 'Key insight', kind: 'long', placeholder: 'e.g. 3 products drive 40% of sales' },
  ],
  product_management: [
    { key: 'teamAndMethod', label: 'Team and method', kind: 'text', placeholder: 'e.g. 5 people, Scrum, 12 weeks' },
    { key: 'frameworks', label: 'Frameworks', kind: 'list', placeholder: 'User stories, RICE' },
    { key: 'outcome', label: 'Outcome', kind: 'long', placeholder: 'e.g. Reached 100 users in a month' },
    { key: 'roadmapUrl', label: 'Roadmap or board link', kind: 'link', placeholder: 'https://' },
  ],
}

const listKeys: DetailKey[] = ['techStack', 'tools', 'frameworks']

// Turns the form's text boxes into the shape the backend wants, for the chosen track only.
export function buildDetails(track: string, values: Partial<Record<string, string>> = {}) {
  const out: Record<string, string | string[]> = {}
  for (const field of detailFields[track] ?? []) {
    const raw = values[field.key]?.trim()
    if (!raw) continue
    out[field.key] = listKeys.includes(field.key)
      ? raw.split(',').map((item) => item.trim()).filter(Boolean)
      : raw
  }
  return out
}