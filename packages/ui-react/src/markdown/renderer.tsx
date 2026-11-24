import { Fragment, type ReactNode } from "react"
import type { Token } from "markdown-it"
import { popolaClass } from "popola-ui"
import className from "licia/className"

/** Extra state the block walkers need beyond the tokens themselves. */
export type RenderContext = {
  /** Last text token, revealed word by word while the agent writes. */
  readonly reveal?: Token
  /** Task marker to strip from the list item, and the checkbox replacing it. */
  readonly strip?: {
    /** Inline token the marker opens. */
    readonly parent: Token
    /** Text token the marker sits in. */
    readonly first: Token
    readonly text: string
    readonly checked: boolean
  }
}

/** `- [ ] todo` / `- [x] done`; an item with only a marker still counts. */
const TASK_MARKER = /^\[([ xX])\](?:[ \t]+|$)/

/** Renders a parsed document's blocks. */
export function renderBlocks(tokens: Token[], ctx: RenderContext = {}): ReactNode[] {
  return renderRange(tokens, 0, tokens.length, ctx)
}

/** Last non-empty text token — the text still being written. */
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

/** Walks the flat token stream, wrapping each container's content in its element. */
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
        // Tight lists hide the item's paragraph; render its content inline.
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
      // Unknown container: still render its content.
      return <Fragment key={key}>{inner}</Fragment>
  }
}

/** Renders a task item's checkbox and strips its marker from the text. */
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

/** The checkbox that replaces a task marker. */
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

function findInline(tokens: Token[], from: number, to: number): Token | undefined {
  for (let index = from; index < to; index++) {
    const token = tokens[index]!
    if (token.type === "inline") return token
  }
  return undefined
}

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
      // `white-space: normal` folds this newline into a space.
      return <Fragment key={key}>{"\n"}</Fragment>

    case "hardbreak":
      return <br key={key} />

    case "html_block":
    case "html_inline":
      // See parser.ts: raw HTML is shown as text, never parsed.
      return <Fragment key={key}>{token.content}</Fragment>

    default:
      return null
  }
}

function renderText(token: Token, ctx: RenderContext, key: number): ReactNode {
  const content = ctx.strip?.first === token ? token.content.slice(ctx.strip.text.length) : token.content

  if (ctx.reveal !== token) return <Fragment key={key}>{content}</Fragment>
  return <Fragment key={key}>{revealWords(content)}</Fragment>
}

/** Fades words in; the last two keep the accent colour, then a cursor. */
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

const HEADING_CLASS = [
  popolaClass.markdownHeading1,
  popolaClass.markdownHeading2,
  popolaClass.markdownHeading3,
  popolaClass.markdownHeading4,
  popolaClass.markdownHeading5,
  popolaClass.markdownHeading6,
] as const

function headingModifier(level: number): string | undefined {
  return HEADING_CLASS[level - 1]
}
