import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore, popolaClass } from "popola-ui"
import {
  PopolaProvider,
  PopolaShell,
  Sidebar,
  SidebarFooter,
  SidebarHint,
  SidebarItem,
  SidebarList,
  SidebarNav,
  SidebarSection,
  SidebarSeparator,
} from "popola-ui-react"

const meta = {
  title: "Sidebar",
  parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const chats = [
  { id: "1", title: "Fix login flow", meta: "Nov 24 · 12" },
  { id: "2", title: "Rename settings classes", meta: "Nov 23 · 4" },
  { id: "3", title: "Empty chat", meta: "Nov 20" },
]

function Demo() {
  const [selected, setSelected] = useState("1")

  return (
    <Sidebar>
      <SidebarNav>
        <SidebarList>
          <SidebarItem leading="+" title="New chat" onPress={() => {}} />
          <SidebarItem
            leading="▣"
            title="popola"
            meta="/Users/surunzi/code/popola"
            onPress={() => {}}
          />
        </SidebarList>
      </SidebarNav>

      <SidebarSeparator />

      <SidebarSection title="Recent">
        <SidebarList>
          <SidebarItem title="popola" meta="/Users/surunzi/code/popola" onPress={() => {}} />
          <SidebarItem title="licia" meta="/Users/surunzi/code/licia" onPress={() => {}} />
        </SidebarList>
      </SidebarSection>

      <SidebarSeparator />

      <SidebarSection
        title="Chats"
        grow
        trailing={
          <button type="button" className={`${popolaClass.button} ${popolaClass.buttonGhost}`}>
            Refresh
          </button>
        }
      >
        <SidebarList>
          {chats.map((chat) => (
            <SidebarItem
              key={chat.id}
              title={chat.title}
              meta={chat.meta}
              selected={selected === chat.id}
              onPress={() => setSelected(chat.id)}
            />
          ))}
        </SidebarList>
      </SidebarSection>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarList>
          <SidebarItem leading="⚙" title="Settings" onPress={() => {}} />
        </SidebarList>
      </SidebarFooter>
    </Sidebar>
  )
}

function EmptyDemo() {
  return (
    <Sidebar>
      <SidebarNav>
        <SidebarList>
          <SidebarItem leading="+" title="New chat" disabled onPress={() => {}} />
          <SidebarItem leading="▣" title="Choose folder" muted onPress={() => {}} />
        </SidebarList>
      </SidebarNav>
      <SidebarSeparator />
      <SidebarSection title="Chats" grow>
        <SidebarHint>Pi sessions for the folder show up here.</SidebarHint>
      </SidebarSection>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarList>
          <SidebarItem leading="⚙" title="Settings" onPress={() => {}} />
        </SidebarList>
      </SidebarFooter>
    </Sidebar>
  )
}

function Frame(props: { sidebar: () => React.ReactNode }) {
  const store = createStore()
  return (
    <PopolaProvider store={store}>
      <div style={{ height: "100vh" }}>
        <PopolaShell
          slots={{
            "shell.header": () => null,
            "shell.sidebar": props.sidebar,
          }}
        >
          <div style={{ padding: 24, color: "var(--popola-text-muted)" }}>Main pane</div>
        </PopolaShell>
      </div>
    </PopolaProvider>
  )
}

/** Directory + recent + chat list inside the shell sidebar slot. */
export const Filled: Story = {
  render: () => <Frame sidebar={() => <Demo />} />,
}

/** No directory chosen yet. */
export const Empty: Story = {
  render: () => <Frame sidebar={() => <EmptyDemo />} />,
}
