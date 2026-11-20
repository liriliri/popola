import { popolaClass, selectCanSend, selectCanStop, type Attachment } from "popola-ui"
import className from "licia/className"
import { usePopola } from "../context"
import { usePopolaState } from "../use-popola-state"
import { Slot } from "../slot"
import type { PopolaSlots } from "../context"

/**
 * The input area.
 *
 * Sending stays available while the agent runs — that is how steering works.
 * Stopping only appears while a run is in flight.
 */
export function PopolaComposer(props: { slots?: PopolaSlots; className?: string }) {
  const { store, onSend, onStop } = usePopola()

  const text = usePopolaState((state) => state.composer.text)
  const attachments = usePopolaState((state) => state.composer.attachments)
  const canSend = usePopolaState(selectCanSend)
  const canStop = usePopolaState(selectCanStop)

  const submit = () => {
    // Without a handler there is nowhere to send, so the text stays put rather
    // than being cleared into nowhere.
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
                </span>
              ))}
            </div>
          )
        }
      />

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
            placeholder="Ask anything"
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
        <Slot
          name="composer.send"
          slotProps={{ canSend, onClick: submit }}
          local={props.slots}
          fallback={
            <button
              className={className(popolaClass.composerButton, popolaClass.composerSend)}
              disabled={!canSend || !onSend}
              onClick={submit}
            >
              Send
            </button>
          }
        />

        {canStop ? (
          <Slot
            name="composer.stop"
            slotProps={{ onClick: () => onStop?.() }}
            local={props.slots}
            fallback={
              <button className={className(popolaClass.composerButton, popolaClass.composerStop)} onClick={() => onStop?.()}>
                Stop
              </button>
            }
          />
        ) : null}
      </div>
    </div>
  )
}
