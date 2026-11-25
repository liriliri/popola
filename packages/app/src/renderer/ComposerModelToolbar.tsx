import { useMemo } from "react"
import { observer } from "mobx-react-lite"
import { useTranslation } from "react-i18next"
import { selectIsBusy, type ComposerModelGroup } from "popola-ui"
import { ComposerModelPicker, ComposerToolbar, usePopolaState } from "popola-ui-react"
import { accountEnabled, activeProviderAccount } from "../shared/types"
import { appStore } from "./stores"

/** Leading composer controls: provider/model menu over configured accounts. */
export const ComposerModelToolbar = observer(function ComposerModelToolbar() {
  const { t } = useTranslation()
  const { provider } = appStore
  const busy = usePopolaState(selectIsBusy)

  const groups = useMemo((): ComposerModelGroup[] => {
    if (!provider) return []
    return provider.accounts.filter(accountEnabled).map((account) => ({
      providerId: account.id,
      providerLabel: t(`provider.presets.${account.id}`, {
        defaultValue: account.name,
      }),
      models: account.models.map((id) => ({ id, label: id })),
    }))
  }, [provider, t])

  if (!provider || groups.length === 0) return null

  const active = activeProviderAccount(provider)
  const selectedProviderId = active?.id ?? provider.activeAccountId
  const selectedModelId =
    active && active.models.includes(provider.model)
      ? provider.model
      : (active?.models[0] ?? provider.model)

  return (
    <ComposerToolbar>
      <ComposerModelPicker
        groups={groups}
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        disabled={busy}
        searchPlaceholder={t("ui.composerSearchModels")}
        emptyLabel={t("ui.composerNoModels")}
        ariaLabel={t("ui.composerModel")}
        onSelect={({ providerId, modelId }) => {
          void appStore.selectProviderModel(providerId, modelId)
        }}
      />
    </ComposerToolbar>
  )
})
