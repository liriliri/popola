import { popolaClass, selectIsBusy, selectMessages, type Message } from "popola-ui"
import { cn } from "./cn.js"
import { usePopolaState } from "./use-popola-state.js"
import { Slot } from "./slot.js"
import { PopolaCard } from "./defaults.js"
import type { PopolaSlots } from "./context.js"

/**
 * The conversation area: one column of messages, newest at the bottom.
 *
 * It needs nothing but the store, so it works on its own — no shell required.
 */
export function PopolaConversation(props: { slots?: PopolaSlots; className?: string }) {
  const messages = usePopolaState(selectMessages)
  const busy = usePopolaState(selectIsBusy)
  const last = messages[messages.length - 1]
  // The assistant message is not in the list yet, so the card cannot host the dots.
  const awaitingAssistant = busy && (last === undefined || last.role !== "assistant")

  return (
    <div className={cn(popolaClass.conversation, props.className)}>
      <div className={popolaClass.conversationScroll}>
        {messages.length === 0 && !awaitingAssistant ? (
          <Slot
            name="conversation.empty"
            slotProps={{}}
            local={props.slots}
            fallback={<div className={popolaClass.conversationEmpty}>No messages yet.</div>}
          />
        ) : (
          messages.map((message, index) => (
            <MessageRow
              key={message.id}
              message={message}
              slots={props.slots}
              // Only the assistant message still being written can stream.
              streaming={busy && message.role === "assistant" && index === messages.length - 1}
            />
          ))
        )}
        {awaitingAssistant ? <PendingReply /> : null}
      </div>
    </div>
  )
}

/** Shown after the user message, before the assistant message exists. */
function PendingReply() {
  return <PopolaCard message={{ id: "pending", role: "assistant", parts: [] }} streaming />
}

function MessageRow(props: { message: Message; slots?: PopolaSlots; streaming?: boolean }) {
  const { message, slots } = props

  const name =
    message.role === "user"
      ? ("conversation.message.user" as const)
      : message.role === "assistant"
        ? ("conversation.message.assistant" as const)
        : ("conversation.message" as const)

  return (
    <Slot
      name={name}
      base="conversation.message"
      slotProps={{ message }}
      local={slots}
      fallback={<PopolaCard message={message} slots={slots} streaming={props.streaming} />}
    />
  )
}
