# popola-protocol

Type-only contract that unifies every agent behind one session interface.
There is no runtime here — adapters implement the types; hosts call them.

```bash
npm install popola-protocol
```

## Mental model

- **`AgentSession`** — the one API. Callers invoke its methods; adapters fill
  them in. Same five methods on both sides: the host calls
  `prompt` / `interrupt` / `respondToPermission`, and listens with `subscribe`
  for each `AgentEvent`.
- **`AgentEvent`** — closed event set the adapter emits. A host maps its own
  agent protocol onto these variants so downstream code never learns which
  agent is running.
- **`AgentSessionFactory`** — how a host creates a session from its own config
  (`cwd`, API keys, spawn options stay in the factory, not in the contract).

Shared shapes (messages, parts, tool calls, permissions) live here too. The
package is isomorphic: no DOM, no `node:` imports. Cancel with
`interrupt()`, not `AbortSignal`.

## Using a session (host)

```ts
import type { AgentSessionFactory } from "popola-protocol"
import { isAgentEvent } from "popola-protocol"

const createSession: AgentSessionFactory<MyConfig> = (config) =>
  new MySession(config)

const session = await createSession({ /* host-owned config */ })

const unsub = session.subscribe((event) => {
  if (!isAgentEvent(event)) return
  // handle the event (update state, forward over IPC, log, …)
})

await session.prompt("Fix the failing test")
session.interrupt()
session.respondToPermission(requestId, "once") // or "always" | "reject"

unsub()
session.close()
```

Swap the factory (pi, codex, an ACP wrapper, …) and the host code above stays
the same.

`isAgentEvent` is a boundary check for untrusted channels (IPC, WebSocket). It
rejects the wrong shape; the consumer still owns deep payload validation.

## Implementing a session (adapter)

```ts
import type { AgentEvent, AgentSession } from "popola-protocol"

export function createSession(): AgentSession {
  const listeners = new Set<(event: AgentEvent) => void>()
  const emit = (event: AgentEvent) => {
    for (const listener of listeners) listener(event)
  }

  return {
    provider: "my-agent",
    async prompt(text) {
      emit({ type: "turn.started", turnID: "t1" })
      emit({
        type: "message.started",
        message: { id: "m1", role: "assistant", parts: [] },
      })
      emit({
        type: "message.part",
        messageID: "m1",
        part: { id: "m1:text:0", type: "text", text: `Echo: ${text}` },
      })
      emit({ type: "turn.completed", turnID: "t1" })
    },
    interrupt() {},
    respondToPermission(_id, _decision) {},
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    close() {},
  }
}
```

Give `"always"` a real meaning: remember the grant for the exact tool and
resource that were shown, and stop asking for that pair.

## Events

| event | meaning |
| --- | --- |
| `session.snapshot` | whole state, for a client that joins mid-run |
| `session.started` | a session opened |
| `turn.started` / `turn.completed` / `turn.failed` / `turn.canceled` | run lifecycle (status is derived from these) |
| `message.started` / `message.part` / `message.removed` | transcript |
| `permission.requested` / `permission.resolved` | approval prompts |
| `usage` / `plan` / `model.changed` / `mode.changed` | what the agent reports |

`message.part` upserts by part id, so a streaming text part replaces its own
earlier version.

`plan`, `model.changed` and `mode.changed` are reserved for ACP. No adapter in
this repository emits them yet — treat them as advisory if you receive them.
