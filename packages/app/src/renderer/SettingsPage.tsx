import { useState } from "react"
import { popolaClass } from "popola-ui"
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
  type PopolaTheme,
} from "popola-ui-react"
import type { ProviderConfig } from "../shared/types"

const empty: ProviderConfig = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
}

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const

type SettingsSectionId = "appearance" | "provider"

function ProviderFields(props: {
  draft: ProviderConfig
  error: string | null
  saving: boolean
  intro?: string
  onChange: (key: keyof ProviderConfig, value: string) => void
  onSave: () => void
}) {
  return (
    <SettingsSection title="Provider">
      {props.intro ? <p className="app-settings__intro">{props.intro}</p> : null}
      <SettingsCard>
        <SettingsInput
          label="Provider"
          value={props.draft.provider}
          placeholder="openai"
          autoComplete="off"
          onValueChange={(value) => props.onChange("provider", value)}
        />
        <SettingsInput
          label="Base URL"
          value={props.draft.baseUrl}
          placeholder="https://api.openai.com/v1"
          inputMode="url"
          autoComplete="off"
          onValueChange={(value) => props.onChange("baseUrl", value)}
        />
        <SettingsInput
          label="API key"
          value={props.draft.apiKey}
          type="password"
          autoComplete="off"
          onValueChange={(value) => props.onChange("apiKey", value)}
        />
        <SettingsInput
          label="Model"
          value={props.draft.model}
          placeholder="gpt-4o"
          autoComplete="off"
          onValueChange={(value) => props.onChange("model", value)}
        />
        <SettingsAction
          label="Session"
          hint="Saving starts a new session."
          error={props.error}
          actionLabel={props.saving ? "Saving…" : "Save"}
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
  const [section, setSection] = useState<SettingsSectionId>("appearance")
  const [draft, setDraft] = useState<ProviderConfig>(props.initial)

  const update = (key: keyof ProviderConfig, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <SettingsLayout
      sidebar={
        <SettingsSidebar
          header={
            <button
              type="button"
              className={`${popolaClass.button} ${popolaClass.buttonGhost}`}
              onClick={props.onBack}
            >
              ← Back
            </button>
          }
        >
          <SettingsSidebarGroup label="App">
            <SettingsSidebarItem
              label="Appearance"
              selected={section === "appearance"}
              onPress={() => setSection("appearance")}
            />
            <SettingsSidebarItem
              label="Provider"
              selected={section === "provider"}
              onPress={() => setSection("provider")}
            />
          </SettingsSidebarGroup>
        </SettingsSidebar>
      }
    >
      <SettingsPageContent>
        {section === "appearance" ? (
          <SettingsSection title="Appearance">
            <SettingsCard>
              <SettingsSelect
                label="Theme"
                hint="Follows the system preference when set to System."
                value={props.theme}
                options={themeOptions}
                onValueChange={props.onThemeChange}
              />
            </SettingsCard>
          </SettingsSection>
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
    </SettingsLayout>
  )
}

export function ProviderSetup(props: {
  initial: ProviderConfig | null
  error: string | null
  saving: boolean
  onSave: (config: ProviderConfig) => void
}) {
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
        intro="Point the agent at an OpenAI-compatible endpoint. The key stays on this machine."
        onChange={update}
        onSave={() => props.onSave(draft)}
      />
    </SettingsPageContent>
  )
}
