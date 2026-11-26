import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "popola-ui/style.css"
import "./themes.css"
import "./app.css"

const root = document.getElementById("root")
if (!root) throw new Error("missing root")

// Traffic-light inset CSS keys off this (only darwin is special-cased today).
if (/Mac|iPhone|iPad/.test(navigator.platform)) {
  document.documentElement.dataset.platform = "darwin"
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
