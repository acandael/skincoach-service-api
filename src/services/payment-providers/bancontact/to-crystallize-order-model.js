module.exports = async function bancontactToCrystallizeOrderModel({
  basket,
  checkoutModel,
  paymentIntentId,
}) {
  const { getClient } = require("./utils");

  // Debug logging to trace metadata
  console.log('[OrderModel Bancontact] checkoutModel received:', JSON.stringify(checkoutModel, null, 2));
  console.log('[OrderModel Bancontact] checkoutModel.metadata:', JSON.stringify(checkoutModel?.metadata, null, 2));

  // Retrieve payment intent with expanded charges
  const paymentIntent = await getClient().paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ['charges', 'charges.data']
    }
  );

  // Handle case where charges might not be available yet (common with Bancontact redirects)
  let charge;
  if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
    // Try to get the latest charge directly if no charges in payment intent
    console.log(`No charges found in payment intent ${paymentIntentId}, fetching directly...`);
    const charges = await getClient().charges.list({
      payment_intent: paymentIntentId,
      limit: 1
    });

    if (!charges.data || charges.data.length === 0) {
      // For Bancontact, charges may take a moment to appear after redirect
      // Wait and retry once
      console.log(`Waiting for Bancontact charges to be available for ${paymentIntentId}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const retryCharges = await getClient().charges.list({
        payment_intent: paymentIntentId,
        limit: 1
      });

      if (!retryCharges.data || retryCharges.data.length === 0) {
        throw new Error(`No charges found for Bancontact payment intent ${paymentIntentId}. Payment intent status: ${paymentIntent.status}. The payment may still be processing.`);
      }

      charge = retryCharges.data[0];
    } else {
      charge = charges.data[0];
    }
  } else {
    charge = paymentIntent.charges.data[0];
  }

  console.log(`Bancontact charge found: ${charge.id} for payment intent ${paymentIntentId}`);

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

  // Try payment method details for Bancontact
  if (charge.payment_method_details?.bancontact?.verified_name) {
    // Bancontact doesn't provide email directly, but we log this for debugging
    console.log(`Bancontact payment verified for: ${charge.payment_method_details.bancontact.verified_name}`);
  }

  return '';
}

// Helper function to build the order model
function buildOrderModel(charge, paymentIntent, basket, checkoutModel) {
  // For Bancontact, try to get name from multiple sources
  let billingName = safeGet(charge, 'billing_details.name', '');

  // Bancontact may have verified_name in payment_method_details
  if (!billingName && charge.payment_method_details?.bancontact?.verified_name) {
    billingName = charge.payment_method_details.bancontact.verified_name;
  }

  // Fallback to checkout model
  if (!billingName && checkoutModel?.customer) {
    const firstName = checkoutModel.customer.firstName || '';
    const lastName = checkoutModel.customer.lastName || '';
    billingName = `${firstName} ${lastName}`.trim();
  }

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
      paymentMethod: 'bancontact',
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
          country: billingAddress.country || 'BE',
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
          country: deliveryAddress.country || billingAddress.country || 'BE',
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
          paymentMethod: safeGet(charge, 'payment_method_details.type', 'bancontact'),
          paymentMethodId: charge.payment_method || '',
          paymentIntentId: charge.payment_intent || '',
          subscriptionId: charge.subscription || '',
          metadata: "bancontact",
        },
      },
    ],
  };
}
