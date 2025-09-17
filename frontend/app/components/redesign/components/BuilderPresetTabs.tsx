import { cx } from 'class-variance-authority'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SVGEdit } from '~/assets/svg'
import { Check, ExclamationTriangle } from '~/components/icons'

type TabOption<T extends string> = { id: T; label: string; isDirty: boolean }
interface Props<T extends string> {
  options: TabOption<T>[]
  children: React.ReactNode
  selectedId: T
  idPrefix: string
  onChange: (id: T) => void
  onRename: (id: T, label: string) => void
}

export const BuilderPresetTabs = <T extends string>({
  options,
  children,
  selectedId,
  idPrefix,
  onChange,
  onRename
}: Props<T>) => {
  const tabListRef = useRef<HTMLDivElement>(null)

  const [activeTabId, setActiveTabId] = useState(selectedId)
  const [activeTabIdx, setActiveTabIdx] = useState(
    options.findIndex((option) => option.id === selectedId)
  )
  const [editingId, setEditingId] = useState<T | null>()
  const [hasEditingError, setHasEditingError] = useState(false)

  useEffect(() => {
    setActiveTab(options.findIndex((option) => option.id === selectedId))
  }, [options, selectedId])

  const getTabElement = (id: T) => {
    return tabListRef.current!.querySelector<HTMLElement>(
      `#${idPrefix}-tab-${id}`
    )
  }

  const setActiveTab = useCallback(
    (tabIndex: number) => {
      if (tabIndex < 0) tabIndex += options.length
      const tabId = options[tabIndex].id
      setActiveTabIdx(tabIndex)
      setActiveTabId(tabId)
      onChange(tabId)
      getTabElement(tabId)?.focus()
    },
    [options, onChange]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let nextTabIdx: number | null = null
      if (!editingId) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const idx = activeTabIdx
          const dir = e.key === 'ArrowLeft' ? -1 : 1
          nextTabIdx = (idx + dir) % options.length
        } else if (e.key === 'Home' || e.key === 'End') {
          nextTabIdx = e.key === 'Home' ? 0 : options.length - 1
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (!hasEditingError) {
            e.preventDefault()
            setEditingId(activeTabId)
            return
          }
        }
      }

      if (typeof nextTabIdx === 'number' && !hasEditingError) {
        e.preventDefault()
        setActiveTab(nextTabIdx)
        setEditingId(null)
      }
    },
    [activeTabId, activeTabIdx]
  )

  return (
    <div className="relative">
      <div
        className="grid overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(calc(180px + 1rem), 1fr))` // not same as grid-cols-3
        }}
      >
        <div
          role="tablist"
          className="col-span-3 grid grid-cols-3"
          aria-label="Configuration versions"
          ref={tabListRef}
        >
          {options.map((option) => (
            <button
              role="tab"
              key={option.id}
              id={`${idPrefix}-tab-${option.id}`}
              type="button"
              aria-selected={option.id === activeTabId}
              aria-controls={`${idPrefix}-tabpanel-${option.id}`}
              tabIndex={option.id === activeTabId ? 0 : -1}
              disabled={hasEditingError}
              onClick={() => onChange(option.id)}
              onDoubleClick={() => setEditingId(option.id)}
              onKeyDown={onKeyDown}
              className={cx(
                'flex-grow flex items-center justify-center relative',
                'px-xs py-sm rounded-b-none rounded-t-sm',
                'cursor-pointer !-outline-offset-2',
                option.id === activeTabId
                  ? 'bg-white text-purple-300'
                  : 'text-silver-600 hover:bg-purple-50'
              )}
            >
              <span
                title={option.label}
                className={cx(
                  'truncate inline-block w-[180px]',
                  option.id === activeTabId
                    ? 'text-purple-300'
                    : 'text-silver-600'
                )}
              >
                {option.label}
              </span>

              {option.isDirty && (
                <>
                  <span className="sr-only"> (modified)</span>
                  {editingId !== option.id && <DirtyMarker />}
                </>
              )}
            </button>
          ))}
        </div>

        <div
          className={cx('-mt-12 z-0', editingId ? 'w-full' : 'w-min ml-auto')}
          style={{ gridColumn: `${activeTabIdx + 1} / span 1` }}
        >
          {editingId === activeTabId && (
            <TabNameEditor
              tabId={activeTabId}
              tabIdx={activeTabIdx}
              options={options}
              onSubmit={(tabId, label) => {
                setEditingId(null)
                onRename(tabId, label)
              }}
              setHasError={setHasEditingError}
              inputId={`${idPrefix}-tab-label-${activeTabId}`}
            />
          )}
          {!editingId && (
            <TabActionTrigger onClick={() => setEditingId(activeTabId)} />
          )}
        </div>
      </div>

      {options.map((option) => (
        <div
          role="tabpanel"
          className={cx(
            'bg-interface-bg-container rounded-b-sm p-md flex-col gap-md w-full',
            option.id === activeTabId ? 'flex' : 'hidden'
          )}
          aria-labelledby={`${idPrefix}-tab-${option.id}`}
          id={`${idPrefix}-tabpanel-${option.id}`}
          key={`${idPrefix}-tabpanel-${option.id}`}
        >
          {option.id === activeTabId && children}
        </div>
      ))}
    </div>
  )
}

function DirtyMarker() {
  return (
    <div
      aria-hidden="true"
      className="absolute right-xs top-sm translate-y-full w-2 h-2 bg-blue-500 rounded-full"
      title="This configuration has unsaved changes"
    />
  )
}

function TabActionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="cursor-pointer px-xs h-full rounded-none rounded-tr-sm mt-1 text-field-helpertext-default hover:text-text-buttons-default focus:text-text-buttons-default"
      onClick={onClick}
      title="Edit configuration name"
      style={{ height: `calc(100% - 0.25rem * 2)` }}
    >
      <span className="sr-only">Edit configuration name</span>
      <SVGEdit className="w-5 h-5" />
    </button>
  )
}

function TabNameEditor<T extends string>({
  options,
  tabId,
  tabIdx,
  onSubmit,
  setHasError,
  inputId
}: {
  options: TabOption<T>[]
  tabId: T
  tabIdx: number
  onSubmit: (tabId: T, label: string) => void
  setHasError: (hasError: boolean) => void
  inputId: string
}) {
  const [errorMessage, setErrorMessage] = useState('')

  const validateTabName = useCallback(
    (input: HTMLInputElement, currentTabId: T): boolean => {
      const errMsg = validateInput(input.value, options, currentTabId)
      input.setCustomValidity(errMsg)
      setErrorMessage(errMsg)
      setHasError(!!errMsg)
      return !errMsg
    },
    [options, setErrorMessage]
  )

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault()
        const input = ev.currentTarget.querySelector('input')!
        if (validateTabName(input, tabId)) {
          onSubmit(tabId, input.value.trim())
        }
      }}
      className={cx(
        'grid grid-flow-col items-center px-xs -outline-offset-2 rounded-t-sm',
        // 'focus-within:outline outline-2 outline-primary-focus',
        !!errorMessage && 'outline outline-2 outline-red-500 bg-red-50'
      )}
    >
      <input
        type="text"
        id={inputId}
        className={cx(
          'flex-shrink-0 w-auto px-xs py-sm text-left',
          'text-base leading-md font-normal w-full',
          'text-purple-600 bg-white',
          'invalid:text-red-500 invalid:bg-red-50',
          'focus:outline-none'
        )}
        placeholder="Preset name"
        autoFocus={true}
        defaultValue={options[tabIdx].label}
        onChange={(e) => validateTabName(e.target, tabId)}
        onBlur={(e) => {
          if (validateTabName(e.target, tabId)) {
            onSubmit(tabId, e.target.value.trim())
          }
        }}
        maxLength={40}
      />

      <button
        type="submit"
        className="cursor-pointer rounded-none p-xs -outline-offset-2 h-full focus:scale-120 focus:outline-none ml-auto -mr-2"
        title="Save configuration name"
      >
        <span className="sr-only">Save configuration name</span>
        {errorMessage ? (
          <ExclamationTriangle className="w-5 h-5 text-red-500" />
        ) : (
          <Check className="w-5 h-5 text-text-success" />
        )}
      </button>
    </form>
  )
}

const validateInput = <T extends string>(
  value: string,
  options: TabOption<T>[],
  currentTabId: T
): string | '' => {
  const val = value.trim()
  if (!val) {
    return 'Name is required'
  }

  const isDuplicate = options.some(
    (opt) =>
      opt.id !== currentTabId && opt.label.toLowerCase() === val.toLowerCase()
  )
  if (isDuplicate) {
    return 'This name is already taken'
  }

  return ''
}
