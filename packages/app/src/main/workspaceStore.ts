import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const MAX_RECENT = 12

export type WorkspaceStoreData = {
  cwd: string | null
  sessionFile: string | null
  recent: string[]
}

const empty: WorkspaceStoreData = {
  cwd: null,
  sessionFile: null,
  recent: [],
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
    this.data = parse(JSON.parse(raw) as unknown) ?? empty
  }

  async setCwd(cwd: string): Promise<WorkspaceStoreData> {
    const normalized = path.resolve(cwd)
    this.data = {
      cwd: normalized,
      sessionFile: null,
      recent: pushRecent(this.data.recent, normalized),
    }
    await this.save()
    return this.data
  }

  async setSession(sessionFile: string | null): Promise<WorkspaceStoreData> {
    this.data = { ...this.data, sessionFile }
    await this.save()
    return this.data
  }

  private async save(): Promise<void> {
    await writeFile(this.file, JSON.stringify(this.data, null, 2), { mode: 0o600 })
  }
}

function pushRecent(recent: string[], cwd: string): string[] {
  return [cwd, ...recent.filter((entry) => entry !== cwd)].slice(0, MAX_RECENT)
}

function parse(input: unknown): WorkspaceStoreData | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const cwd = typeof record.cwd === "string" ? record.cwd : null
  const sessionFile = typeof record.sessionFile === "string" ? record.sessionFile : null
  const recent = Array.isArray(record.recent)
    ? record.recent.filter((entry): entry is string => typeof entry === "string")
    : []
  return { cwd, sessionFile, recent }
}
