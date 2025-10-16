export type PaymentStatusSuccess = {
  paymentId: string
  hash: string
  interact_ref: string
}

export type PaymentStatusRejected = {
  paymentId: string
  result: 'grant_rejected'
}

export function isInteractionSuccess(
  params: PaymentStatus
): params is PaymentStatusSuccess {
  return 'interact_ref' in params
}

export function isInteractionRejected(
  params: PaymentStatus
): params is PaymentStatusRejected {
  return 'result' in params && params.result === 'grant_rejected'
}

export type PaymentStatus = PaymentStatusSuccess | PaymentStatusRejected
