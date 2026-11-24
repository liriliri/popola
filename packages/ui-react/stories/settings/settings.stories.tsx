import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { popolaClass } from "popola-ui"
import {
  SettingsAction,
  SettingsAddRow,
  SettingsCard,
  SettingsDetailRow,
  SettingsGroup,
  SettingsInput,
  SettingsLayout,
  SettingsPage,
  SettingsSection,
  SettingsSelect,
  SettingsSidebar,
  SettingsSidebarGroup,
  SettingsSidebarItem,
  SettingsSwitch,
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
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system")
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
          <SettingsSection title="Appearance">
            <SettingsCard>
              <SettingsSelect
                label="Theme"
                hint="Follows the system preference when set to System."
                value={theme}
                options={[
                  { label: "System", value: "system" },
                  { label: "Light", value: "light" },
                  { label: "Dark", value: "dark" },
                ]}
                onValueChange={setTheme}
              />
              <SettingsSwitch
                label="Steer while busy"
                hint="Sending stays available while a run is in flight."
                value={steering}
                onValueChange={setSteering}
              />
            </SettingsCard>
          </SettingsSection>
        ) : null}

        {section === "provider" ? (
          <SettingsSection title="Provider">
            <SettingsCard>
              <SettingsInput
                label="Provider"
                value={provider}
                placeholder="openai"
                onValueChange={setProvider}
              />
              <SettingsInput
                label="Model"
                value={model}
                placeholder="gpt-4o"
                onValueChange={setModel}
              />
              <SettingsAction
                label="Session"
                hint="Saving starts a new session."
                actionLabel="Save"
                onPress={() => {}}
              />
            </SettingsCard>
          </SettingsSection>
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
