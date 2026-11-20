# popola-ui-react

React rendering of [popola-ui](../ui/README.md) via `useSyncExternalStore`.
React 18 or 19 is a peer dependency.

```tsx
import { createStore } from "popola-ui"
import { PopolaProvider, PopolaShell } from "popola-ui-react"
import "popola-ui/style.css"

const store = createStore()

<PopolaProvider store={store} onSend={({ text }) => { /* send to agent */ }}>
  <PopolaShell title="popola" />
</PopolaProvider>
```

`PopolaShell` = header + conversation + composer + approval prompts. Pieces are
also exported as subpaths:

```ts
import { PopolaConversation } from "popola-ui-react/conversation"
import { PopolaComposer } from "popola-ui-react/composer"
import { PopolaPermissions } from "popola-ui-react/permission"
import { PopolaShell } from "popola-ui-react/shell"
```

Pass `slots` to replace a built-in part; a component-level slot beats a
provider-level one.

## Markdown

```tsx
import { PopolaMarkdown } from "popola-ui-react/markdown"

<PopolaMarkdown text={answer} streaming />
```

Headings, lists, tables, task lists, code fences, quotes and links render as
styled elements. Raw HTML is shown as text, never parsed; links open in a new
tab. With `streaming`, finished blocks are cached and only the open block and
its words are re-rendered.

Replace `conversation.part.text` to render text yourself:

```tsx
<PopolaProvider slots={{ "conversation.part.text": PlainText }} />
```

```bash
npm run dev    # Storybook on :6006
```
