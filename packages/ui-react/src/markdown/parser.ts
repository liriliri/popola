import MarkdownIt from "markdown-it"
import type { Token } from "markdown-it"
import Lru from "licia/Lru"

/**
 * `html` is off so agent text is shown as text, never parsed as markup;
 * `typographer` is off for fidelity (curly quotes would alter the source).
 */
const markdownEngine = MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
})

/** Bounded cache: the same text is re-parsed on remounts and the final frame. */
const parseCache = new Lru(4)

/** Parses Markdown into the token stream, cached by text. */
export function parseMarkdown(text: string): Token[] {
  const cached: Token[] | undefined = parseCache.get(text)
  if (cached) return cached

  const tokens = markdownEngine.parse(text, {})
  parseCache.set(text, tokens)
  return tokens
}
