import { useNavigate, useOutletContext, useParams } from '@remix-run/react'
import { RemoveVersionModal } from '~/components/modals/index.js'
import type { ElementConfigType } from '@shared/types'
import type { ModalType } from '~/lib/presets.js'

type ContextType = {
  toolConfig: ElementConfigType
  setConfigs: (
    config: Record<string, ElementConfigType>,
    versionName: string
  ) => void
  setModalOpen: React.Dispatch<React.SetStateAction<ModalType | undefined>>
  selectedVersion: string
}

export default function RemoveVersionRoute() {
  const navigate = useNavigate()
  const params = useParams<{ type: string }>()
  const { toolConfig, setConfigs, setModalOpen, selectedVersion } =
    useOutletContext<ContextType>()

  return (
    <RemoveVersionModal
      title="Remove Version"
      versionToRemove={selectedVersion}
      isOpen={true}
      onClose={() => navigate('..')}
      toolConfig={toolConfig}
      setConfigs={setConfigs}
      setModalOpen={setModalOpen}
      elementType={params.type!}
    />
  )
}
