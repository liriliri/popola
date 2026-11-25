# AGENTS.md

Guidance for AI agents and contributors. For usage, see [README.md](./README.md).

## What this is

`popola` is an npm workspace monorepo for embedding a coding agent's UI into an
Electron/React app: one framework-agnostic state core, one React renderer,
agent adapters such as `popola-pi`, and a private test app that wires them.

## Tech stack

| concern | choice |
| --- | --- |
| Language | TypeScript 7.0.2, `strict`, `moduleResolution: bundler`, ES2023 |
| Runtime | Node >= 22; ESM everywhere |
| Package manager | npm workspaces (`packages/*`) |
| Build | `tsc -b` project references; ESM-only emit into `dist/` |
| React | 18 or 19 (peer); renderer uses `useSyncExternalStore` |
| Markdown | `markdown-it` (raw HTML off) |
| Utilities | `licia` (`className`, `Lru`, `isEqual`, `isErr`, `rtrim`) |
| Test app | Electron 39, Vite 8, `@vitejs/plugin-react`, `@earendil-works/pi-*` |
| Dev tooling | Storybook 10 (`react-vite`), `concurrently`, `wait-on` |
| Styling | Plain CSS in `popola-ui`, keyed by class name only; values from tokens |
| Linting/tests | none — verify with `npm run typecheck` and `npm run build` |

## Layout

```
packages/
  protocol/    popola-protocol  transport-neutral agent contract (published)
    src/
      index.ts               public re-exports
      message.ts             message/part/tool shapes
      permission.ts          permission request + decision
      events.ts              AgentEvent, AgentSnapshot, usage, plan
      session.ts             AgentSession interface
      guard.ts               isAgentEvent, for trust boundaries
  ui/          popola-ui       framework-agnostic core (published)
    src/
      index.ts               public re-exports
      state.ts reducer.ts store.ts selectors.ts slots.ts classes.ts style.css
      <domain>/              shell/ conversation/ message/ composer/ permission/ markdown/ settings/ sidebar/
        index.ts             data shapes, selectors, slot/class contracts for that domain
        style.css           authored CSS, @imported by root style.css
  ui-react/    popola-ui-react React renderer (published)
    src/                     mirrors the domain dirs
    stories/ .storybook/     dev only, never published
  pi/          popola-pi      Pi → popola-protocol adapter (published)
    src/                     createPiSession, listPiSessions
  app/         popola-app     Electron test host (private)
    src/main/                window, IPC, AgentHost
    src/preload.cjs          contextBridge exposing window.popola
    src/renderer/            settings, sidebar, bridge, store binding
    src/shared/types.ts      main/renderer wire contract
    vite.config.ts vite.main.ts

tsconfig.json               solution root + shared compiler options
package.json                workspace root scripts
README.md                   usage only     AGENTS.md   this file
```

Each `ui` domain is one `index.ts` (data, selectors, slots, class names) plus a
standalone `style.css`; root aggregators re-export them as one state, one slot
map, one class map.

## Packages

- **`popola-protocol`** (`0.1.0`, MIT) — the contract between an agent runtime and
  the UI layer: `AgentEvent` (the closed event set), `AgentSession` (what an
  adapter implements), the shared data shapes, and `isAgentEvent` for validating
  untrusted input. Isomorphic by design: no DOM and no Node APIs, so a browser
  host and a Node host can both depend on it. Zero runtime dependencies.
- **`popola-ui`** (`0.1.0`, MIT) — no React/DOM; usable in an Electron main
  process. Pure reducer over a closed event set, minimal store
  (`getState`/`subscribe`/`dispatch`), plain selectors, slots, class names, CSS.
  Reducer returns the *same* state object on a no-op, so renderers skip work by
  identity. Exports `.` (ESM) and `./style.css` (authored CSS, not built).
  `sideEffects: ["*.css"]`. Owns the shared `PopolaLabels` chrome-copy contract.
  Re-exports the protocol types, so a host needs one dependency to render and to
  drive an agent.
- **`popola-ui-react`** (`0.1.0`, MIT) — binds the core with
  `useSyncExternalStore`. Exports `.` + subpaths `./shell`, `./conversation`,
  `./composer`, `./permission`, `./markdown`, `./settings`, `./sidebar`.
  React/ReactDOM peers; `licia`, `lucide-react`, `markdown-it`, `popola-ui`
  runtime deps. Hosts localize chrome copy via `PopolaProvider` `labels`
  (types/defaults from `popola-ui`). `sideEffects: false`.
- **`popola-pi`** (`0.1.0`, MIT) — Pi coding agent adapter: `createPiSession`
  implements `AgentSession`, plus `listPiSessions` for JSONL chats under
  `~/.pi/agent/sessions/`. Depends on `popola-protocol` and the `@earendil-works/pi-*`
  packages.
- **`popola-app`** (`0.0.0`, private) — Electron host wiring `popola-pi` to the
  UI. See [packages/app/README.md](./packages/app/README.md).

## The agent contract

- An adapter implements `AgentSession` and emits `AgentEvent`. The state core
  consumes those events; the renderer never learns which agent is running.
- `message.part` upserts by part id, so a streaming text part replaces its own
  earlier version.
- The run status is **derived** from the turn lifecycle (`turn.started` →
  busy, `turn.completed`/`turn.canceled` → idle, `turn.failed` → error). There
  is no separate "status" event, so there is one source of truth.
- `session.snapshot` carries the whole state for a client that joins mid-run.
- `AgentSession` carries no platform API: `cwd`, `spawn` and `process.env`
  belong to the factory. Cancellation goes through `interrupt()`, not an
  `AbortSignal`, so the contract stays free of ambient globals that differ
  between the DOM and Node type libraries.
- A host creates a session through `AgentSessionFactory`, so it names the
  contract, not a concrete adapter. `popola-pi` exports `createPiSession`; a
  host that only needs the contract holds an `AgentSession`, while one that
  reopens Pi JSONL chats may keep the concrete `PiSession`.
- `PermissionDecision` is `"once" | "always" | "reject"`. An adapter must give
  `"always"` a real meaning: the pi adapter remembers the grant for the exact
  tool and resource that were shown, and stops asking for that one.
- Tool calls carry a `ToolCallDetail` classified by meaning (`shell`, `read`,
  `edit`, `write`, `search`, `fetch`), never by vendor.

## Build system

- Root `tsconfig.json` is solution root + shared base: empty `files`/`include`,
  one `references` per package; each package extends it with `composite`,
  `outDir`, `rootDir`. `tsc -b` resolves order from `references`; a dependent
  package also lists its dependency there.
- Published packages emit once to `dist/` (ESNext + declarations). `src/` is
  truth; `dist/` is gitignored. Packages set `"type": "module"`.
- `popola-app`: `tsc -b` only checks main/shared into `dist/types`; Vite bundles
  main (`vite.main.ts`) and renderer (`vite.config.ts`) into `dist/main` and
  `dist/renderer`. Vite aliases the workspace libs to `src/index.ts`, so dev
  needs no prior build — keep the alias list in step with the packages.
- Storybook type-checks separately (`tsc -p stories`), never published.

## Commands

```bash
# root
npm run build           # protocol + ui + ui-react + pi (ESM)
npm run typecheck       # tsc -b across references
npm run clean           # dist, tsbuildinfo, storybook-static

# packages/ui-react
npm run dev             # Storybook on :6006
npm run build-storybook # static build
npm run typecheck       # also checks stories

# packages/app
npm run dev             # build main, then Vite on :5173
npm run start           # Electron (POPOLA_DEV=1; waits for Vite)
npm run build           # tsc + bundle main/renderer
npm run typecheck       # main + renderer
```

## Conventions

- Package names `popola-<name>`; unscoped, publish as public with no flag.
- Cross-package deps use real version ranges (`"popola-ui": "^0.1.0"`);
  workspaces symlink them locally.
- Relative imports omit `.js`; use `import type` (`verbatimModuleSyntax` on).
- Class names are a public contract: stylesheet targets names only, never DOM
  shape/nesting; renaming is breaking for hosts.
- State core stays framework-agnostic: plain data, pure reducer, no I/O/clocks.
- The protocol package stays platform-free: no DOM lib, no `node:` imports, no
  ambient globals that differ between the DOM and Node type libraries.
- Slots resolve by scope before specificity (component > provider; exact >
  family base). Tool slots: `conversation.tool.<toolName>` → `conversation.tool`.
- Raw HTML in messages is shown as text, never parsed.

## Adding a package

```
packages/agent/
├── package.json
├── tsconfig.json
└── src/index.ts
```

`package.json`:

```json
{
  "name": "popola-agent", "version": "0.0.0", "type": "module",
  "main": "./dist/index.js", "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsc -b", "clean": "rm -rf dist tsconfig.tsbuildinfo" }
}
```

`tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "composite": true, "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

Add `{ "path": "packages/agent" }` to root `tsconfig.json` `references`, and to
any package depending on it.
