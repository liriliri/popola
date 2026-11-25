import { ArrowUp, Square } from "lucide-react"
import { popolaClass, selectCanSend, selectCanStop, type Attachment } from "popola-ui"
import className from "licia/className"
import { usePopola } from "../context"
import { usePopolaState } from "../usePopolaState"
import { Slot } from "../slot"
import type { PopolaSlots } from "../context"

export { ComposerModelPicker, ComposerToolbar } from "./modelPicker"
export type { ComposerModelSelection } from "./modelPicker"

/** The input area. Stop appears only while a run is in flight. */
export function PopolaComposer(props: { slots?: PopolaSlots; className?: string }) {
  const { store, onSend, onStop, labels } = usePopola()

  const text = usePopolaState((state) => state.composer.text)
  const attachments = usePopolaState((state) => state.composer.attachments)
  const canSend = usePopolaState(selectCanSend)
  const canStop = usePopolaState(selectCanStop)

  const submit = () => {
    // Keep the text when there is no handler to send it to.
    if (!canSend || !onSend) return
    onSend({ text, attachments })
    store.dispatch({ type: "composer.cleared" })
  }

  const removeAttachment = (id: string) => {
    store.dispatch({ type: "composer.attachmentRemoved", id })
  }

  return (
    <div className={className(popolaClass.composer, props.className)}>
      <Slot
        name="composer.context"
        slotProps={{ attachments, onRemove: removeAttachment }}
        local={props.slots}
        fallback={
          attachments.length === 0 ? null : (
            <div className={popolaClass.composerContext}>
              {attachments.map((attachment: Attachment) => (
                <span key={attachment.id} className={popolaClass.attachment}>
                  <span className={popolaClass.attachmentName}>{attachment.name}</span>
                  <button
                    type="button"
                    className={className(popolaClass.button, popolaClass.buttonGhost)}
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )
        }
      />

      <div className={popolaClass.composerField}>
        <Slot
          name="composer.input"
          slotProps={{
            value: text,
            onChange: (value: string) => store.dispatch({ type: "composer.text", text: value }),
            onSubmit: submit,
          }}
          local={props.slots}
          fallback={
            <textarea
              className={popolaClass.composerInput}
              value={text}
              placeholder={labels.composerPlaceholder}
              rows={1}
              onChange={(event) => store.dispatch({ type: "composer.text", text: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
            />
          }
        />

        <div className={popolaClass.composerActions}>
          <Slot name="composer.toolbar" slotProps={{}} local={props.slots} fallback={null} />

          <div className={popolaClass.composerActionsTrailing}>
            {canStop ? (
              <Slot
                name="composer.stop"
                slotProps={{ onClick: () => onStop?.() }}
                local={props.slots}
                fallback={
                  <button
                    type="button"
                    className={className(popolaClass.composerButton, popolaClass.composerStop)}
                    aria-label={labels.composerStop}
                    onClick={() => onStop?.()}
                  >
                    <Square size={10} fill="currentColor" aria-hidden />
                  </button>
                }
              />
            ) : null}

            <Slot
              name="composer.send"
              slotProps={{ canSend, onClick: submit }}
              local={props.slots}
              fallback={
                <button
                  type="button"
                  className={className(popolaClass.composerButton, popolaClass.composerSend)}
                  disabled={!canSend || !onSend}
                  aria-label={labels.composerSend}
                  onClick={submit}
                >
                  <ArrowUp size={14} strokeWidth={2.5} aria-hidden />
                </button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
