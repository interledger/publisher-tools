import z from 'zod'
import { isCuid } from '@paralleldrive/cuid2'

export const AmountSchema = z.object({
  value: z.string(),
  assetCode: z.string(),
  assetScale: z.number().int().min(0),
})

export const UserAmountSchema = z.coerce
  .number()
  .positive('Value must be a positive number')

export const DebitOrReceiveAmountSchema = z.union(
  [
    z.object({
      debitAmount: UserAmountSchema,
      receiveAmount: z.never().optional(),
    }),
    z.object({
      receiveAmount: UserAmountSchema,
      debitAmount: z.never().optional(),
    }),
  ],
  {
    error: 'Must provide either `debitAmount` or `receiveAmount`, but not both',
  },
)

export const WalletAddressSchema = z
  .looseObject({
    id: z.string(),
    publicName: z.string().optional(),
    assetCode: z.string(),
    assetScale: z.number().int().min(0),
    authServer: z.string(),
    resourceServer: z.string(),
  })
  .brand('WalletAddress')

export const PaymentIdSchema = z
  .string()
  .refine(isCuid, { error: 'Invalid payment ID' })
