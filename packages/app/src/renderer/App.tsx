import { useEffect, useMemo, useState } from "react"
import { createStore, popolaClass } from "popola-ui"
import type { ProviderConfig } from "../shared/types"
import { PopolaProvider, PopolaShell } from "popola-ui-react"
import { bridge } from "./bridge"
import { ProviderForm } from "./ProviderForm"
import { applySnapshot } from "./snapshot"

type Screen = "loading" | "provider" | "chat"

export function App() {
  const store = useMemo(() => createStore(), [])
  const [screen, setScreen] = useState<Screen>("loading")
  const [saved, setSaved] = useState<ProviderConfig | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
          if (event.type === "messages") applySnapshot(store, event.messages)
          if (event.type === "running") {
            store.dispatch({ type: "status", status: event.running ? "busy" : "idle" })
          }
        })
      } catch (error) {
        if (cancelled) return
        setFormError(error instanceof Error ? error.message : "The app bridge is missing.")
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
      setFormError(error instanceof Error ? error.message : "Could not save the provider.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PopolaProvider
      store={store}
      onSend={(payload) => {
        void bridge().prompt(payload.text)
      }}
      onStop={() => {
        void bridge().abort()
      }}
    >
      <PopolaShell
        slots={{
          "shell.header": function Header() {
            return (
              <div className={popolaClass.shellHeader}>
                <span>popola</span>
                <span className="popola-app-header__spacer" />
                {saved ? (
                  <button
                    type="button"
                    className={`${popolaClass.button} ${popolaClass.buttonGhost}`}
                    onClick={() => {
                      setFormError(null)
                      setScreen("provider")
                    }}
                  >
                    Provider
                  </button>
                ) : null}
              </div>
            )
          },
        }}
      >
        {screen === "provider" ? (
          <ProviderForm
            key={saved?.model ?? "empty"}
            initial={saved}
            error={formError}
            saving={saving}
            canCancel={saved !== null}
            onCancel={() => setScreen("chat")}
            onSave={(config) => {
              void save(config)
            }}
          />
        ) : screen === "loading" ? null : undefined}
      </PopolaShell>
    </PopolaProvider>
  )
}
