import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { AgentHost } from "./host"

const here = path.dirname(fileURLToPath(import.meta.url))
const dev = process.env.POPOLA_DEV === "1"

/** Matches paseo's `MAC_TRAFFIC_LIGHT_POSITION`. */
const MAC_TRAFFIC_LIGHT_POSITION = { x: 16, y: 14 } as const

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

if (dev) {
  app.setPath("userData", path.resolve(here, "../../.data"))
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
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
  const userData = app.getPath("userData")
  await mkdir(userData, { recursive: true })
  const host = new AgentHost(
    path.join(userData, "workspace.json"),
    path.join(userData, "provider.json"),
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
  ipcMain.handle("workspace:get", () => host.getWorkspace())
  ipcMain.handle("workspace:pick", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: "Working directory",
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
    return host.setCwd(result.filePaths[0]!)
  })
  ipcMain.handle("workspace:set-cwd", async (_event, cwd: unknown) => {
    if (typeof cwd !== "string" || !cwd.trim()) {
      return { ok: false, error: "Pick a working directory." }
    }
    return host.setCwd(cwd)
  })
  ipcMain.handle("session:new", () => host.newSession())
  ipcMain.handle("session:open", (_event, sessionFile: unknown) => {
    if (typeof sessionFile !== "string" || !sessionFile) {
      return { ok: false, error: "Missing session path." }
    }
    return host.openSession(sessionFile)
  })
  ipcMain.handle("prompt", async (_event, text: unknown) => {
    await host.prompt(typeof text === "string" ? text : "")
  })
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
