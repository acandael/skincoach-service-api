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

  const paymentIntentData = {
    amount: Math.round(basket.total.gross * 100),
    currency: basket.total.currency.toLowerCase(),
    payment_method_types: ['bancontact'],
    confirmation_method: 'manual', // Bancontact requires manual confirmation
    metadata: {
      basketId: basketModel?.basketId || `basket_${Date.now()}`,
      returnUrl: returnUrl || '', // Store return URL in metadata for later use during confirmation
    }
  };

  // Note: return_url should be passed during confirmation, not creation
  console.log('Bancontact paymentIntentData being sent to Stripe:', JSON.stringify(paymentIntentData, null, 2));

  const paymentIntent = await getClient().paymentIntents.create(paymentIntentData);

  return paymentIntent;
};