# popola-ui-react

React rendering of [popola-ui](https://github.com/liriliri/popola/tree/master/packages/ui). It binds the store with `useSyncExternalStore`. React 18 or 19 is a peer dependency.

```tsx
import { createStore } from "popola-ui"
import { PopolaProvider, PopolaShell } from "popola-ui-react"
import "popola-ui/styles.css"

const store = createStore()

<PopolaProvider store={store} onSend={({ text }) => { /* hand the text to the agent */ }}>
  <PopolaShell title="popola" />
</PopolaProvider>
```

`PopolaShell` is the full column: header, conversation, composer, and approval prompts. The pieces are also exported on their own, and as subpaths:

```ts
import { PopolaConversation } from "popola-ui-react/conversation"
import { PopolaComposer } from "popola-ui-react/composer"
import { PopolaPermissions } from "popola-ui-react/permission"
import { PopolaShell } from "popola-ui-react/shell"
```

Pass `slots` to replace one built-in part. A slot on a component beats the same slot on the provider.

## Markdown

The text of a message is Markdown, so it is rendered as Markdown. Headings, lists, tables, task lists, code fences, quotes and links all come out as elements the stylesheet knows about.

Raw HTML is shown as text and never parsed, so a message cannot smuggle markup into the page. Links open in a new tab.

```tsx
import { PopolaMarkdown } from "popola-ui-react/markdown"

<PopolaMarkdown text={answer} />
```

While the agent writes, the blocks it has finished are parsed once and kept, and only the block still being written is parsed again. The words of that block arrive one by one, so the eye can follow the writing. Pass `streaming` to turn this on.

To render a text part yourself — plain text, or something else — replace the `conversation.part.text` slot:

```tsx
<PopolaProvider slots={{ "conversation.part.text": PlainText }} />
```

```bash
npm run dev    # Storybook on http://localhost:6006
```
