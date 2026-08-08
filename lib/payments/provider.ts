import 'server-only'

/**
 * Payment provider abstraction (spec §9.1).
 *
 * Launch configuration is manual approval only, with payments abstracted for
 * later. Swapping providers must require no code change outside the registry.
 *
 * Entitlement granting is deliberately NOT part of this interface — every
 * provider, the invitation flow, and the admin panel all call the single
 * `grantEntitlement()` in `lib/payments/grant.ts`.
 */

export type CreateCheckoutInput = {
  userId: string
  planId: string
  email: string
  /** Where to send the user after a successful checkout. */
  returnUrl: string
}

export type CheckoutResult = { url: string } | { manual: true }

export type WebhookResult = {
  handled: boolean
  /** For logs and idempotency, never returned to a client. */
  eventId?: string
}

export interface PaymentProvider {
  readonly key: string
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>
  handleWebhook(req: Request): Promise<WebhookResult>
  getCustomerPortalUrl(userId: string): Promise<string | null>
  cancelSubscription(ref: string): Promise<void>
}

/**
 * Thrown by providers that compile but are not configured for use.
 *
 * A real, honest error — not a stub that silently pretends to succeed.
 */
export class NotConfiguredError extends Error {
  readonly provider: string

  constructor(provider: string, detail?: string) {
    super(
      `Payment provider "${provider}" is not configured.` +
        (detail ? ` ${detail}` : ''),
    )
    this.name = 'NotConfiguredError'
    this.provider = provider
  }
}
