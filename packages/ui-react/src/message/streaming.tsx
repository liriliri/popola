import { popolaClass } from "popola-ui"
import className from "licia/className"

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
