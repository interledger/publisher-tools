import { afterEach, describe, expect, it, vi } from 'vitest'
import { encode, pickWeightedRandom } from '@shared/probabilistic-revenue-share'
import {
  appendShareRow,
  getPercentageIssue,
  getPercentageStepBase,
  hasValidPercentages,
  hasDuplicatePointers,
  pointerToShares,
  sharesToPaymentPointer,
  tagOrPointerToShares,
  validateShares,
  weightsToPercentages,
  type Share,
} from './revshare'

const baseUrl = 'https://example.com/revshare/'
const shares = (...pointers: string[]): Share[] => {
  const percentages = weightsToPercentages(pointers.map(() => 1))
  return pointers.map((pointer, index) => ({
    id: String(index),
    pointer,
    percentage: percentages[index],
    isValid: true,
  }))
}
const encodePointers = (...pointers: string[]): string =>
  encode(pointers.map((pointer) => ({ pointer, weight: 1 })))
const withPercentages = (...percentages: number[]): Share[] =>
  percentages.map((percentage, index) => ({
    id: String(index),
    pointer: `https://wallet.example/${index}`,
    percentage,
    isValid: true,
  }))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('percentage distributions', () => {
  it('converts equal weights to percentages that total exactly 100', () => {
    const percentages = weightsToPercentages([1, 1, 1])

    expect(percentages).toEqual([33.34, 33.33, 33.33])
    expect(hasValidPercentages(withPercentages(...percentages))).toBe(true)
  })

  it('preserves proportional differences when converting legacy weights', () => {
    expect(weightsToPercentages([1, 2, 3])).toEqual([16.67, 33.33, 50])
  })

  it('keeps tiny positive legacy weights above zero', () => {
    const percentages = weightsToPercentages([1, 100_000])

    expect(percentages).toEqual([0.01, 99.99])
    expect(hasValidPercentages(withPercentages(...percentages))).toBe(true)
  })

  it('uses largest-remainder rounding when rounded shares would exceed 100', () => {
    const percentages = weightsToPercentages(Array(6).fill(1))

    expect(percentages).toEqual([16.67, 16.67, 16.67, 16.67, 16.66, 16.66])
    expect(hasValidPercentages(withPercentages(...percentages))).toBe(true)
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

    recipients[0].percentage = 100.01
    recipients[1].percentage = Number.NaN
    expect(hasValidPercentages(recipients)).toBe(false)
  })

  it.each([
    [[50, 49.99]],
    [[50, 50.01]],
    [[33.34, 33.34, 33.34]],
    [[33.33, 33.33, 33.33]],
  ])('rejects totals that are close to but not exactly 100: %j', (values) => {
    const recipients = withPercentages(...values)
    expect(hasValidPercentages(recipients)).toBe(false)
    expect(sharesToPaymentPointer(recipients, baseUrl)).toBe('')
  })

  it('reports why percentages are invalid', () => {
    expect(getPercentageIssue(withPercentages(60, 40))).toBeUndefined()
    expect(getPercentageIssue(withPercentages(100, 0))).toEqual({
      type: 'not-positive',
    })
    expect(getPercentageIssue(withPercentages(100, Number.NaN))).toEqual({
      type: 'not-positive',
    })
    expect(getPercentageIssue(withPercentages(33.333, 33.333, 33.334))).toEqual(
      { type: 'too-many-decimals' },
    )
    expect(getPercentageIssue(withPercentages(33.33, 33.33, 33.33))).toEqual({
      type: 'wrong-total',
      total: 99.99,
      difference: -0.01,
    })
    expect(getPercentageIssue(withPercentages(70.1, 40.2))).toEqual({
      type: 'wrong-total',
      total: 110.3,
      difference: 10.3,
    })
  })

  it('encodes an exact 100% split without altering it', () => {
    const thirds = withPercentages(33.34, 33.33, 33.33)
    expect(hasValidPercentages(thirds)).toBe(true)
    expect(
      pointerToShares(sharesToPaymentPointer(thirds, baseUrl)).map(
        (share) => share.percentage,
      ),
    ).toEqual([33.34, 33.33, 33.33])
  })

  it('prefills the leftover percentage when adding a recipient', () => {
    const added = appendShareRow(withPercentages(40.1, 39.9))
    expect(added.map((share) => share.percentage)).toEqual([40.1, 39.9, 20])
  })

  it('leaves existing percentages alone when adding to a full split', () => {
    expect(
      appendShareRow(withPercentages(70, 30)).map((share) => share.percentage),
    ).toEqual([70, 30, 0])
    expect(
      appendShareRow(withPercentages(70, 40)).map((share) => share.percentage),
    ).toEqual([70, 40, 0])
    expect(
      appendShareRow(withPercentages(70, 29.999)).map(
        (share) => share.percentage,
      ),
    ).toEqual([70, 29.999, 0])
  })

  it.each([
    [28.5, 0.5],
    [1.1, 0.1],
    [33.33, 0.33],
    [99.99, 0.99],
    [50, 0],
    [0, 0],
    [-1.5, 0],
    [Number.NaN, 0],
  ])('uses %d as a step base of %d', (percentage, expected) => {
    expect(getPercentageStepBase(percentage)).toBe(expected)
  })

  it('converts imported legacy weights to percentages', () => {
    // Generated by the weight-based tool: alice has weight 1, bob weight 3.
    const legacyLink =
      'https://webmonetization.org/api/revshare/pay/W1siaHR0cHM6Ly93YWxsZXQuZXhhbXBsZS9hbGljZSIsMSwiQWxpY2UiXSxbImh0dHBzOi8vd2FsbGV0LmV4YW1wbGUvYm9iIiwzLCJCb2IiXV0'
    const imported = tagOrPointerToShares(legacyLink)!

    expect(
      imported.map(({ pointer, name, percentage }) => ({
        pointer,
        name,
        percentage,
      })),
    ).toEqual([
      {
        pointer: 'https://wallet.example/alice',
        name: 'Alice',
        percentage: 25,
      },
      { pointer: 'https://wallet.example/bob', name: 'Bob', percentage: 75 },
    ])
  })
})

describe('legacy encoded distributions', () => {
  it('uses the actual total when selecting from old relative weights', () => {
    const random = vi.spyOn(Math, 'random')
    const legacyDistribution = [
      { pointer: 'alice', weight: 1 },
      { pointer: 'bob', weight: 3 },
    ]

    random.mockReturnValueOnce(0.2).mockReturnValueOnce(0.5)
    expect(pickWeightedRandom(legacyDistribution)).toBe('alice')
    expect(pickWeightedRandom(legacyDistribution)).toBe('bob')
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
        encodePointers('https://wallet.example/alice', '$wallet.example/alice'),
    )!
    expect(imported.every((share) => share.isValid === undefined)).toBe(true)
    expect(hasDuplicatePointers(imported)).toBe(true)
    expect(sharesToPaymentPointer(imported, baseUrl)).toBe('')
    expect(
      hasDuplicatePointers(
        tagOrPointerToShares(
          baseUrl +
            encodePointers(
              'https://wallet.example/alice',
              'https://wallet.example/bob',
            ),
        )!,
      ),
    ).toBe(false)
  })

  it('keeps duplicate imports editable while blocking output until corrected', () => {
    const imported = tagOrPointerToShares(
      baseUrl +
        encodePointers(
          '$wallet.example',
          'https://wallet.example/.well-known/pay',
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
