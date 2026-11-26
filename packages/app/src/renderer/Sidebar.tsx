import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"
import { observer } from "mobx-react-lite"
import { Archive, ChevronDown, Folder, FolderMinus, FolderPlus, PanelLeft, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  PopolaContextMenu,
  Sidebar as SidebarFrame,
  SidebarFooter,
  SidebarHint,
  SidebarItem,
  SidebarList,
  SidebarNav,
  SidebarSection,
  SidebarSeparator,
  type PopolaContextMenuItem,
} from "popola-ui-react"
import type { ProjectSummary, SessionSummary } from "../shared/types"
import { TitlebarResizer } from "./TitlebarChrome"
import { SIDEBAR_WIDTH_MAX, SIDEBAR_WIDTH_MIN } from "./sidebarWidth"
import { appStore } from "./stores"

/** Compact relative time in the trailing slot. */
function formatCompactTime(ms: number, nowLabel: string): string {
  if (!ms) return ""
  const diff = Date.now() - ms
  if (diff < 60_000) return nowLabel
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m`
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))}h`
  if (diff < 7 * 86_400_000) return `${Math.max(1, Math.floor(diff / 86_400_000))}d`
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
      new Date(ms),
    )
  } catch {
    return ""
  }
}

type ContextMenuState =
  | { kind: "session"; session: SessionSummary; x: number; y: number }
  | { kind: "project"; project: ProjectSummary; x: number; y: number }

export const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()
  const { workspace, workspaceBusy, canChat, drafting, sidebarWidth, sidebarResizing } = appStore
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

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

  const closeMenu = () => setMenu(null)

  const menuItems: PopolaContextMenuItem[] = menu
    ? menu.kind === "session"
      ? [
          {
            key: "archive",
            label: t("sidebar.archive"),
            icon: <Archive size={14} strokeWidth={1.75} />,
            onSelect: () => {
              const session = menu.session
              closeMenu()
              void appStore.archiveSession(session)
            },
          },
        ]
      : [
          {
            key: "remove-project",
            label: t("sidebar.removeProject"),
            icon: <FolderMinus size={14} strokeWidth={1.75} />,
            danger: true,
            onSelect: () => {
              const project = menu.project
              closeMenu()
              void appStore.removeProject(project)
            },
          },
        ]
    : []

  return (
    <SidebarFrame className="app-sidebar">
      <div className="app-sidebar__header">
        <TitlebarResizer />
        <button
          type="button"
          className="app-chrome-icon-btn"
          title={t("sidebar.collapse")}
          aria-label={t("sidebar.collapse")}
          aria-expanded={true}
          onClick={() => appStore.toggleSidebar()}
        >
          <PanelLeft size={15} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
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
            title={t("sidebar.newTask")}
            selected={drafting}
            disabled={!canChat}
            tooltip={
              !appStore.provider
                ? t("sidebar.configureProviderFirst")
                : workspace.cwd
                  ? t("sidebar.newTaskTooltip")
                  : t("sidebar.addProjectFirst")
            }
            onPress={() => {
              void appStore.newTask()
            }}
          />
          <SidebarItem
            leading={<FolderPlus size={14} strokeWidth={1.75} aria-hidden />}
            title={t("sidebar.addProject")}
            tooltip={t("sidebar.addProjectTooltip")}
            disabled={workspaceBusy}
            onPress={() => {
              void appStore.addProject()
            }}
          />
        </SidebarList>
      </SidebarNav>

      <SidebarSeparator />

      <SidebarSection grow className="app-sidebar__projects">
        {workspace.projects.length === 0 ? (
          <SidebarHint>{t("sidebar.emptyNoProjects")}</SidebarHint>
        ) : (
          <div className="app-sidebar__tree">
            {workspace.projects.map((project) => (
              <ProjectGroup
                key={project.path}
                project={project}
                active={project.path === workspace.cwd}
                sessionFile={drafting ? null : workspace.sessionFile}
                busy={workspaceBusy}
                menuSessionPath={menu?.kind === "session" ? menu.session.path : null}
                menuProjectPath={menu?.kind === "project" ? menu.project.path : null}
                onActivate={() => {
                  void appStore.activateProject(project)
                }}
                onOpenSession={(session) => {
                  void appStore.openSession(session)
                }}
                onSessionContextMenu={(session, event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setMenu({ kind: "session", session, x: event.clientX, y: event.clientY })
                }}
                onProjectContextMenu={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setMenu({ kind: "project", project, x: event.clientX, y: event.clientY })
                }}
              />
            ))}
          </div>
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

      {menu ? (
        <PopolaContextMenu
          items={menuItems}
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
        />
      ) : null}
    </SidebarFrame>
  )
})

function ProjectGroup(props: {
  project: ProjectSummary
  active: boolean
  sessionFile: string | null
  busy: boolean
  menuSessionPath: string | null
  menuProjectPath: string | null
  onActivate: () => void
  onOpenSession: (session: SessionSummary) => void
  onSessionContextMenu: (session: SessionSummary, event: ReactMouseEvent) => void
  onProjectContextMenu: (event: ReactMouseEvent) => void
}) {
  const { t } = useTranslation()
  const { project, active, sessionFile, busy } = props
  const expanded = !project.collapsed
  const nowLabel = t("sidebar.timeNow")

  return (
    <section
      className="app-sidebar__project"
      data-collapsed={project.collapsed ? "true" : undefined}
      data-menu-open={project.path === props.menuProjectPath ? "true" : undefined}
    >
      <button
        type="button"
        className="app-sidebar__project-header"
        title={project.path}
        aria-expanded={expanded}
        disabled={busy}
        onClick={props.onActivate}
        onContextMenu={props.onProjectContextMenu}
      >
        <ChevronDown
          size={13}
          strokeWidth={2}
          className="app-sidebar__project-chevron"
          aria-hidden
        />
        <Folder size={13} strokeWidth={1.75} aria-hidden />
        <span className="app-sidebar__project-name">{project.name}</span>
        {active ? (
          <span className="app-sidebar__project-dot" aria-label={t("sidebar.projectActive")} />
        ) : null}
      </button>
      <ul
        className="app-sidebar__project-sessions"
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        {project.sessions.length === 0 ? (
          <li className="app-sidebar__project-empty">{t("sidebar.emptyNoSessions")}</li>
        ) : (
          project.sessions.map((session) => (
            <li key={session.path}>
              <button
                type="button"
                className="app-sidebar__session"
                data-selected={session.path === sessionFile ? "true" : undefined}
                data-menu-open={session.path === props.menuSessionPath ? "true" : undefined}
                title={session.title}
                disabled={busy}
                tabIndex={expanded ? undefined : -1}
                aria-current={session.path === sessionFile ? "page" : undefined}
                onClick={() => {
                  props.onOpenSession(session)
                }}
                onContextMenu={(event) => {
                  props.onSessionContextMenu(session, event)
                }}
              >
                <span className="app-sidebar__session-title">{session.title}</span>
                <span className="app-sidebar__session-time">
                  {formatCompactTime(session.modifiedAt, nowLabel)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
