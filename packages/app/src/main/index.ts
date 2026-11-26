import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { AgentHost } from "./host"
import { resolvePopolaHome } from "./popolaHome"

const here = path.dirname(fileURLToPath(import.meta.url))
const dev = process.env.POPOLA_DEV === "1"

/** Vertically centers traffic lights in the 44px toolbar band. */
const MAC_TRAFFIC_LIGHT_POSITION = { x: 16, y: 15 } as const

/** macOS keeps traffic lights overlaid; Windows/Linux go frameless. */
function getMainWindowChromeOptions(): Pick<
  Electron.BrowserWindowConstructorOptions,
  "titleBarStyle" | "trafficLightPosition" | "frame" | "titleBarOverlay" | "autoHideMenuBar"
> {
  if (process.platform === "darwin") {
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: true,
      trafficLightPosition: MAC_TRAFFIC_LIGHT_POSITION,
    }
  }
  return {
    frame: false,
    autoHideMenuBar: true,
  }
}

const WINDOW_MIN_WIDTH = 800
const WINDOW_MIN_HEIGHT = 560

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    title: "popola",
    ...getMainWindowChromeOptions(),
    webPreferences: {
      preload: path.resolve(here, "../../src/preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  win.once("ready-to-show", () => win.show())

  // A link in a message opens in the browser, not in a window of the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: "deny" }
  })

  if (dev) {
    void win.loadURL("http://127.0.0.1:5173")
  } else {
    void win.loadFile(path.resolve(here, "../renderer/index.html"))
  }

  return win
}

app.whenReady().then(async () => {
  const home = resolvePopolaHome()
  await mkdir(home, { recursive: true })
  const host = new AgentHost(
    path.join(home, "workspace.json"),
    path.join(home, "provider.json"),
  )
  await host.load()

  const attach = (win: BrowserWindow) => {
    host.onEvent((event) => {
      if (win.isDestroyed()) return
      win.webContents.send("host-event", event)
    })
  }

  ipcMain.handle("provider:get", () => host.getProvider())
  ipcMain.handle("provider:set", async (_event, input: unknown) => {
    const error = await host.setProvider(input)
    return error ? { ok: false, error } : { ok: true }
  })
  ipcMain.handle("provider:list-models", (_event, input: unknown) => host.listModels(input))
  ipcMain.handle("workspace:get", () => host.getWorkspace())
  ipcMain.handle("workspace:add-project", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: "Add project",
      properties: ["openDirectory", "createDirectory"] as Array<
        "openDirectory" | "createDirectory"
      >,
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: true, workspace: await host.getWorkspace() }
    }
    return host.addProject(result.filePaths[0]!)
  })
  ipcMain.handle("workspace:select-project", async (_event, cwd: unknown) => {
    if (typeof cwd !== "string" || !cwd.trim()) {
      return { ok: false, error: "Pick a project." }
    }
    return host.selectProject(cwd)
  })
  ipcMain.handle(
    "workspace:set-collapsed",
    async (_event, cwd: unknown, collapsed: unknown) => {
      if (typeof cwd !== "string" || !cwd.trim()) {
        return { ok: false, error: "Pick a project." }
      }
      return host.setProjectCollapsed(cwd, collapsed === true)
    },
  )
  ipcMain.handle("session:new", () => host.newSession())
  ipcMain.handle("session:open", (_event, sessionFile: unknown) => {
    if (typeof sessionFile !== "string" || !sessionFile) {
      return { ok: false, error: "Missing session path." }
    }
    return host.openSession(sessionFile)
  })
  ipcMain.handle("session:archive", (_event, sessionFile: unknown) => {
    if (typeof sessionFile !== "string" || !sessionFile) {
      return { ok: false, error: "Missing session path." }
    }
    return host.archiveSession(sessionFile)
  })
  ipcMain.handle("workspace:remove-project", (_event, cwd: unknown) => {
    if (typeof cwd !== "string" || !cwd.trim()) {
      return { ok: false, error: "Pick a project." }
    }
    return host.removeProject(cwd)
  })
  ipcMain.handle("prompt", (_event, text: unknown) =>
    host.prompt(typeof text === "string" ? text : ""),
  )
  ipcMain.handle("abort", () => {
    host.abort()
  })
  ipcMain.handle("permission:reply", (_event, id: unknown, decision: unknown) => {
    if (typeof id !== "string") return
    if (decision !== "once" && decision !== "always" && decision !== "reject") return
    host.respondToPermission(id, decision)
  })
  ipcMain.on("host:listen", (event) => {
    event.sender.send("host-event", host.snapshot())
  })

  attach(createWindow())

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) attach(createWindow())
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
