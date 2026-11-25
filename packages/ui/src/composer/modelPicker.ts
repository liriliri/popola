/**
 * Presentational data shapes for the composer model / provider menu.
 * Hosts own storage and selection; this module only filters and labels rows.
 */

export type ComposerModelOption = {
  readonly id: string
  readonly label: string
}

export type ComposerModelGroup = {
  readonly providerId: string
  readonly providerLabel: string
  readonly models: readonly ComposerModelOption[]
}

export type ComposerModelFlatRow = {
  readonly providerId: string
  readonly providerLabel: string
  readonly modelId: string
  readonly modelLabel: string
  readonly haystack: string
}

/** Flatten groups into searchable rows. */
export function flattenComposerModelGroups(
  groups: readonly ComposerModelGroup[],
): ComposerModelFlatRow[] {
  return groups.flatMap((group) =>
    group.models.map((model) => ({
      providerId: group.providerId,
      providerLabel: group.providerLabel,
      modelId: model.id,
      modelLabel: model.label,
      haystack:
        `${group.providerLabel} ${group.providerId} ${model.label} ${model.id}`.toLowerCase(),
    })),
  )
}

/** Case-insensitive substring filter; empty query keeps every row. */
export function filterComposerModelRows(
  rows: readonly ComposerModelFlatRow[],
  query: string,
): ComposerModelFlatRow[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...rows]
  return rows.filter((row) => row.haystack.includes(needle))
}

/** Regroup filtered flat rows for rendering. */
export function groupComposerModelRows(
  rows: readonly ComposerModelFlatRow[],
): ComposerModelGroup[] {
  const order: string[] = []
  const map = new Map<string, ComposerModelGroup & { models: ComposerModelOption[] }>()
  for (const row of rows) {
    let group = map.get(row.providerId)
    if (!group) {
      group = {
        providerId: row.providerId,
        providerLabel: row.providerLabel,
        models: [],
      }
      map.set(row.providerId, group)
      order.push(row.providerId)
    }
    group.models.push({ id: row.modelId, label: row.modelLabel })
  }
  return order.map((id) => map.get(id)!)
}
