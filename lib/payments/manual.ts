import 'server-only'

/**
 * Manual provider — the launch configuration.
 *
 * Fully implemented. `createCheckout` records an access request of type
 * `payment` and returns `{ manual: true }`, which the UI renders as "our team
 * will contact you with payment details".
 *
 * No money moves through this provider. Access is granted by an admin calling
 * `grantEntitlement()`.
 */
import type {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentProvider,
  WebhookResult,
} from '@/lib/payments/provider'
import { createAdminClient } from '@/lib/supabase/admin'

export class ManualProvider implements PaymentProvider {
  readonly key = 'manual'

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const supabase = createAdminClient()

    // A partial unique index permits only one pending request per user, so a
    // duplicate submission is a no-op rather than an error.
    const { error } = await supabase.from('access_requests').insert({
      user_id: input.userId,
      request_type: 'payment',
      status: 'pending',
      message: `Requested plan: ${input.planId}`,
    })

    // 23505 = unique_violation → a pending request already exists. Idempotent.
    if (error && error.code !== '23505') {
      throw new Error(`ManualProvider.createCheckout failed: ${error.message}`)
    }

    return { manual: true }
  }

  /** No webhooks exist for manual approval. */
  async handleWebhook(_req: Request): Promise<WebhookResult> {
    return { handled: false }
  }

  /** No self-service portal under manual billing. */
  async getCustomerPortalUrl(_userId: string): Promise<string | null> {
    return null
  }

  /**
   * Cancellation is an admin action under manual billing — it goes through
   * `revokeEntitlement()`, not through the provider.
   */
  async cancelSubscription(_ref: string): Promise<void> {
    return
  }
}
