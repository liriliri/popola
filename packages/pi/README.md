# popola-pi

Pi coding agent adapter for [`popola-protocol`](../protocol/README.md).

```bash
npm install popola-pi
```

```ts
import { createPiSession, listPiSessions } from "popola-pi"

const session = createPiSession({
  cwd: "/path/to/project",
  model: { provider: "openai", baseUrl: "https://…", apiKey: "…", model: "…" },
  askPermission: true,
})

session.subscribe((event) => {
  /* AgentEvent */
})

await session.prompt("Fix the failing test")
```

`createPiSession` returns a `PiSession` (`AgentSession` plus `sessionFile` and
`initialSnapshot()` for hosts that reopen Pi JSONL chats). `listPiSessions(cwd)`
lists those files under `~/.pi/agent/sessions/…`.
