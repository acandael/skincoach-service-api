const invariant = require("invariant");
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

let resendClient;

function getResendClient() {
  if (!resendClient) {
    invariant(RESEND_API_KEY, "process.env.RESEND_API_KEY not defined");
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

module.exports = {
  async sendEmail(args) {
    invariant(EMAIL_FROM, "process.env.EMAIL_FROM is not defined");

    const resend = getResendClient();

    return resend.emails.send({
      from: EMAIL_FROM,
      ...args,
    });
  },
};