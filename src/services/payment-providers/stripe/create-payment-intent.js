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
