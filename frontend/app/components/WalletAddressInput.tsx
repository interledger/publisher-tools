import type { ElementConfigType } from '@shared/types'
import type { ElementErrors } from '~/lib/types.js'
import { Input } from './index.js'
import { tooltips } from '~/lib/tooltips.js'

export const WalletAddress = ({
  errors,
  config,
  setToolConfig
}: {
  errors?: ElementErrors
  config: ElementConfigType
  setToolConfig: React.Dispatch<React.SetStateAction<ElementConfigType>>
}) => {
  return (
    <div className="w-full my-4">
      <Input
        name="walletAddress"
        label="Wallet address"
        tooltip={tooltips.walletAddress}
        value={config?.walletAddress || ''}
        placeholder="https://ase-provider-url/jdoe"
        error={errors?.fieldErrors.walletAddress}
        onChange={(e) =>
          setToolConfig({
            ...config,
            walletAddress: e.target.value ?? ''
          })
        }
        withBorder
      />
    </div>
  )
}

WalletAddress.displayName = 'WalletAddress'
