import type { ReactNode } from "react"
import { popolaClass, type PopolaStore } from "popola-ui"
import { PopolaProvider, usePopola, useResolvedTheme, type PopolaContextValue } from "popola-ui-react"

type Handlers = Pick<PopolaContextValue, "onSend" | "onStop" | "onPermissionReply">

/** Frame for a single-component story; shell stories bring their own frame. */
export function Stage(props: Handlers & { store?: PopolaStore; children: ReactNode }) {
  return (
    <PopolaProvider
      store={props.store}
      onSend={props.onSend}
      onStop={props.onStop}
      onPermissionReply={props.onPermissionReply}
    >
      <Surface>{props.children}</Surface>
    </PopolaProvider>
  )
}

function Surface(props: { children: ReactNode }) {
  const { theme } = usePopola()
  const resolved = useResolvedTheme(theme)

  return (
    <div className={popolaClass.shell} data-popola-theme={resolved}>
      <div className={popolaClass.shellBody}>
        <div className={popolaClass.shellMain}>{props.children}</div>
      </div>
    </div>
  )
}

/** The same column the conversation uses, so a single message sits where it would in the shell. */
export function Column(props: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--popola-space-5)",
        width: "100%",
        maxWidth: "var(--popola-column)",
        padding: "var(--popola-space-5) var(--popola-space-4)",
      }}
    >
      {props.children}
    </div>
  )
}
