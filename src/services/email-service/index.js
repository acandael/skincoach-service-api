const { sendEmail } = require("./utils");

const sendGiftCard = require("./giftcard");
const sendOrderConfirmation = require("./order-confirmation");
const sendUserMagicLink = require("./user-magic-link");

module.exports = {
  sendEmail,
  sendGiftCard,
  sendOrderConfirmation,
  sendUserMagicLink,
};
