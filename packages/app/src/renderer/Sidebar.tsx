import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import { observer } from "mobx-react-lite"
import { Folder, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { popolaClass } from "popola-ui"
import {
  Sidebar as SidebarFrame,
  SidebarFooter,
  SidebarHint,
  SidebarItem,
  SidebarList,
  SidebarNav,
  SidebarSection,
  SidebarSeparator,
} from "popola-ui-react"
import { TitlebarChrome } from "./TitlebarChrome"
import { SIDEBAR_WIDTH_MAX, SIDEBAR_WIDTH_MIN } from "./sidebarWidth"
import { appStore } from "./stores"

function basename(cwd: string): string {
  const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean)
  return parts[parts.length - 1] ?? cwd
}

function formatTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms))
  } catch {
    return ""
  }
}

export const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()
  const { workspace, workspaceBusy, canChat, sidebarWidth, sidebarResizing } = appStore

  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null)

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: appStore.sidebarWidth,
    }
    appStore.setSidebarResizing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    appStore.setSidebarWidth(drag.startWidth + (event.clientX - drag.startX))
  }

  const endResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    appStore.setSidebarResizing(false)
    appStore.commitSidebarWidth()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <SidebarFrame className="app-sidebar">
      <TitlebarChrome />
      <div
        className="app-sidebar__resize"
        role="separator"
        aria-orientation="vertical"
        aria-label={t("sidebar.resize")}
        aria-valuemin={SIDEBAR_WIDTH_MIN}
        aria-valuemax={SIDEBAR_WIDTH_MAX}
        aria-valuenow={sidebarWidth}
        data-active={sidebarResizing ? "true" : undefined}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
      <SidebarNav>
        <SidebarList>
          <SidebarItem
            leading="+"
            title={t("sidebar.newChat")}
            disabled={!canChat}
            tooltip={
              !appStore.provider
                ? t("sidebar.configureProviderFirst")
                : workspace.cwd
                  ? t("sidebar.newChatTooltip")
                  : t("sidebar.chooseFolderFirst")
            }
            onPress={() => {
              void appStore.newChat()
            }}
          />
          <SidebarItem
            leading={<Folder size={14} strokeWidth={1.75} aria-hidden />}
            title={workspace.cwd ? basename(workspace.cwd) : t("sidebar.chooseFolder")}
            meta={workspace.cwd ?? undefined}
            tooltip={workspace.cwd ?? t("sidebar.chooseFolderTooltip")}
            muted={!workspace.cwd}
            disabled={workspaceBusy}
            onPress={() => {
              void appStore.pickDirectory()
            }}
          />
        </SidebarList>
      </SidebarNav>

      <SidebarSeparator />

      {workspace.recent.length > 1 ? (
        <>
          <SidebarSection title={t("sidebar.recent")}>
            <SidebarList>
              {workspace.recent
                .filter((cwd) => cwd !== workspace.cwd)
                .map((cwd) => (
                  <SidebarItem
                    key={cwd}
                    title={basename(cwd)}
                    meta={cwd}
                    tooltip={cwd}
                    disabled={workspaceBusy}
                    onPress={() => {
                      void appStore.selectRecent(cwd)
                    }}
                  />
                ))}
            </SidebarList>
          </SidebarSection>
          <SidebarSeparator />
        </>
      ) : null}

      <SidebarSection
        title={t("sidebar.chats")}
        grow
        trailing={
          <button
            type="button"
            className={`${popolaClass.button} ${popolaClass.buttonGhost}`}
            disabled={!workspace.cwd || workspaceBusy}
            onClick={() => {
              void appStore.refreshWorkspace()
            }}
            title={t("sidebar.refreshTooltip")}
          >
            {t("sidebar.refresh")}
          </button>
        }
      >
        {!workspace.cwd ? (
          <SidebarHint>{t("sidebar.emptyNoFolder")}</SidebarHint>
        ) : workspace.sessions.length === 0 ? (
          <SidebarHint>{t("sidebar.emptyNoSessions")}</SidebarHint>
        ) : (
          <SidebarList>
            {workspace.sessions.map((session) => (
              <SidebarItem
                key={session.path}
                title={session.title}
                meta={`${formatTime(session.modifiedAt)}${
                  session.messageCount > 0 ? ` · ${session.messageCount}` : ""
                }`}
                selected={session.path === workspace.sessionFile}
                disabled={workspaceBusy}
                onPress={() => {
                  void appStore.openSession(session)
                }}
              />
            ))}
          </SidebarList>
        )}
      </SidebarSection>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarList>
          <SidebarItem
            leading={<Settings size={14} strokeWidth={1.75} aria-hidden />}
            title={t("sidebar.settings")}
            onPress={appStore.openSettings}
          />
        </SidebarList>
      </SidebarFooter>
    </SidebarFrame>
  )
})
