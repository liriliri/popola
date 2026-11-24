import { useEffect, useMemo, useState } from "react"
import isErr from "licia/isErr"
import { createStore, popolaClass } from "popola-ui"
import { isAgentEvent } from "popola-protocol"
import type { ProviderConfig } from "../shared/types"
import { PopolaProvider, PopolaShell, type PopolaTheme } from "popola-ui-react"
import { bridge } from "./bridge"
import { ProviderSetup, SettingsPage } from "./SettingsPage"

type Screen = "loading" | "provider" | "chat" | "settings"

export function App() {
  const store = useMemo(() => createStore(), [])
  const [screen, setScreen] = useState<Screen>("loading")
  const [saved, setSaved] = useState<ProviderConfig | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<PopolaTheme>("system")

  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false

    void (async () => {
      try {
        const api = bridge()
        const provider = await api.getProvider()
        if (cancelled) return
        setSaved(provider)
        setScreen(provider ? "chat" : "provider")
        unsubscribe = api.onEvent((event) => {
          // The main process is the source, but the payload still crosses a
          // process boundary: validate it before it reaches the reducer.
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
      setScreen("chat")
    } catch (error) {
      setFormError(isErr(error) ? error.message : "Could not save the provider.")
    } finally {
      setSaving(false)
    }
  }

  // Keep the slot map stable so the header component is not remounted on
  // every App render (a new component type would unmount the host's slot).
  const slots = useMemo(
    () => ({
      "shell.header": function Header() {
        return (
          <div className={popolaClass.shellHeader}>
            <span>popola</span>
            <span className="app-header__spacer" />
            {saved ? (
              <button
                type="button"
                className={`${popolaClass.button} ${popolaClass.buttonGhost}`}
                onClick={() => {
                  setFormError(null)
                  setScreen("settings")
                }}
              >
                Settings
              </button>
            ) : null}
          </div>
        )
      },
    }),
    [saved],
  )

  return (
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
        ) : screen === "settings" && saved ? (
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
        ) : screen === "loading" ? null : undefined}
      </PopolaShell>
    </PopolaProvider>
  )
}
