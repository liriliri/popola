import type { ReactNode } from "react"
import { popolaClass } from "popola-ui"
import className from "licia/className"
import { usePopola, useResolvedTheme, type PopolaSlots } from "../context"
import { Slot } from "../slot"
import { PopolaConversation } from "../conversation/index"
import { PopolaComposer } from "../composer/index"
import { PopolaPermissions } from "../permission/index"

/**
 * Full shell: header, optional sidebar, conversation area. Pass children to
 * replace the default column (conversation, composer, approval prompts).
 */
export function PopolaShell(props: {
  title?: string
  slots?: PopolaSlots
  children?: ReactNode
  className?: string
}) {
  const context = usePopola()
  const theme = useResolvedTheme(context.theme)

  return (
    <div className={className(popolaClass.shell, props.className)} data-popola-theme={theme}>
      <Slot
        name="shell.header"
        slotProps={{ title: props.title }}
        local={props.slots}
        fallback={
          <div className={popolaClass.shellHeader}>
            <span>{props.title ?? "popola"}</span>
          </div>
        }
      />

      <div className={popolaClass.shellBody}>
        <Slot
          name="shell.sidebar"
          slotProps={{}}
          local={props.slots}
          className={popolaClass.shellSidebar}
          fallback={null}
        />

        <div className={popolaClass.shellMain}>
          {props.children ?? (
            <>
              <PopolaConversation slots={props.slots} />
              <PopolaComposer slots={props.slots} />
              <PopolaPermissions slots={props.slots} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
