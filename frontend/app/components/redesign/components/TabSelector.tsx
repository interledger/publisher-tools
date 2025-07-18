import { cx } from 'class-variance-authority'
import React, { useState, useRef, useEffect } from 'react'
import { SVGEdit } from '~/assets/svg'
import { TabTooltip } from './TabTooltip'
import { toolActions, toolState, type StableKey } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'

export interface TabOption {
  id: StableKey
}

interface TabSelectorProps {
  options: TabOption[]
  selectedId?: StableKey
  onSelectTab?: (tabId: StableKey) => void
  className?: string
  onTabLabelChange?: (tabId: StableKey, newLabel: string) => void
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  options,
  selectedId,
  onSelectTab,
  className = '',
  onTabLabelChange
}) => {
  const { modifiedVersions, configurations } = useSnapshot(toolState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragDistance, setDragDistance] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const getDisplayLabel = (stableKey: string): string => {
    return configurations[stableKey as StableKey].versionName
  }

  const isConfigModified = (stableKey: string): boolean => {
    return modifiedVersions.includes(stableKey as StableKey)
  }

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  useEffect(() => {
    if (!editingId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        if (!hasError) {
          saveEdit()
        } else {
          // cancel edit if there's an error
          setEditingId(null)
          setHasError(false)
          setErrorMessage('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingId, inputValue])

  const handleTabClick = (tabId: string) => {
    if (dragDistance > 5) {
      // prevent click if user was dragging
      setDragDistance(0)
      return
    }

    if (selectedId === tabId && !editingId) {
      beginEditing(tabId)
    } else {
      if (editingId) {
        saveEdit()
      }

      toolActions.selectVersion(tabId as StableKey)
      if (onSelectTab) {
        onSelectTab(tabId as StableKey)
      }
    }
  }

  const beginEditing = (tabId: string) => {
    const currentLabel = getDisplayLabel(tabId)

    setEditingId(tabId)
    setInputValue(currentLabel)
    setHasError(false)
    setErrorMessage('')
  }

  const validateInput = (value: string, currentTabId: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      setHasError(true)
      setErrorMessage('tab name is required')
      return
    }

    const isDuplicate = Object.entries(configurations).some(
      ([stableKey, config]) =>
        stableKey !== currentTabId &&
        config.versionName.trim().toLowerCase() === trimmedValue.toLowerCase()
    )

    if (isDuplicate) {
      setHasError(true)
      setErrorMessage('this name is taken by another tab')
      return
    }

    setHasError(false)
    setErrorMessage('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (/^[a-zA-Z0-9-_ ]*$/.test(newValue)) {
      setInputValue(newValue)

      if (editingId) {
        validateInput(newValue, editingId)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!hasError) {
        saveEdit()
      }
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setHasError(false)
      setErrorMessage('')
    }
  }

  const saveEdit = () => {
    if (editingId && inputValue.trim() !== '' && !hasError) {
      const originalLabel = getDisplayLabel(editingId)
      const newLabel = inputValue.trim()

      if (onTabLabelChange && originalLabel !== newLabel) {
        onTabLabelChange(editingId as StableKey, newLabel)
      }

      setEditingId(null)
      setHasError(false)
      setErrorMessage('')
    }
  }

  const startDragging = (e: React.MouseEvent) => {
    if (editingId || !containerRef.current) return

    mouseDownRef.current = true
    setDragDistance(0)
    startXRef.current = e.pageX - containerRef.current.offsetLeft
    scrollLeftRef.current = containerRef.current.scrollLeft
  }

  const stopDragging = () => {
    mouseDownRef.current = false
  }

  const move = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!mouseDownRef.current || !containerRef.current) return

    const x = e.pageX - containerRef.current.offsetLeft
    const scroll = x - startXRef.current
    setDragDistance(Math.abs(scroll))
    containerRef.current.scrollLeft = scrollLeftRef.current - scroll
  }

  return (
    <div id="tab-selector" className={`w-full overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className={`flex w-full overflow-x-auto scrollbar-hide select-none ${
          mouseDownRef.current ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={startDragging}
        onMouseMove={move}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {options.map((tab) => {
          const isSelected = selectedId === tab.id
          const isEditing = editingId === tab.id
          const displayLabel = getDisplayLabel(tab.id)
          const isModified = isConfigModified(tab.id)

          return (
            <div key={tab.id} className="flex flex-col flex-1">
              <div className="h-4 flex items-end">
                {isEditing && hasError && (
                  <div className="text-red-500 text-xs animate-in fade-in duration-200">
                    {errorMessage}
                  </div>
                )}
              </div>
              <div
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => setHoveredId(tab.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  rounded-t-sm flex-1 cursor-pointer ${isEditing ? 'min-w-[200px]' : ''}
                  ${
                    isSelected
                      ? 'bg-white text-purple-300'
                      : 'text-silver-600 hover:bg-purple-50'
                  }
                `}
                aria-selected={isSelected}
                role="tab"
              >
                <div className="flex flex-row items-center w-full h-[50px] gap-1 px-3 py-2">
                  <div
                    className="cursor-pointer flex-shrink-0"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      if (isSelected) beginEditing(tab.id)
                    }}
                  >
                    <SVGEdit
                      className={cx(
                        'w-7 h-7',
                        isEditing || (isSelected && hoveredId === tab.id)
                          ? 'visible'
                          : 'invisible'
                      )}
                    />
                  </div>

                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className={`bg-transparent border-none outline-none text-base leading-md font-normal w-full box-border ${
                        hasError ? 'text-red-500' : 'text-purple-600'
                      }`}
                      maxLength={40}
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <TabTooltip
                        text={displayLabel}
                        className={`
                        truncate block
                        ${isSelected ? 'text-purple-300' : 'text-silver-600'}
                      `}
                      >
                        {displayLabel}
                      </TabTooltip>
                      {isModified && (
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                          title="This configuration has been modified from default"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabSelector
