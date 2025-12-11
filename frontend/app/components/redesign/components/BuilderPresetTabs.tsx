import { useCallback, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGEdit, SVGExclamationCircle } from '~/assets/svg'

type TabOption<T extends string> = { id: T; label: string; isDirty: boolean }
interface Props<T extends string> {
  options: readonly TabOption<T>[]
  children: React.ReactNode
  selectedId: T
  idPrefix: string
  onChange: (id: T) => void
  onRename: (label: string) => void
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

  const activeTabId = selectedId
  const activeTabIdx = options.findIndex((option) => option.id === selectedId)
  const [editingId, setEditingId] = useState<T | null>()
  const [hasEditingError, setHasEditingError] = useState(false)

  const getTabElement = (id: T) => {
    return tabListRef.current!.querySelector<HTMLElement>(
      `#${idPrefix}-tab-${id}`
    )
  }

  const setActiveTab = useCallback(
    (tabIndex: number) => {
      if (tabIndex < 0) tabIndex += options.length
      const tabId = options[tabIndex].id
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
        className="grid w-full overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(12rem, 1fr))` // not same as grid-cols-3
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
                'flex-grow flex items-center text-left relative',
                'px-4 py-4 rounded-b-none rounded-t-sm',
                'cursor-pointer !-outline-offset-2',
                !editingId && 'mb-2',
                option.id === activeTabId
                  ? 'bg-white text-text-buttons-default'
                  : 'text-silver-600 hover:bg-purple-50'
              )}
            >
              <span
                title={option.label}
                className={cx(
                  'truncate inline-block w-48 pr-4',
                  option.id === activeTabId
                    ? 'text-text-buttons-default'
                    : 'text-silver-600'
                )}
              >
                {option.label}
              </span>

              {option.isDirty && (
                <>
                  <span className="sr-only"> (modified)</span>
                  <DirtyMarker />
                </>
              )}
            </button>
          ))}
        </div>

        <div
          className={cx('-mt-14 z-0', editingId ? 'w-full' : 'w-min ml-auto')}
          style={{ gridColumn: `${activeTabIdx + 1} / span 1` }}
        >
          {editingId === activeTabId && (
            <TabNameEditor
              tabId={activeTabId}
              tabIdx={activeTabIdx}
              options={options}
              onSubmit={(label) => {
                setEditingId(null)
                onRename(label)
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
            'bg-interface-bg-container rounded-b-sm p-md flex-col gap-md w-full -mt-2',
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
      className="absolute right-2 top-2 w-1.5 h-1.5 bg-blue-500 rounded-full"
      title="This configuration has unsaved changes"
    />
  )
}

function TabActionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="grid items-center cursor-pointer px-4 rounded-none rounded-tr-sm h-full -mt-1 text-field-helpertext-default hover:text-text-buttons-default focus:text-text-buttons-default"
      onClick={onClick}
      title="Edit configuration name"
      style={{ height: `calc(100% - 0.25rem * 2)` }}
    >
      <span className="sr-only">Edit configuration name</span>
      <SVGEdit className="w-5 h-5" />
    </button>
  )
}

interface TabNameEditorProps<T extends string> {
  options: readonly TabOption<T>[]
  tabId: T
  tabIdx: number
  onSubmit: (label: string) => void
  setHasError: (hasError: boolean) => void
  inputId: string
}

function TabNameEditor<T extends string>({
  options,
  tabId,
  tabIdx,
  onSubmit,
  setHasError,
  inputId
}: TabNameEditorProps<T>) {
  const [errorMessage, setErrorMessage] = useState('')
  const ALLOWED_CHARS = /[a-zA-Z0-9-_\s#@&]/

  const validateTabName = useCallback(
    (input: HTMLInputElement): boolean => {
      const errMsg = validateInput(input.value, options, tabId)
      input.setCustomValidity(errMsg)
      setErrorMessage(errMsg)
      setHasError(!!errMsg)
      return !errMsg
    },
    [tabId, options, setErrorMessage]
  )

  const onKeyDown = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ALLOWED_CHARS.test(ev.key)) return // ok
    if (!ev.ctrlKey && !ev.metaKey) ev.preventDefault()
  }, [])

  const onPaste = useCallback(
    (ev: React.ClipboardEvent<HTMLInputElement>) => {
      const input = ev.currentTarget
      // let paste be completed, then update input to remove illegal chars
      setTimeout(() => {
        const re = new RegExp(ALLOWED_CHARS.source.replace(/^\[/, '[^'), 'g')
        input.value = input.value.replace(re, '').trim()
        validateTabName(input)
      }, 0)
    },
    [tabId]
  )

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault()
        const input = ev.currentTarget.querySelector('input')!
        if (validateTabName(input)) {
          onSubmit(input.value.trim())
        }
      }}
      className={cx(
        'grid grid-flow-col items-center -outline-offset-2 rounded-t-sm bg-white pr-2 relative mb-2',
        // 'focus-within:outline outline-2 outline-primary-focus',
        !!errorMessage && 'outline outline-2 outline-field-border-error'
      )}
    >
      <input
        type="text"
        id={inputId}
        className={cx(
          'flex-shrink-0 w-auto px-4 py-4 text-left',
          'text-style-body-standard leading-md font-normal w-full',
          'text-text-buttons-default bg-white rounded-t-sm',
          'invalid:text-text-error invalid:underline invalid:empty:no-underline decoration-dashed',
          'focus:outline-none'
        )}
        placeholder="Preset name"
        autoFocus={true}
        defaultValue={options[tabIdx].label}
        onChange={(e) => validateTabName(e.target)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={(e) => {
          if (validateTabName(e.target)) {
            onSubmit(e.target.value.trim())
          }
        }}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? `${inputId}-error` : undefined}
        maxLength={40}
      />
      {!!errorMessage && (
        <span
          className="text-style-caption-standard !text-text-error absolute -bottom-1.5 right-1.5 bg-white"
          id={`${inputId}-error`}
        >
          {errorMessage}
        </span>
      )}

      <button
        type="submit"
        className="cursor-pointer rounded-none p-xs -outline-offset-2 h-full focus:scale-120 focus:outline-none ml-auto"
        title="Save configuration name"
      >
        <span className="sr-only">Save configuration name</span>
        {errorMessage ? (
          <SVGExclamationCircle className="w-4 h-4 text-text-error" />
        ) : (
          <SVGEdit className="w-5 h-5 text-text-buttons-default" />
        )}
      </button>
    </form>
  )
}

const validateInput = <T extends string>(
  value: string,
  options: readonly TabOption<T>[],
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
    return 'This name is already used'
  }

  return ''
}
