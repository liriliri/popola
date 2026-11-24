import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  SettingsLayout,
  SettingsPage as SettingsPageContent,
  SettingsSection,
  SettingsSelect,
  SettingsSidebar,
  SettingsSidebarGroup,
  SettingsSidebarItem,
  SettingsThemePicker,
  type PopolaTheme,
} from "popola-ui-react"
import type { ProviderConfig } from "../shared/types"
import { LANGUAGE_OPTIONS, useAppLanguage, type AppLanguage } from "./i18n"
import { TitlebarChrome } from "./TitlebarChrome"
import { getAppThemeOptions } from "./themes"

type LanguageSelectOption = { value: AppLanguage; label: string }

const empty: ProviderConfig = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
}

type SettingsSectionId = "appearance" | "provider"

function ProviderFields(props: {
  draft: ProviderConfig
  error: string | null
  saving: boolean
  intro?: string
  onChange: (key: keyof ProviderConfig, value: string) => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  return (
    <SettingsSection title={t("section.provider")}>
      {props.intro ? <p className="app-settings__intro">{props.intro}</p> : null}
      <SettingsCard>
        <SettingsInput
          label={t("provider.provider")}
          value={props.draft.provider}
          placeholder="openai"
          autoComplete="off"
          onValueChange={(value) => props.onChange("provider", value)}
        />
        <SettingsInput
          label={t("provider.baseUrl")}
          value={props.draft.baseUrl}
          placeholder="https://api.openai.com/v1"
          inputMode="url"
          autoComplete="off"
          onValueChange={(value) => props.onChange("baseUrl", value)}
        />
        <SettingsInput
          label={t("provider.apiKey")}
          value={props.draft.apiKey}
          type="password"
          autoComplete="off"
          onValueChange={(value) => props.onChange("apiKey", value)}
        />
        <SettingsInput
          label={t("provider.model")}
          value={props.draft.model}
          placeholder="gpt-4o"
          autoComplete="off"
          onValueChange={(value) => props.onChange("model", value)}
        />
        <SettingsAction
          label={t("provider.session")}
          hint={t("provider.sessionHint")}
          error={props.error}
          actionLabel={props.saving ? t("provider.saving") : t("provider.save")}
          disabled={props.saving}
          onPress={props.onSave}
        />
      </SettingsCard>
    </SettingsSection>
  )
}

export function SettingsPage(props: {
  initial: ProviderConfig
  theme: PopolaTheme
  error: string | null
  saving: boolean
  onThemeChange: (theme: PopolaTheme) => void
  onBack: () => void
  onSave: (config: ProviderConfig) => void
}) {
  const { t } = useTranslation()
  const { language, setLanguage } = useAppLanguage()
  const [section, setSection] = useState<SettingsSectionId>("appearance")
  const [draft, setDraft] = useState<ProviderConfig>(props.initial)

  const languageOptions = useMemo(
    (): LanguageSelectOption[] =>
      LANGUAGE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  )

  const themeOptions = useMemo(() => getAppThemeOptions(t), [t])

  const update = (key: keyof ProviderConfig, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <SettingsLayout
      className="app-settings-layout"
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
      <>
        <TitlebarChrome />
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
            <ProviderFields
              draft={draft}
              error={props.error}
              saving={props.saving}
              onChange={update}
              onSave={() => props.onSave(draft)}
            />
          )}
        </SettingsPageContent>
      </>
    </SettingsLayout>
  )
}

export function ProviderSetup(props: {
  initial: ProviderConfig | null
  error: string | null
  saving: boolean
  onSave: (config: ProviderConfig) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<ProviderConfig>(props.initial ?? empty)

  const update = (key: keyof ProviderConfig, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <SettingsPageContent>
      <ProviderFields
        draft={draft}
        error={props.error}
        saving={props.saving}
        intro={t("provider.intro")}
        onChange={update}
        onSave={() => props.onSave(draft)}
      />
    </SettingsPageContent>
  )
}
