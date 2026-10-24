// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultWidgetProfile } from '@shared/default-data'
import {
  PROFILE_A,
  PROFILE_B,
  PROFILE_C,
  type ToolProfiles,
} from '@shared/types'
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
