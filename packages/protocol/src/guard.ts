/** Runtime validation for the event set, for trust boundaries such as IPC. */

import type { AgentEvent } from "./events"

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown): value is string {
  return typeof value === "string"
}

function list(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Boundary check, not a schema: rejects the wrong shape and leaves deep
 * payload validation to the reducer.
 */
export function isAgentEvent(value: unknown): value is AgentEvent {
  const event = record(value)
  if (!event) return false

  switch (event["type"]) {
    case "session.snapshot": {
      const snapshot = record(event["snapshot"])
      return (
        !!snapshot &&
        text(snapshot["status"]) &&
        list(snapshot["messages"]) &&
        list(snapshot["permissions"])
      )
    }
    case "session.started":
      return text(event["sessionID"]) && text(event["provider"])
    case "turn.started":
    case "turn.completed":
    case "turn.canceled":
      return text(event["turnID"])
    case "turn.failed":
      return text(event["turnID"]) && text(event["error"])
    case "message.started": {
      const message = record(event["message"])
      return !!message && text(message["id"]) && text(message["role"]) && list(message["parts"])
    }
    case "message.part": {
      const part = record(event["part"])
      return text(event["messageID"]) && !!part && text(part["id"]) && text(part["type"])
    }
    case "message.removed":
      return text(event["messageID"])
    case "permission.requested": {
      const request = record(event["request"])
      return !!request && text(request["id"]) && text(request["action"])
    }
    case "permission.resolved":
      return text(event["id"])
    case "usage":
      return !!record(event["usage"])
    case "plan":
      return list(event["entries"])
    case "model.changed":
      return text(event["model"])
    case "mode.changed":
      return event["modeID"] === null || text(event["modeID"])
    default:
      return false
  }
}
