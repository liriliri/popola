# popola

Embed a coding agent into any Electron app.

## Layout

```
packages/ui/src/         framework-agnostic data and styles
  shell/  conversation/  message/  composer/  permission/  markdown/
packages/ui-react/src/   React rendering, same directories
  stories/               Storybook, split the same way (dev only, never published)
  .storybook/            Storybook config
packages/app/            Electron host for trying the UI against pi
```

## Commands

```bash
# from the repo root
npm run build           # build every package
npm run typecheck       # type-check every package
npm run clean

# from packages/ui-react
npm run typecheck       # type-check the stories too
npm run dev             # Storybook on http://localhost:6006
npm run build-storybook # static Storybook into packages/ui-react/storybook-static/

# from packages/app
npm run dev             # Electron window, asks for a provider first
```

## The card

The smallest useful piece: one message from the agent.

```tsx
import { PopolaCard, PopolaProvider } from "popola-ui-react"
import "popola-ui/styles.css"

<PopolaProvider store={store}>
  <PopolaCard message={message} />
</PopolaProvider>
```

A user's message is a bubble; the assistant's is Markdown that arrives word by
word, followed by one collapsible row per tool call. Every part renders
through a slot, so a host can replace one piece without forking the rest:

```tsx
<PopolaConversation slots={{ "conversation.tool.bash": MyBashCard }} />
```

Slots resolve by scope first, then by name: a slot handed to one component
beats one the provider registers for everything, and within a scope the exact
name beats the family base (`conversation.message.user` over
`conversation.message`). When nothing matches, the built-in rendering is used.
Tool slots are named `conversation.tool.<toolName>` and fall back to
`conversation.tool`.

## Packages

`popola-ui` is framework-agnostic on purpose: a pure reducer over a closed event
set, a small store, plain selectors, the slot contract, the class-name
contract, and one stylesheet. It carries no React and no DOM, so it can run in
the Electron main process.

`popola-ui-react` binds that core to React with `useSyncExternalStore`. Each other
framework needs roughly twenty lines to do the same.

## Adding a package

```
packages/agent/
├── package.json
├── tsconfig.json
└── src/index.ts
```

`packages/agent/package.json`:

```json
{
  "name": "popola-agent",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -b",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  }
}
```

`packages/agent/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Then register it in the root `tsconfig.json`:

```json
"references": [{ "path": "packages/agent" }]
```

A package that depends on another workspace package lists it in its own `references`
too, so `tsc -b` resolves the build order.

## Conventions

- Package names: `popola-<name>`
- Compiled distribution: `src/` holds the source. `dist/esm` is ESM, `dist/cjs` is CommonJS. `main` points at CommonJS; `module` and `types` point at ESM
- Cross-package dependencies use a real version range (`"popola-ui": "^0.1.0"`); npm workspaces symlinks them locally
- Scoped packages are private by default on npm; these packages are unscoped, so they publish as public with no extra flag
- Node >= 22, TypeScript 7.0.2, `moduleResolution: bundler`. Relative imports omit the `.js` suffix. The CommonJS build is a second `tsc` pass
- Packages extend the root `tsconfig.json`, so shared options live in one place. The root file keeps
  empty `files`/`include`: it is the solution root and owns no sources of its own
- Styles live in `popola-ui/styles.css` and are keyed by class name only, never by DOM shape
