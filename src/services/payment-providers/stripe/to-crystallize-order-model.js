module.exports = async function stripeToCrystallizeOrderModel({
  basket,
  checkoutModel,
  paymentIntentId,
}) {
  const { getClient } = require("./utils");

  // Retrieve payment intent with expanded charges
  const paymentIntent = await getClient().paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ['charges', 'charges.data']
    }
  );

  // Handle case where charges might not be available yet
  if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
    // Try to get the latest charge directly if no charges in payment intent
    const charges = await getClient().charges.list({
      payment_intent: paymentIntentId,
      limit: 1
    });

    if (!charges.data || charges.data.length === 0) {
      throw new Error(`No charges found for payment intent ${paymentIntentId}. Payment intent status: ${paymentIntent.status}`);
    }

    // Use the charge from the direct query
    const charge = charges.data[0];

    // Continue with the charge data
    return buildOrderModel(charge, paymentIntent, basket, checkoutModel);
  }

  const { data } = paymentIntent.charges;
  const charge = data[0];

  return buildOrderModel(charge, paymentIntent, basket, checkoutModel);
};

// Helper function to build the order model
function buildOrderModel(charge, paymentIntent, basket, checkoutModel) {
  const customerName = charge.billing_details.name.split(" ");
  let email = charge.receipt_email;
  if (!email && checkoutModel.customer && checkoutModel.customer.addresses) {
    const addressWithEmail = checkoutModel.customer.addresses.find(
      (a) => !!a.email
    );
    if (addressWithEmail) {
      email = addressWithEmail.email;
    }
  }

  return {
    cart: basket.cart,
    total: basket.total,
    additionalInformation: JSON.stringify({
      stripe_merchant_data: paymentIntent.merchant_data,
      order_metadata: checkoutModel.metadata,
    }),
    customer: {
      identifier: "",
      firstName: customerName[0],
      middleName: customerName.slice(1, customerName.length - 1).join(),
      lastName: customerName[customerName.length - 1],
      birthDate: Date,
      addresses: [
        {
          type: "billing",
          firstName: customerName[0],
          middleName: customerName.slice(1, customerName.length - 1).join(),
          lastName: customerName[customerName.length - 1],
          street: charge.billing_details.address.line1,
          street2: charge.billing_details.address.line2,
          postalCode: charge.billing_details.address.postal_code,
          city: charge.billing_details.address.city,
          state: charge.billing_details.address.state,
          country: charge.billing_details.address.country,
          phone: charge.billing_details.phone,
          email,
        },
        {
          type: "delivery",
          firstName: customerName[0],
          middleName: customerName.slice(1, customerName.length - 1).join(),
          lastName: customerName[customerName.length - 1],
          street: checkoutModel.customer.addresses[1].street,
          streetNumber: checkoutModel.customer.addresses[1].streetNumber,
          street2: charge.billing_details.address.line2,
          postalCode: checkoutModel.customer.addresses[1].postalCode,
          city: checkoutModel.customer.addresses[1].city,
          state: charge.billing_details.address.state,
          country: charge.billing_details.address.country,
          phone: charge.billing_details.phone,
          email,
        },
      ],
    },
    payment: [
      {
        provider: "stripe",
        stripe: {
          stripe: charge.id,
          customerId: charge.customer,
          orderId: charge.payment_intent,
          paymentMethod: charge.payment_method_details.type,
          paymentMethodId: charge.payment_method,
          paymentIntentId: charge.payment_intent,
          subscriptionId: charge.subscription,
          metadata: "",
        },
      },
    ],
  };
}
