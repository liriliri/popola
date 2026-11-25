import { useMemo, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { popolaClass, providerChooserOptions } from "popola-ui"
import {
  SettingsAction,
  SettingsAddRow,
  SettingsCard,
  SettingsDetailRow,
  SettingsGroup,
  SettingsInput,
  SettingsLayout,
  SettingsPage,
  SettingsProviderChooser,
  SettingsSection,
  SettingsSelect,
  SettingsSidebar,
  SettingsSidebarGroup,
  SettingsSidebarItem,
  SettingsSwitch,
  SettingsThemePicker,
  type PopolaTheme,
} from "popola-ui-react"
import { Stage } from "../stage"

const meta = {
  title: "Settings",
  parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Section = "appearance" | "provider" | "advanced"

function SidebarDemo() {
  const [section, setSection] = useState<Section>("appearance")
  const [theme, setTheme] = useState<PopolaTheme>("system")
  const [steering, setSteering] = useState(true)
  const [model, setModel] = useState("gpt-4o")
  const [provider, setProvider] = useState("openai")

  return (
    <SettingsLayout
      sidebar={
        <SettingsSidebar
          header={
            <button type="button" className={`${popolaClass.button} ${popolaClass.buttonGhost}`}>
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
            <SettingsSidebarItem
              label="Advanced"
              selected={section === "advanced"}
              onPress={() => setSection("advanced")}
            />
          </SettingsSidebarGroup>
        </SettingsSidebar>
      }
    >
      <SettingsPage>
        {section === "appearance" ? (
          <>
            <SettingsSection title="Theme">
              <SettingsCard>
                <SettingsThemePicker value={theme} onValueChange={setTheme} />
              </SettingsCard>
            </SettingsSection>
            <SettingsSection title="Behavior">
              <SettingsCard>
                <SettingsSwitch
                  label="Steer while busy"
                  hint="Sending stays available while a run is in flight."
                  value={steering}
                  onValueChange={setSteering}
                />
              </SettingsCard>
            </SettingsSection>
          </>
        ) : null}

        {section === "provider" ? (
          <ProviderChooserDemo provider={provider} model={model} onProvider={setProvider} onModel={setModel} />
        ) : null}

        {section === "advanced" ? (
          <SettingsSection title="Advanced">
            <SettingsCard>
              <SettingsDetailRow
                label="Keyboard shortcuts"
                summary="Defaults"
                onPress={() => {}}
              />
              <SettingsDetailRow
                label="Diagnostics"
                hint="Logs and crash reports"
                onPress={() => {}}
              />
              <SettingsAddRow label="Add provider" onPress={() => {}} />
            </SettingsCard>
          </SettingsSection>
        ) : null}
      </SettingsPage>
    </SettingsLayout>
  )
}

function ProviderChooserDemo(props: {
  provider: string
  model: string
  onProvider: (value: string) => void
  onModel: (value: string) => void
}) {
  const [choosing, setChoosing] = useState(!props.provider)
  const options = useMemo(
    () =>
      providerChooserOptions({
        customLabel: "Custom endpoint",
        customDetail: "Any OpenAI-compatible base URL",
      }),
    [],
  )

  if (choosing) {
    return (
      <SettingsSection title="Provider">
        <SettingsProviderChooser
          options={options}
          current={props.provider || undefined}
          searchPlaceholder="Search services"
          emptyLabel="No services match that search."
          emptyActionLabel="Use a custom endpoint"
          onPick={(id) => {
            props.onProvider(id)
            setChoosing(false)
          }}
        />
      </SettingsSection>
    )
  }

  return (
    <SettingsSection title="Provider">
      <SettingsCard>
        <SettingsDetailRow
          label="Service"
          summary={props.provider || "Custom"}
          onPress={() => setChoosing(true)}
        />
        <SettingsInput
          label="Model"
          value={props.model}
          placeholder="gpt-4o"
          onValueChange={props.onModel}
        />
        <SettingsAction
          label="Session"
          hint="Saving starts a new session."
          actionLabel="Save"
          onPress={() => {}}
        />
      </SettingsCard>
    </SettingsSection>
  )
}

function StackedDemo() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system")

  return (
    <SettingsPage>
      <SettingsGroup title="Preferences">
        <SettingsSection title="Appearance" flush>
          <SettingsCard>
            <SettingsSelect
              label="Theme"
              value={theme}
              options={[
                { label: "System", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
              onValueChange={setTheme}
            />
          </SettingsCard>
        </SettingsSection>
      </SettingsGroup>
    </SettingsPage>
  )
}

/** Desktop split: sidebar navigates between detail sections. */
export const WithSidebar: Story = {
  render: () => (
    <Stage>
      <SidebarDemo />
    </Stage>
  ),
}

/** Single-column page with no sidebar (first-run / compact). */
export const Stacked: Story = {
  render: () => (
    <Stage>
      <StackedDemo />
    </Stage>
  ),
}
