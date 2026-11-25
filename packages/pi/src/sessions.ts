import { SessionManager, type SessionInfo } from "@earendil-works/pi-coding-agent"

/** One Pi JSONL session under a working directory. */
export type PiSessionSummary = {
  readonly id: string
  readonly path: string
  readonly title: string
  readonly modifiedAt: number
  readonly messageCount: number
}

/** Lists Pi session files for a working directory (`~/.pi/agent/sessions/…`). */
export async function listPiSessions(cwd: string): Promise<PiSessionSummary[]> {
  const sessions = await SessionManager.list(cwd)
  return sessions
    .map(summarize)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)
}

function summarize(session: SessionInfo): PiSessionSummary {
  const title = session.name?.trim() || firstLine(session.firstMessage) || "Empty chat"
  return {
    id: session.id,
    path: session.path,
    title,
    modifiedAt: session.modified.getTime(),
    messageCount: session.messageCount,
  }
}

function firstLine(text: string): string {
  const line = text.trim().split(/\r?\n/, 1)[0] ?? ""
  return line.length > 80 ? `${line.slice(0, 79)}…` : line
}
