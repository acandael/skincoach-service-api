module.exports = async function createPaymentIntent({
  checkoutModel,
  context,
}) {
  const basketService = require("../../basket-service");
  const { getClient } = require("./utils");

  const { basketModel, customer } = checkoutModel;

  // Debug logging for incoming data
  console.log("CreatePaymentIntent - Checkout Model:", {
    basketId: basketModel?.basketId,
    customer: {
      email: customer?.email,
      firstName: customer?.firstName,
      lastName: customer?.lastName,
      // Mask sensitive data
      hasAddress: !!customer?.streetAddress,
    },
  });

  // Get basket details
  const basket = await basketService.get({ basketModel, context });

  // Debug logging for basket
  console.log("CreatePaymentIntent - Basket Details:", {
    total: basket.total,
    currency: basket.total.currency,
    calculatedAmount: Math.round(basket.total.gross * 100),
  });

  try {
    const idempotencyKey = basketModel?.basketId
      ? `pi_${basketModel.basketId}_${basket.total.gross}`
      : `pi_${Date.now()}_${basket.total.gross}`;

    // Serialize checkoutModel for webhook fallback
    const checkoutModelMetadata = serializeCheckoutModelForMetadata(checkoutModel);

    // Basic payment intent data
    const paymentIntentData = {
      amount: Math.round(basket.total.gross * 100),
      currency: basket.total.currency.toLowerCase(),
      payment_method_types: ["card"],
      confirmation_method: "automatic",
      metadata: {
        basketId: basketModel?.basketId || `basket_${Date.now()}`,
        customerName:
          `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
          "Guest",
        ...checkoutModelMetadata, // Include serialized checkoutModel for webhook fallback
      },
    };

    // Add customer info if available
    if (customer?.email) {
      paymentIntentData.receipt_email = customer.email;
      paymentIntentData.metadata.customerEmail = customer.email;
    }

    if (customer?.firstName || customer?.lastName) {
      paymentIntentData.description = `Order for ${customer.firstName || ""} ${
        customer.lastName || ""
      }`.trim();
    }

    if (customer?.streetAddress) {
      paymentIntentData.shipping = {
        name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        address: {
          line1: customer.streetAddress,
          postal_code: customer.postalCode || "",
          city: customer.city || "",
          country: customer.country || "BE",
          state: customer.state || null,
        },
      };
    }

    // Log request data
    console.log("Creating Payment Intent:", {
      data: paymentIntentData,
      idempotencyKey,
    });

    const paymentIntent = await getClient().paymentIntents.create(
      paymentIntentData,
      {
        idempotencyKey,
      }
    );

    console.log("Payment Intent Created:", {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ? "present" : "missing",
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    // Detailed error logging
    console.error("Stripe Error:", {
      type: error.type,
      code: error.code,
      message: error.message,
      param: error.param,
      requestId: error.requestId,
      ...(error.raw && { raw: error.raw }),
    });

    throw error; // Let the API handle the error response
  }
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
