# popola-protocol

The transport-neutral contract between an agent runtime and the popola UI layer.

```bash
npm install popola-protocol
```

## What it is

Two things:

- **`AgentEvent`** — a closed event set. Every agent adapter maps its own
  protocol onto these variants, so the UI never learns which agent is running.
- **`AgentSession`** — what an adapter implements. **`AgentSessionFactory`** is
  how a host creates one: it takes the host's own config and returns a session,
  so a Node host can spawn a CLI and a browser host can call a model API
  behind the same contract.

Plus the shared data shapes (messages, parts, tool calls, permission requests)
that both the state core and the adapters speak.

## What it is not

It carries no platform API. `cwd`, `spawn` and `process.env` belong to the
factory, so the same contract can be implemented by a Node host that spawns a
CLI and by a browser host that talks to a model API.

The package is isomorphic: no DOM lib, no `node:` imports, and no ambient
globals that differ between the DOM and Node type libraries. Cancellation goes
through `AgentSession.interrupt()` rather than an `AbortSignal` for that reason.

## The events

| event | meaning |
| --- | --- |
| `session.snapshot` | the whole state, for a client that joins mid-run |
| `session.started` | a session opened |
| `turn.started` / `turn.completed` / `turn.failed` / `turn.canceled` | the run lifecycle |
| `message.started` / `message.part` / `message.removed` | the transcript |
| `permission.requested` / `permission.resolved` | approval prompts |
| `usage` / `plan` / `model.changed` / `mode.changed` | what the agent reports |

`message.part` upserts by part id, so a streaming text part replaces its own
earlier version.

`plan`, `model.changed` and `mode.changed` are reserved vocabulary: ACP reports
plans, model switches and mode switches, so the event set already carries them.
No adapter in this repository produces them yet — the pi adapter only reports
`usage`. A host that receives them should treat them as advisory.

## Writing an adapter

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
      emit({ type: "message.started", message: { id: "m1", role: "assistant", parts: [] } })
      emit({
        type: "message.part",
        messageID: "m1",
        part: { id: "m1:text:0", type: "text", text: "Hello" },
      })
      emit({ type: "turn.completed", turnID: "t1" })
    },
    interrupt() {},
    respondToPermission(id, decision) {},
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    close() {},
  }
}
```

## Validating untrusted input

`isAgentEvent` checks the shape at a trust boundary, such as an IPC channel:

```ts
import { isAgentEvent } from "popola-protocol"

if (isAgentEvent(payload)) store.dispatch(payload)
```

It is a boundary check, not a schema: it rejects the wrong shape and leaves
deep payload validation to the reducer that consumes the event.
