/**
 * Traffic-light clearance + window drag strip (paseo / VS Code pattern).
 * Place as the first child of a sidebar (or full-bleed main) that reaches the
 * window top. The strip itself is the drag region — no nested overlay needed.
 */
export function TitlebarChrome() {
  return (
    <div className="app-titlebar">
      {/* Real node: Electron ignores -webkit-app-region on pseudo-elements. */}
      <div className="app-titlebar__resizer" />
    </div>
  )
}
