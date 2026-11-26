import { makeAutoObservable, runInAction, toJS } from "mobx"
import isErr from "licia/isErr"
import { createStore, type PopolaStore } from "popola-ui"
import { isAgentEvent } from "popola-protocol"
import type { PopolaTheme } from "popola-ui-react"
import type {
  ProjectSummary,
  ProviderConfig,
  SessionSummary,
  WorkspaceResult,
  WorkspaceState,
} from "../../shared/types"
import { projectName, titleFromPrompt } from "../../shared/types"
import { bridge } from "../bridge"
import {
  applySidebarWidth,
  clampSidebarWidth,
  readSidebarWidth,
  writeSidebarWidth,
} from "../sidebarWidth"
import { appToast } from "../toastBus"

export type AppScreen = "loading" | "chat" | "settings"

const emptyWorkspace: WorkspaceState = {
  cwd: null,
  sessionFile: null,
  projects: [],
}

/** Host shell state. Conversation/agent state stays in `popola`. */
export class AppStore {
  screen: AppScreen = "loading"
  provider: ProviderConfig | null = null
  saving = false
  theme: PopolaTheme = "system"
  workspace: WorkspaceState = emptyWorkspace
  workspaceBusy = false
  sidebarWidth = readSidebarWidth()
  sidebarResizing = false

  /** Framework-agnostic conversation store; not an observable field. */
  readonly popola: PopolaStore

  private unsubscribeHost: (() => void) | null = null
  /** Bumps on dispose / re-bootstrap so stale async work cannot subscribe or write. */
  private bootstrapGen = 0

  constructor(popola: PopolaStore = createStore()) {
    this.popola = popola
    makeAutoObservable(this, { popola: false }, { autoBind: true })
    applySidebarWidth(this.sidebarWidth)
  }

  get canChat(): boolean {
    // Do not gate on workspaceBusy — that dims New task on every session switch.
    return Boolean(this.provider && this.workspace.cwd)
  }

  /** Live chat not yet in the catalog — New task stays selected until the first send. */
  get drafting(): boolean {
    const file = this.workspace.sessionFile
    if (!file) return false
    return !this.workspace.projects.some((project) =>
      project.sessions.some((session) => session.path === file),
    )
  }

  setTheme(theme: PopolaTheme): void {
    this.theme = theme
  }

  setSidebarWidth(width: number): void {
    this.sidebarWidth = clampSidebarWidth(width)
    applySidebarWidth(this.sidebarWidth)
  }

  setSidebarResizing(resizing: boolean): void {
    this.sidebarResizing = resizing
  }

  commitSidebarWidth(): void {
    writeSidebarWidth(this.sidebarWidth)
  }

  openSettings(): void {
    this.screen = "settings"
  }

  backToChat(): void {
    this.screen = "chat"
  }

  async bootstrap(): Promise<void> {
    const gen = ++this.bootstrapGen
    this.unsubscribeHost?.()
    this.unsubscribeHost = null

    try {
      const api = bridge()
      const [provider, workspace] = await Promise.all([api.getProvider(), api.getWorkspace()])
      if (gen !== this.bootstrapGen) return
      runInAction(() => {
        this.provider = provider
        this.workspace = workspace
        this.screen = "chat"
      })
      this.unsubscribeHost = api.onEvent((event) => {
        if (isAgentEvent(event)) this.popola.dispatch(event)
      })
    } catch (error) {
      if (gen !== this.bootstrapGen) return
      runInAction(() => {
        this.screen = "chat"
      })
      appToast(isErr(error) ? error.message : "The app bridge is missing.", {
        variant: "error",
      })
    }
  }

  dispose(): void {
    this.bootstrapGen++
    this.unsubscribeHost?.()
    this.unsubscribeHost = null
  }

  private async commitProvider(
    config: ProviderConfig,
    options: {
      clear?: boolean
      failMessage: string
      afterOk?: () => void
    },
  ): Promise<boolean> {
    // MobX proxies are not structured-cloneable for Electron IPC.
    const plain = toJS(config)
    try {
      const result = await bridge().setProvider(plain)
      if (!result.ok) {
        appToast(result.error, { variant: "error" })
        return false
      }
      const workspace = await bridge().getWorkspace()
      runInAction(() => {
        this.provider = options.clear ? null : plain
        this.workspace = workspace
        options.afterOk?.()
      })
      return true
    } catch (error) {
      appToast(isErr(error) ? error.message : options.failMessage, {
        variant: "error",
      })
      return false
    }
  }

  async saveProvider(config: ProviderConfig): Promise<boolean> {
    this.saving = true
    try {
      return await this.commitProvider(config, {
        failMessage: "Could not save the provider.",
        afterOk: () => {
          if (this.screen !== "settings") this.screen = "chat"
        },
      })
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async clearProvider(): Promise<boolean> {
    this.saving = true
    try {
      return await this.commitProvider(
        { accounts: [], activeAccountId: "", model: "" },
        {
          clear: true,
          failMessage: "Could not clear the provider.",
        },
      )
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async selectProviderModel(accountId: string, modelId: string): Promise<void> {
    const current = this.provider
    if (!current) return
    const account = current.accounts.find((item) => item.id === accountId)
    if (!account || account.enabled === false || !account.models.includes(modelId)) return
    if (current.activeAccountId === accountId && current.model === modelId) return
    await this.commitProvider(
      { ...current, activeAccountId: accountId, model: modelId },
      { failMessage: "Could not switch model." },
    )
  }

  async runWorkspace(
    action: () => Promise<WorkspaceResult>,
    options?: { busy?: boolean },
  ): Promise<void> {
    const busy = options?.busy !== false
    if (busy) this.workspaceBusy = true
    try {
      const result = await action()
      if (!result.ok) {
        appToast(result.error, { variant: "error" })
        return
      }
      runInAction(() => {
        this.workspace = result.workspace
      })
    } catch (error) {
      appToast(isErr(error) ? error.message : "Workspace action failed.", {
        variant: "error",
      })
    } finally {
      if (busy) {
        runInAction(() => {
          this.workspaceBusy = false
        })
      }
    }
  }

  addProject(): Promise<void> {
    return this.runWorkspace(() => bridge().addProject())
  }

  /** Select the project if needed, then toggle its collapsed state (PI Desktop). */
  async activateProject(project: ProjectSummary): Promise<void> {
    const active = this.workspace.cwd === project.path
    if (!active) {
      await this.runWorkspace(() => bridge().selectProject(project.path), { busy: false })
      return
    }
    // Collapse is presentation-only — update locally so the rail does not flash busy.
    await this.setProjectCollapsed(project.path, !project.collapsed)
  }

  /** Persist expand/collapse without the workspace busy dim. */
  async setProjectCollapsed(cwd: string, collapsed: boolean): Promise<void> {
    const previous = this.workspace
    runInAction(() => {
      this.workspace = {
        ...this.workspace,
        projects: this.workspace.projects.map((project) =>
          project.path === cwd ? { ...project, collapsed } : project,
        ),
      }
    })
    try {
      const result = await bridge().setProjectCollapsed(cwd, collapsed)
      if (!result.ok) {
        runInAction(() => {
          this.workspace = previous
        })
        appToast(result.error, { variant: "error" })
      }
    } catch (error) {
      runInAction(() => {
        this.workspace = previous
      })
      appToast(isErr(error) ? error.message : "Could not update the project.", {
        variant: "error",
      })
    }
  }

  newTask(): Promise<void> {
    return this.runWorkspace(() => bridge().newSession(), { busy: false })
  }

  openSession(session: SessionSummary): Promise<void> {
    // Paint selection immediately so New task / other rows do not flash busy state.
    runInAction(() => {
      this.workspace = { ...this.workspace, sessionFile: session.path }
    })
    return this.runWorkspace(() => bridge().openSession(session.path), { busy: false })
  }

  archiveSession(session: SessionSummary): Promise<void> {
    return this.runWorkspace(() => bridge().archiveSession(session.path), { busy: false })
  }

  removeProject(project: ProjectSummary): Promise<void> {
    return this.runWorkspace(() => bridge().removeProject(project.path), { busy: false })
  }

  /** Apply a workspace snapshot without toggling the busy flag (e.g. after prompt). */
  applyWorkspace(workspace: WorkspaceState | null | undefined): void {
    if (!workspace) return
    this.workspace = workspace
  }

  async prompt(text: string): Promise<void> {
    const sessionFile = this.workspace.sessionFile
    const cwd = this.workspace.cwd
    if (sessionFile && cwd) {
      const title = titleFromPrompt(text)
      const entry: SessionSummary = {
        id: sessionFile,
        path: sessionFile,
        title,
        modifiedAt: Date.now(),
        messageCount: 1,
      }
      runInAction(() => {
        const projects = this.workspace.projects
        const index = projects.findIndex((project) => project.path === cwd)
        if (index < 0) {
          this.workspace = {
            ...this.workspace,
            projects: [
              {
                path: cwd,
                name: projectName(cwd),
                collapsed: false,
                sessions: [entry],
              },
              ...projects,
            ],
          }
          return
        }
        const project = projects[index]!
        const existing = project.sessions.find((session) => session.path === sessionFile)
        const updated: SessionSummary = existing
          ? {
              ...existing,
              title:
                !existing.title.trim() || existing.title === "New chat" ? title : existing.title,
              modifiedAt: Date.now(),
              messageCount: Math.max(existing.messageCount, 1),
            }
          : entry
        const without = project.sessions.filter((session) => session.path !== sessionFile)
        const next = projects.slice()
        next[index] = {
          ...project,
          collapsed: false,
          sessions: [updated, ...without],
        }
        this.workspace = { ...this.workspace, projects: next }
      })
    }
    try {
      const workspace = await bridge().prompt(text)
      runInAction(() => {
        this.applyWorkspace(workspace)
      })
    } catch (error) {
      appToast(isErr(error) ? error.message : "Could not send the message.", {
        variant: "error",
      })
    }
  }
}

export const appStore = new AppStore()
