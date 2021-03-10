const { formatCurrency } = require("../../lib/currency");
const { orders } = require("../crystallize");
const { sendEmail} = require("./utils");

module.exports = async function sendOrderConfirmation(orderId) {
  try {
    const order = await orders.getOrder(orderId);

    const { email } = order.customer.addresses[0];

    const additionalInformation = JSON.parse(order.additionalInformation)
    const {shipping} = additionalInformation.order_metadata

    if (!email) {
      return {
        success: false,
        error: "No email is conntected with the customer object",
      };
    }

    const mjml2html = require("mjml");

    const { html } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Bestelgegevens</h1>
              <p>Bedankt voor je bestelling! Deze email bevat een kopie van je bestelling voor referentie.</p>
              <p>
                Bestelnummer: <strong>#${order.id}</strong>
              </p>
              <p>
                Voornaam: <strong>${order.customer.firstName}</strong><br />
                Naam: <strong>${order.customer.lastName}</strong><br />
                Email: <strong>${email}</strong>
              </p>
              ${shipping ? `<p>
                Verzendkosten: <strong>${formatCurrency({
                  amount: 8,
                  currency: order.total.currency,
                })}</strong>
              </p>` : `<p>Geen verzendkosten (ophalen in winkel)</p>`}
              <p>
                Totaal: <strong>${formatCurrency({
                  amount: shipping ? (order.total.gross + 8) : order.total.gross,
                  currency: order.total.currency,
                })}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Naam</th>
                <th style="padding: 0 15px;">Hoeveelheid</th>
                <th style="padding: 0 0 0 15px;">Totaal</th>
              </tr>
              ${order.cart.map(
                (item) => `<tr>
                  <td style="padding: 0 15px 0 0;">${item.name} (${
                  item.sku
                })</td>
                  <td style="padding: 0 15px;">${item.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${formatCurrency({
                    amount: item.price.gross * item.quantity,
                    currency: item.price.currency,
                  })}</td>
                </tr>`
              )}
            </mj-table>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);

    await sendEmail({
      to: email,
      subject: "Bestelgegevens",
      html,
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
