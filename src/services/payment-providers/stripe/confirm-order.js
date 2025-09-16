module.exports = async function confirmOrder({
  paymentIntentId,
  checkoutModel,
  context,
}) {
  const crystallize = require("../../crystallize");
  const emailService = require("../../email-service");
  const basketService = require("../../basket-service");

  const toCrystallizeOrderModel = require("./to-crystallize-order-model");
  const { getClient } = require("./utils");

  const { basketModel } = checkoutModel;

  const basket = await basketService.get({ basketModel, context });

  // Verify the payment intent status and confirm if needed
  const stripe = getClient();
  try {
    // First retrieve the payment intent to check its status
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // If the payment intent is not yet confirmed, confirm it server-side
    if (paymentIntent.status === 'requires_confirmation') {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        // This will use POST method to confirm the payment intent
        return_url: `${process.env.NEXT_PUBLIC_URL || 'https://your-domain.com'}/order/confirmation`
      });
    }

    // Ensure the payment is successful before proceeding
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    console.log(`Payment intent ${paymentIntentId} confirmed successfully with status: ${paymentIntent.status}`);
  } catch (error) {
    console.error('Payment intent verification/confirmation failed:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }

  // Prepares a model valid for Crystallize order intake
  const crystallizeOrderModel = await toCrystallizeOrderModel({
    basket,
    checkoutModel,
    paymentIntentId,
  });

  /**
   * Record the order in Crystallize
   * Manage the order lifecycle by using the fulfilment pipelines:
   * https://crystallize.com/learn/user-guides/orders-and-fulfilment
   */
  const order = await crystallize.orders.createOrder(crystallizeOrderModel);

  // Wait for the order to be persisted
  await crystallize.orders.waitForOrderToBePersistated({ id: order.id });

  /**
   * Send out the order confirmation email to the customer
   * It can also be done in a webhook, example here:
   * - webhooks/order/created
   */
  await emailService.sendOrderConfirmation(order.id);

  return {
    success: true,
    orderId: order.id,
  };
};