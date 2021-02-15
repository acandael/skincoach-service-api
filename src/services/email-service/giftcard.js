const { sendEmail, mjml2html } = require("./utils");

module.exports = async function sendGiftCard({ email, aanbieder, message, amount }) {
  console.log(email)
  try {
    const mjml2html = require("mjml");
    const { html } = mjml2html(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Je aanvraag voor een kadobon werd verstuurd:</mj-text>
              <mj-text>Aanbieder: ${aanbieder}</mj-text>
              <mj-text>Vraag: ${message}</mj-text>
              <mj-text>Bedrag: ${amount}</mj-text>
              <mj-text>Bedankt voor je bestelling. Ik maak de geschenkenbon klaar</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);

    await sendEmail({
      to: email,
      subject: "Giftcard Order",
      html
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error,
    };
  }
};
