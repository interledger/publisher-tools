// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultPaywallProfile,
  createDefaultWidgetProfile,
} from '@shared/default-data'
import {
  PROFILE_A,
  PROFILE_B,
  PROFILE_C,
  type ToolProfiles,
} from '@shared/types'
import { paywall } from '~/stores/paywall-store'
import { toolActions } from '~/stores/toolStore'
import { widget } from '~/stores/widget-store'

const serverProfiles: ToolProfiles<'widget'> = {
  [PROFILE_A]: createDefaultWidgetProfile('Server A'),
  [PROFILE_B]: createDefaultWidgetProfile('Server B'),
  [PROFILE_C]: createDefaultWidgetProfile('Server C'),
}

describe('toolActions.setToolProfiles', () => {
  beforeEach(() => {
    localStorage.clear()
    toolActions.setCurrentToolType('widget')
    toolActions.setToolProfiles(serverProfiles)
  })

  it('marks loaded server profiles as saved', () => {
    widget.profilesUpdate.add(PROFILE_A)

    toolActions.setToolProfiles(serverProfiles)

    expect(widget.profilesUpdate.size).toBe(0)
  })

  it('keeps local profiles flagged as unsaved', () => {
    widget.profiles[PROFILE_A].$name = 'Local A'
    const mergedProfiles: ToolProfiles<'widget'> = {
      ...serverProfiles,
      [PROFILE_A]: widget.profiles[PROFILE_A],
    }

    toolActions.setToolProfiles(mergedProfiles, serverProfiles)

    expect(widget.profiles[PROFILE_A].$name).toBe('Local A')
    expect([...widget.profilesUpdate]).toEqual([PROFILE_A])
  })

  it('keeps local edits flagged when the server has no copy', () => {
    widget.profiles[PROFILE_C].$name = 'Local C'
    const { [PROFILE_C]: _, ...partialServerProfiles } = serverProfiles

    toolActions.setToolProfiles(partialServerProfiles, partialServerProfiles)

    expect(widget.profiles[PROFILE_C].$name).toBe('Local C')
    expect([...widget.profilesUpdate]).toEqual([PROFILE_C])
  })
})

// The paywall nests objects two levels deep (`behavior.delay`). Assigning the
// server profiles into the store turns those into proxies, and the import
// dialog's "keep local change" then failed to clone them.
describe('toolActions.setToolProfiles for the paywall', () => {
  // a fresh copy, as each fetch from the API returns
  const fetchServerProfiles = (): ToolProfiles<'paywall'> =>
    JSON.parse(
      JSON.stringify({
        [PROFILE_A]: createDefaultPaywallProfile('Server A'),
        [PROFILE_B]: createDefaultPaywallProfile('Server B'),
        [PROFILE_C]: createDefaultPaywallProfile('Server C'),
      }),
    )

  beforeEach(() => {
    localStorage.clear()
    toolActions.setCurrentToolType('paywall')
    toolActions.setToolProfiles(fetchServerProfiles())
  })

  it('keeps a local change and loads the other versions from the server', () => {
    paywall.profiles[PROFILE_A].price.value = '9.00'
    paywall.profiles[PROFILE_A].behavior.delay.value = 5
    const serverProfiles = fetchServerProfiles()
    const mergedProfiles: ToolProfiles<'paywall'> = {
      ...serverProfiles,
      [PROFILE_A]: paywall.profiles[PROFILE_A],
    }

    toolActions.setToolProfiles(mergedProfiles, serverProfiles)

    expect(paywall.profiles[PROFILE_A].price.value).toBe('9.00')
    expect(paywall.profiles[PROFILE_A].behavior.delay.value).toBe(5)
    expect(paywall.profiles[PROFILE_B].$name).toBe('Server B')
    expect([...paywall.profilesUpdate]).toEqual([PROFILE_A])
  })
})
