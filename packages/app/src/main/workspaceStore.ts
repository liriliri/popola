import { randomUUID } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { titleFromPrompt } from "../shared/types"

const DEFAULT_TITLE = "New chat"

export type StoredProject = {
  /** Absolute working directory. */
  path: string
  /** When true, the project's sessions are hidden in the tree. */
  collapsed: boolean
}

export type StoredSession = {
  id: string
  /** Working directory this chat belongs to. */
  cwd: string
  /** Provider transcript path (Pi JSONL); persistence handle only. */
  path: string
  title: string
  modifiedAt: number
  messageCount: number
}

export type WorkspaceStoreData = {
  /** Active project path (selected in the tree). */
  cwd: string | null
  sessionFile: string | null
  projects: StoredProject[]
  /** Popola-owned catalog — not scanned from the agent. Order is stable. */
  sessions: StoredSession[]
}

const empty: WorkspaceStoreData = {
  cwd: null,
  sessionFile: null,
  projects: [],
  sessions: [],
}

export class WorkspaceStore {
  private data: WorkspaceStoreData = empty

  constructor(private readonly file: string) {}

  get(): WorkspaceStoreData {
    return this.data
  }

  async load(): Promise<void> {
    let raw: string
    try {
      raw = await readFile(this.file, "utf8")
    } catch {
      this.data = empty
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      this.data = empty
      return
    }
    this.data = parse(parsed) ?? empty
  }

  /**
   * Point New task at a folder. The project only enters the tree once a chat
   * is created under it (`upsertSession`).
   */
  async addProject(cwd: string): Promise<WorkspaceStoreData> {
    const normalized = path.resolve(cwd)
    this.data = {
      ...this.data,
      cwd: normalized,
      sessionFile: null,
    }
    await this.save()
    return this.data
  }

  /** Select an existing project as active. Clears the open chat. */
  async selectProject(cwd: string): Promise<WorkspaceStoreData> {
    return this.setActiveProject(cwd, { clearSession: true })
  }

  /** Switch active project without clearing the session pointer (used before open). */
  async activateProject(cwd: string): Promise<WorkspaceStoreData> {
    return this.setActiveProject(cwd, { clearSession: false })
  }

  private async setActiveProject(
    cwd: string,
    options: { clearSession: boolean },
  ): Promise<WorkspaceStoreData> {
    const normalized = path.resolve(cwd)
    this.data = {
      ...this.data,
      cwd: normalized,
      sessionFile: options.clearSession ? null : this.data.sessionFile,
      projects: this.data.projects.map((project) =>
        project.path === normalized ? { ...project, collapsed: false } : project,
      ),
    }
    await this.save()
    return this.data
  }

  async setCollapsed(cwd: string, collapsed: boolean): Promise<WorkspaceStoreData> {
    const normalized = path.resolve(cwd)
    const projects = this.data.projects.map((project) =>
      project.path === normalized ? { ...project, collapsed } : project,
    )
    if (!projects.some((project) => project.path === normalized)) {
      return this.data
    }
    this.data = { ...this.data, projects }
    await this.save()
    return this.data
  }

  async setSession(sessionFile: string | null): Promise<WorkspaceStoreData> {
    this.data = { ...this.data, sessionFile }
    await this.save()
    return this.data
  }

  /**
   * Register or refresh a chat. Keyed by transcript `path`.
   * Selecting/opening updates in place; `touch: true` (e.g. a prompt) bumps
   * `modifiedAt` and moves the row to the front of its project.
   */
  async upsertSession(input: {
    path: string
    cwd: string
    title?: string
    messageCount?: number
    modifiedAt?: number
    touch?: boolean
  }): Promise<StoredSession> {
    const cwd = path.resolve(input.cwd)
    const existing = this.data.sessions.find((session) => session.path === input.path)
    const isNew = !existing
    const touch = isNew || input.touch === true
    const nextTitle =
      input.title && (!existing || isDefaultTitle(existing.title))
        ? titleFromPrompt(input.title)
        : (existing?.title ?? (input.title ? titleFromPrompt(input.title) : DEFAULT_TITLE))
    const entry: StoredSession = {
      id: existing?.id ?? randomUUID(),
      cwd,
      path: input.path,
      title: nextTitle || DEFAULT_TITLE,
      modifiedAt: touch
        ? (input.modifiedAt ?? Date.now())
        : (existing?.modifiedAt ?? input.modifiedAt ?? Date.now()),
      messageCount: input.messageCount ?? existing?.messageCount ?? 0,
    }
    const projects = upsertProject(this.data.projects, cwd)
    this.data = {
      ...this.data,
      projects,
      sessions: nextSessionList(this.data.sessions, entry, { isNew, touch }),
    }
    await this.save()
    return entry
  }

  async deleteSession(sessionFile: string): Promise<StoredSession | null> {
    const existing = this.findSession(sessionFile)
    if (!existing) return null
    // Keep the project row even when its last chat is archived.
    this.data = {
      ...this.data,
      sessions: this.data.sessions.filter((session) => session.path !== sessionFile),
      sessionFile: this.data.sessionFile === sessionFile ? null : this.data.sessionFile,
    }
    await this.save()
    return existing
  }

  /** Drop a project and all of its catalog chats from the sidebar. */
  async removeProject(cwd: string): Promise<boolean> {
    const normalized = path.resolve(cwd)
    if (!this.data.projects.some((project) => project.path === normalized)) return false
    const sessions = this.data.sessions.filter((session) => session.cwd !== normalized)
    const projects = this.data.projects.filter((project) => project.path !== normalized)
    const open = this.data.sessionFile
      ? this.data.sessions.find((session) => session.path === this.data.sessionFile)
      : null
    // Clear drafts (sessionFile set but not yet cataloged) when the active cwd goes away.
    const clearSession =
      this.data.cwd === normalized || open?.cwd === normalized
    this.data = {
      ...this.data,
      projects,
      sessions,
      sessionFile: clearSession ? null : this.data.sessionFile,
      cwd: this.data.cwd === normalized ? (projects[0]?.path ?? null) : this.data.cwd,
    }
    await this.save()
    return true
  }

  /** Sessions for a working directory — catalog order. */
  sessionsFor(cwd: string | null): StoredSession[] {
    if (!cwd) return []
    const normalized = path.resolve(cwd)
    return this.data.sessions.filter((session) => session.cwd === normalized)
  }

  findSession(sessionFile: string): StoredSession | null {
    return this.data.sessions.find((session) => session.path === sessionFile) ?? null
  }

  private async save(): Promise<void> {
    await writeFile(this.file, JSON.stringify(this.data, null, 2), { mode: 0o600 })
  }
}

function nextSessionList(
  sessions: StoredSession[],
  entry: StoredSession,
  options: { isNew: boolean; touch: boolean },
): StoredSession[] {
  const without = sessions.filter((session) => session.path !== entry.path)
  if (options.isNew || options.touch) return [entry, ...without]
  const index = sessions.findIndex((session) => session.path === entry.path)
  if (index < 0) return [entry, ...without]
  const next = sessions.slice()
  next[index] = entry
  return next
}

function isDefaultTitle(title: string): boolean {
  return !title.trim() || title === DEFAULT_TITLE
}

/** Insert a project at the front if missing; otherwise leave order alone. */
function upsertProject(projects: StoredProject[], cwd: string): StoredProject[] {
  if (projects.some((project) => project.path === cwd)) return projects
  return [{ path: cwd, collapsed: false }, ...projects]
}

function parse(input: unknown): WorkspaceStoreData | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const cwd = typeof record.cwd === "string" ? record.cwd : null
  const sessionFile = typeof record.sessionFile === "string" ? record.sessionFile : null
  const sessions = Array.isArray(record.sessions)
    ? record.sessions
        .map(parseSession)
        .filter((session): session is StoredSession => session !== null)
    : []

  let projects: StoredProject[] = []
  if (Array.isArray(record.projects)) {
    projects = record.projects
      .map(parseProject)
      .filter((project): project is StoredProject => project !== null)
  } else if (Array.isArray(record.recent)) {
    const seen = new Set<string>()
    for (const entry of record.recent) {
      if (typeof entry !== "string" || !entry.trim()) continue
      const normalized = path.resolve(entry)
      if (seen.has(normalized)) continue
      seen.add(normalized)
      projects.push({ path: normalized, collapsed: false })
    }
  }

  if (cwd) {
    const normalized = path.resolve(cwd)
    if (!projects.some((project) => project.path === normalized)) {
      projects = [{ path: normalized, collapsed: false }, ...projects]
    }
  }

  for (const session of sessions) {
    if (!projects.some((project) => project.path === session.cwd)) {
      projects.push({ path: session.cwd, collapsed: false })
    }
  }

  return { cwd, sessionFile, projects, sessions }
}

function parseProject(input: unknown): StoredProject | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const projectPath = typeof record.path === "string" ? record.path.trim() : ""
  if (!projectPath) return null
  return {
    path: path.resolve(projectPath),
    collapsed: record.collapsed === true,
  }
}

function parseSession(input: unknown): StoredSession | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const id = typeof record.id === "string" ? record.id : ""
  const cwd = typeof record.cwd === "string" ? record.cwd : ""
  const sessionPath = typeof record.path === "string" ? record.path : ""
  const title = typeof record.title === "string" ? record.title.trim() : ""
  const modifiedAt =
    typeof record.modifiedAt === "number" && Number.isFinite(record.modifiedAt)
      ? record.modifiedAt
      : 0
  const messageCount =
    typeof record.messageCount === "number" && Number.isFinite(record.messageCount)
      ? Math.max(0, Math.floor(record.messageCount))
      : 0
  if (!id || !cwd || !sessionPath) return null
  return {
    id,
    cwd: path.resolve(cwd),
    path: sessionPath,
    title: title || DEFAULT_TITLE,
    modifiedAt,
    messageCount,
  }
}
