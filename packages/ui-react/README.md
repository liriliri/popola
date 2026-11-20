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

```bash
npm run dev    # Storybook on http://localhost:6006
```
