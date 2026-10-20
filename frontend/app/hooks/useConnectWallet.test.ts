import { describe, expect, it } from 'vitest'
import { PROFILE_B } from '@shared/types'
import { getLegacyOptions } from '~/hooks/useConnectWallet'
import { paywall } from '~/stores/paywall-store'
import { toolActions } from '~/stores/toolStore'
import { widget } from '~/stores/widget-store'

describe('getLegacyOptions', () => {
  it('uses the paywall changes on the paywall page', () => {
    toolActions.setCurrentToolType('paywall')
    widget.profilesUpdate.clear()
    paywall.profilesUpdate.add(PROFILE_B)

    const options = getLegacyOptions()

    expect(options.hasConflicts).toBe(true)
    expect(options.updates).toEqual([PROFILE_B])
    expect(options.profiles).toBe(paywall.profiles)
  })
})
