/** Traffic-light clearance + drag strip; place first in any top-reaching pane. */
export function TitlebarChrome() {
  return (
    <div className="app-titlebar">
      {/* Real node: Electron ignores -webkit-app-region on pseudo-elements. */}
      <div className="app-titlebar__resizer" />
    </div>
  )
}
