const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("popola", {
  getProvider() {
    return ipcRenderer.invoke("provider:get")
  },
  setProvider(config) {
    return ipcRenderer.invoke("provider:set", config)
  },
  getWorkspace() {
    return ipcRenderer.invoke("workspace:get")
  },
  pickDirectory() {
    return ipcRenderer.invoke("workspace:pick")
  },
  setCwd(cwd) {
    return ipcRenderer.invoke("workspace:set-cwd", cwd)
  },
  newSession() {
    return ipcRenderer.invoke("session:new")
  },
  openSession(sessionFile) {
    return ipcRenderer.invoke("session:open", sessionFile)
  },
  prompt(text) {
    return ipcRenderer.invoke("prompt", text)
  },
  abort() {
    return ipcRenderer.invoke("abort")
  },
  respondToPermission(id, decision) {
    return ipcRenderer.invoke("permission:reply", id, decision)
  },
  onEvent(listener) {
    const handler = (_event, payload) => listener(payload)
    ipcRenderer.on("host-event", handler)
    ipcRenderer.send("host:listen")
    return () => ipcRenderer.removeListener("host-event", handler)
  },
})
