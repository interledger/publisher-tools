import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  encode,
  pickRandomByPercentage,
} from '@shared/probabilistic-revenue-share'
import {
  appendShareRow,
  getPercentageTotal,
  hasValidPercentages,
  hasDuplicatePointers,
  normalizeSharePercentages,
  pointerToShares,
  sharesToPaymentPointer,
  tagOrPointerToShares,
  validateShares,
  type Share,
} from './revshare'

const baseUrl = 'https://example.com/revshare/'
const shares = (...pointers: string[]): Share[] =>
  normalizeSharePercentages(
    pointers.map((pointer, index) => ({
      id: String(index),
      pointer,
      percentage: 1,
      isValid: true,
    })),
  )

afterEach(() => {
  vi.restoreAllMocks()
})

describe('percentage distributions', () => {
  it('normalizes relative values and keeps the rounded total at 100', () => {
    const normalized = normalizeSharePercentages([
      { id: '1', pointer: 'one', percentage: 1 },
      { id: '2', pointer: 'two', percentage: 1 },
      { id: '3', pointer: 'three', percentage: 1 },
    ])

    expect(normalized.map((share) => share.percentage)).toEqual([
      33.34, 33.33, 33.33,
    ])
    expect(getPercentageTotal(normalized)).toBe(100)
    expect(hasValidPercentages(normalized)).toBe(true)
  })

  it('preserves proportional differences when converting legacy values', () => {
    const normalized = normalizeSharePercentages([
      { id: '1', pointer: 'one', percentage: 1 },
      { id: '2', pointer: 'two', percentage: 2 },
      { id: '3', pointer: 'three', percentage: 3 },
    ])

    expect(normalized.map((share) => share.percentage)).toEqual([
      16.67, 33.33, 50,
    ])
  })

  it('keeps tiny positive legacy shares above zero', () => {
    const normalized = normalizeSharePercentages([
      { id: '1', pointer: 'one', percentage: 1 },
      { id: '2', pointer: 'two', percentage: 100_000 },
    ])

    expect(normalized.map((share) => share.percentage)).toEqual([0.01, 99.99])
    expect(hasValidPercentages(normalized)).toBe(true)
  })

  it('uses largest-remainder rounding when rounded shares would exceed 100', () => {
    const normalized = normalizeSharePercentages(
      Array.from({ length: 6 }, (_, index) => ({
        id: String(index),
        pointer: String(index),
        percentage: 1,
      })),
    )

    expect(normalized.map((share) => share.percentage)).toEqual([
      16.67, 16.67, 16.67, 16.67, 16.66, 16.66,
    ])
    expect(getPercentageTotal(normalized)).toBe(100)
  })

  it('requires positive percentages that add up to 100', () => {
    const recipients = shares(
      'https://wallet.example/alice',
      'https://wallet.example/bob',
    )
    expect(hasValidPercentages(recipients)).toBe(true)
    expect(sharesToPaymentPointer(recipients, baseUrl)).not.toBe('')

    recipients[0].percentage = 99.99
    recipients[1].percentage = 0.01
    expect(hasValidPercentages(recipients)).toBe(true)

    recipients[1].percentage = 0
    expect(hasValidPercentages(recipients)).toBe(false)
    expect(sharesToPaymentPointer(recipients, baseUrl)).toBe('')

    recipients[0].percentage = 50.002
    recipients[1].percentage = 50.002
    expect(hasValidPercentages(recipients)).toBe(false)

    recipients[0].percentage = 100.01
    recipients[1].percentage = Number.NaN
    expect(hasValidPercentages(recipients)).toBe(false)
  })

  it('accepts equal two-decimal splits that round just under 100', () => {
    const thirds = [
      { id: '1', pointer: 'one', percentage: 33.33, isValid: true },
      { id: '2', pointer: 'two', percentage: 33.33, isValid: true },
      { id: '3', pointer: 'three', percentage: 33.33, isValid: true },
    ]
    expect(hasValidPercentages(thirds)).toBe(true)
    expect(
      pointerToShares(sharesToPaymentPointer(thirds, baseUrl)).map(
        (share) => share.percentage,
      ),
    ).toEqual([33.34, 33.33, 33.33])
  })

  it('fills leftover percentage when adding a recipient', () => {
    const added = appendShareRow([
      { id: '1', pointer: 'one', percentage: 40, isValid: true },
      { id: '2', pointer: 'two', percentage: 40, isValid: true },
    ])
    expect(added.map((share) => share.percentage)).toEqual([40, 40, 20])
  })

  it('rescales existing shares when adding to a full 100% split', () => {
    const added = appendShareRow([
      { id: '1', pointer: 'one', percentage: 70, isValid: true },
      { id: '2', pointer: 'two', percentage: 30, isValid: true },
    ])
    expect(added.map((share) => share.percentage)).toEqual([46.67, 20, 33.33])
    expect(getPercentageTotal(added)).toBe(100)
    expect(hasValidPercentages(added)).toBe(true)
  })

  it('normalizes imported legacy values to percentages', () => {
    const imported = pointerToShares(
      baseUrl +
        encode([
          { pointer: 'https://wallet.example/alice', percentage: 1 },
          { pointer: 'https://wallet.example/bob', percentage: 3 },
        ]),
    )

    expect(imported.map((share) => share.percentage)).toEqual([25, 75])
  })
})

describe('legacy encoded distributions', () => {
  it('uses the actual total when selecting from old relative weights', () => {
    const random = vi.spyOn(Math, 'random')
    const legacyDistribution = [
      { pointer: 'alice', percentage: 1 },
      { pointer: 'bob', percentage: 3 },
    ]

    random.mockReturnValueOnce(0.2).mockReturnValueOnce(0.5)
    expect(pickRandomByPercentage(legacyDistribution)).toBe('alice')
    expect(pickRandomByPercentage(legacyDistribution)).toBe('bob')
  })
})

describe('duplicate recipient wallets', () => {
  it.each([
    ['https://wallet.example/alice', 'https://wallet.example/alice'],
    ['$wallet.example/alice', 'https://wallet.example/alice'],
    [' https://wallet.example/alice ', 'https://wallet.example/alice'],
    ['https://WALLET.example:443/alice', 'https://wallet.example/alice'],
    ['https://wallet.example', 'https://wallet.example/.well-known/pay'],
    ['https://wallet.example/', 'https://wallet.example/.well-known/pay'],
    ['$wallet.example', 'https://wallet.example/.well-known/pay'],
    ['$wallet.example/', '$wallet.example/.well-known/pay'],
    ['https://WALLET.example:443/', '$wallet.example/.well-known/pay'],
  ])('detects equivalent addresses %s and %s', (first, second) => {
    const recipients = shares(first, second)
    expect(hasDuplicatePointers(recipients)).toBe(true)
    expect(sharesToPaymentPointer(recipients, baseUrl)).toBe('')
  })

  it('ignores blank rows and preserves case-sensitive wallet paths', () => {
    expect(hasDuplicatePointers(shares('', '', '  '))).toBe(false)
    expect(
      hasDuplicatePointers(
        shares('https://wallet.example/Alice', 'https://wallet.example/alice'),
      ),
    ).toBe(false)
    expect(
      hasDuplicatePointers(
        shares('https://wallet.example', 'https://wallet.example/alice'),
      ),
    ).toBe(false)
  })

  it('detects duplicates while wallet validation is still pending', () => {
    const recipients = shares(
      'https://wallet.example/alice',
      '$wallet.example/alice',
    )
    recipients[1].isValid = false
    expect(hasDuplicatePointers(recipients)).toBe(true)
    expect(sharesToPaymentPointer(recipients, baseUrl)).toBe('')
  })

  it('detects duplicates in imported links before wallet validation', () => {
    const imported = tagOrPointerToShares(
      baseUrl +
        encode(shares('https://wallet.example/alice', '$wallet.example/alice')),
    )!
    expect(imported.every((share) => share.isValid === undefined)).toBe(true)
    expect(hasDuplicatePointers(imported)).toBe(true)
    expect(sharesToPaymentPointer(imported, baseUrl)).toBe('')
    expect(
      hasDuplicatePointers(
        tagOrPointerToShares(
          baseUrl +
            encode(
              shares(
                'https://wallet.example/alice',
                'https://wallet.example/bob',
              ),
            ),
        )!,
      ),
    ).toBe(false)
  })

  it('keeps duplicate imports editable while blocking output until corrected', () => {
    const imported = tagOrPointerToShares(
      baseUrl +
        encode(
          shares('$wallet.example', 'https://wallet.example/.well-known/pay'),
        ),
    )!
    expect(imported.map((share) => share.pointer)).toEqual([
      '$wallet.example',
      'https://wallet.example/.well-known/pay',
    ])
    expect(imported[0].id).not.toBe(imported[1].id)
    imported.forEach((share) => (share.isValid = true))
    expect(hasDuplicatePointers(imported)).toBe(true)
    expect(sharesToPaymentPointer(imported, baseUrl)).toBe('')

    imported[1].pointer = 'https://wallet.example/bob'
    expect(hasDuplicatePointers(imported)).toBe(false)
    expect(
      pointerToShares(sharesToPaymentPointer(imported, baseUrl)).map(
        (share) => share.pointer,
      ),
    ).toEqual(imported.map((share) => share.pointer))
  })

  it('keeps previously validated duplicate entries recoverable from storage', () => {
    const recipients = shares(
      'https://wallet.example/alice',
      'https://wallet.example/alice',
    )
    expect(validateShares(recipients)).toBe(true)
    expect(hasDuplicatePointers(recipients)).toBe(true)
    expect(recipients).toHaveLength(2)
  })

  it('allows generation again after changing or removing a duplicate', () => {
    const recipients = shares(
      'https://wallet.example/alice',
      'https://wallet.example/alice',
    )
    recipients[1].pointer = 'https://wallet.example/bob'
    expect(hasDuplicatePointers(recipients)).toBe(false)
    expect(
      pointerToShares(sharesToPaymentPointer(recipients, baseUrl)).map(
        (s) => s.pointer,
      ),
    ).toEqual(recipients.map((s) => s.pointer))
    recipients[1].pointer = recipients[0].pointer
    recipients.pop()
    recipients[0].percentage = 100
    expect(sharesToPaymentPointer(recipients, baseUrl)).not.toBe('')
  })
})
