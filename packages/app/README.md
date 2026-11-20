# popola-app

Private Electron host for trying `popola-ui-react` against a real `pi` coding
agent (read, bash, edit, write tools). Not published.

## Run

```bash
# from the repo root
npm run dev -w popola-app
```

Builds the main process, starts Vite on `127.0.0.1:5173`, then opens Electron.
Vite aliases both libs to source, so no prior build is needed. `POPOLA_DEV=1`
loads that URL and keeps data in `packages/app/.data`; otherwise the window loads
`dist/renderer/index.html` with the normal Electron `userData`.

First launch asks for an OpenAI-compatible endpoint (`provider`, `baseUrl`,
`apiKey`, `model`), saved to `<userData>/provider.json` (mode `0600`). Saving
starts a new session; the header's **Provider** button reopens the form.

## Commands

```bash
npm run dev         # Vite + Electron
npm run build       # tsc + bundle main/renderer into dist/
npm run typecheck   # main + renderer
npm run clean       # dist, tsbuildinfo, .data
```

## Layout

```
src/
  main/
    index.ts      window, IPC handlers, dev/prod loading
    host.ts       AgentHost: lifecycle, events, provider config
    serialize.ts  pi messages → popola Message/Part
  preload.cjs     contextBridge exposing window.popola
  renderer/
    App.tsx       provider form + PopolaProvider + PopolaShell
    bridge.ts     typed wrapper around window.popola
    snapshot.ts   applies a messages snapshot into the store
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
| `host:listen` | send | triggers `snapshot()` replay |
| `host-event` | push | `messages` or `running` |

A `messages` event is a full transcript; `applySnapshot` diffs it and dispatches
only changes, keeping message/part identities.

## Security

`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`; preload is
the only bridge. Links open in the system browser; raw HTML is shown as text,
never parsed.
