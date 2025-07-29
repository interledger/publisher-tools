import { useNavigate, useOutletContext, useParams } from '@remix-run/react'
import { ImportModal } from '~/components/modals/index.js'
import { APP_BASEPATH } from '~/lib/constants.js'
import type { ElementConfigType } from '@shared/types'

type ContextType = {
  toolConfig: ElementConfigType
  setConfigs: (config: Record<string, ElementConfigType>) => void
  setToolConfig: React.Dispatch<React.SetStateAction<ElementConfigType>>
}

export default function ImportRoute() {
  const navigate = useNavigate()
  const params = useParams<{ type: string }>()
  const { toolConfig, setConfigs, setToolConfig } =
    useOutletContext<ContextType>()

  return (
    <ImportModal
      title="Import config from wallet address"
      basepath={APP_BASEPATH}
      isOpen={true}
      onClose={() => navigate('..')}
      toolConfig={toolConfig}
      setConfigs={setConfigs}
      setToolConfig={setToolConfig}
      elementType={params.type!}
    />
  )
}
