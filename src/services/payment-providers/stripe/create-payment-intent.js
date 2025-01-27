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
    // Create an idempotency key from basket ID and total
    const idempotencyKey = `pi_${basketModel.basketId}_${basket.total.gross}`;

    // Create payment intent with complete details
    const paymentIntentData = {
      amount: Math.round(basket.total.gross * 100),
      currency: basket.total.currency.toLowerCase(),
      payment_method_types: ["card"],
      // Ensure metadata is not empty
      metadata: {
        basketId: basketModel.basketId || "no_basket_id",
        crystallizeOrderId: basketModel.crystallizeOrderId || "pending",
        customerEmail: customer?.email || "no_email",
      },
      // Only add customer details if they exist
      ...(customer?.email && {
        receipt_email: customer.email,
        description: `Order for ${customer?.firstName || ""} ${
          customer?.lastName || ""
        }`.trim(),
      }),
      // Only add shipping if address exists
      ...(customer?.streetAddress && {
        shipping: {
          name: `${customer?.firstName || ""} ${
            customer?.lastName || ""
          }`.trim(),
          address: {
            line1: customer.streetAddress,
            postal_code: customer.postalCode || "",
            city: customer.city || "",
            country: customer.country || "BE",
            state: customer.state || null,
          },
        },
      }),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      // Add confirmation method
      confirmation_method: "automatic",
      // Add capture method
      capture_method: "automatic",
    };

    // Debug logging for payment intent data
    console.log("CreatePaymentIntent - Payment Intent Data:", {
      ...paymentIntentData,
      // Mask sensitive data
      shipping: paymentIntentData.shipping ? "present" : "not_present",
    });

    const paymentIntent = await getClient().paymentIntents.create(
      paymentIntentData,
      {
        idempotencyKey, // Add idempotency key to the request
      }
    );

    // Log successful creation
    console.log("Payment Intent Created Successfully:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      hasMetadata: !!paymentIntent.metadata,
      hasShipping: !!paymentIntent.shipping,
      idempotencyKey,
    });

    return paymentIntent;
  } catch (error) {
    // Enhanced error logging
    console.error("Error creating payment intent:", {
      error: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      ...(error.raw && { raw: error.raw }),
    });
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};
