import { SessionManager, type SessionInfo } from "@earendil-works/pi-coding-agent"
import type { SessionSummary } from "../shared/types"

/** Lists Pi session files for a working directory (`~/.pi/agent/sessions/…`). */
export async function listPiSessions(cwd: string): Promise<SessionSummary[]> {
  const sessions = await SessionManager.list(cwd)
  return sessions
    .map(summarize)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)
}

function summarize(session: SessionInfo): SessionSummary {
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
