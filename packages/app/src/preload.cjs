const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("popola", {
  getProvider() {
    return ipcRenderer.invoke("provider:get")
  },
  setProvider(config) {
    return ipcRenderer.invoke("provider:set", config)
  },
  listModels(input) {
    return ipcRenderer.invoke("provider:list-models", input)
  },
  getWorkspace() {
    return ipcRenderer.invoke("workspace:get")
  },
  addProject() {
    return ipcRenderer.invoke("workspace:add-project")
  },
  selectProject(cwd) {
    return ipcRenderer.invoke("workspace:select-project", cwd)
  },
  setProjectCollapsed(cwd, collapsed) {
    return ipcRenderer.invoke("workspace:set-collapsed", cwd, collapsed)
  },
  newSession() {
    return ipcRenderer.invoke("session:new")
  },
  openSession(sessionFile) {
    return ipcRenderer.invoke("session:open", sessionFile)
  },
  archiveSession(sessionFile) {
    return ipcRenderer.invoke("session:archive", sessionFile)
  },
  removeProject(cwd) {
    return ipcRenderer.invoke("workspace:remove-project", cwd)
  },
  prompt(text) {
    return ipcRenderer.invoke("prompt", text) // → WorkspaceState | null
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
