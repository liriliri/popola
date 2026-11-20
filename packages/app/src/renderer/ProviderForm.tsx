import { useState } from "react"
import { popolaClass } from "popola-ui"
import type { ProviderConfig } from "../shared/types"

const empty: ProviderConfig = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
}

export function ProviderForm(props: {
  initial: ProviderConfig | null
  error: string | null
  saving: boolean
  canCancel: boolean
  onCancel: () => void
  onSave: (config: ProviderConfig) => void
}) {
  const [draft, setDraft] = useState<ProviderConfig>(props.initial ?? empty)

  const update = (key: keyof ProviderConfig, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      className="popola-setup"
      onSubmit={(event) => {
        event.preventDefault()
        props.onSave(draft)
      }}
    >
      <div className="popola-setup__intro">
        <h1>Provider</h1>
        <p>Point the agent at an OpenAI-compatible endpoint. The key stays on this machine.</p>
      </div>

      <label>
        Provider
        <input
          value={draft.provider}
          placeholder="openai"
          autoComplete="off"
          onChange={(event) => update("provider", event.target.value)}
        />
      </label>
      <label>
        Base URL
        <input
          value={draft.baseUrl}
          placeholder="https://api.openai.com/v1"
          inputMode="url"
          autoComplete="off"
          onChange={(event) => update("baseUrl", event.target.value)}
        />
      </label>
      <label>
        API key
        <input
          value={draft.apiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => update("apiKey", event.target.value)}
        />
      </label>
      <label>
        Model
        <input
          value={draft.model}
          placeholder="gpt-4o"
          autoComplete="off"
          onChange={(event) => update("model", event.target.value)}
        />
      </label>

      {props.error ? <p className="popola-setup__error">{props.error}</p> : null}

      <div className="popola-setup__actions">
        <button
          type="submit"
          className={`${popolaClass.button} ${popolaClass.buttonPrimary}`}
          disabled={props.saving}
        >
          Save
        </button>
        {props.canCancel ? (
          <button type="button" className={`${popolaClass.button} ${popolaClass.buttonGhost}`} onClick={props.onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      <p className="popola-setup__note">Saving starts a new session.</p>
    </form>
  )
}
