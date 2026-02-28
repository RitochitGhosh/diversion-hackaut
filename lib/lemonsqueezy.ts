import { createHmac } from 'crypto';

const LS_API = 'https://api.lemonsqueezy.com/v1';

function lsHeaders() {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}

export async function createCheckout(
  variantId: string,
  userId: string,
  userEmail: string
): Promise<string> {
  const res = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: userEmail,
            custom: { user_id: userId },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          },
          checkout_options: { dark: false },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LemonSqueezy checkout failed: ${body}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}

/** Generate a customer billing portal URL for managing existing subscription. */
export async function createCustomerPortal(customerId: string): Promise<string> {
  const res = await fetch(`${LS_API}/customers/${customerId}`, {
    headers: lsHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch LemonSqueezy customer');
  const json = await res.json();
  return json.data.attributes.urls?.customer_portal as string ?? '';
}

/** Verify the HMAC-SHA256 webhook signature from LemonSqueezy. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  return digest === signature;
}

/** Parse relevant subscription fields from a LemonSqueezy webhook payload. */
export interface LsSubscriptionData {
  lsSubscriptionId: string;
  lsCustomerId: string;
  lsOrderId: string;
  variantId: string;
  status: string; // active | cancelled | expired | past_due
  currentPeriodEnd: Date | null;
  userId: string; // from custom data
  userEmail: string;
}

export function parseLsSubscription(payload: any): LsSubscriptionData | null {
  try {
    const attrs = payload.data?.attributes ?? {};

    // LemonSqueezy places custom_data inside meta, not data.attributes
    const userId: string =
      payload.meta?.custom_data?.user_id ??
      attrs.custom_data?.user_id ??
      '';

    if (!userId) {
      console.warn('[LS] parseLsSubscription: no user_id in meta.custom_data or attributes.custom_data');
      return null;
    }

    const lsStatus = attrs.status as string; // active | cancelled | expired | past_due
    const endsAt   = attrs.ends_at   ? new Date(attrs.ends_at)   : null;
    const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;

    return {
      lsSubscriptionId: String(payload.data?.id),
      lsCustomerId:     String(attrs.customer_id),
      lsOrderId:        String(attrs.order_id ?? ''),
      variantId:        String(attrs.variant_id),
      status:           lsStatus,
      currentPeriodEnd: renewsAt ?? endsAt,
      userId,
      userEmail:        attrs.user_email ?? '',
    };
  } catch (err) {
    console.error('[LS] parseLsSubscription threw:', err);
    return null;
  }
}
