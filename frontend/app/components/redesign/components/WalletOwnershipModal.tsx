import React from 'react'
import { cx } from 'class-variance-authority'
import { useSnapshot } from 'valtio'
import { ToolsSecondaryButton } from '@/components'
import { Heading5, BodyEmphasis } from '@/typography'
import { toolState } from '~/stores/toolStore'
import { BaseModal } from './modals/BaseModal'

interface WalletOwnershipModalProps {
  grantRedirect: string
}

export const WalletOwnershipModal: React.FC<WalletOwnershipModalProps> = ({
  grantRedirect
}) => {
  const { walletAddress } = useSnapshot(toolState)
  return (
    <BaseModal
      className="p-8 pb-4
        flex flex-col items-center gap-6 w-full max-w-[442px]"
    >
      <div className="text-center">
        <Heading5>Please confirm you are owner of</Heading5>
        {walletAddress && (
          <div className="flex w-full justify-center text-center mt-2">
            <BodyEmphasis>{walletAddress}</BodyEmphasis>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          You will need to confirm a grant to prove that you are the owner of
          the wallet address. <br /> No funds will be withdrawn from your
          wallet.
        </p>
      </div>
      <div className="w-full">
        <ToolsSecondaryButton
          className="w-full flex items-center justify-center"
          onClick={() => {
            window.location.href = grantRedirect
          }}
        >
          Confirm
        </ToolsSecondaryButton>
      </div>
    </BaseModal>
  )
}

export default WalletOwnershipModal
