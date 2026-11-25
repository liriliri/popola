import { makeAutoObservable, runInAction } from "mobx"
import isErr from "licia/isErr"
import { createStore, type PopolaStore } from "popola-ui"
import { isAgentEvent } from "popola-protocol"
import type { PopolaTheme } from "popola-ui-react"
import type { ProviderConfig, SessionSummary, WorkspaceResult, WorkspaceState } from "../../shared/types"
import { bridge } from "../bridge"
import {
  applySidebarWidth,
  clampSidebarWidth,
  readSidebarWidth,
  writeSidebarWidth,
} from "../sidebarWidth"

export type AppScreen = "loading" | "chat" | "settings"

const emptyWorkspace: WorkspaceState = {
  cwd: null,
  sessionFile: null,
  recent: [],
  sessions: [],
}

/** Host shell state. Conversation/agent state stays in `popola`. */
export class AppStore {
  screen: AppScreen = "loading"
  provider: ProviderConfig | null = null
  formError: string | null = null
  saving = false
  theme: PopolaTheme = "system"
  workspace: WorkspaceState = emptyWorkspace
  workspaceError: string | null = null
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
    return Boolean(this.provider && this.workspace.cwd) && !this.workspaceBusy
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
    this.formError = null
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
        this.formError = null
      })
      this.unsubscribeHost = api.onEvent((event) => {
        if (isAgentEvent(event)) this.popola.dispatch(event)
      })
    } catch (error) {
      if (gen !== this.bootstrapGen) return
      runInAction(() => {
        this.formError = isErr(error) ? error.message : "The app bridge is missing."
        this.screen = "chat"
      })
    }
  }

  dispose(): void {
    this.bootstrapGen++
    this.unsubscribeHost?.()
    this.unsubscribeHost = null
  }

  async saveProvider(config: ProviderConfig): Promise<void> {
    this.saving = true
    this.formError = null
    try {
      const result = await bridge().setProvider(config)
      if (!result.ok) {
        runInAction(() => {
          this.formError = result.error
        })
        return
      }
      const workspace = await bridge().getWorkspace()
      runInAction(() => {
        this.provider = config
        this.workspace = workspace
        this.screen = "chat"
      })
    } catch (error) {
      runInAction(() => {
        this.formError = isErr(error) ? error.message : "Could not save the provider."
      })
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async runWorkspace(action: () => Promise<WorkspaceResult>): Promise<void> {
    this.workspaceBusy = true
    this.workspaceError = null
    try {
      const result = await action()
      if (!result.ok) {
        runInAction(() => {
          this.workspaceError = result.error
        })
        return
      }
      runInAction(() => {
        this.workspace = result.workspace
      })
    } catch (error) {
      runInAction(() => {
        this.workspaceError = isErr(error) ? error.message : "Workspace action failed."
      })
    } finally {
      runInAction(() => {
        this.workspaceBusy = false
      })
    }
  }

  pickDirectory(): Promise<void> {
    return this.runWorkspace(() => bridge().pickDirectory())
  }

  selectRecent(cwd: string): Promise<void> {
    return this.runWorkspace(() => bridge().setCwd(cwd))
  }

  newChat(): Promise<void> {
    return this.runWorkspace(() => bridge().newSession())
  }

  openSession(session: SessionSummary): Promise<void> {
    return this.runWorkspace(() => bridge().openSession(session.path))
  }

  refreshWorkspace(): Promise<void> {
    return this.runWorkspace(async () => ({
      ok: true,
      workspace: await bridge().getWorkspace(),
    }))
  }
}

export const appStore = new AppStore()
