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

  // Idempotency check: Check if order already exists for this payment intent
  const existingOrder = await findOrderByPaymentIntentId(paymentIntentId);
  if (existingOrder) {
    console.log(`Bancontact order already exists for payment intent ${paymentIntentId}: ${existingOrder.id}`);
    return {
      success: true,
      orderId: existingOrder.id,
    };
  }

  const basket = await basketService.get({ basketModel, context });

  // Verify the payment intent status
  const stripe = getClient();
  let paymentIntent;
  try {
    // Retrieve the payment intent to check its current status
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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
  let crystallizeOrderModel;
  try {
    crystallizeOrderModel = await toCrystallizeOrderModel({
      basket,
      checkoutModel,
      paymentIntentId,
    });
  } catch (error) {
    console.error('Failed to build Crystallize order model for Bancontact:', error);
    throw new Error(`Order model creation failed: ${error.message}. Payment was successful but order could not be created. Please contact support with payment intent ID: ${paymentIntentId}`);
  }

  /**
   * Record the order in Crystallize
   * Manage the order lifecycle by using the fulfilment pipelines:
   * https://crystallize.com/learn/user-guides/orders-and-fulfilment
   */
  let order;
  try {
    order = await crystallize.orders.createOrder(crystallizeOrderModel);
    console.log(`Bancontact order created in Crystallize: ${order.id} for payment intent: ${paymentIntentId}`);
  } catch (error) {
    console.error('Failed to create Bancontact order in Crystallize:', error);
    throw new Error(`Order creation failed: ${error.message}. Payment was successful (ID: ${paymentIntentId}) but order could not be recorded. Please contact support.`);
  }

  // Wait for the order to be persisted
  try {
    await crystallize.orders.waitForOrderToBePersistated({ id: order.id });
    console.log(`Bancontact order ${order.id} persisted successfully`);
  } catch (error) {
    // Order was created but persistence check timed out
    // This is not critical - the order exists, just eventual consistency delay
    console.warn(`Bancontact order persistence check timed out for ${order.id}, but order was created:`, error);
    // Don't throw - continue with the order
  }

  /**
   * Send out the order confirmation email to the customer
   * Email failure should NOT fail the order - order is already created
   */
  try {
    await emailService.sendOrderConfirmation(order.id);
    console.log(`Order confirmation email sent for Bancontact order ${order.id}`);
  } catch (error) {
    // Log email failure but don't fail the order
    console.error(`Failed to send order confirmation email for Bancontact order ${order.id}:`, error);
    // Order is created successfully, so we still return success
  }

  return {
    success: true,
    orderId: order.id,
  };
};

/**
 * Check if an order already exists for this payment intent
 * This provides idempotency - prevents duplicate orders on retry
 */
async function findOrderByPaymentIntentId(paymentIntentId) {
  const { callOrdersApi } = require("../../crystallize/utils");

  try {
    const response = await callOrdersApi({
      query: `
        query findOrderByPaymentIntent {
          orders {
            getAll(first: 1, filter: { payment: { paymentIntentId: "${paymentIntentId}" } }) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `,
    });

    if (response.data?.orders?.getAll?.edges?.length > 0) {
      return { id: response.data.orders.getAll.edges[0].node.id };
    }
    return null;
  } catch (error) {
    // If search fails, continue with order creation
    console.warn('Could not check for existing Bancontact order:', error);
    return null;
  }
}
