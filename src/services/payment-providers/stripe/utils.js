const invariant = require("invariant");
const { REQUIRED_STRIPE_CONFIG } = require("./config");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let client;
module.exports = {
  getClient: () => {
    invariant(
      STRIPE_SECRET_KEY,
      "process.env.STRIPE_SECRET_KEY is not defined"
    );

    if (!client) {
      const stripe = require("stripe");
      client = stripe(STRIPE_SECRET_KEY, REQUIRED_STRIPE_CONFIG);
    }

    return client;
  },
};
