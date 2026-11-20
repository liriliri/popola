/**
 * Class names for rendered Markdown.
 *
 * The stylesheet targets these names and nothing else, so a renderer in any
 * framework produces the same look by using the same strings. Every element a
 * Markdown document produces carries its own class — the stylesheet never
 * reaches down to a child, so a renderer is free to nest differently.
 */
export const markdownClass = {
  /** The container every Markdown block renders inside. */
  markdown: "popola-markdown",

  markdownParagraph: "popola-markdown__paragraph",

  markdownHeading: "popola-markdown__heading",
  markdownHeading1: "popola-markdown__heading--1",
  markdownHeading2: "popola-markdown__heading--2",
  markdownHeading3: "popola-markdown__heading--3",
  markdownHeading4: "popola-markdown__heading--4",
  markdownHeading5: "popola-markdown__heading--5",
  markdownHeading6: "popola-markdown__heading--6",

  markdownList: "popola-markdown__list",
  /** A list nested in another list. */
  markdownListNested: "popola-markdown__list--nested",
  markdownListItem: "popola-markdown__list-item",
  /** A list item that carries a checkbox. */
  markdownTask: "popola-markdown__task",
  markdownTaskBox: "popola-markdown__task-box",
  markdownTaskBoxChecked: "popola-markdown__task-box--checked",

  markdownQuote: "popola-markdown__quote",

  /** Code inside a line. */
  markdownCode: "popola-markdown__code",
  /** A fenced or indented code block. */
  markdownCodeBlock: "popola-markdown__code-block",

  markdownLink: "popola-markdown__link",
  markdownImage: "popola-markdown__image",

  markdownTableWrap: "popola-markdown__table-wrap",
  markdownTable: "popola-markdown__table",
  markdownTableRow: "popola-markdown__table-row",
  markdownTableCell: "popola-markdown__table-cell",
  markdownTableHead: "popola-markdown__table-head",

  markdownRule: "popola-markdown__rule",

  markdownStrong: "popola-markdown__strong",
  markdownEmphasis: "popola-markdown__emphasis",
  markdownStrikethrough: "popola-markdown__strikethrough",
} as const
