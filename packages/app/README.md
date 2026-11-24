# popola-app

Private Electron host for trying `popola-ui-react` against a real `pi` coding
agent (read, bash, edit, write tools). Not published.

## Run

```bash
# from the repo root — two terminals
npm run dev -w popola-app    # build main, start Vite on 127.0.0.1:5173
npm run start -w popola-app  # Electron with POPOLA_DEV=1 (waits for Vite)
```

Vite aliases both libs to source, so no prior package build is needed.
`POPOLA_DEV=1` loads the Vite URL and keeps data in `packages/app/.data`;
without it the window loads `dist/renderer/index.html` with the normal
Electron `userData`.

First launch asks for an OpenAI-compatible endpoint (`provider`, `baseUrl`,
`apiKey`, `model`), saved to `<userData>/provider.json` (mode `0600`). After
that, the sidebar requires a working directory before **New chat**. Chats are
Pi JSONL sessions under `~/.pi/agent/sessions/` for that directory (same store
as the Pi CLI). Sidebar **Settings** opens a full-screen appearance / provider
page.

## Approvals

Every tool call raises an approval prompt before it runs, because this app is
the test host for the whole chain. The prompt offers **Allow once**,
**Always allow** and **Reject**. "Always allow" is remembered for the rest of
the session, but only for the exact tool and resource that were shown — a grant
for `ls -la` does not cover `rm -rf build`, and a grant for one file does not
cover another.

## Commands

```bash
npm run dev         # build main, then Vite on :5173
npm run start       # Electron (POPOLA_DEV=1; waits for Vite)
npm run build       # tsc + bundle main/renderer into dist/
npm run typecheck   # main + renderer
npm run clean       # dist, tsbuildinfo, .data
```

## Layout

```
src/
  main/
    index.ts      window, IPC handlers, dev/prod loading
    host.ts       AgentHost: session lifecycle, state mirror, event fan-out
    adapters/
      pi.ts            pi agent → popola-protocol events
  preload.cjs     contextBridge exposing window.popola
  renderer/
    App.tsx          workspace sidebar + settings / chat + PopolaShell
    Sidebar.tsx      directory picker + Pi session list
    SettingsPage.tsx app settings (appearance / provider)
    bridge.ts        typed wrapper around window.popola
  shared/types.ts main/renderer wire contract (HostEvent, ProviderConfig)
```

Main and renderer share only `shared/types.ts`; runtime communication goes
through `window.popola`:

| channel | direction | payload |
| --- | --- | --- |
| `provider:get` | invoke | → `ProviderConfig \| null` |
| `provider:set` | invoke | config → `{ ok } \| { ok: false, error }` |
| `prompt` | invoke | text |
| `abort` | invoke | — |
| `permission:reply` | invoke | id + decision → — |
| `host:listen` | send | triggers the `session.snapshot` replay |
| `host-event` | push | one `popola-protocol` `AgentEvent` |

`host-event` carries protocol events only. `adapters/pi.ts` maps pi's own event
vocabulary onto `AgentEvent`, the host mirrors them through the state core, and
the renderer dispatches them straight into the store — no diffing in the
renderer. A renderer that connects mid-run is handed a `session.snapshot`
instead of the whole event history.

The host never names a concrete adapter: it asks the protocol's
`AgentSessionFactory` for a session (`adapters/pi.ts` exports
`createPiSession`), so a second adapter can be registered beside pi without
touching the host.

## Security

`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`; preload is
the only bridge. Links open in the system browser; raw HTML is shown as text,
never parsed.
