import { describe, expect, it } from 'vitest'
import { encode } from '@shared/probabilistic-revenue-share'
import {
  hasDuplicatePointers,
  pointerToShares,
  sharesToPaymentPointer,
  tagOrPointerToShares,
  validateShares,
  type Share,
} from './revshare'

const baseUrl = 'https://example.com/revshare/'
const shares = (...pointers: string[]): Share[] =>
  pointers.map((pointer, index) => ({
    id: String(index),
    pointer,
    weight: 1,
    isValid: true,
  }))

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
    expect(sharesToPaymentPointer(recipients, baseUrl)).not.toBe('')
  })
})
