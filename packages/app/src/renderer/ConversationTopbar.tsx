import { observer } from "mobx-react-lite"
import { Folder, PanelLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { TitlebarResizer } from "./TitlebarChrome"
import { appStore } from "./stores"

const DEFAULT_TITLES = new Set(["new task", "new chat", "新建任务", "新对话"])

function isDefaultTitle(title?: string | null): boolean {
  const trimmed = (title ?? "").trim().toLowerCase()
  return !trimmed || DEFAULT_TITLES.has(trimmed)
}

/** Main-pane top band: drag region + project / task title. */
export const ConversationTopbar = observer(function ConversationTopbar() {
  const { t } = useTranslation()
  const { drafting, sidebarCollapsed, activeProject, workspace } = appStore
  const session =
    !drafting && workspace.sessionFile
      ? (activeProject?.sessions.find((entry) => entry.path === workspace.sessionFile) ?? null)
      : null

  const taskTitle =
    drafting || !session || isDefaultTitle(session.title)
      ? t("ui.untitledTask")
      : session.title
  const projectLabel = activeProject?.name ?? null
  const breadcrumb = projectLabel ? `${projectLabel} · ${taskTitle}` : taskTitle

  return (
    <div
      className="app-conversation-topbar"
      data-collapsed={sidebarCollapsed ? "true" : undefined}
      role="toolbar"
      aria-label={t("ui.conversationToolbar")}
    >
      <TitlebarResizer />
      {sidebarCollapsed ? (
        <button
          type="button"
          className="app-chrome-icon-btn"
          title={t("sidebar.expand")}
          aria-label={t("sidebar.expand")}
          aria-expanded={false}
          onClick={() => appStore.toggleSidebar()}
        >
          <PanelLeft size={15} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      <div className="app-conversation-topbar__title-wrap" title={breadcrumb}>
        {projectLabel ? (
          <>
            <span className="app-conversation-topbar__project">
              <Folder size={12} strokeWidth={1.75} aria-hidden />
              <span className="app-conversation-topbar__project-name">{projectLabel}</span>
            </span>
            <span className="app-conversation-topbar__sep" aria-hidden>
              /
            </span>
          </>
        ) : null}
        <h1 className="app-conversation-topbar__title">{taskTitle}</h1>
      </div>
    </div>
  )
})
