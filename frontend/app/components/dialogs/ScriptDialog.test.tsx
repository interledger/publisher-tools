import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  PROFILE_A,
  PROFILE_B,
  TOOL_BANNER,
  TOOL_OFFERWALL,
  TOOL_PAYWALL,
  TOOL_WIDGET,
  type Tool,
} from '@shared/types'
import { toolActions, toolState } from '~/stores/toolStore'
import type { WalletStore } from '~/stores/wallet-store'
import { DialogProvider } from './DialogProvider'
import { ScriptDialog } from './ScriptDialog'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  toolState.cdnUrl = 'https://cdn.test'
})

const wallet = {
  walletAddress: 'https://wallet.test/alice',
  walletAddressId: '',
} as WalletStore

function renderScript(tool: Tool) {
  toolActions.setCurrentToolType(tool)
  // e.g. "Version 2" selected in the banner
  toolActions.setActiveTab(PROFILE_B)
  render(
    <DialogProvider>
      <ScriptDialog wallet={wallet} />
    </DialogProvider>,
  )
  return screen.getByRole('region', { name: 'Script tag snippet' }).textContent
}

describe('ScriptDialog', () => {
  afterEach(() => {
    toolActions.setActiveTab(PROFILE_A)
  })

  it.each<Tool>([TOOL_BANNER, TOOL_WIDGET, TOOL_OFFERWALL])(
    'uses the selected version for the %s',
    (tool) => {
      expect(renderScript(tool)).toContain(`data-tag="${PROFILE_B}"`)
    },
  )

  it('always uses the paywall profile for the paywall', () => {
    expect(renderScript(TOOL_PAYWALL)).toContain(`data-tag="${PROFILE_A}"`)
  })
})
