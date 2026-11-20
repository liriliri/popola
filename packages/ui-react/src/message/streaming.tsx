import { useEffect, useMemo, useState } from "react"
import { popolaClass } from "popola-ui"
import className from "licia/className"

/**
 * Reveals text word by word while the agent is generating.
 *
 * The text itself arrives complete — the transport pushes a new part on every
 * chunk — so the animation is driven here, not by the store. Words fade in as
 * they are revealed, and the two most recent ones stay highlighted so the eye
 * has something to follow.
 */
export function useStreamingWords(text: string, streaming: boolean) {
  const words = useMemo(() => (text.length === 0 ? [] : text.split(" ")), [text])
  const [shown, setShown] = useState(words.length)

  // Catch up when the text stops streaming, and never show more words than
  // have arrived.
  useEffect(() => {
    if (!streaming) {
      setShown(words.length)
      return
    }
    setShown((count) => Math.min(count, words.length))
  }, [words.length, streaming])

  useEffect(() => {
    if (!streaming || shown >= words.length) return

    // Reveal faster when a lot is queued, so the tail never falls behind.
    const lag = words.length - shown
    const step = lag > 20 ? 3 : lag > 6 ? 2 : 1
    const delay = lag > 20 ? 30 : lag > 6 ? 45 : 70

    const timer = setTimeout(() => {
      setShown((count) => Math.min(count + step, words.length))
    }, delay)

    return () => clearTimeout(timer)
  }, [shown, words.length, streaming])

  return { words, shown }
}

/**
 * Text that arrives word by word.
 *
 * A host that renders markdown replaces this through the
 * `conversation.part.text` slot.
 */
export function PopolaStreamingText(props: {
  text: string
  streaming?: boolean
  className?: string
}) {
  const streaming = props.streaming ?? false
  const { words, shown } = useStreamingWords(props.text, streaming)

  // Nothing has been revealed yet — the dots hold the place until the first word.
  if (streaming && shown === 0) {
    return (
      <div className={className(popolaClass.streamText, props.className)}>
        <PopolaTypingIndicator />
      </div>
    )
  }

  return (
    <div className={className(popolaClass.streamText, props.className)}>
      {words.slice(0, shown).map((word, index) => (
        <span
          key={index}
          className={className(popolaClass.streamWord, {
            [popolaClass.streamWordFresh]: streaming && index >= shown - 2,
          })}
        >
          {word}{" "}
        </span>
      ))}
      {streaming && shown > 0 ? <span className={popolaClass.streamCursor} /> : null}
    </div>
  )
}

/** Three dots shown while the agent is producing its first words. */
export function PopolaTypingIndicator(props: { className?: string }) {
  return (
    <span className={className(popolaClass.typing, props.className)}>
      {[0, 150, 300].map((delay) => (
        <span key={delay} className={popolaClass.typingDot} style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  )
}
