import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { serializeError } from './utils/utils.js'

export type Env = {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET_NAME: string
  OP_WALLET_ADDRESS: string
  OP_PRIVATE_KEY: string
  OP_KEY_ID: string
}

export const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 7200
  })
)

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error)
    const err = {
      status: error.status,
      statusText: error.res?.statusText,
      message: error.message,
      details: {
        // @ts-expect-error if there's a cause, it should have a message
        message: error.cause?.message
      }
    }
    return c.json({ error: err }, error.status)
  }

  if (error instanceof ZodError) {
    const err = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: {
        issues: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return c.json({ error: err }, 400)
  }

  const serializedError = serializeError(error)
  console.error('Unexpected error: ', serializedError)
  const err = {
    message: 'INTERNAL_ERROR',
    ...serializedError
  }

  return c.json({ error: err }, 500)
})
