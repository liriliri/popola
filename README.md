# popola

Embed a coding agent's UI into any Electron or React app. `popola-ui` is a
framework-agnostic state core; `popola-ui-react` renders it with React. Bring
your own store and agent transport.

## Install

```bash
npm install popola-ui popola-ui-react   # React 18 or 19 is a peer dependency
```

```ts
import "popola-ui/style.css"            // once, where you mount the UI
```

## Quick start

```tsx
import { createStore } from "popola-ui"
import { PopolaProvider, PopolaShell } from "popola-ui-react"

const store = createStore()

<PopolaProvider
  store={store}
  onSend={({ text }) => { /* send to your agent */ }}
  onStop={() => { /* abort the run */ }}
  onPermissionReply={(id, decision) => { /* answer a prompt */ }}
>
  <PopolaShell title="popola" />
</PopolaProvider>
```

`PopolaShell` = header + conversation + composer + approval prompts. Pieces are
also exported separately and as subpaths:

```ts
import { PopolaConversation } from "popola-ui-react/conversation"
import { PopolaComposer } from "popola-ui-react/composer"
import { PopolaPermissions } from "popola-ui-react/permission"
import { PopolaMarkdown } from "popola-ui-react/markdown"
```

## Feeding the store

```ts
store.dispatch({ type: "status", status: "busy" })
store.dispatch({ type: "message.started", message })
store.dispatch({ type: "message.part", messageID: message.id, part })
store.dispatch({ type: "status", status: "idle" })
```

The reducer is pure and returns the same state object on a no-op, so renderers
only re-render on real changes. Events and shapes:
[`packages/ui/src`](./packages/ui/src) (`state.ts`, `reducer.ts`,
`message/index.ts`).

## The card

```tsx
import { PopolaCard } from "popola-ui-react"

<PopolaProvider store={store}>
  <PopolaCard message={message} streaming />
</PopolaProvider>
```

User messages are bubbles; assistant messages are Markdown arriving word by
word, with one collapsible row per tool call. `streaming` enables the animation.

## Slots

Replace any built-in part:

```tsx
<PopolaConversation slots={{ "conversation.tool.bash": MyBashCard }} />
<PopolaProvider slots={{ "conversation.part.text": PlainText }} />
```

Resolution: component-level slot > provider-level; exact name > family base
(`conversation.message.user` > `conversation.message`). Tool slots are
`conversation.tool.<toolName>`, falling back to `conversation.tool`. No match →
built-in rendering.

## Commands

```bash
# root
npm run build           # build published packages
npm run typecheck       # tsc -b
npm run clean

# packages/ui-react
npm run dev             # Storybook on :6006
npm run build-storybook

# packages/app
npm run dev             # Electron window, provider form on first launch
```

## Docs

- [`popola-ui`](./packages/ui/README.md) — state core, slots, stylesheet
- [`popola-ui-react`](./packages/ui-react/README.md) — components, Markdown, streaming
- [`popola-app`](./packages/app/README.md) — Electron test host (`pi` agent)
- [AGENTS.md](./AGENTS.md) — structure, tech stack, contributor conventions
