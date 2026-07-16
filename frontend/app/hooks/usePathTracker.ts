import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { TOOLS, type Tool } from '@shared/types'
import { toolActions } from '~/stores/toolStore'

export const usePathTracker = (): string => {
  const location = useLocation()
  useEffect(() => {
    const tool = location.pathname.split('/')[1]

    if (!isValidToolType(tool)) {
      throw new Error(`Unknown tool type: "${tool}".`)
    }

    toolActions.setCurrentToolType(tool)
  }, [location.pathname])

  return location.pathname
}

function isValidToolType(value: string | undefined): value is Tool {
  return value !== undefined && TOOLS.includes(value as Tool)
}
