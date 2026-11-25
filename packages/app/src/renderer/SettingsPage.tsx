import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CUSTOM_PROVIDER_ID,
  PROVIDER_PRESETS,
  defaultProviderPresetModel,
  findProviderPreset,
  matchProviderPreset,
  popolaClass,
  providerChooserOptions,
  providerPresetEndpointLabel,
} from "popola-ui"
import className from "licia/className"
import {
  PopolaDialog,
  SettingsCard,
  SettingsCredentialsField,
  SettingsLayout,
  SettingsModelPanes,
  SettingsPage as SettingsPageContent,
  SettingsProviderChooser,
  SettingsSection,
  SettingsSelect,
  SettingsServiceChip,
  SettingsServicePanel,
  SettingsSidebar,
  SettingsSidebarGroup,
  SettingsSidebarItem,
  SettingsThemePicker,
  useToast,
  type PopolaTheme,
  type SettingsServiceRowData,
} from "popola-ui-react"
import type { ProviderAccount, ProviderConfig } from "../shared/types"
import { accountEnabled } from "../shared/types"
import { bridge } from "./bridge"
import { LANGUAGE_OPTIONS, useAppLanguage, type AppLanguage } from "./i18n"
import { TitlebarChrome } from "./TitlebarChrome"
import { getAppThemeOptions } from "./themes"

type LanguageSelectOption = { value: AppLanguage; label: string }

type AccountDraft = {
  id: string
  name: string
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  models: string[]
  catalog: string[]
  enabled: boolean
}

const emptyDraft = (): AccountDraft => ({
  id: "",
  name: "",
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  models: [],
  catalog: [],
  enabled: true,
})

type SettingsSectionId = "appearance" | "provider"

/** null = closed; "new" = add; account id = edit; `{ copyFrom }` = duplicate. */
type SetupTarget = null | "new" | string | { copyFrom: string }

function accountToDraft(account: ProviderAccount, activeModel: string): AccountDraft {
  return {
    id: account.id,
    name: account.name,
    provider: account.provider,
    baseUrl: account.baseUrl,
    apiKey: account.apiKey,
    model: account.models.includes(activeModel) ? activeModel : (account.models[0] ?? ""),
    models: [...account.models],
    catalog: account.catalog ? [...account.catalog] : [],
    enabled: accountEnabled(account),
  }
}

function accountToCopyDraft(account: ProviderAccount, name: string): AccountDraft {
  return {
    id: `copy:${account.id}-${Date.now().toString(36)}`,
    name,
    provider: account.provider,
    baseUrl: account.baseUrl,
    apiKey: "",
    model: account.models[0] ?? "",
    models: [...account.models],
    catalog: account.catalog ? [...account.catalog] : [],
    enabled: true,
  }
}

function applyPreset(draft: AccountDraft, presetId: string): AccountDraft {
  if (presetId === CUSTOM_PROVIDER_ID) {
    return {
      ...draft,
      id: draft.id.startsWith("custom:") ? draft.id : "",
      name: draft.name || "",
      provider: draft.provider || "",
      baseUrl: draft.baseUrl || "",
      models: draft.models.length ? draft.models : draft.model ? [draft.model] : [],
      catalog: [],
    }
  }
  const preset = findProviderPreset(presetId)
  if (!preset) return draft
  const models = draft.models.length ? draft.models : [...preset.models]
  const model =
    draft.model && models.includes(draft.model) ? draft.model : defaultProviderPresetModel(preset)
  return {
    ...draft,
    id: preset.id,
    name: preset.name,
    provider: preset.provider,
    baseUrl: preset.baseUrl,
    model,
    models,
    catalog: [],
  }
}

function isLocalBaseUrl(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase()
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1"
  } catch {
    return false
  }
}

function draftToAccount(draft: AccountDraft): ProviderAccount | null {
  const provider = draft.provider.trim()
  const baseUrl = draft.baseUrl.trim()
  const apiKey = draft.apiKey.trim()
  const model = draft.model.trim()
  const models = [
    ...new Set(
      [...draft.models, model].map((item) => item.trim()).filter(Boolean),
    ),
  ]
  const catalog = [
    ...new Set(draft.catalog.map((item) => item.trim()).filter(Boolean)),
  ]
  if (!provider || !baseUrl || models.length === 0) return null
  if (!apiKey && !isLocalBaseUrl(baseUrl)) return null
  const matched = matchProviderPreset({ provider, baseUrl })
  const id = draft.id.trim() || matched?.id || `custom:${baseUrl}`
  const name = draft.name.trim() || matched?.name || provider
  return {
    id,
    name,
    provider,
    baseUrl,
    apiKey,
    models,
    ...(catalog.length > 0 ? { catalog } : {}),
    enabled: draft.enabled,
  }
}

function upsertAccount(config: ProviderConfig | null, account: ProviderAccount, model: string): ProviderConfig {
  const accounts = config?.accounts ?? []
  const index = accounts.findIndex((item) => item.id === account.id)
  const nextAccounts =
    index >= 0
      ? accounts.map((item, i) => (i === index ? account : item))
      : [...accounts, account]

  const editingExisting = index >= 0
  const keepCurrentActive =
    editingExisting &&
    config != null &&
    config.activeAccountId !== account.id &&
    nextAccounts.some((item) => item.id === config.activeAccountId)

  if (keepCurrentActive) {
    return {
      accounts: nextAccounts,
      activeAccountId: config.activeAccountId,
      model: config.model,
    }
  }

  return {
    accounts: nextAccounts,
    activeAccountId: account.id,
    model,
  }
}

function removeAccount(config: ProviderConfig, accountId: string): ProviderConfig | null {
  const accounts = config.accounts.filter((account) => account.id !== accountId)
  if (accounts.length === 0) return null
  const activeAccountId =
    config.activeAccountId === accountId ? accounts[0]!.id : config.activeAccountId
  const active = accounts.find((account) => account.id === activeAccountId) ?? accounts[0]!
  const model = active.models.includes(config.model) ? config.model : active.models[0]!
  return { accounts, activeAccountId, model }
}

function ProviderSetupDialog(props: {
  config: ProviderConfig | null
  editing: ProviderAccount | null
  seed?: AccountDraft | null
  saving: boolean
  onClose: () => void
  onSave: (config: ProviderConfig) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [draft, setDraft] = useState<AccountDraft>(() => {
    if (props.editing) {
      return accountToDraft(
        props.editing,
        props.config?.model ?? props.editing.models[0] ?? "",
      )
    }
    if (props.seed) return props.seed
    return emptyDraft()
  })
  const [serviceId, setServiceId] = useState(() => {
    const source = props.editing ?? props.seed
    if (!source) return ""
    return matchProviderPreset(source)?.id ?? CUSTOM_PROVIDER_ID
  })
  const [choosing, setChoosing] = useState(!props.editing && !props.seed)
  const [fetchingModels, setFetchingModels] = useState(false)

  const namedPreset =
    serviceId && serviceId !== CUSTOM_PROVIDER_ID ? findProviderPreset(serviceId) : undefined

  const requestBaseUrl = (namedPreset?.baseUrl || draft.baseUrl).trim()
  const apiKey = draft.apiKey.trim()
  const canFetchModels = (() => {
    try {
      const url = new URL(requestBaseUrl)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  })()
  const canProbeWithoutKey = isLocalBaseUrl(requestBaseUrl)

  const modelSuggestions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of [...draft.catalog, ...(namedPreset?.models ?? [])]) {
      const trimmed = id.trim()
      if (!trimmed || seen.has(trimmed.toLowerCase())) continue
      seen.add(trimmed.toLowerCase())
      out.push(trimmed)
    }
    return out
  }, [draft.catalog, namedPreset])

  const fetchModels = async () => {
    if (!canFetchModels || fetchingModels) return
    if (!apiKey && !canProbeWithoutKey) {
      toast.show(t("provider.fetchModelsNeedKey"), { variant: "error" })
      return
    }
    setFetchingModels(true)
    try {
      const api = bridge()
      if (typeof api.listModels !== "function") {
        toast.show(t("provider.fetchModelsRestart"), { variant: "error" })
        return
      }
      const result = await api.listModels({
        baseUrl: requestBaseUrl,
        apiKey: apiKey || undefined,
      })
      if (!result.ok) {
        toast.show(result.error, { variant: "error" })
        return
      }
      setDraft((current) => ({ ...current, catalog: result.models }))
      toast.show(t("provider.fetchModelsOk", { count: result.models.length }), {
        variant: "success",
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("provider.fetchModelsFailed")
      toast.show(message, { variant: "error" })
    } finally {
      setFetchingModels(false)
    }
  }

  const presetLabels = useMemo(
    (): Record<string, string> =>
      Object.fromEntries(
        PROVIDER_PRESETS.map((preset) => [preset.id, t(`provider.presets.${preset.id}`)]),
      ),
    [t],
  )

  const chooserOptions = useMemo(
    () =>
      providerChooserOptions({
        labels: presetLabels,
        customLabel: t("provider.custom"),
        customDetail: t("provider.customDetail"),
      }),
    [presetLabels, t],
  )

  const serviceLabel = !serviceId
    ? t("provider.chooseService")
    : serviceId === CUSTOM_PROVIDER_ID
      ? t("provider.custom")
      : (presetLabels[serviceId] ?? namedPreset?.name ?? t("provider.chooseService"))

  const update = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const setModels = (models: string[]) => {
    setDraft((current) => ({
      ...current,
      models,
      model: current.model && models.includes(current.model) ? current.model : (models[0] ?? ""),
    }))
  }

  const save = async () => {
    const ready =
      namedPreset && draft.models.length === 0
        ? { ...draft, models: [...namedPreset.models], model: defaultProviderPresetModel(namedPreset) }
        : draft
    const account = draftToAccount(ready)
    if (!account) {
      toast.show(
        !draft.apiKey.trim()
          ? t("provider.missingKey")
          : draft.models.length === 0
            ? t("provider.missingModels")
            : t("provider.missingFields"),
        { variant: "error" },
      )
      return
    }
    const activeModel =
      props.config?.activeAccountId === account.id &&
      account.models.includes(props.config.model)
        ? props.config.model
        : draft.model && account.models.includes(draft.model)
          ? draft.model
          : account.models[0]!
    const ok = await props.onSave(upsertAccount(props.config, account, activeModel))
    if (ok) props.onClose()
  }

  const title = choosing
    ? t("provider.chooseService")
    : props.editing
      ? t("provider.editTitle")
      : props.seed
        ? t("provider.copyTitle")
        : t("provider.addTitle")

  return (
    <PopolaDialog
      title={title}
      setup
      onClose={props.onClose}
      actions={
        choosing ? (
          <button
            type="button"
            className={className(popolaClass.button, popolaClass.buttonGhost)}
            disabled={props.saving}
            onClick={serviceId ? () => setChoosing(false) : props.onClose}
          >
            {t("provider.cancel")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={className(popolaClass.button, popolaClass.buttonGhost)}
              disabled={props.saving}
              onClick={props.onClose}
            >
              {t("provider.cancel")}
            </button>
            <button
              type="button"
              className={className(popolaClass.button, popolaClass.buttonPrimary)}
              disabled={props.saving}
              onClick={() => {
                void save()
              }}
            >
              {props.saving ? t("provider.saving") : t("provider.save")}
            </button>
          </>
        )
      }
    >
      {choosing ? (
        <SettingsProviderChooser
          options={chooserOptions}
          current={serviceId || undefined}
          searchPlaceholder={t("provider.searchService")}
          emptyLabel={t("provider.noServiceMatches")}
          emptyActionLabel={t("provider.useCustom")}
          disabled={props.saving}
          onPick={(id) => {
            setServiceId(id)
            setDraft((current) => applyPreset(current, id))
            setChoosing(false)
          }}
        />
      ) : (
        <>
          <div className={popolaClass.settingsCredentials}>
            <div className={popolaClass.settingsCredentialsRow}>
              <SettingsCredentialsField label={t("provider.service")}>
                <SettingsServiceChip
                  name={serviceLabel}
                  detail={
                    namedPreset
                      ? providerPresetEndpointLabel(namedPreset.baseUrl)
                      : draft.baseUrl
                        ? providerPresetEndpointLabel(draft.baseUrl)
                        : undefined
                  }
                />
              </SettingsCredentialsField>
              <SettingsCredentialsField label={t("provider.apiKey")}>
                <input
                  className={popolaClass.settingsInput}
                  type="password"
                  value={draft.apiKey}
                  placeholder="sk-…"
                  autoComplete="off"
                  disabled={props.saving}
                  aria-label={t("provider.apiKey")}
                  onChange={(event) => update("apiKey", event.target.value)}
                />
              </SettingsCredentialsField>
            </div>

            {namedPreset ? null : (
              <div className={popolaClass.settingsCredentialsRow}>
                <SettingsCredentialsField label={t("provider.provider")}>
                  <input
                    className={popolaClass.settingsInput}
                    value={draft.provider}
                    placeholder="openai"
                    autoComplete="off"
                    disabled={props.saving}
                    aria-label={t("provider.provider")}
                    onChange={(event) => update("provider", event.target.value)}
                  />
                </SettingsCredentialsField>
                <SettingsCredentialsField label={t("provider.baseUrl")}>
                  <input
                    className={popolaClass.settingsInput}
                    value={draft.baseUrl}
                    placeholder="https://api.openai.com/v1"
                    inputMode="url"
                    autoComplete="off"
                    disabled={props.saving}
                    aria-label={t("provider.baseUrl")}
                    onChange={(event) => update("baseUrl", event.target.value)}
                  />
                </SettingsCredentialsField>
              </div>
            )}
          </div>

          <SettingsModelPanes
            value={draft.models}
            suggestions={modelSuggestions}
            disabled={props.saving}
            availableTitle={t("provider.availableModels")}
            chosenTitle={t("provider.chosenModels")}
            searchAvailablePlaceholder={t("provider.searchModels")}
            searchChosenPlaceholder={t("provider.searchChosen")}
            availableEmptyLabel={t("provider.availableEmpty")}
            chosenEmptyLabel={t("provider.chosenEmpty")}
            noMatchLabel={t("provider.noModelMatches")}
            addPlaceholder={t("provider.addModelPlaceholder")}
            addLabel={t("provider.addModel")}
            removeLabel={t("provider.removeModel")}
            selectAllLabel={t("provider.selectAllModels")}
            deselectAllLabel={t("provider.deselectAllModels")}
            reloadLabel={t("provider.fetchModels")}
            reloadingLabel={t("provider.fetchingModels")}
            reloading={fetchingModels}
            canReload={canFetchModels && !props.saving}
            onReload={() => {
              void fetchModels()
            }}
            onChange={setModels}
          />
        </>
      )}
    </PopolaDialog>
  )
}

function ProviderSection(props: {
  config: ProviderConfig | null
  saving: boolean
  onSave: (config: ProviderConfig) => Promise<boolean>
  onClear: () => Promise<boolean>
}) {
  const { t } = useTranslation()
  const [setupFor, setSetupFor] = useState<SetupTarget>(null)

  const presetLabels = useMemo(
    (): Record<string, string> =>
      Object.fromEntries(
        PROVIDER_PRESETS.map((preset) => [preset.id, t(`provider.presets.${preset.id}`)]),
      ),
    [t],
  )

  const rows = useMemo((): SettingsServiceRowData[] => {
    if (!props.config) return []
    return props.config.accounts.map((account) => ({
      id: account.id,
      name: presetLabels[account.id] ?? account.name,
      meta: [
        t("provider.modelCount", { count: account.models.length }),
        providerPresetEndpointLabel(account.baseUrl),
      ],
      active: account.id === props.config?.activeAccountId,
      enabled: accountEnabled(account),
    }))
  }, [props.config, presetLabels, t])

  const editingId =
    typeof setupFor === "string" && setupFor !== "new" ? setupFor : null
  const copyFromId =
    setupFor && typeof setupFor === "object" ? setupFor.copyFrom : null

  const editing =
    editingId && props.config
      ? (props.config.accounts.find((account) => account.id === editingId) ?? null)
      : null

  const copySource =
    copyFromId && props.config
      ? (props.config.accounts.find((account) => account.id === copyFromId) ?? null)
      : null

  const copySeed = useMemo(() => {
    if (!copySource) return null
    const label = presetLabels[copySource.id] ?? copySource.name
    return accountToCopyDraft(copySource, t("provider.copyName", { name: label }))
  }, [copySource, presetLabels, t])

  const closeSetup = () => {
    setSetupFor(null)
  }

  const removeAccountById = async (accountId: string) => {
    if (!props.config) return false
    const next = removeAccount(props.config, accountId)
    if (!next) return props.onClear()
    return props.onSave(next)
  }

  const toggleEnabled = async (accountId: string, enabled: boolean) => {
    if (!props.config) return
    const accounts = props.config.accounts.map((account) =>
      account.id === accountId ? { ...account, enabled } : account,
    )
    let activeAccountId = props.config.activeAccountId
    let model = props.config.model
    const active = accounts.find((account) => account.id === activeAccountId)
    if (!active || !accountEnabled(active)) {
      const fallback = accounts.find(accountEnabled) ?? accounts[0]
      if (fallback) {
        activeAccountId = fallback.id
        model = fallback.models.includes(model) ? model : (fallback.models[0] ?? model)
      }
    }
    await props.onSave({ accounts, activeAccountId, model })
  }

  const dialogKey =
    setupFor === null
      ? "closed"
      : typeof setupFor === "string"
        ? setupFor
        : `copy:${setupFor.copyFrom}`

  return (
    <>
      <SettingsServicePanel
        title={t("section.provider")}
        countLabel={
          rows.length > 0 ? t("provider.serviceCount", { count: rows.length }) : undefined
        }
        addLabel={t("provider.addAccount")}
        emptyTitle={t("provider.emptyTitle")}
        emptyDescription={t("provider.emptyDesc")}
        enableLabel={t("provider.enabledToggle")}
        editLabel={t("provider.edit")}
        copyLabel={t("provider.copy")}
        deleteLabel={t("provider.delete")}
        deleteConfirmLabel={t("provider.deleteConfirm")}
        rows={rows}
        busy={props.saving}
        onAdd={() => {
          setSetupFor("new")
        }}
        onOpen={(id) => {
          setSetupFor(id)
        }}
        onCopy={(id) => {
          setSetupFor({ copyFrom: id })
        }}
        onRemove={(id) => {
          void removeAccountById(id)
        }}
        onToggleEnabled={(id, enabled) => {
          void toggleEnabled(id, enabled)
        }}
      />

      {setupFor !== null ? (
        <ProviderSetupDialog
          key={dialogKey}
          config={props.config}
          editing={editing}
          seed={copySeed}
          saving={props.saving}
          onClose={closeSetup}
          onSave={props.onSave}
        />
      ) : null}
    </>
  )
}

export function SettingsPage(props: {
  initial: ProviderConfig | null
  theme: PopolaTheme
  saving: boolean
  onThemeChange: (theme: PopolaTheme) => void
  onBack: () => void
  onSave: (config: ProviderConfig) => Promise<boolean>
  onClearProvider: () => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { language, setLanguage } = useAppLanguage()
  const [section, setSection] = useState<SettingsSectionId>(
    props.initial ? "appearance" : "provider",
  )

  const languageOptions = useMemo(
    (): LanguageSelectOption[] =>
      LANGUAGE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  )

  const themeOptions = useMemo(() => getAppThemeOptions(t), [t])

  return (
    <SettingsLayout
      className="app-settings-layout"
      header={<TitlebarChrome />}
      sidebar={
        <SettingsSidebar
          className="app-settings-sidebar"
          header={
            <>
              <TitlebarChrome />
              <SettingsSidebarItem label={t("nav.back")} onPress={props.onBack} />
            </>
          }
        >
          <SettingsSidebarGroup label={t("nav.preferences")}>
            <SettingsSidebarItem
              label={t("nav.appearance")}
              selected={section === "appearance"}
              onPress={() => setSection("appearance")}
            />
          </SettingsSidebarGroup>
          <SettingsSidebarGroup label={t("nav.agent")}>
            <SettingsSidebarItem
              label={t("nav.provider")}
              selected={section === "provider"}
              onPress={() => setSection("provider")}
            />
          </SettingsSidebarGroup>
        </SettingsSidebar>
      }
    >
      <SettingsPageContent>
        {section === "appearance" ? (
          <>
            <SettingsSection title={t("section.theme")}>
              <SettingsCard>
                <SettingsThemePicker
                  value={props.theme}
                  options={themeOptions}
                  onValueChange={props.onThemeChange}
                />
              </SettingsCard>
            </SettingsSection>
            <SettingsSection title={t("section.language")}>
              <SettingsCard>
                <SettingsSelect
                  label={t("language.label")}
                  hint={t("language.hint")}
                  value={language}
                  options={languageOptions}
                  onValueChange={setLanguage}
                />
              </SettingsCard>
            </SettingsSection>
          </>
        ) : (
          <ProviderSection
            config={props.initial}
            saving={props.saving}
            onSave={props.onSave}
            onClear={props.onClearProvider}
          />
        )}
      </SettingsPageContent>
    </SettingsLayout>
  )
}
