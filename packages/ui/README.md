# popola-ui

Framework-agnostic core: state, slots, class names, stylesheet. No React/DOM, so
it runs in an Electron main process.

```ts
import { createStore } from "popola-ui"
import "popola-ui/style.css"

const store = createStore()
store.dispatch({ type: "status", status: "busy" })
```

- `require("popola-ui")` → CommonJS; `module` condition → ESM.
- `popola-ui/style.css` is the authored stylesheet (not built); it targets
  `popolaClass` names and reads visual values from tokens.

```
src/
  shell/ conversation/ message/ composer/ permission/ markdown/
    index.ts      data, selectors, slots, class names
    style.css    authored CSS
```

Each domain is one `index.ts` plus a standalone `style.css`; root aggregators
re-export one state, one slot map, one class map.
