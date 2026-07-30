import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseWithShape, patchProxy, subscribeToStorage } from './utils.storage'

describe('parseWithShape', () => {
  const shape = { a: 1, b: 'x', c: null }

  it('returns null for null / empty input', () => {
    expect(parseWithShape(null, shape)).toBeNull()
    expect(parseWithShape('', shape)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseWithShape('{oops', shape)).toBeNull()
  })

  it('returns null when a key is not part of the shape', () => {
    expect(
      parseWithShape(JSON.stringify({ a: 2, unknown: 9 }), shape),
    ).toBeNull()
  })

  it('returns null for non-object JSON', () => {
    expect(parseWithShape('42', shape)).toBeNull()
    expect(parseWithShape('null', shape)).toBeNull()
  })

  it('returns the parsed object when every key is in the shape', () => {
    expect(parseWithShape(JSON.stringify({ a: 5 }), shape)).toEqual({ a: 5 })
    expect(parseWithShape(JSON.stringify({ a: 5, b: 'y' }), shape)).toEqual({
      a: 5,
      b: 'y',
    })
  })
})

describe('subscribeToStorage', () => {
  const mockStorage = {} as Storage
  let listeners: Array<(e: Partial<StorageEvent>) => void> = []

  beforeEach(() => {
    listeners = []
    global.window = {
      addEventListener: (_type: string, h: EventListener) => {
        listeners.push(h as (e: Partial<StorageEvent>) => void)
      },
      removeEventListener: (_type: string, h: EventListener) => {
        const i = listeners.indexOf(h as (e: Partial<StorageEvent>) => void)
        if (i >= 0) listeners.splice(i, 1)
      },
    } as unknown as Window & typeof globalThis
    global.localStorage = mockStorage
  })

  afterEach(() => {
    delete (global as Record<string, unknown>).window
    delete (global as Record<string, unknown>).localStorage
  })

  const fire = (overrides: Partial<StorageEvent> = {}) => {
    const event = { storageArea: mockStorage, key: 'k', newValue: 'v', ...overrides }
    listeners.forEach((h) => h(event))
  }

  it('calls handler for valid localStorage storage events', () => {
    const handler = vi.fn()
    subscribeToStorage(handler)
    fire()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('filters events from a different storage area', () => {
    const handler = vi.fn()
    subscribeToStorage(handler)
    fire({ storageArea: {} as Storage })
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes through events with no storageArea (browser quirk)', () => {
    const handler = vi.fn()
    subscribeToStorage(handler)
    fire({ storageArea: undefined })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('filters events where key is null (full-storage clear)', () => {
    const handler = vi.fn()
    subscribeToStorage(handler)
    fire({ key: null })
    expect(handler).not.toHaveBeenCalled()
  })

  it('filters events where newValue is null (key deletion)', () => {
    const handler = vi.fn()
    subscribeToStorage(handler)
    fire({ newValue: null })
    expect(handler).not.toHaveBeenCalled()
  })

  it('unsubscribe stops the handler from being called', () => {
    const handler = vi.fn()
    const unsub = subscribeToStorage(handler)
    unsub()
    fire()
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('patchProxy', () => {
  it('applies leaf assignments recursively', () => {
    const target = { a: 1, nested: { x: 'old' } }
    patchProxy(target, { a: 2, nested: { x: 'new' } })
    expect(target).toEqual({ a: 2, nested: { x: 'new' } })
  })

  it('does not reassign leaves that are already equal', () => {
    let writes = 0
    const target: { a: number } = { a: 1 }
    const proxy = new Proxy(target, {
      set(t, k, v) {
        writes++
        ;(t as Record<string | symbol, unknown>)[k as string] = v
        return true
      },
    })
    patchProxy(proxy, { a: 1 })
    expect(writes).toBe(0)
    patchProxy(proxy, { a: 2 })
    expect(writes).toBe(1)
  })
})
