import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "popola-ui/style.css"
import "./themes.css"
import "./app.css"

const root = document.getElementById("root")
if (!root) throw new Error("missing root")
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
