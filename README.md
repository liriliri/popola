# popola

Embed a coding agent's UI into any Electron or React app. `popola-ui` is a
framework-agnostic state core; `popola-ui-react` renders it with React;
`popola-protocol` is the transport-neutral contract between an agent runtime
and the UI. Bring your own store and agent transport.

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
import {
  SettingsLayout,
  SettingsSidebar,
  SettingsPage,
  SettingsSection,
  SettingsCard,
} from "popola-ui-react/settings"
```

## Feeding the store

```ts
store.dispatch({ type: "turn.started", turnID: "t1" })
store.dispatch({ type: "message.started", message })
store.dispatch({ type: "message.part", messageID: message.id, part })
store.dispatch({ type: "turn.completed", turnID: "t1" })
```

The reducer is pure and returns the same state object on a no-op, so renderers
only re-render on real changes. The run status is derived from the turn
lifecycle, so there is no separate status event to keep in sync.

Events and shapes:
[`packages/protocol/src`](./packages/protocol/src) (the agent contract) and
[`packages/ui/src`](./packages/ui/src) (the state core).

## The agent contract

`popola-protocol` is the contract between an agent runtime and this UI layer.
An adapter implements `AgentSession` and emits `AgentEvent`; the reducer
consumes those events, so the UI never learns which agent is running.

```ts
import type { AgentEvent, AgentSession } from "popola-protocol"

const session: AgentSession = {
  provider: "my-agent",
  async prompt(text) { /* run a turn */ },
  interrupt() {},
  respondToPermission(id, decision) {},
  subscribe(listener) { /* push AgentEvents */ return () => {} },
  close() {},
}
```

The contract carries no platform API, so the same session can be implemented by
a Node host that spawns a CLI and by a browser host that talks to a model API.
`popola-protocol` is isomorphic: no DOM and no Node APIs.

A host creates sessions through `AgentSessionFactory`, so it names the contract
rather than one adapter:

```ts
import type { AgentSessionFactory } from "popola-protocol"

const createSession: AgentSessionFactory<MyConfig> = (config) => new MySession(config)
```

Approval prompts are answered with `"once"`, `"always"` or `"reject"`. Give
`"always"` a real meaning in your adapter — the pi adapter remembers the grant
for the exact tool and resource that were shown, and stops asking for that one.

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

- [`popola-protocol`](./packages/protocol/README.md) — the agent contract
- [`popola-ui`](./packages/ui/README.md) — state core, slots, stylesheet
- [`popola-ui-react`](./packages/ui-react/README.md) — components, Markdown, streaming
- [`popola-app`](./packages/app/README.md) — Electron test host (`pi` agent)
- [AGENTS.md](./AGENTS.md) — structure, tech stack, contributor conventions
