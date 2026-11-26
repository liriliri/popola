/** Top-edge resizer for frameless Windows/Linux; must be a real DOM node. */
export function TitlebarResizer() {
  return <div className="app-titlebar__resizer" />
}

/** Traffic-light clearance + drag strip; place first in any top-reaching pane. */
export function TitlebarChrome() {
  return (
    <div className="app-titlebar">
      <TitlebarResizer />
    </div>
  )
}
