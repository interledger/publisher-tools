import type { PaymentWidget } from '@tools/components'
import type { WebComponentProps } from '@lit/react'

declare global {
  interface HTMLElementTagNameMap {
    'wm-payment-widget': PaymentWidget
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wm-payment-widget': WebComponentProps<PaymentWidget>
    }
  }
}
