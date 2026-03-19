import React from 'react'
import { ToolsSecondaryButton } from '@/components'
import { BodyEmphasis, BodyStandard } from '@/typography'
import { BaseDialog } from './BaseDialog'

interface Props {
  walletAddress: string
  grantRedirect: string
}

export const GrantConfirmationDialog: React.FC<Props> = ({
  walletAddress,
  grantRedirect,
}) => {
  return (
    <BaseDialog
      className="p-4 pt-8
        flex flex-col items-center gap-md"
    >
      <div className="text-center">
        <BodyEmphasis>Confirm you are the owner of</BodyEmphasis>
        {walletAddress && (
          <div className="flex w-full justify-center text-center mt-2">
            <BodyStandard className="!text-text-success">
              {walletAddress}
            </BodyStandard>
          </div>
        )}
      </div>
      <div className=" text-center">
        <BodyStandard className="!text-field-helpertext-default">
          The privacy and safety of your data is important to us. Please confirm
          you own the wallet address shown above.
        </BodyStandard>
        <BodyEmphasis className="!text-field-helpertext-default">
          No funds will be withdrawn from your wallet.
        </BodyEmphasis>
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
    </BaseDialog>
  )
}
