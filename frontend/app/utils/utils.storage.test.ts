import { describe, it, expect } from 'vitest'
import { parseWithShape, patchProxy } from './utils.storage'

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
