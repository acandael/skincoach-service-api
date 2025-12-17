module.exports = async function createPaymentIntent({
  checkoutModel,
  context,
}) {
  const basketService = require("../../basket-service");

  const { getClient } = require("./utils");

  const { basketModel, confirmationURL } = checkoutModel;

  const basket = await basketService.get({ basketModel, context });

  // Create the return URL with proper URL encoding for Bancontact
  let returnUrl = confirmationURL;
  if (confirmationURL) {
    // Replace the crystallizeOrderId placeholder with a temporary value that can be handled later
    // The actual order ID will be passed through payment intent metadata
    returnUrl = confirmationURL.replace('{crystallizeOrderId}', 'PENDING');

    if (returnUrl.includes('?checkout_model=')) {
      // URL encode the entire checkout_model parameter value
      const urlParts = returnUrl.split('?checkout_model=');
      if (urlParts.length === 2) {
        const baseUrl = urlParts[0];
        const checkoutModelData = urlParts[1];
        returnUrl = `${baseUrl}?checkout_model=${encodeURIComponent(checkoutModelData)}`;
      }
    }
  }

  // Serialize checkoutModel for webhook fallback
  // Stripe metadata has a 500 character limit per value, so we chunk if needed
  const checkoutModelMetadata = serializeCheckoutModelForMetadata(checkoutModel);

  const paymentIntentData = {
    amount: Math.round(basket.total.gross * 100),
    currency: basket.total.currency.toLowerCase(),
    payment_method_types: ['bancontact'],
    confirmation_method: 'automatic', // Bancontact requires automatic confirmation for redirect-based flows
    metadata: {
      basketId: basketModel?.basketId || `basket_${Date.now()}`,
      returnUrl: returnUrl || '', // Store return URL in metadata for later use during confirmation
      ...checkoutModelMetadata, // Include serialized checkoutModel for webhook fallback
    }
  };

  // Note: return_url should be passed during confirmation, not creation
  console.log('Bancontact paymentIntentData being sent to Stripe:', JSON.stringify(paymentIntentData, null, 2));

  const paymentIntent = await getClient().paymentIntents.create(paymentIntentData);

  return paymentIntent;
};

/**
 * Serialize checkoutModel for storage in Stripe metadata
 * Stripe has a 500 character limit per metadata value, so we chunk the data
 * @param {Object} checkoutModel - The checkout model to serialize
 * @returns {Object} - Metadata object with chunked checkoutModel
 */
function serializeCheckoutModelForMetadata(checkoutModel) {
  const metadata = {};
  const CHUNK_SIZE = 490; // Leave some margin for safety

  try {
    const serialized = JSON.stringify(checkoutModel);
    const chunks = [];

    for (let i = 0; i < serialized.length; i += CHUNK_SIZE) {
      chunks.push(serialized.slice(i, i + CHUNK_SIZE));
    }

    // Stripe allows max 50 metadata keys, so we limit to 40 chunks (leaving room for other metadata)
    const maxChunks = Math.min(chunks.length, 40);

    if (chunks.length > maxChunks) {
      console.warn(`[createPaymentIntent] checkoutModel too large, truncating from ${chunks.length} to ${maxChunks} chunks`);
    }

    for (let i = 0; i < maxChunks; i++) {
      metadata[`checkoutModel_${i}`] = chunks[i];
    }

    console.log(`[createPaymentIntent] Stored checkoutModel in ${maxChunks} metadata chunks`);
  } catch (error) {
    console.error('[createPaymentIntent] Failed to serialize checkoutModel:', error);
  }

  return metadata;
}