/** Traffic-light clearance + drag strip; place first in a top-reaching sidebar. */
export function TitlebarChrome() {
  return (
    <div className="app-titlebar">
      {/* Real node: Electron ignores -webkit-app-region on pseudo-elements. */}
      <div className="app-titlebar__resizer" />
    </div>
  )
}
