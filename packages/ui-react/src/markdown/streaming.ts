import type { Token } from "markdown-it"

/**
 * Link definitions may follow their link, so a document containing one stays
 * mutable from the start — splitting could strand a link in the closed head.
 */
const REFERENCE_DEFINITION = /^[ \t]{0,3}\[[^\]\n]+\]:/m

export type MarkdownSplit = {
  /** Closed blocks. Their text never changes again. */
  readonly head: Token[]
  /** The block being written, plus the line still arriving. */
  readonly tail: Token[]
  /** Source text the head covers; the key for caching its render. */
  readonly headSource: string
}

/** Splits tokens into closed blocks and the still-open last block, without re-parsing. */
export function splitStreamingTokens(text: string, tokens: Token[]): MarkdownSplit {
  if (REFERENCE_DEFINITION.test(text)) return { head: [], tail: tokens, headSource: "" }

  // Last level-0 opening token starts the still-open block.
  let start = -1
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!
    if (token.level === 0 && token.nesting !== -1) start = index
  }

  if (start <= 0) return { head: [], tail: tokens, headSource: "" }

  const tail = tokens[start]!
  const line = tail.map?.[0] ?? 0
  return {
    head: tokens.slice(0, start),
    tail: tokens.slice(start),
    headSource: text.slice(0, lineOffset(text, line)),
  }
}

function lineOffset(text: string, line: number): number {
  let offset = 0

  for (let index = 0; index < line; index++) {
    const newline = text.indexOf("\n", offset)
    if (newline === -1) return text.length
    offset = newline + 1
  }

  return offset
}
