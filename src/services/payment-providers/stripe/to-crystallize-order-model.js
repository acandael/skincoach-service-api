module.exports = async function stripeToCrystallizeOrderModel({
  basket,
  checkoutModel,
  paymentIntentId,
}) {
  const { getClient } = require("./utils");

  // Debug logging to trace metadata
  console.log('[OrderModel] checkoutModel received:', JSON.stringify(checkoutModel, null, 2));
  console.log('[OrderModel] checkoutModel.metadata:', JSON.stringify(checkoutModel?.metadata, null, 2));

  // Retrieve payment intent with expanded charges
  const paymentIntent = await getClient().paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ['charges', 'charges.data']
    }
  );

  // Handle case where charges might not be available yet
  let charge;
  if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
    // Try to get the latest charge directly if no charges in payment intent
    const charges = await getClient().charges.list({
      payment_intent: paymentIntentId,
      limit: 1
    });

    if (!charges.data || charges.data.length === 0) {
      throw new Error(`No charges found for payment intent ${paymentIntentId}. Payment intent status: ${paymentIntent.status}`);
    }

    charge = charges.data[0];
  } else {
    charge = paymentIntent.charges.data[0];
  }

  return buildOrderModel(charge, paymentIntent, basket, checkoutModel);
};

/**
 * Safely get a value from a nested object path
 */
function safeGet(obj, path, defaultValue = '') {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined && current[key] !== null
      ? current[key]
      : defaultValue;
  }, obj);
}

/**
 * Safely parse customer name into parts
 */
function parseCustomerName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: 'Unknown', middleName: '', lastName: 'Customer' };
  }

  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 0) {
    return { firstName: 'Unknown', middleName: '', lastName: 'Customer' };
  }

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], middleName: '', lastName: nameParts[0] };
  }

  return {
    firstName: nameParts[0],
    middleName: nameParts.slice(1, nameParts.length - 1).join(' '),
    lastName: nameParts[nameParts.length - 1]
  };
}

/**
 * Get delivery address from checkout model safely
 */
function getDeliveryAddress(checkoutModel) {
  const addresses = checkoutModel?.customer?.addresses;

  // Try to find delivery address (index 1) or fallback to billing (index 0)
  if (addresses && addresses.length > 1) {
    return addresses[1];
  }
  if (addresses && addresses.length > 0) {
    return addresses[0];
  }

  return {};
}

/**
 * Get email from multiple sources
 */
function getEmail(charge, checkoutModel) {
  // Try receipt_email first
  if (charge.receipt_email) {
    return charge.receipt_email;
  }

  // Try checkout model addresses
  if (checkoutModel?.customer?.addresses) {
    const addressWithEmail = checkoutModel.customer.addresses.find(a => !!a?.email);
    if (addressWithEmail) {
      return addressWithEmail.email;
    }
  }

  // Try billing details
  if (charge.billing_details?.email) {
    return charge.billing_details.email;
  }

  return '';
}

// Helper function to build the order model
function buildOrderModel(charge, paymentIntent, basket, checkoutModel) {
  // Safely parse customer name
  const billingName = safeGet(charge, 'billing_details.name', '');
  const customerName = parseCustomerName(billingName);

  // Get email from multiple sources
  const email = getEmail(charge, checkoutModel);

  // Get delivery address safely
  const deliveryAddress = getDeliveryAddress(checkoutModel);

  // Safely extract billing address details
  const billingAddress = charge.billing_details?.address || {};

  return {
    cart: basket.cart,
    total: basket.total,
    additionalInformation: JSON.stringify({
      stripe_merchant_data: paymentIntent.merchant_data,
      order_metadata: checkoutModel?.metadata,
      paymentIntentId: paymentIntent.id,
    }),
    customer: {
      identifier: email || '',
      firstName: customerName.firstName,
      middleName: customerName.middleName,
      lastName: customerName.lastName,
      birthDate: null,
      addresses: [
        {
          type: "billing",
          firstName: customerName.firstName,
          middleName: customerName.middleName,
          lastName: customerName.lastName,
          street: billingAddress.line1 || '',
          street2: billingAddress.line2 || '',
          postalCode: billingAddress.postal_code || '',
          city: billingAddress.city || '',
          state: billingAddress.state || '',
          country: billingAddress.country || '',
          phone: safeGet(charge, 'billing_details.phone', ''),
          email,
        },
        {
          type: "delivery",
          firstName: customerName.firstName,
          middleName: customerName.middleName,
          lastName: customerName.lastName,
          street: deliveryAddress.street || billingAddress.line1 || '',
          streetNumber: deliveryAddress.streetNumber || '',
          street2: deliveryAddress.street2 || billingAddress.line2 || '',
          postalCode: deliveryAddress.postalCode || billingAddress.postal_code || '',
          city: deliveryAddress.city || billingAddress.city || '',
          state: deliveryAddress.state || billingAddress.state || '',
          country: deliveryAddress.country || billingAddress.country || '',
          phone: deliveryAddress.phone || safeGet(charge, 'billing_details.phone', ''),
          email,
        },
      ],
    },
    payment: [
      {
        provider: "stripe",
        stripe: {
          stripe: charge.id || '',
          customerId: charge.customer || '',
          orderId: charge.payment_intent || '',
          paymentMethod: safeGet(charge, 'payment_method_details.type', 'card'),
          paymentMethodId: charge.payment_method || '',
          paymentIntentId: charge.payment_intent || '',
          subscriptionId: charge.subscription || '',
          metadata: JSON.stringify({
            chargeId: charge.id,
            receiptUrl: charge.receipt_url,
          }),
        },
      },
    ],
  };
}
