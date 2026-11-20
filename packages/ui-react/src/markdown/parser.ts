import MarkdownIt from "markdown-it"
import type { Token } from "markdown-it"
import Lru from "licia/Lru"

/**
 * The Markdown engine.
 *
 * `html` is off on purpose. A message is text the agent produced, not markup
 * a host vouched for, so raw HTML is shown as text and never parsed. The
 * renderer only ever produces the elements the stylesheet knows about.
 *
 * `typographer` is off for the same reason of fidelity: the source is the
 * text the agent wrote, and curly quotes would change it.
 */
const markdownEngine = MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
})

/** Bounded cache: the same text is re-parsed on remounts and the final frame. */
const parseCache = new Lru(4)

/** Parses Markdown into the token stream the renderer walks. */
export function parseMarkdown(text: string): Token[] {
  const cached: Token[] | undefined = parseCache.get(text)
  if (cached) return cached

  const tokens = markdownEngine.parse(text, {})
  parseCache.set(text, tokens)
  return tokens
}
