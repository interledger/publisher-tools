import { useCallback, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGEdit2, SVGExclamationCircle } from '~/assets/svg'

type TabOption<T extends string> = { id: T; label: string; hasUpdates: boolean }
interface Props<T extends string> {
  options: readonly TabOption<T>[]
  children: React.ReactNode
  selectedId: T
  idPrefix: string
  onChange: (id: T) => void
  onRename: (label: string) => void
}

export const BuilderProfileTabs = <T extends string>({
  options,
  children,
  selectedId,
  idPrefix,
  onChange,
  onRename,
}: Props<T>) => {
  const tabListRef = useRef<HTMLDivElement>(null)

  const activeTabId = selectedId
  const activeTabIdx = options.findIndex((option) => option.id === selectedId)
  const [editingId, setEditingId] = useState<T | null>()
  const [editIntentId, setEditIntentId] = useState<T | null>(null)
  const [hasEditingError, setHasEditingError] = useState(false)

  const getTabElement = (id: T) => {
    return tabListRef.current!.querySelector<HTMLElement>(
      `#${idPrefix}-tab-${id}`,
    )
  }

  const handleEditIntentLeave = useCallback(
    (e: React.MouseEvent | React.FocusEvent, id: T) => {
      if (!(e.relatedTarget instanceof Element)) return
      const dest = e.relatedTarget
      if (dest?.closest(`#${idPrefix}-tab-${id}`)) return
      if (dest?.closest(`[data-intent-wrapper="${id}"]`)) return

      setEditIntentId(null)
    },
    [idPrefix],
  )

  const setActiveTab = useCallback(
    (tabIndex: number) => {
      if (tabIndex < 0) tabIndex += options.length
      const tabId = options[tabIndex].id
      onChange(tabId)
      getTabElement(tabId)?.focus()
    },
    [options, onChange],
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
    [activeTabId, activeTabIdx],
  )

  return (
    <div className="relative overflow-hidden">
      <div
        className="grid w-full overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(12rem, 1fr))`, // not same as grid-cols-3
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
              onMouseEnter={() => setEditIntentId(option.id)}
              onMouseLeave={(e) => handleEditIntentLeave(e, option.id)}
              onFocus={() => setEditIntentId(option.id)}
              onBlur={(e) => handleEditIntentLeave(e, option.id)}
              className={cx(
                'flex-grow flex items-center text-left relative',
                'px-2 pb-2 pt-4 rounded-b-none rounded-t-sm',
                'cursor-pointer !-outline-offset-2',
                !editingId && 'mb-2',
                option.id === activeTabId
                  ? 'bg-white text-text-buttons-default'
                  : 'text-silver-600 hover:bg-purple-50',
              )}
            >
              <span
                title={option.label}
                className={cx(
                  'truncate inline-block w-full px-2 py-2 rounded-sm',
                  option.id === activeTabId
                    ? 'text-text-buttons-default'
                    : 'text-silver-600',
                  !editingId &&
                    editIntentId === option.id &&
                    editIntentId === activeTabId &&
                    'bg-white outline outline-1 outline-field-border-hover text-text-primary',
                )}
              >
                {option.label}
              </span>

              {option.hasUpdates && editingId !== option.id && (
                <>
                  <span className="sr-only"> (modified)</span>
                  <DirtyMarker
                    visible={
                      editIntentId === activeTabId
                        ? editIntentId !== option.id
                        : true
                    }
                  />
                </>
              )}
            </button>
          ))}
        </div>

        <div
          className={cx('-mt-14 z-0', editingId ? 'w-full' : 'w-min ml-auto')}
          style={{ gridColumn: `${activeTabIdx + 1} / span 1` }}
          data-intent-wrapper={activeTabId}
          onMouseEnter={() => setEditIntentId(activeTabId)}
          onFocus={() => setEditIntentId(activeTabId)}
          onMouseLeave={(e) => handleEditIntentLeave(e, activeTabId)}
          onBlur={(e) => handleEditIntentLeave(e, activeTabId)}
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
          {!editingId && editIntentId === activeTabId && (
            <TabActionTrigger onClick={() => setEditingId(activeTabId)} />
          )}
        </div>
      </div>

      {options.map((option) => (
        <div
          role="tabpanel"
          className={cx(
            'bg-interface-bg-container rounded-b-sm p-md flex-col gap-md w-full -mt-2',
            option.id === activeTabId ? 'flex' : 'hidden',
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

function DirtyMarker({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-4 top-1 w-fit transition-colors"
      title="This configuration has unsaved changes"
      style={{ fontSize: '10px', color: visible ? '#AD6200' : 'transparent' }}
    >
      • unsaved changes
    </div>
  )
}

function TabActionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-test-id="tab-rename-trigger"
      className="grid items-center cursor-pointer px-2 mr-2 rounded-none rounded-r-sm h-full bg-white text-text-buttons-default"
      onClick={onClick}
      title="Edit configuration name"
      style={{ height: `calc(100% - 0.5rem * 2)` }}
    >
      <span className="sr-only">Edit configuration name</span>
      <SVGEdit2 className="size-4" />
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
  inputId,
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
    [tabId, options, setErrorMessage],
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
    [tabId],
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
        'grid grid-flow-col items-center rounded-t-sm bg-white relative p-2 mb-2',
      )}
    >
      <input
        type="text"
        id={inputId}
        className={cx(
          'flex-shrink-0 w-auto p-2 pr-8 text-left',
          'text-style-body-standard leading-md font-normal w-full',
          'text-text-buttons-default bg-white rounded-sm',
          'invalid:text-text-error invalid:underline invalid:empty:no-underline decoration-dashed',
          'outline outline-1',
          !!errorMessage && 'outline outline-field-border-error',
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
          className="text-style-caption-standard !text-text-error absolute bottom-1.5 right-1.5 bg-white"
          id={`${inputId}-error`}
        >
          {errorMessage}
        </span>
      )}

      <button
        type="submit"
        className="cursor-pointer rounded-none p-xs -outline-offset-2 h-full focus:scale-120 focus:outline-none absolute right-2"
        title="Save configuration name"
      >
        <span className="sr-only">Save configuration name</span>
        {errorMessage ? (
          <SVGExclamationCircle className="size-4 text-text-error bg-white" />
        ) : (
          <SVGEdit2 className="size-4 text-text-buttons-default bg-white" />
        )}
      </button>
    </form>
  )
}

const validateInput = <T extends string>(
  value: string,
  options: readonly TabOption<T>[],
  currentTabId: T,
): string | '' => {
  const val = value.trim()
  if (!val) {
    return 'Name is required'
  }

  const isDuplicate = options.some(
    (opt) =>
      opt.id !== currentTabId && opt.label.toLowerCase() === val.toLowerCase(),
  )
  if (isDuplicate) {
    return 'This name is already used'
  }

  return ''
}
