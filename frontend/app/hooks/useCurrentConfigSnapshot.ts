import { useSnapshot } from 'valtio'
import { toolState } from '~/stores/toolStore'
import type { ElementConfigType } from '@shared/types'

/**
 * The { sync: true } option ensures synchronous updates to prevent stale closures
 * and inconsistent state. Without sync: true, there can be a brief delay where the
 * snapshot doesn't reflect the latest changes, causing UI inconsistencies.
 *
 * See: https://github.com/pmndrs/valtio/issues/132
 *
 */
export function useCurrentConfigSnapshot(): ElementConfigType {
  return useSnapshot(toolState.currentConfig, { sync: true })
}
