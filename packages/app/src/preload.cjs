const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("popola", {
  getProvider() {
    return ipcRenderer.invoke("provider:get")
  },
  setProvider(config) {
    return ipcRenderer.invoke("provider:set", config)
  },
  prompt(text) {
    return ipcRenderer.invoke("prompt", text)
  },
  abort() {
    return ipcRenderer.invoke("abort")
  },
  onEvent(listener) {
    const handler = (_event, payload) => listener(payload)
    ipcRenderer.on("host-event", handler)
    ipcRenderer.send("host:listen")
    return () => ipcRenderer.removeListener("host-event", handler)
  },
})
