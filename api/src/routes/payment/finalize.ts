import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { app } from '../../app'
import { AmountSchema, WalletAddressSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { createHTTPException } from '../../utils/utils'

const PaymentFinalizeSchema = z.object({
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
export type PaymentFinalizeInput = z.infer<typeof PaymentFinalizeSchema>

app.post(
  '/payment/finalize',
  zValidator('json', PaymentFinalizeSchema),
  async ({ req, json, env }) => {
    try {
      const {
        walletAddress,
        pendingGrant,
        quote,
        incomingPaymentGrant,
        interactRef,
        note,
      } = req.valid('json')

      const openPaymentsService = await OpenPaymentsService.getInstance(env)
      const result = await openPaymentsService.finishPaymentProcess(
        walletAddress,
        pendingGrant,
        quote,
        incomingPaymentGrant,
        interactRef,
        note,
      )

      return json(result)
    } catch (error) {
      throw createHTTPException(500, 'Payment finalization error: ', error)
    }
  },
)
