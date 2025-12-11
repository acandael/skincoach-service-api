const { formatCurrency } = require("../../lib/currency");
const { orders } = require("../crystallize");
const { sendEmail } = require("./utils");

const EMAIL_FROM = process.env.EMAIL_FROM;

module.exports = async function sendOrderConfirmation(orderId) {
  try {
    const order = await orders.getOrder(orderId);
    const address = order.customer.addresses?.[1] || order.customer.addresses?.[0] || {};

    const { email } = order.customer.addresses[0] || {};

    // Safely parse additionalInformation
    let additionalInformation = {};
    try {
      additionalInformation = order.additionalInformation
        ? JSON.parse(order.additionalInformation)
        : {};
    } catch (e) {
      console.warn('Could not parse additionalInformation:', e.message);
    }

    const deliveryMethod = additionalInformation?.order_metadata?.deliveryMethod || '';

    console.log(`[Email] Order ${orderId} - deliveryMethod: "${deliveryMethod}", email: "${email}"`);

    if (!email) {
      console.error(`[Email] No email found for order ${orderId}`);
      return {
        success: false,
        error: "No email is connected with the customer object",
      };
    }

    function setDeliveryMessage() {
      if (deliveryMethod === "shipping") {
        const street = address.street || '';
        const streetNumber = address.streetNumber || '';
        const postalCode = address.postalCode || '';
        const city = address.city || '';

        return `<p>
        Verzendkosten: <strong>${formatCurrency({
          amount: 8,
          currency: order.total.currency,
        })}</strong>
      </p>
      <p>Leveradres: ${street} ${streetNumber}, ${postalCode} ${city}</p>
      `;
      } else if (deliveryMethod === "pickup") {
        return `<p>Geen verzendkosten (ophalen in winkel)</p>`;
      } else if (deliveryMethod === "email") {
        return `<p>Je kadobon wordt gemaild naar ${email}</p>`;
      } else {
        // Default message when deliveryMethod is not set or unknown
        console.warn(`[Email] Unknown deliveryMethod: "${deliveryMethod}" for order ${orderId}`);
        return `<p>Leveringsmethode: ${deliveryMethod || 'Niet gespecificeerd'}</p>`;
      }
    }

    // Helper to safely format cart item
    function formatCartItem(item) {
      const name = item.name || 'Product';
      const sku = item.sku || '';
      const quantity = item.quantity || 1;
      const price = item.price || { gross: 0, currency: 'EUR' };
      const itemTotal = (price.gross || 0) * quantity;

      return `<tr>
        <td style="padding: 0 15px 0 0;">${name}${sku ? ` (${sku})` : ''}</td>
        <td style="padding: 0 15px;">${quantity}</td>
        <td style="padding: 0 0 0 15px;">${formatCurrency({
          amount: itemTotal,
          currency: price.currency || order.total.currency,
        })}</td>
      </tr>`;
    }

    const mjml2html = require("mjml");

    const cartItemsHtml = (order.cart || []).map(formatCartItem).join('');

    const { html } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Bestelgegevens</h1>
              <p>Bedankt voor je bestelling!
              We maken deze zo spoedig mogelijk klaar voor je. Graag nog even wachten met ophalen tot je de mail met klaar voor ophalen ontvangen hebt.
              Hieronder een kopie van je bestelling voor referentie</p>
              <p>
                Bestelnummer: <strong>#${order.id}</strong>
              </p>
              <p>
                Voornaam: <strong>${order.customer.firstName || ''}</strong><br />
                Naam: <strong>${order.customer.lastName || ''}</strong><br />
                Email: <strong>${email}</strong>
              </p>
              ${setDeliveryMessage()}
              <p>
                Totaal: <strong>${formatCurrency({
                  amount: order.total.gross,
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
              ${cartItemsHtml}
            </mj-table>
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
          <mj-image width="240px" src="https://www.anniek-lambrecht.be/static/logo-header-3.jpg" />
        </mj-column>
        <mj-column>
        <mj-text>
          <p>Skincenter Anniek Lambrecht<br>
          De Smet De Naeyerlaan 74<br>
          8370 Blankenberge</p>
        </mj-text>
        </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);

    const { html: html2 } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Nieuw Bestelling</h1>
              <p>Er werd een nieuwe bestelling geplaatst</p>
              <p>
                Bestelnummer: <strong>#${order.id}</strong>
              </p>
              <p>
                Voornaam: <strong>${order.customer.firstName || ''}</strong><br />
                Naam: <strong>${order.customer.lastName || ''}</strong><br />
                Email: <strong>${email}</strong>
              </p>
              ${setDeliveryMessage()}
              <p>
                Totaal: <strong>${formatCurrency({
                  amount: order.total.gross,
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
              ${cartItemsHtml}
            </mj-table>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);

    console.log(`[Email] Sending customer confirmation email to: ${email}`);
    await sendEmail({
      to: email,
      subject: "Bestelgegevens",
      html,
    });
    console.log(`[Email] Customer confirmation email sent successfully to: ${email}`);

    console.log(`[Email] Sending shop notification email to: info@anniek-lambrecht.be`);
    await sendEmail({
      to: "info@anniek-lambrecht.be",
      subject: "Nieuwe Bestelling",
      html: html2,
    });
    console.log(`[Email] Shop notification email sent successfully`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Email] Error sending order confirmation email:', error);
    if (error.response) {
      console.error('[Email] API response:', error.response.body);
    }
    return {
      success: false,
      error,
    };
  }
};
