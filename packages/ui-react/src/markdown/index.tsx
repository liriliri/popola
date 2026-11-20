import { useMemo, useRef, type ReactNode } from "react"
import { popolaClass } from "popola-ui"
import className from "licia/className"
import type { Token } from "markdown-it"
import { PopolaTypingIndicator } from "../message/streaming"
import { parseMarkdown } from "./parser"
import { findRevealTarget, renderBlocks } from "./renderer"
import { splitStreamingTokens } from "./streaming"

/** The tail of a document that is not being written. */
const NO_TAIL: Token[] = []

/**
 * Renders Markdown; finished blocks are cached while the last block streams.
 */
export function PopolaMarkdown(props: {
  text: string
  /** The text is still arriving. */
  streaming?: boolean
  className?: string
}) {
  const streaming = props.streaming ?? false
  const text = props.text

  const tokens = useMemo(() => parseMarkdown(text), [text])

  const split = useMemo(
    () =>
      streaming
        ? splitStreamingTokens(text, tokens)
        : { head: tokens, tail: NO_TAIL, headSource: text },
    [text, tokens, streaming],
  )

  // The reveal belongs to the text that is still arriving.
  const reveal = useMemo(
    () => (streaming ? findRevealTarget(split.tail) : undefined),
    [split.tail, streaming],
  )

  const head = useClosedBlocks(split.head, split.headSource)
  const tail = useMemo(() => renderBlocks(split.tail, { reveal }), [split.tail, reveal])

  // Nothing has arrived yet — the dots hold the place until the first word.
  if (streaming && text.length === 0) {
    return (
      <div className={className(popolaClass.markdown, props.className)}>
        <PopolaTypingIndicator />
      </div>
    )
  }

  return (
    <div className={className(popolaClass.markdown, props.className)}>
      {head}
      {tail}
    </div>
  )
}

/** Keeps the rendered head while its source text is unchanged. */
function useClosedBlocks(tokens: Token[], source: string): ReactNode[] {
  const cache = useRef<{ source: string; nodes: ReactNode[] } | undefined>(undefined)

  return useMemo(() => {
    const cached = cache.current
    if (cached && cached.source === source) return cached.nodes

    const nodes = renderBlocks(tokens)
    cache.current = { source, nodes }
    return nodes
  }, [tokens, source])
}
