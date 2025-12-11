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

    console.log(`[Email] Sending email via Resend:`, {
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
    });

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      ...args,
    });

    // Log the full response for debugging
    console.log(`[Email] Resend API response:`, JSON.stringify(response, null, 2));

    // Check for errors in the response
    if (response.error) {
      console.error(`[Email] Resend API error:`, response.error);
      throw new Error(`Resend API error: ${response.error.message || JSON.stringify(response.error)}`);
    }

    // Verify we got an ID back (indicates successful queuing)
    if (!response.data?.id) {
      console.warn(`[Email] Resend response missing email ID - email may not have been sent`);
    } else {
      console.log(`[Email] Email queued successfully with ID: ${response.data.id}`);
    }

    return response;
  },
};
