import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import isErr from "licia/isErr"
import { createStore, popolaClass } from "popola-ui"
import { isAgentEvent } from "popola-protocol"
import type { ProviderConfig, WorkspaceResult, WorkspaceState } from "../shared/types"
import {
  PopolaProvider,
  PopolaShell,
  usePopola,
  useResolvedTheme,
  type PopolaTheme,
} from "popola-ui-react"
import { bridge } from "./bridge"
import { I18nProvider } from "./i18n"
import { ProviderSetup, SettingsPage } from "./SettingsPage"
import { Sidebar } from "./Sidebar"

/** Full-viewport chrome with theme tokens — used when settings replaces the shell. */
function ThemedFrame(props: { children: ReactNode }) {
  const context = usePopola()
  const theme = useResolvedTheme(context.theme)
  return (
    <div className={popolaClass.shell} data-popola-theme={theme}>
      {props.children}
    </div>
  )
}

type Screen = "loading" | "provider" | "chat" | "settings"
type SidebarProps = ComponentProps<typeof Sidebar>

const emptyWorkspace: WorkspaceState = {
  cwd: null,
  sessionFile: null,
  recent: [],
  sessions: [],
}

export function App() {
  const store = useMemo(() => createStore(), [])
  const [screen, setScreen] = useState<Screen>("loading")
  const [saved, setSaved] = useState<ProviderConfig | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<PopolaTheme>("system")
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [workspaceBusy, setWorkspaceBusy] = useState(false)

  /**
   * Slot remounts when the component *type* changes. Keep one stable type and
   * feed it the latest props through a ref so workspace updates don't reset
   * sidebar scroll/focus.
   */
  const sidebarPropsRef = useRef<SidebarProps | null>(null)
  const ChatSidebar = useMemo(
    () =>
      function ChatSidebar() {
        const props = sidebarPropsRef.current
        if (!props) return null
        return <Sidebar {...props} />
      },
    [],
  )

  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false

    void (async () => {
      try {
        const api = bridge()
        const [provider, nextWorkspace] = await Promise.all([api.getProvider(), api.getWorkspace()])
        if (cancelled) return
        setSaved(provider)
        setWorkspace(nextWorkspace)
        setScreen(provider ? "chat" : "provider")
        unsubscribe = api.onEvent((event) => {
          if (isAgentEvent(event)) store.dispatch(event)
        })
      } catch (error) {
        if (cancelled) return
        setFormError(isErr(error) ? error.message : "The app bridge is missing.")
        setScreen("provider")
      }
    })()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [store])

  const save = async (config: ProviderConfig) => {
    setSaving(true)
    setFormError(null)
    try {
      const result = await bridge().setProvider(config)
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      setSaved(config)
      setWorkspace(await bridge().getWorkspace())
      setScreen("chat")
    } catch (error) {
      setFormError(isErr(error) ? error.message : "Could not save the provider.")
    } finally {
      setSaving(false)
    }
  }

  const runWorkspace = async (action: () => Promise<WorkspaceResult>) => {
    setWorkspaceBusy(true)
    setWorkspaceError(null)
    try {
      const result = await action()
      if (!result.ok) {
        setWorkspaceError(result.error)
        return
      }
      setWorkspace(result.workspace)
    } catch (error) {
      setWorkspaceError(isErr(error) ? error.message : "Workspace action failed.")
    } finally {
      setWorkspaceBusy(false)
    }
  }

  sidebarPropsRef.current = {
    workspace,
    busy: workspaceBusy,
    error: workspaceError,
    onPickDirectory: () => {
      void runWorkspace(() => bridge().pickDirectory())
    },
    onSelectRecent: (cwd) => {
      void runWorkspace(() => bridge().setCwd(cwd))
    },
    onNewChat: () => {
      void runWorkspace(() => bridge().newSession())
    },
    onOpenSession: (session) => {
      void runWorkspace(() => bridge().openSession(session.path))
    },
    onRefresh: () => {
      void runWorkspace(async () => ({
        ok: true,
        workspace: await bridge().getWorkspace(),
      }))
    },
    onSettings: () => {
      setFormError(null)
      setScreen("settings")
    },
  }

  const slots = useMemo(
    () => ({
      "shell.header": () => null,
      "shell.sidebar": saved && screen === "chat" ? ChatSidebar : undefined,
    }),
    [saved, screen, ChatSidebar],
  )

  return (
    <I18nProvider>
      <PopolaProvider
        store={store}
        theme={theme}
        onSend={(payload) => {
          void bridge().prompt(payload.text)
        }}
        onStop={() => {
          void bridge().abort()
        }}
        onPermissionReply={(id, decision) => {
          void bridge().respondToPermission(id, decision)
        }}
      >
        {screen === "settings" && saved ? (
          <ThemedFrame>
            <SettingsPage
              key={`${saved.provider}:${saved.model}`}
              initial={saved}
              theme={theme}
              error={formError}
              saving={saving}
              onThemeChange={setTheme}
              onBack={() => setScreen("chat")}
              onSave={(config) => {
                void save(config)
              }}
            />
          </ThemedFrame>
        ) : (
          <PopolaShell slots={slots}>
            {screen === "provider" ? (
              <ProviderSetup
                key={saved?.model ?? "empty"}
                initial={saved}
                error={formError}
                saving={saving}
                onSave={(config) => {
                  void save(config)
                }}
              />
            ) : screen === "loading" ? null : undefined}
          </PopolaShell>
        )}
      </PopolaProvider>
    </I18nProvider>
  )
}
