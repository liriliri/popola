import type { Token } from "markdown-it"

/**
 * A link reference definition: `[label]: https://example.com`.
 *
 * A definition may sit after the link that uses it, so a document that holds
 * one stays mutable from the start. Splitting it could leave a link in the
 * closed part pointing at a definition that has not arrived yet.
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
 * Splits a parsed document into the blocks that are closed and the block that
 * is still open.
 *
 * A block is closed once the next block has started, so the head is always a
 * whole number of blocks — a document the renderer can keep. The tail holds
 * the last block, which more text can still extend.
 *
 * The tokens are split rather than the text, so the document is parsed once
 * and not again.
 */
export function splitStreamingTokens(text: string, tokens: Token[]): MarkdownSplit {
  if (REFERENCE_DEFINITION.test(text)) return { head: [], tail: tokens, headSource: "" }

  // The last token that opens at the outermost level starts the block that is
  // still being written. A closing token sits at that level too, so it is
  // left out.
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
