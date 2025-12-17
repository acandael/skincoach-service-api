/**
 * Stripe Webhook Handler for payment_intent events
 *
 * This webhook handles payment_intent.succeeded events to ensure orders are
 * created in Crystallize even if the frontend confirmation fails.
 *
 * Endpoint: POST /api/webhooks/payment-providers/stripe/payment-intent
 */

import Stripe from 'stripe';

// Disable body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Get raw body from request for Stripe signature verification
 */
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Reconstruct checkoutModel from payment intent metadata
 */
function reconstructCheckoutModel(metadata) {
  if (!metadata) {
    return null;
  }

  // Check if we have chunked checkoutModel data
  const checkoutModelKeys = Object.keys(metadata).filter(key =>
    key.startsWith('checkoutModel_')
  );

  if (checkoutModelKeys.length > 0) {
    // Sort by index and reconstruct
    const sortedKeys = checkoutModelKeys.sort((a, b) => {
      const indexA = parseInt(a.split('_')[1]);
      const indexB = parseInt(b.split('_')[1]);
      return indexA - indexB;
    });

    const serialized = sortedKeys.map(key => metadata[key]).join('');

    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to parse chunked checkoutModel:', error);
      return null;
    }
  }

  // Legacy: check for single checkoutModel field
  if (metadata.checkoutModel) {
    try {
      return JSON.parse(metadata.checkoutModel);
    } catch (error) {
      console.error('Failed to parse checkoutModel:', error);
      return null;
    }
  }

  return null;
}

export default async function webhookStripePaymentIntent(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log(`[Stripe Webhook] Received event: ${event.type}, ID: ${event.id}`);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling event ${event.type}:`, error);
    // Still return 200 to prevent Stripe from retrying
    // The error is logged for investigation
    return res.status(200).json({ received: true, error: error.message });
  }
}

/**
 * Handle successful payment intents
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata || {};

  console.log(`[Stripe Webhook] Processing payment_intent.succeeded for ${paymentIntentId}`);
  console.log(`[Stripe Webhook] Payment method types:`, paymentIntent.payment_method_types);
  console.log(`[Stripe Webhook] Metadata:`, JSON.stringify(metadata, null, 2));

  // Determine which confirm order to use based on payment method
  const isBancontact = paymentIntent.payment_method_types?.includes('bancontact');

  // Try to reconstruct checkoutModel from metadata
  const checkoutModel = reconstructCheckoutModel(metadata);

  if (!checkoutModel) {
    console.warn(`[Stripe Webhook] No checkoutModel found in metadata for ${paymentIntentId}`);
    console.warn(`[Stripe Webhook] This payment may have been processed before checkoutModel storage was implemented`);
    console.warn(`[Stripe Webhook] Available metadata keys:`, Object.keys(metadata));

    // Log the payment details for manual reconciliation
    console.warn(`[Stripe Webhook] Payment details for manual reconciliation:`);
    console.warn(`  - Payment Intent ID: ${paymentIntentId}`);
    console.warn(`  - Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
    console.warn(`  - Basket ID: ${metadata.basketId || 'N/A'}`);

    // Still return success - we don't want Stripe to retry indefinitely
    return;
  }

  // Import the appropriate confirm order function
  const confirmOrder = isBancontact
    ? require('../../../../../src/services/payment-providers/bancontact/confirm-order')
    : require('../../../../../src/services/payment-providers/stripe/confirm-order');

  try {
    const result = await confirmOrder({
      paymentIntentId,
      checkoutModel,
      context: {}, // Webhook context
    });

    if (result.success) {
      console.log(`[Stripe Webhook] Order created/confirmed successfully: ${result.orderId}`);
    } else {
      console.error(`[Stripe Webhook] Order confirmation returned failure for ${paymentIntentId}`);
    }
  } catch (error) {
    // Log the error but don't throw - the confirm-order has idempotency checks
    // so if the order was already created by the frontend, this will just return the existing order
    console.error(`[Stripe Webhook] Error confirming order for ${paymentIntentId}:`, error.message);

    // If it's an idempotency-related success, that's fine
    if (error.message.includes('already exists')) {
      console.log(`[Stripe Webhook] Order already exists for ${paymentIntentId} - this is expected if frontend succeeded`);
    }
  }
}

/**
 * Handle failed payment intents
 */
async function handlePaymentIntentFailed(paymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const lastError = paymentIntent.last_payment_error;

  console.log(`[Stripe Webhook] Payment failed for ${paymentIntentId}`);
  console.log(`[Stripe Webhook] Error:`, lastError?.message || 'Unknown error');
  console.log(`[Stripe Webhook] Error code:`, lastError?.code || 'N/A');

  // Log for monitoring/alerting purposes
  // Could integrate with alerting service here (e.g., Sentry, Slack)
}
