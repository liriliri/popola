import { makeAutoObservable, runInAction, toJS } from "mobx"
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
import { appToast } from "../toastBus"

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

  async runWorkspace(action: () => Promise<WorkspaceResult>): Promise<void> {
    this.workspaceBusy = true
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
