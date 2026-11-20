import { app, BrowserWindow, ipcMain, shell } from "electron"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { AgentHost } from "./host"

const here = path.dirname(fileURLToPath(import.meta.url))
const dev = process.env.POPOLA_DEV === "1"
const repoRoot = path.resolve(here, "../../../..")

if (dev) {
  app.setPath("userData", path.resolve(here, "../../.data"))
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    title: "popola",
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
  await mkdir(app.getPath("userData"), { recursive: true })
  const host = new AgentHost(repoRoot, path.join(app.getPath("userData"), "provider.json"))
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
  ipcMain.handle("prompt", async (_event, text: unknown) => {
    await host.prompt(typeof text === "string" ? text : "")
  })
  ipcMain.handle("abort", () => {
    host.abort()
  })
  ipcMain.on("host:listen", (event) => {
    for (const snapshot of host.snapshot()) event.sender.send("host-event", snapshot)
  })

  attach(createWindow())

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) attach(createWindow())
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
