import { Fragment, type ReactNode } from "react"
import type { Token } from "markdown-it"
import { popolaClass } from "popola-ui"
import className from "licia/className"

/**
 * Renders a Markdown token stream as React elements.
 *
 * Every element carries the class name the stylesheet targets, and nothing
 * else. The stylesheet never reaches down to a child, so the shape of the tree
 * is the renderer's own business.
 */

/** What the renderer needs to know beyond the tokens themselves. */
export type RenderContext = {
  /**
   * The text token revealed word by word while the agent writes. It is the
   * last text of the document, so the eye has something to follow.
   */
  readonly reveal?: Token
  /**
   * The task marker of the list item being rendered: the text to remove and
   * the state of the checkbox that replaces it.
   */
  readonly strip?: {
    /** The inline token the marker opens. */
    readonly parent: Token
    /** The text token the marker sits in. */
    readonly first: Token
    /** The marker itself. */
    readonly text: string
    /** Whether the checkbox is ticked. */
    readonly checked: boolean
  }
}

/**
 * A task marker: `- [ ] todo` or `- [x] done`.
 *
 * A marker at the very end of the item counts too — the item is a task with
 * nothing written in it yet.
 */
const TASK_MARKER = /^\[([ xX])\](?:[ \t]+|$)/

/** Renders the blocks of a parsed document. */
export function renderBlocks(tokens: Token[], ctx: RenderContext = {}): ReactNode[] {
  return renderRange(tokens, 0, tokens.length, ctx)
}

/**
 * The last run of text in a document.
 *
 * This is the text the agent is still writing, so it is the text revealed
 * word by word. A document made only of code has no such run.
 */
export function findRevealTarget(tokens: Token[]): Token | undefined {
  let target: Token | undefined

  const visit = (list: Token[]) => {
    for (const token of list) {
      if (token.type === "inline") {
        for (const child of token.children ?? []) {
          if (child.type === "text" && child.content.trim().length > 0) target = child
        }
        continue
      }
      if (token.children) visit(token.children)
    }
  }

  visit(tokens)

  return target
}

/**
 * Renders a range of tokens.
 *
 * The token stream is flat: an opening token, its content, a closing token.
 * A container is rendered by walking its content and handing the result to
 * the element that wraps it.
 */
function renderRange(tokens: Token[], from: number, to: number, ctx: RenderContext): ReactNode[] {
  const out: ReactNode[] = []
  let index = from

  while (index < to) {
    const token = tokens[index]!

    if (token.nesting === 1) {
      const close = findClose(tokens, index, to)

      if (token.type === "list_item_open") {
        out.push(renderListItem(tokens, index, close, ctx, index))
      } else if (token.hidden) {
        // A tight list hides the paragraph around an item. The text still
        // shows, it just does not sit in a block of its own.
        out.push(
          <Fragment key={index}>{renderRange(tokens, index + 1, close, ctx)}</Fragment>,
        )
      } else {
        out.push(renderContainer(token, renderRange(tokens, index + 1, close, ctx), index))
      }

      index = close + 1
      continue
    }

    if (token.type === "inline") {
      const children = token.children ?? []
      out.push(
        <Fragment key={index}>
          {renderTaskBox(token, ctx)}
          {renderRange(children, 0, children.length, ctx)}
        </Fragment>,
      )
      index += 1
      continue
    }

    out.push(renderLeaf(token, ctx, index))
    index += 1
  }

  return out
}

/** The index of the token that closes the one at `open`. */
function findClose(tokens: Token[], open: number, to: number): number {
  let level = 0

  for (let index = open; index < to; index++) {
    const token = tokens[index]!
    if (token.nesting === 1) level += 1
    if (token.nesting === -1) level -= 1
    if (level === 0) return index
  }

  return to
}

/** The element that wraps the content of a container token. */
function renderContainer(token: Token, inner: ReactNode[], key: number): ReactNode {
  switch (token.type) {
    case "paragraph_open":
      return (
        <p key={key} className={popolaClass.markdownParagraph}>
          {inner}
        </p>
      )

    case "heading_open": {
      const level = Number(token.tag.slice(1))
      const Tag = token.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      return (
        <Tag key={key} className={className(popolaClass.markdownHeading, headingModifier(level))}>
          {inner}
        </Tag>
      )
    }

    case "bullet_list_open":
    case "ordered_list_open": {
      const Tag = token.tag as "ul" | "ol"
      // An ordered list can start at a number other than one.
      const start = Tag === "ol" ? token.attrGet("start") : null
      return (
        <Tag
          key={key}
          className={className(popolaClass.markdownList, {
            [popolaClass.markdownListNested]: token.level > 0,
          })}
          start={start === null ? undefined : Number(start)}
        >
          {inner}
        </Tag>
      )
    }

    case "blockquote_open":
      return (
        <blockquote key={key} className={popolaClass.markdownQuote}>
          {inner}
        </blockquote>
      )

    case "table_open":
      return (
        <div key={key} className={popolaClass.markdownTableWrap}>
          <table className={popolaClass.markdownTable}>{inner}</table>
        </div>
      )

    case "tr_open":
      return (
        <tr key={key} className={popolaClass.markdownTableRow}>
          {inner}
        </tr>
      )

    case "th_open":
      return (
        <th key={key} className={popolaClass.markdownTableHead}>
          {inner}
        </th>
      )

    case "td_open":
      return (
        <td key={key} className={popolaClass.markdownTableCell}>
          {inner}
        </td>
      )

    case "strong_open":
      return (
        <strong key={key} className={popolaClass.markdownStrong}>
          {inner}
        </strong>
      )

    case "em_open":
      return (
        <em key={key} className={popolaClass.markdownEmphasis}>
          {inner}
        </em>
      )

    case "s_open":
      return (
        <del key={key} className={popolaClass.markdownStrikethrough}>
          {inner}
        </del>
      )

    case "link_open":
      return (
        <a
          key={key}
          className={popolaClass.markdownLink}
          href={token.attrGet("href") ?? ""}
          title={token.attrGet("title") ?? undefined}
          target="_blank"
          rel="noreferrer noopener"
        >
          {inner}
        </a>
      )

    default:
      // A container the renderer has no element for. Its content still shows.
      return <Fragment key={key}>{inner}</Fragment>
  }
}

/**
 * A list item.
 *
 * An item whose text opens with a task marker gets a checkbox, and the marker
 * itself is dropped from the text.
 */
function renderListItem(
  tokens: Token[],
  open: number,
  close: number,
  ctx: RenderContext,
  key: number,
): ReactNode {
  const inline = findInline(tokens, open + 1, close)
  const marker = inline ? TASK_MARKER.exec(inline.content) : null
  const first = inline?.children?.[0]
  const isTask = marker !== null && first?.type === "text" && first.content.startsWith(marker[0])

  if (!inline || !marker || !first || !isTask) {
    return (
      <li key={key} className={popolaClass.markdownListItem}>
        {renderRange(tokens, open + 1, close, ctx)}
      </li>
    )
  }

  const nested: RenderContext = {
    ...ctx,
    strip: { parent: inline, first, text: marker[0], checked: marker[1] !== " " },
  }

  return (
    <li key={key} className={className(popolaClass.markdownListItem, popolaClass.markdownTask)}>
      {renderRange(tokens, open + 1, close, nested)}
    </li>
  )
}

/** The checkbox that replaces a task marker, in front of the text it marked. */
function renderTaskBox(token: Token, ctx: RenderContext): ReactNode {
  const strip = ctx.strip
  if (!strip || strip.parent !== token) return null
  const checked = strip.checked

  return (
    <span
      className={className(popolaClass.markdownTaskBox, {
        [popolaClass.markdownTaskBoxChecked]: checked,
      })}
      role="img"
      aria-label={checked ? "done" : "not done"}
    />
  )
}

/** The inline token of a list item. */
function findInline(tokens: Token[], from: number, to: number): Token | undefined {
  for (let index = from; index < to; index++) {
    const token = tokens[index]!
    if (token.type === "inline") return token
  }
  return undefined
}

/** A token that stands on its own. */
function renderLeaf(token: Token, ctx: RenderContext, key: number): ReactNode {
  switch (token.type) {
    case "text":
      return renderText(token, ctx, key)

    case "code_inline":
      return (
        <code key={key} className={popolaClass.markdownCode}>
          {token.content}
        </code>
      )

    case "fence":
    case "code_block":
      return (
        <pre key={key} className={popolaClass.markdownCodeBlock}>
          <code>{token.content}</code>
        </pre>
      )

    case "hr":
      return <hr key={key} className={popolaClass.markdownRule} />

    case "image":
      return (
        <img
          key={key}
          className={popolaClass.markdownImage}
          src={token.attrGet("src") ?? ""}
          alt={token.content}
          title={token.attrGet("title") ?? undefined}
        />
      )

    case "softbreak":
      // Markdown soft-wraps a paragraph: the line break is a space.
      return <Fragment key={key}>{"\n"}</Fragment>

    case "hardbreak":
      return <br key={key} />

    case "html_block":
    case "html_inline":
      // Raw HTML is shown as text. It is never parsed, so it cannot become an
      // element the stylesheet did not ask for.
      return <Fragment key={key}>{token.content}</Fragment>

    default:
      return null
  }
}

/** A run of plain text. */
function renderText(token: Token, ctx: RenderContext, key: number): ReactNode {
  const content = ctx.strip?.first === token ? token.content.slice(ctx.strip.text.length) : token.content

  if (ctx.reveal !== token) return <Fragment key={key}>{content}</Fragment>
  return <Fragment key={key}>{revealWords(content)}</Fragment>
}

/**
 * Words that fade in one by one, with the newest ones highlighted.
 *
 * The last two words carry the accent colour, and a cursor sits after them.
 */
function revealWords(content: string): ReactNode {
  const words = content.split(" ")

  return (
    <>
      {words.map((word, index) => (
        <span
          key={index}
          className={className(popolaClass.streamWord, {
            [popolaClass.streamWordFresh]: index >= words.length - 2,
          })}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
      <span className={popolaClass.streamCursor} />
    </>
  )
}

/** The heading class for a level. */
function headingModifier(level: number): string | undefined {
  switch (level) {
    case 1:
      return popolaClass.markdownHeading1
    case 2:
      return popolaClass.markdownHeading2
    case 3:
      return popolaClass.markdownHeading3
    case 4:
      return popolaClass.markdownHeading4
    case 5:
      return popolaClass.markdownHeading5
    case 6:
      return popolaClass.markdownHeading6
    default:
      return undefined
  }
}
