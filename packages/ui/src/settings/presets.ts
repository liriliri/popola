/**
 * Named OpenAI-compatible endpoint presets for the settings provider form.
 * Transport is the host's concern; these only seed id, base URL, and model ids.
 */

export const CUSTOM_PROVIDER_ID = "custom" as const

export type ProviderPreset = {
  readonly id: string
  /** Display name; hosts may localize via a label map. */
  readonly name: string
  /** Value stored as the session's `provider` field. */
  readonly provider: string
  readonly baseUrl: string
  /** Suggested model ids; the first is the default when the preset is picked. */
  readonly models: readonly string[]
  readonly aliases?: readonly string[]
}

/** Short mainstream list — not the full models.dev catalog. */
export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  {
    id: "openai",
    name: "OpenAI",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "o3", "o4-mini"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4",
      "google/gemini-2.5-pro",
      "deepseek/deepseek-chat",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3-32b"],
  },
  {
    id: "moonshot",
    name: "Moonshot",
    provider: "moonshot",
    baseUrl: "https://api.moonshot.cn/v1",
    models: ["kimi-k2-turbo-preview", "kimi-latest", "moonshot-v1-auto"],
    aliases: ["kimi", "moonshotai"],
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    provider: "siliconflow",
    baseUrl: "https://api.siliconflow.cn/v1",
    models: [
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen3-235B-A22B",
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    provider: "minimax",
    baseUrl: "https://api.minimaxi.com/v1",
    models: ["MiniMax-M2", "MiniMax-M2.5", "MiniMax-Text-01"],
    aliases: ["minimaxi"],
  },
]

export function defaultProviderPresetModel(preset: ProviderPreset): string {
  return preset.models[0] ?? ""
}

export type ProviderPresetMatchInput = {
  readonly provider?: string | null
  readonly baseUrl?: string | null
}

/** Split `https://host/path` without relying on the DOM `URL` global. */
function splitEndpointUrl(value: string): { protocol: string; host: string; pathname: string } | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)([^?#]*)/i.exec(value.trim())
  if (!match) return null
  return {
    protocol: match[1]!.toLowerCase(),
    host: match[2]!.toLowerCase(),
    pathname: match[3] ?? "",
  }
}

/** Canonical form of a configured endpoint for preset matching. */
export function normalizeProviderEndpointUrl(value: string | undefined | null): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  const parsed = splitEndpointUrl(raw)
  if (!parsed) return raw.replace(/\/+$/, "").toLowerCase()
  const pathname = parsed.pathname.replace(/\/+$/, "")
  return `${parsed.protocol}://${parsed.host}${pathname}`
}

function endpointHost(value: string | undefined | null): string | undefined {
  const normalized = normalizeProviderEndpointUrl(value)
  if (!normalized) return undefined
  return splitEndpointUrl(normalized)?.host
}

export function findProviderPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((preset) => preset.id === id)
}

/**
 * Resolve a saved row to a named preset, or `custom` when nothing matches.
 * Prefer an exact base URL, then host, then provider id / aliases.
 */
export function matchProviderPreset(
  input: ProviderPresetMatchInput,
  presets: readonly ProviderPreset[] = PROVIDER_PRESETS,
): ProviderPreset | undefined {
  const url = normalizeProviderEndpointUrl(input.baseUrl)
  if (url) {
    const byUrl = presets.find(
      (preset) => normalizeProviderEndpointUrl(preset.baseUrl) === url,
    )
    if (byUrl) return byUrl
  }

  const host = endpointHost(input.baseUrl)
  if (host) {
    const byHost = presets.find((preset) => endpointHost(preset.baseUrl) === host)
    if (byHost) return byHost
  }

  const provider = (input.provider ?? "").trim().toLowerCase()
  if (!provider) return undefined

  return presets.find((preset) => {
    if (preset.id === provider || preset.provider === provider) return true
    return preset.aliases?.some((alias) => alias.toLowerCase() === provider) ?? false
  })
}

/** Host + path under the label in the chooser. */
export function providerPresetEndpointLabel(url: string): string {
  const parsed = splitEndpointUrl(url)
  if (!parsed) return url
  return parsed.host + parsed.pathname.replace(/\/+$/, "")
}

export type ProviderChooserOption = {
  readonly id: string
  readonly label: string
  /** Secondary line under the label (endpoint host, or a custom hint). */
  readonly detail: string
  /** Lowercased search haystack. */
  readonly haystack: string
}

/** Build chooser rows: custom first, then named presets. */
export function providerChooserOptions(input: {
  presets?: readonly ProviderPreset[]
  /** Localized labels keyed by preset id; falls back to `preset.name`. */
  labels?: Readonly<Record<string, string>>
  customLabel: string
  customDetail: string
}): ProviderChooserOption[] {
  const presets = input.presets ?? PROVIDER_PRESETS
  const custom: ProviderChooserOption = {
    id: CUSTOM_PROVIDER_ID,
    label: input.customLabel,
    detail: input.customDetail,
    haystack: `${input.customLabel} custom endpoint`.toLowerCase(),
  }

  const named = presets.map((preset): ProviderChooserOption => {
    const label = input.labels?.[preset.id] ?? preset.name
    const endpoint = providerPresetEndpointLabel(preset.baseUrl)
    const aliases = preset.aliases?.join(" ") ?? ""
    return {
      id: preset.id,
      label,
      detail: endpoint,
      haystack:
        `${label} ${preset.name} ${preset.id} ${preset.provider} ${aliases} ${preset.baseUrl} ${endpoint}`.toLowerCase(),
    }
  })

  return [custom, ...named]
}

/** Case-insensitive substring match; an empty query keeps every option. */
export function filterProviderChooserOptions<T extends { haystack: string }>(
  options: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...options]
  return options.filter((option) => option.haystack.includes(needle))
}
