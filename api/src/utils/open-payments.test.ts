import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AuthenticatedClient } from '@interledger/open-payments'
import type { Env } from '../app.js'

const createAuthenticatedClient = vi.hoisted(() => vi.fn())

vi.mock('@interledger/open-payments', () => ({ createAuthenticatedClient }))

const env = {
  OP_WALLET_ADDRESS: 'https://wallet.test/publisher',
  OP_PRIVATE_KEY: '',
  OP_KEY_ID: 'key-id',
} as Env

describe('OpenPaymentsService.getInstance', () => {
  beforeEach(() => {
    vi.resetModules()
    createAuthenticatedClient.mockReset()
  })

  it('gives concurrent callers the same initialized client', async () => {
    const client = {} as AuthenticatedClient
    createAuthenticatedClient.mockResolvedValue(client)
    const { OpenPaymentsService } = await import('./open-payments.js')

    const clients = await Promise.all([
      OpenPaymentsService.getClient(env),
      OpenPaymentsService.getClient(env),
    ])

    expect(clients).toEqual([client, client])
    expect(createAuthenticatedClient).toHaveBeenCalledTimes(1)
  })

  it('retries the client initialization after it fails', async () => {
    const client = {} as AuthenticatedClient
    createAuthenticatedClient
      .mockRejectedValueOnce(new Error('wallet unreachable'))
      .mockResolvedValueOnce(client)
    const { OpenPaymentsService } = await import('./open-payments.js')

    await expect(OpenPaymentsService.getClient(env)).rejects.toThrow(
      'wallet unreachable',
    )
    await expect(OpenPaymentsService.getClient(env)).resolves.toBe(client)
  })
})
