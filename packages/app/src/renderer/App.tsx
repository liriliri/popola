import { useEffect, useMemo, type ReactNode } from "react"
import { observer } from "mobx-react-lite"
import { useTranslation } from "react-i18next"
import { popolaClass } from "popola-ui"
import {
  PopolaProvider,
  PopolaShell,
  usePopola,
  useResolvedTheme,
  type PopolaLabels,
} from "popola-ui-react"
import { bridge } from "./bridge"
import { I18nProvider } from "./i18n"
import { ProviderSetup, SettingsPage } from "./SettingsPage"
import { Sidebar } from "./Sidebar"
import { TitlebarChrome } from "./TitlebarChrome"
import { appStore } from "./stores"

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

export function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  )
}

const AppShell = observer(function AppShell() {
  const { t } = useTranslation()
  const {
    screen,
    provider,
    formError,
    saving,
    theme,
    popola,
  } = appStore

  const labels = useMemo(
    (): Partial<PopolaLabels> => ({
      composerPlaceholder: t("ui.composerPlaceholder"),
      composerSend: t("ui.composerSend"),
      composerStop: t("ui.composerStop"),
      conversationEmpty: t("ui.conversationEmpty"),
      permissionAllowOnce: t("ui.permissionAllowOnce"),
      permissionAlwaysAllow: t("ui.permissionAlwaysAllow"),
      permissionReject: t("ui.permissionReject"),
      toolCallRequest: t("ui.toolCallRequest"),
      toolCallResult: t("ui.toolCallResult"),
      settingsNav: t("ui.settingsNav"),
      themePicker: t("ui.themePicker"),
    }),
    [t],
  )

  useEffect(() => {
    void appStore.bootstrap()
    return () => appStore.dispose()
  }, [])

  const slots = useMemo(
    () => ({
      "shell.header": () => null,
      "shell.main.leading": () => <TitlebarChrome />,
      // Module-stable `Sidebar` — a fresh component type would remount and reset scroll.
      "shell.sidebar": provider && screen === "chat" ? Sidebar : undefined,
    }),
    [provider, screen],
  )

  return (
    <PopolaProvider
      store={popola}
      theme={theme}
      labels={labels}
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
      {screen === "settings" && provider ? (
        <ThemedFrame>
          <SettingsPage
            key={`${provider.provider}:${provider.model}`}
            initial={provider}
            theme={theme}
            error={formError}
            saving={saving}
            onThemeChange={appStore.setTheme}
            onBack={appStore.backToChat}
            onSave={(config) => {
              void appStore.saveProvider(config)
            }}
          />
        </ThemedFrame>
      ) : (
        <PopolaShell slots={slots}>
          {screen === "provider" ? (
            <ProviderSetup
              key={provider?.model ?? "empty"}
              initial={provider}
              error={formError}
              saving={saving}
              onSave={(config) => {
                void appStore.saveProvider(config)
              }}
            />
          ) : screen === "loading" ? null : undefined}
        </PopolaShell>
      )}
    </PopolaProvider>
  )
})
