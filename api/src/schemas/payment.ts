import z from 'zod'

export const AmountSchema = z.object({
  value: z.string(),
  assetCode: z.string(),
  assetScale: z.number().int().min(0),
})

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
