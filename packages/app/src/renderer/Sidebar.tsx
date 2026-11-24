import { popolaClass } from "popola-ui"
import {
  Sidebar as SidebarFrame,
  SidebarError,
  SidebarFooter,
  SidebarHint,
  SidebarItem,
  SidebarList,
  SidebarNav,
  SidebarSection,
  SidebarSeparator,
} from "popola-ui-react"
import type { SessionSummary, WorkspaceState } from "../shared/types"
import { useTranslation } from "react-i18next"
import { TitlebarChrome } from "./TitlebarChrome"

function basename(cwd: string): string {
  const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean)
  return parts[parts.length - 1] ?? cwd
}

function FolderMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4.5A1.5 1.5 0 0 1 3.5 3h3.1c.3 0 .6.1.8.3L8.6 4.5c.2.2.5.3.8.3H12.5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  )
}

function SettingsMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.5 2.5h3l.4 1.4a4.5 4.5 0 0 1 1.1.6l1.4-.5 1.5 2.6-1.1 1a4.6 4.6 0 0 1 0 1.3l1.1 1-1.5 2.6-1.4-.5a4.5 4.5 0 0 1-1.1.6L9.5 13.5h-3l-.4-1.4a4.5 4.5 0 0 1-1.1-.6l-1.4.5L2.1 9.4l1.1-1a4.6 4.6 0 0 1 0-1.3l-1.1-1L3.6 3.5l1.4.5a4.5 4.5 0 0 1 1.1-.6L6.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
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

export function Sidebar(props: {
  workspace: WorkspaceState
  busy?: boolean
  error: string | null
  onPickDirectory: () => void
  onSelectRecent: (cwd: string) => void
  onNewChat: () => void
  onOpenSession: (session: SessionSummary) => void
  onRefresh: () => void
  onSettings: () => void
}) {
  const { workspace } = props
  const { t } = useTranslation()
  const canChat = Boolean(workspace.cwd) && !props.busy

  return (
    <SidebarFrame className="app-sidebar">
      <TitlebarChrome />
      <SidebarNav>
        <SidebarList>
          <SidebarItem
            leading="+"
            title={t("sidebar.newChat")}
            disabled={!canChat}
            tooltip={
              workspace.cwd ? t("sidebar.newChatTooltip") : t("sidebar.chooseFolderFirst")
            }
            onPress={props.onNewChat}
          />
          <SidebarItem
            leading={<FolderMark />}
            title={workspace.cwd ? basename(workspace.cwd) : t("sidebar.chooseFolder")}
            meta={workspace.cwd ?? undefined}
            tooltip={workspace.cwd ?? t("sidebar.chooseFolderTooltip")}
            muted={!workspace.cwd}
            disabled={props.busy}
            onPress={props.onPickDirectory}
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
                    disabled={props.busy}
                    onPress={() => props.onSelectRecent(cwd)}
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
            disabled={!workspace.cwd || props.busy}
            onClick={props.onRefresh}
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
                disabled={props.busy}
                onPress={() => props.onOpenSession(session)}
              />
            ))}
          </SidebarList>
        )}
      </SidebarSection>

      {props.error ? <SidebarError>{props.error}</SidebarError> : null}

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarList>
          <SidebarItem
            leading={<SettingsMark />}
            title={t("sidebar.settings")}
            onPress={props.onSettings}
          />
        </SidebarList>
      </SidebarFooter>
    </SidebarFrame>
  )
}
