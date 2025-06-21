import { z } from 'zod'

export const PaymentQuoteSchema = z.object({
  senderWalletAddress: z.string().url('Invalid sender wallet address'),
  receiverWalletAddress: z.string().url('Invalid receiver wallet address'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional()
})

export const AmountSchema = z.object({
  value: z.string(),
  assetCode: z.string(),
  assetScale: z.number().int().min(0)
})

const WalletAddressSchema = z
  .object({
    id: z.string(),
    publicName: z.string(),
    assetCode: z.string(),
    assetScale: z.number().int().min(0),
    authServer: z.string(),
    resourceServer: z.string()
  })
  .brand('WalletAddress')

export const PaymentGrantSchema = z.object({
  walletAddress: WalletAddressSchema,
  debitAmount: AmountSchema,
  receiveAmount: AmountSchema
})

export const PaymentFinalizeSchema = z.object({
  walletAddress: WalletAddressSchema,
  pendingGrant: z.object({
    interact: z.object({
      redirect: z.string().url(),
      finish: z.string()
    }),
    continue: z.object({
      uri: z.string().url(),
      access_token: z.object({
        value: z.string()
      }),
      wait: z.number()
    })
  }),
  quote: z.object({
    id: z.string(),
    walletAddress: z.string().url('Invalid wallet address'),
    receiver: z.string().url(),
    receiveAmount: AmountSchema,
    debitAmount: AmountSchema,
    method: z.literal('ilp'),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional()
  }),
  incomingPaymentGrant: z.object({
    access_token: z.object({
      value: z.string(),
      manage: z.string().url(),
      expires_in: z.number().int(),
      access: z.array(
        z.object({
          type: z.literal('incoming-payment'),
          actions: z.array(z.enum(['create', 'read', 'complete'])),
          identifier: z.string().optional()
        })
      )
    }),
    continue: z.object({
      access_token: z.object({
        value: z.string()
      }),
      uri: z.string().url(),
      wait: z.number().int().optional()
    })
  }),
  interactRef: z.string().min(1, 'Interact reference is required')
})

export const WalletAddressParamSchema = z.object({
  wa: z.string().min(1, 'Wallet address is required'),
  version: z.string().optional().default('default')
})
