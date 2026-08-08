import 'server-only'

/**
 * Provider registry.
 *
 * Selection is by the PAYMENT_PROVIDER env var. Switching providers must
 * require NO code change outside this file (spec §9.4).
 */
import { ManualProvider } from '@/lib/payments/manual'
import type { PaymentProvider } from '@/lib/payments/provider'
import { StripeProvider } from '@/lib/payments/stripe'

const PROVIDERS: Record<string, () => PaymentProvider> = {
  manual: () => new ManualProvider(),
  stripe: () => new StripeProvider(),
}

export const DEFAULT_PROVIDER = 'manual'

export function getPaymentProvider(): PaymentProvider {
  const key = (process.env.PAYMENT_PROVIDER ?? DEFAULT_PROVIDER).trim().toLowerCase()
  const factory = PROVIDERS[key]

  if (!factory) {
    throw new Error(
      `Unknown PAYMENT_PROVIDER "${key}". Known providers: ${Object.keys(PROVIDERS).join(', ')}.`,
    )
  }

  return factory()
}

export function listProviderKeys(): string[] {
  return Object.keys(PROVIDERS)
}
