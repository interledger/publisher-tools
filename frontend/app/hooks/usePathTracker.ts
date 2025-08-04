import { useLocation } from '@remix-run/react'
import { useEffect } from 'react'
import { TOOL_TYPES, toolActions, type ToolType } from '~/stores/toolStore'

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

function isValidToolType(value: string | undefined): value is ToolType {
  return value !== undefined && TOOL_TYPES.includes(value as ToolType)
}
