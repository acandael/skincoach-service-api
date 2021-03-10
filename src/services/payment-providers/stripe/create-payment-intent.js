module.exports = async function createPaymentIntent({
  checkoutModel,
  context,
}) {
  const basketService = require("../../basket-service");

  const { getClient } = require("./utils");

  const { basketModel, metadata } = checkoutModel;

  const basket = await basketService.get({ basketModel, context });

  if (metadata.shipping) {
    basket.total.gross += 8;
  }

  const paymentIntent = await getClient().paymentIntents.create({
    amount: basket.total.gross * 100,
    currency: basket.total.currency,
  });

  return paymentIntent;
};