import z from 'zod'

export const PaymentQuoteSchema = z.object({
  senderWalletAddress: z.url('Invalid sender wallet address'),
  receiverWalletAddress: z.url('Invalid receiver wallet address'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
})

export const AmountSchema = z.object({
  value: z.string(),
  assetCode: z.string(),
  assetScale: z.number().int().min(0),
})

const WalletAddressSchema = z
  .looseObject({
    id: z.string(),
    publicName: z.string().optional(),
    assetCode: z.string(),
    assetScale: z.number().int().min(0),
    authServer: z.string(),
    resourceServer: z.string(),
  })
  .brand('WalletAddress')

export const PaymentGrantSchema = z.object({
  redirectUrl: z.url(),
  walletAddress: WalletAddressSchema,
  debitAmount: AmountSchema,
  receiveAmount: AmountSchema,
})

export const PaymentFinalizeSchema = z.object({
  walletAddress: WalletAddressSchema,
  pendingGrant: z.object({
    interact: z.object({
      redirect: z.url(),
      finish: z.string(),
    }),
    continue: z.object({
      uri: z.url(),
      access_token: z.object({
        value: z.string(),
      }),
      wait: z.number(),
    }),
  }),
  quote: z.object({
    id: z.string(),
    walletAddress: z.url('Invalid wallet address'),
    receiver: z.url(),
    receiveAmount: AmountSchema,
    debitAmount: AmountSchema,
    method: z.literal('ilp'),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().optional(),
  }),
  incomingPaymentGrant: z.object({
    access_token: z.object({
      value: z.string(),
      manage: z.url(),
      expires_in: z.number().int(),
      access: z.array(
        z.object({
          type: z.literal('incoming-payment'),
          actions: z.array(z.enum(['create', 'read', 'complete'])),
          identifier: z.string().optional(),
        }),
      ),
    }),
    continue: z.object({
      access_token: z.object({
        value: z.string(),
      }),
      uri: z.url(),
      wait: z.number().int().optional(),
    }),
  }),
  interactRef: z.string().min(1, 'Interact reference is required'),
  note: z.string().optional().default('Tools payment'),
})

export const PaymentStatusParamSchema = z.object({
  paymentId: z
    .string()
    .min(1, 'Payment ID is required')
    .max(100, 'Payment ID invalid'),
})

export const WalletAddressParamSchema = z.object({
  wa: z.string().min(1, 'Wallet address is required'),
  version: z.string().optional().default('default'),
})
