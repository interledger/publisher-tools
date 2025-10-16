export type PaymentStatusSuccess = {
  paymentId: string
  hash: string
  interact_ref: string
}

export type PaymentStatusRejected = {
  paymentId: string
  result: 'grant_rejected'
}

export type PaymentStatusData = {
  data: {
    type: string
    paymentId: string
    interact_ref: string
    hash: string
    result: string
  }
}

export type PaymentStatus = PaymentStatusSuccess | PaymentStatusRejected
