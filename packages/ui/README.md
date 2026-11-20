# popola-ui

Framework-agnostic core of the popola UI: state, slots, class names, and the stylesheet. No React and no DOM, so the same module can run in an Electron main process.

```ts
import { createStore } from "popola-ui"
import "popola-ui/styles.css"

const store = createStore()
store.dispatch({ type: "status", status: "busy" })
```

`require("popola-ui")` loads the CommonJS build. Bundlers that ask for the `module` condition get the ESM build. `popola-ui/styles.css` is the authored stylesheet; it targets the `popolaClass` names and reads every visual decision from a token.

```
src/
  shell/  conversation/  message/  composer/  permission/  markdown/
```

Each directory holds that component's data, selectors, slot contract, class names, and styles. The package entry re-exports them as one state, one slot map, and one class map.
