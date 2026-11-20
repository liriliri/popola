import type { ReactNode } from "react"
import { popolaClass } from "popola-ui"
import { cn } from "./cn.js"
import { usePopola, useResolvedTheme, type PopolaSlots } from "./context.js"
import { Slot } from "./slot.js"
import { PopolaConversation } from "./conversation.js"
import { PopolaComposer } from "./composer.js"
import { PopolaPermissions } from "./permission.js"

/**
 * The full shell: header, optional sidebar, and the conversation area.
 *
 * Pass children to lay the body out yourself. Leave them out and you get the
 * default column — conversation, composer and approval prompts.
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
    <div className={cn(popolaClass.shell, props.className)} data-popola-theme={theme}>
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
        <Slot name="shell.sidebar" slotProps={{}} local={props.slots} fallback={null} />

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
