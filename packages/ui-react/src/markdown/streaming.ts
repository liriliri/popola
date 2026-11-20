import type { Token } from "markdown-it"

/**
 * Link reference definitions (`[label]: url`) may appear after their link, so
 * a document containing one stays mutable from the start — splitting could
 * strand a link in the closed head.
 */
const REFERENCE_DEFINITION = /^[ \t]{0,3}\[[^\]\n]+\]:/m

export type MarkdownSplit = {
  /** The blocks that are closed. Their text never changes again. */
  readonly head: Token[]
  /** The block being written, plus the line that is still arriving. */
  readonly tail: Token[]
  /**
   * The text the head covers.
   *
   * The head renders the same way for the same text, so this is what tells
   * one frame's head from the next.
   */
  readonly headSource: string
}

/**
 * Splits tokens into closed blocks (`head`) and the still-open last block
 * (`tail`). Splitting tokens, not text, avoids re-parsing the document.
 */
export function splitStreamingTokens(text: string, tokens: Token[]): MarkdownSplit {
  if (REFERENCE_DEFINITION.test(text)) return { head: [], tail: tokens, headSource: "" }

  // The last level-0 opening token starts the block still being written.
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

/** The character offset the given line starts on. */
function lineOffset(text: string, line: number): number {
  let offset = 0

  for (let index = 0; index < line; index++) {
    const newline = text.indexOf("\n", offset)
    if (newline === -1) return text.length
    offset = newline + 1
  }

  return offset
}
