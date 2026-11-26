import { useCallback, useEffect, useMemo, type ReactNode } from "react"
import { observer } from "mobx-react-lite"
import { useTranslation } from "react-i18next"
import { popolaClass } from "popola-ui"
import {
  PopolaProvider,
  PopolaShell,
  ToastProvider,
  usePopola,
  useResolvedTheme,
  type PopolaLabels,
  type ToastApi,
} from "popola-ui-react"
import { bridge } from "./bridge"
import { ComposerModelToolbar } from "./ComposerModelToolbar"
import { I18nProvider } from "./i18n"
import { SettingsPage } from "./SettingsPage"
import { Sidebar } from "./Sidebar"
import { ConversationTopbar } from "./ConversationTopbar"
import { bindAppToast } from "./toastBus"
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
  const { screen, provider, saving, theme, popola, activeProject, sidebarCollapsed } = appStore

  const onToastReady = useCallback((api: ToastApi | null) => {
    bindAppToast(api ? api.show.bind(api) : null)
  }, [])

  const labels = useMemo(
    (): Partial<PopolaLabels> => ({
      composerPlaceholder: t("ui.composerPlaceholder"),
      composerSend: t("ui.composerSend"),
      composerStop: t("ui.composerStop"),
      conversationEmpty: !provider
        ? t("ui.conversationNoProvider")
        : activeProject
          ? t("ui.conversationEmptyInProject", { project: activeProject.name })
          : t("ui.conversationEmpty"),
      permissionAllowOnce: t("ui.permissionAllowOnce"),
      permissionAlwaysAllow: t("ui.permissionAlwaysAllow"),
      permissionReject: t("ui.permissionReject"),
      permissionQuestion: t("ui.permissionQuestion"),
      toolCallRequest: t("ui.toolCallRequest"),
      toolCallResult: t("ui.toolCallResult"),
      settingsNav: t("ui.settingsNav"),
      themePicker: t("ui.themePicker"),
      composerModel: t("ui.composerModel"),
      composerSearchModels: t("ui.composerSearchModels"),
      composerNoModels: t("ui.composerNoModels"),
    }),
    [activeProject, provider, t],
  )

  useEffect(() => {
    void appStore.bootstrap()
    return () => appStore.dispose()
  }, [])

  const slots = useMemo(
    () => ({
      "shell.header": () => null,
      // Stable component refs — a fresh arrow would remount on every collapse toggle.
      "shell.main.leading": ConversationTopbar,
      "shell.sidebar": screen === "chat" && !sidebarCollapsed ? Sidebar : undefined,
      "composer.toolbar": screen === "chat" ? ComposerModelToolbar : undefined,
    }),
    [screen, sidebarCollapsed],
  )

  return (
    <PopolaProvider
      store={popola}
      theme={theme}
      labels={labels}
      onSend={(payload) => {
        void appStore.prompt(payload.text)
      }}
      onStop={() => {
        void bridge().abort()
      }}
      onPermissionReply={(id, decision) => {
        void bridge().respondToPermission(id, decision)
      }}
    >
      <ToastProvider dismissLabel={t("ui.toastDismiss")} onReady={onToastReady}>
        {screen === "settings" ? (
          <ThemedFrame>
            <SettingsPage
              initial={provider}
              theme={theme}
              saving={saving}
              onThemeChange={appStore.setTheme}
              onBack={appStore.backToChat}
              onSave={(config) => appStore.saveProvider(config)}
              onClearProvider={() => appStore.clearProvider()}
            />
          </ThemedFrame>
        ) : screen === "loading" ? null : (
          <PopolaShell slots={slots} />
        )}
      </ToastProvider>
    </PopolaProvider>
  )
})
