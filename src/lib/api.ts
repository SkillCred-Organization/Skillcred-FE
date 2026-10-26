import { apiClient } from "./apiClient";
import { timeAgo } from "./format";
import type {
  Institution,
  LearnerProfile,
  NewProject,
  OnboardingData,
  Project,
  Status,
  ProjectDetail,
  Activity,
  Dashboard,
  DashboardStat,
  PublicItem,
  PublicProfile,
  ShareSettings,
  SkillItem,
  LearnerItem,
  NewLearnerItem,
} from "../types";
import type { Claim } from "../types";
import { buildDetails } from "./projectFields";


// ---------- Profile and onboarding ----------

type InstitutionsResponse = {
  institutions: { id?: string; _id?: string; name: string }[];
};

export async function searchInstitutions(
  query: string,
): Promise<Institution[]> {
  const data = await apiClient<InstitutionsResponse>(
    `/api/learner/institutions?q=${encodeURIComponent(query.trim())}`,
  );
  // The backend's field is `id`. `_id` stays as a fallback for an older server.
  return data.institutions.map((i) => ({
    id: String(i.id ?? i._id ?? ""),
    name: i.name,
  }));
}

// The only keys PATCH /api/learner/profile accepts. Any extra key returns a 400.
type ProfilePayload = {
  headline?: string;
  location?: string;
  skills?: string[];
  institution?: {
    name: string;
    institutionId?: string;
    programme?: string;
    cohort?: string;
  };
};

export function buildProfilePayload(data: OnboardingData): ProfilePayload {
  const payload: ProfilePayload = {};
  if (data.headline.trim()) payload.headline = data.headline.trim();
  if (data.location.trim()) payload.location = data.location.trim();
  if (data.skills.length) payload.skills = data.skills;

  if (data.institution?.name) {
    const institution: NonNullable<ProfilePayload["institution"]> = {
      name: data.institution.name,
    };
    if (data.institution.id) institution.institutionId = data.institution.id;
    if (data.programme) institution.programme = data.programme;
    if (data.year) institution.cohort = data.year; // ASSUMPTION: year goes into cohort
    payload.institution = institution;
  }
  return payload;
}

export async function saveOnboarding(data: OnboardingData): Promise<void> {
  const payload = buildProfilePayload(data);
  if (Object.keys(payload).length === 0) return; // the learner skipped everything, so there's nothing to send
  await apiClient("/api/learner/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// GET /api/learner/profile gives { profile: {...} }, or { profile: null } for a learner with no profile yet
export function getProfile() {
  return apiClient<{ profile: LearnerProfile | null }>("/api/learner/profile");
}

// ---------- Projects ----------

type ApiProject = {
  id?: string;
  _id?: string;
  title: string;
  summary?: string;
  status: string;
  role?: string;
  track?: string;
  startDate?: string;
  endDate?: string;
  proofLink?: string;
  details?: Record<string, unknown>;
  teammates?: { name?: string; email?: string; role?: string }[];
  decision?: { reason?: string; messageToLearner?: string };
  actions?: {
    edit?: boolean;
    requestVerification?: boolean;
    withdraw?: boolean;
    delete?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

const knownStatuses: Status[] = [
  "verified",
  "team-confirmed",
  "pending",
  "needs-changes",
  "self-reported",
  "draft",
];

// One short line under each project, built from what the backend sends
function projectMeta(p: ApiProject, status: Status) {
  const when = timeAgo(p.updatedAt ?? p.createdAt);
  const suffix = when ? ` · ${when}` : "";
  switch (status) {
    case "verified":
      return `Verified${suffix}`;
    case "pending":
      return `Sent for verification${suffix}`;
       case 'needs-changes':
      return `Changes requested${p.decision?.reason ? `: ${p.decision.reason}` : ''}${suffix}`
    case "team-confirmed":
      return `Confirmed by teammates${suffix}`;
    case "draft":
      return "Draft · only you can see it";
    default:
      return p.teammates?.length ? "Team project" : "Personal project";
  }
}

// This is the only place that knows the backend's shape. If a field name differs, fix it here.
function toProject(p: ApiProject): Project {
  const status = knownStatuses.includes(p.status as Status)
    ? (p.status as Status)
    : "self-reported";
  return {
    id: String(p.id ?? p._id ?? ""),
    title: p.title,
    summary: p.summary ?? "",
    status,
    meta: projectMeta(p, status),
    actions: {
      edit: p.actions?.edit ?? false,
      requestVerification: p.actions?.requestVerification ?? false,
      withdraw: p.actions?.withdraw ?? false,
      delete: p.actions?.delete ?? false,
    },
  };
}

// Empty values are left out: the backend rejects unknown fields and invalid empty ones.
function clean(object: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== "" && value !== undefined,
    ),
  );
}

function buildProjectFields(
  input: Omit<NewProject, "status">,
  isDraft = false,
) {
  // Fields from later steps don't exist yet when a draft is saved early, so read every text safely
  const text = (value?: string) => (value ?? "").trim();
  const details = buildDetails(input.track ?? "", input.details);
  return clean({
    title: text(input.title) || (isDraft ? "Untitled project" : ""),
    summary: text(input.summary),
    role: text(input.role),
    track: input.track || undefined,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    proofLink: text(input.link),
    teammates: input.teammates?.length
      ? input.teammates.map((t) =>
          clean({ email: t.email, name: t.name, role: t.role }),
        )
      : undefined,
    details: Object.keys(details).length ? details : undefined,
  });
}

export function buildProjectPayload(input: NewProject) {
  const isDraft = input.status === "draft";
  const send = input.status === "pending";
  return {
    ...buildProjectFields(input, isDraft),
    ...(isDraft ? { draft: true } : {}),
    ...(send
      ? {
          requestVerification: true,
          ...(input.institutionId
            ? { institutionId: input.institutionId }
            : {}),
        }
      : {}),
  };
}

export async function getProjects(): Promise<Project[]> {
  const data = await apiClient<{ items: ApiProject[] }>(
    "/api/learner/projects",
  );
  return data.items.map(toProject);
}

export async function addProject(input: NewProject): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>("/api/learner/projects", {
    method: "POST",
    body: JSON.stringify(buildProjectPayload(input)),
  });
  return toProject(data.item);
}

export async function updateProject(
  id: string,
  input: Omit<NewProject, "status">,
  publish?: { requestVerification: boolean; institutionId?: string },
): Promise<Project> {
  const body = {
    ...buildProjectFields(input),
    // Finishing a draft: it stops being a draft, and is sent only if the learner asked for that
    ...(publish
      ? {
          draft: false,
          ...(publish.requestVerification
            ? {
                requestVerification: true,
                ...(publish.institutionId
                  ? { institutionId: publish.institutionId }
                  : {}),
              }
            : {}),
        }
      : {}),
  };
  const data = await apiClient<{ item: ApiProject }>(
    `/api/learner/projects/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return toProject(data.item);
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient(`/api/learner/projects/${id}`, {
    method: "DELETE",
  });
}

export async function requestVerification(
  id: string,
  institutionId?: string,
): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>(
    `/api/learner/projects/${id}/request-verification`,
    {
      method: "POST",
      body: JSON.stringify(institutionId ? { institutionId } : {}),
    },
  );
  return toProject(data.item);
}

function detailText(value: unknown): string {
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === "string").join(", ");
  return typeof value === "string" ? value : "";
}

function detailsToText(
  details?: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(details ?? {})) {
    const text = detailText(value);
    if (text) out[key] = text;
  }
  return out;
}

function toProjectDetail(p: ApiProject): ProjectDetail {
  const hasDecision = p.decision?.reason || p.decision?.messageToLearner;
  const rawStack = p.details?.techStack;
  return {
    ...toProject(p),
    role: p.role ?? "",
    track: p.track ?? "",
    projectType: detailText(p.details?.projectType),
    startDate: p.startDate ?? "",
    endDate: p.endDate ?? "",
    proofLink: p.proofLink ?? "",
    techStack: Array.isArray(rawStack)
      ? rawStack.filter((t): t is string => typeof t === "string")
      : [],
    details: detailsToText(p.details),
    teammates: (p.teammates ?? []).map((t) => ({
      name: t.name ?? "",
      email: t.email ?? "",
      role: t.role ?? "",
    })),
    decision: hasDecision
      ? {
          reason: p.decision?.reason ?? "",
          message: p.decision?.messageToLearner ?? "",
        }
      : undefined,
  };
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const data = await apiClient<{ item: ApiProject }>(
    `/api/learner/projects/${id}`,
  );
  return toProjectDetail(data.item);
}

export async function withdrawRequest(id: string): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>(
    `/api/learner/projects/${id}/withdraw`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
  return toProject(data.item);
}

// ---------- Dashboard ----------

type ApiStat = { total?: number; verified?: number };
type ApiActivity = {
  claimId?: string;
  claimTitle?: string;
  action?: string;
  label?: string;
  at?: string;
};
type ApiDashboard = {
  stats?: {
    projects?: ApiStat;
    certifications?: ApiStat;
    skills?: ApiStat;
    achievements?: ApiStat;
    drafts?: number;
  };
  banner?: { verified?: number; waiting?: number; needsChanges?: number };
  recentActivity?: ApiActivity[];
};

function toStat(s?: ApiStat): DashboardStat {
  return { total: s?.total ?? 0, verified: s?.verified ?? 0 };
}

function activityKind(action = ""): Activity["kind"] {
  const a = action.toLowerCase().replace(/[_-]/g, " ");
  if (/verified|approved/.test(a)) return "verified";
  if (/change/.test(a)) return "needs-changes";
  if (/confirm/.test(a)) return "confirmed";
  if (/draft/.test(a)) return "draft";
  return "info";
}

export async function getDashboard(): Promise<Dashboard> {
  const data = await apiClient<ApiDashboard>("/api/learner/dashboard");
  return {
    stats: {
      projects: toStat(data.stats?.projects),
      certifications: toStat(data.stats?.certifications),
      skills: toStat(data.stats?.skills),
      achievements: toStat(data.stats?.achievements),
    },
    banner: {
      verified: data.banner?.verified ?? 0,
      waiting: data.banner?.waiting ?? 0,
      needsChanges: data.banner?.needsChanges ?? 0,
    },
    drafts: data.stats?.drafts ?? 0,
    activity: (data.recentActivity ?? []).map((a, i) => ({
      id: `${a.claimId ?? "event"}-${i}`,
      kind: activityKind(a.action),
      text:
        a.claimTitle && a.label
          ? `${a.claimTitle}: ${a.label}`
          : (a.label ?? a.claimTitle ?? "Activity on your profile"),
      time: timeAgo(a.at),
    })),
  };
}

// ---------- Verification (all my claims) ----------

type ApiClaim = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  type?: string;
  kind?: string;
  itemType?: string;
  status?: string;
  projectId?: string;
  itemId?: string;
  refId?: string;
  project?: { id?: string; _id?: string; title?: string };
  updatedAt?: string;
  createdAt?: string;
};

// The only place that knows the claims' backend shape. A wrong field name is fixed here.
export async function getClaims(): Promise<Claim[]> {
  const data = await apiClient<{ items?: ApiClaim[] }>("/api/learner/claims");
  return (data.items ?? []).map((c, i) => {
    const type = (c.type ?? c.kind ?? c.itemType ?? "").toLowerCase();
    const isProject = type.includes("project");
    const status = knownStatuses.includes(c.status as Status)
      ? (c.status as Status)
      : "self-reported";
    const linkId =
      c.projectId ??
      c.itemId ??
      c.refId ??
      c.project?.id ??
      c.project?._id ??
      c.id ??
      c._id;
    return {
      id: String(c.id ?? c._id ?? i),
      title: c.title ?? c.name ?? c.project?.title ?? "Untitled",
      kind: type ? type.charAt(0).toUpperCase() + type.slice(1) : "Item",
      status,
      updated: timeAgo(c.updatedAt ?? c.createdAt),
      projectId: isProject && linkId ? String(linkId) : null,
    };
  });
}

// ---------- Sharing and public profile ----------

type ApiShare = { isPublic?: boolean; showPendingAndSelfReported?: boolean; showEmail?: boolean }

export async function getShareSettings(): Promise<ShareSettings> {
  const raw = await apiClient<ApiShare & { settings?: ApiShare }>('/api/learner/share-settings')
  const s = raw.settings ?? raw
  return {
    isPublic: Boolean(s.isPublic),
    showPendingAndSelfReported: Boolean(s.showPendingAndSelfReported),
    showEmail: Boolean(s.showEmail),
  }
}

export async function saveShareSettings(change: Partial<ShareSettings>): Promise<void> {
  await apiClient('/api/learner/share-settings', { method: 'PATCH', body: JSON.stringify(change) })
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const data = await apiClient<{ available?: boolean }>(
    `/api/learner/handle-available?handle=${encodeURIComponent(handle)}`,
  )
  return Boolean(data.available)
}

export async function saveHandle(handle: string): Promise<void> {
  await apiClient('/api/learner/profile', { method: 'PATCH', body: JSON.stringify({ handle }) })
}

type ApiPublicItem = {
  id?: string
  _id?: string
  title?: string
  name?: string
  summary?: string
  description?: string
  status?: string
  verifiedBy?: string | { name?: string; institutionName?: string }
}

type ApiPublicProfile = {
  fullName?: string
  handle?: string
  headline?: string
  location?: string
  bio?: string
  email?: string
  institution?: string | { name?: string; programme?: string } | null
  projects?: ApiPublicItem[]
  certifications?: ApiPublicItem[]
  achievements?: ApiPublicItem[]
  skills?: (string | { name?: string; verified?: boolean })[]
  stats?: { verified?: number; total?: number }
}

function toPublicItem(p: ApiPublicItem, i: number): PublicItem {
  const status = knownStatuses.includes(p.status as Status) ? (p.status as Status) : 'self-reported'
  const by = typeof p.verifiedBy === 'string' ? p.verifiedBy : (p.verifiedBy?.name ?? p.verifiedBy?.institutionName ?? '')
  return {
    id: String(p.id ?? p._id ?? i),
    title: p.title ?? p.name ?? 'Untitled',
    summary: p.summary ?? p.description ?? '',
    status,
    verifiedBy: by,
  }
}

// The only place that knows the public profile's backend shape. A wrong field name is fixed here.
export async function getPublicProfile(handle: string): Promise<PublicProfile> {
  const data = await apiClient<{ profile: ApiPublicProfile }>(
    `/api/public/profiles/${encodeURIComponent(handle)}`,
    { auth: false },
  )
  const p = data.profile
  const inst = p.institution
  return {
    fullName: p.fullName ?? '',
    handle: p.handle ?? handle,
    headline: p.headline ?? '',
    location: p.location ?? '',
    bio: p.bio ?? '',
    email: p.email ?? '',
    institution: typeof inst === 'string' ? inst : [inst?.name, inst?.programme].filter(Boolean).join(' · '),
    projects: (p.projects ?? []).map(toPublicItem),
    certifications: (p.certifications ?? []).map(toPublicItem),
    achievements: (p.achievements ?? []).map(toPublicItem),
    skills: (p.skills ?? []).map((s) =>
      typeof s === 'string' ? { name: s, verified: false } : { name: s.name ?? '', verified: Boolean(s.verified) },
    ),
    stats: { verified: p.stats?.verified ?? 0, total: p.stats?.total ?? 0 },
  }
}

// ---------- Skills ----------

type ApiDashSkills = { skills?: (string | { name?: string; verified?: boolean })[] }

// The names come from the profile; which ones are verified comes from the dashboard.
export async function getSkills(): Promise<SkillItem[]> {
  const [{ profile }, dash] = await Promise.all([
    getProfile(),
    apiClient<ApiDashSkills>('/api/learner/dashboard').catch((): ApiDashSkills => ({})),
  ])
  const verified = new Set(
    (dash.skills ?? [])
      .map((s) => (typeof s === 'string' ? null : s))
      .filter((s): s is { name?: string; verified?: boolean } => s !== null && Boolean(s.verified))
      .map((s) => (s.name ?? '').toLowerCase()),
  )
  const raw: unknown[] = profile?.skills ?? []
  const names = raw
    .map((s) => (typeof s === 'string' ? s : ((s as { name?: string }).name ?? '')))
    .filter(Boolean)
  return names.map((name) => ({ name, verified: verified.has(name.toLowerCase()) }))
}

// Replaces the whole list, so always pass every skill the learner should have.
export async function saveSkills(skills: string[]): Promise<void> {
  await apiClient('/api/learner/profile', { method: 'PATCH', body: JSON.stringify({ skills }) })
}

// ---------- Certifications and achievements (same calls as projects, different path) ----------

export type ItemKind = 'certifications' | 'achievements'

function toItem(p: ApiProject): LearnerItem {
  const status = knownStatuses.includes(p.status as Status) ? (p.status as Status) : 'self-reported'
  const hasDecision = p.decision?.reason || p.decision?.messageToLearner
  return {
    id: String(p.id ?? p._id ?? ''),
    title: p.title,
    issuer: p.summary ?? '',
    date: p.startDate ?? '',
    link: p.proofLink ?? '',
    status,
    actions: {
      edit: p.actions?.edit ?? false,
      requestVerification: p.actions?.requestVerification ?? false,
      withdraw: p.actions?.withdraw ?? false,
      delete: p.actions?.delete ?? false,
    },
    decision: hasDecision ? { reason: p.decision?.reason ?? '', message: p.decision?.messageToLearner ?? '' } : undefined,
  }
}

function itemBody(input: NewLearnerItem) {
  return clean({
    title: input.title.trim(),
    summary: input.issuer.trim(),
    startDate: input.date || undefined,
    proofLink: input.link.trim(),
  })
}

const itemPath = (kind: ItemKind) => `/api/learner/${kind}`

export async function getItems(kind: ItemKind): Promise<LearnerItem[]> {
  const data = await apiClient<{ items: ApiProject[] }>(itemPath(kind))
  return data.items.map(toItem)
}

export async function addItem(kind: ItemKind, input: NewLearnerItem): Promise<LearnerItem> {
  const data = await apiClient<{ item: ApiProject }>(itemPath(kind), { method: 'POST', body: JSON.stringify(itemBody(input)) })
  return toItem(data.item)
}

export async function updateItem(kind: ItemKind, id: string, input: NewLearnerItem): Promise<LearnerItem> {
  const data = await apiClient<{ item: ApiProject }>(`${itemPath(kind)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(itemBody(input)),
  })
  return toItem(data.item)
}

export async function requestItemVerification(kind: ItemKind, id: string, institutionId?: string): Promise<LearnerItem> {
  const data = await apiClient<{ item: ApiProject }>(`${itemPath(kind)}/${id}/request-verification`, {
    method: 'POST',
    body: JSON.stringify(institutionId ? { institutionId } : {}),
  })
  return toItem(data.item)
}

export async function withdrawItem(kind: ItemKind, id: string): Promise<LearnerItem> {
  const data = await apiClient<{ item: ApiProject }>(`${itemPath(kind)}/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return toItem(data.item)
}

export async function deleteItem(kind: ItemKind, id: string): Promise<void> {
  await apiClient(`${itemPath(kind)}/${id}`, { method: 'DELETE' })
}

// Adds skills to the learner's profile without losing the ones already there.
export async function addSkillsToProfile(names: string[]): Promise<void> {
  const { profile } = await getProfile()
  const raw: unknown[] = profile?.skills ?? []
  const existing = raw
    .map((s) => (typeof s === 'string' ? s : ((s as { name?: string }).name ?? '')))
    .filter(Boolean)
  const have = new Set(existing.map((s) => s.toLowerCase()))
  const extra = names.filter((n) => !have.has(n.toLowerCase()))
  if (extra.length === 0) return
  await saveSkills([...existing, ...extra].slice(0, 20))
}