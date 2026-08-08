import 'server-only'

/**
 * Stripe provider — a real, compiling placeholder.
 *
 * Every method throws `NotConfiguredError` with a clear message. This is
 * deliberate and permitted by spec §9.1: it is NOT a stub with fake logic, and
 * it will never silently pretend a payment succeeded.
 *
 * To implement: install the Stripe SDK, set STRIPE_SECRET_KEY,
 * STRIPE_WEBHOOK_SECRET and STRIPE_PUBLISHABLE_KEY, then replace each body.
 * Entitlement granting must still go through `grantEntitlement()` — do not
 * write `profiles.role` from a webhook handler directly.
 */
import {
  NotConfiguredError,
  type CheckoutResult,
  type CreateCheckoutInput,
  type PaymentProvider,
  type WebhookResult,
} from '@/lib/payments/provider'

const DETAIL =
  'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, then implement lib/payments/stripe.ts.'

export class StripeProvider implements PaymentProvider {
  readonly key = 'stripe'

  async createCheckout(_input: CreateCheckoutInput): Promise<CheckoutResult> {
    throw new NotConfiguredError(this.key, DETAIL)
  }

  async handleWebhook(_req: Request): Promise<WebhookResult> {
    throw new NotConfiguredError(
      this.key,
      `${DETAIL} Webhook signatures MUST be verified before any entitlement is granted.`,
    )
  }

  async getCustomerPortalUrl(_userId: string): Promise<string | null> {
    throw new NotConfiguredError(this.key, DETAIL)
  }

  async cancelSubscription(_ref: string): Promise<void> {
    throw new NotConfiguredError(this.key, DETAIL)
  }
}
