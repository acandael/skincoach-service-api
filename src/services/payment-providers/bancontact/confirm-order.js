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

  // Verify the payment intent status
  const stripe = getClient();
  try {
    // Retrieve the payment intent to check its current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log(`Bancontact payment intent ${paymentIntentId} current status: ${paymentIntent.status}`);

    // Ensure the payment is successful before proceeding
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}. Please ensure payment is confirmed on the client side before calling confirmOrder.`);
    }

    console.log(`Bancontact payment intent ${paymentIntentId} verified successfully with status: ${paymentIntent.status}`);
  } catch (error) {
    console.error('Bancontact payment intent verification failed:', error);
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