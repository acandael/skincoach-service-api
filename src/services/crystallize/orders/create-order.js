const { callOrdersApi, normaliseOrderModel } = require("../utils");

module.exports = async function createOrder(variables) {
  // Log the order model being sent
  const normalizedVariables = normaliseOrderModel(variables);
  console.log('[CreateOrder] Sending to Crystallize:', JSON.stringify(normalizedVariables, null, 2));

  const response = await callOrdersApi({
    variables: normalizedVariables,
    query: `
      mutation createOrder(
        $customer: CustomerInput!
        $cart: [OrderItemInput!]!
        $total: PriceInput
        $payment: [PaymentInput!]
        $additionalInformation: String
      ) {
        orders {
          create(
            input: {
              customer: $customer
              cart: $cart
              total: $total
              payment: $payment
              additionalInformation: $additionalInformation
            }
          ) {
            id
          }
        }
      }
    `,
  });

  // Log the full response for debugging
  console.log('[CreateOrder] Crystallize response:', JSON.stringify(response, null, 2));

  // Check for errors
  if (response.errors) {
    console.error('[CreateOrder] Crystallize API errors:', JSON.stringify(response.errors, null, 2));
    throw new Error(`Crystallize API error: ${response.errors[0]?.message || 'Unknown error'}`);
  }

  if (!response.data || !response.data.orders) {
    console.error('[CreateOrder] Invalid response from Crystallize:', JSON.stringify(response, null, 2));
    throw new Error('Invalid response from Crystallize API - no data returned');
  }

  return response.data.orders.create;
};