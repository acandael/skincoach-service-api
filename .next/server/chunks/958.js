"use strict";exports.id=958,exports.ids=[958],exports.modules={5444:e=>{e.exports={formatCurrency:function({amount:e,currency:t}){return new Intl.NumberFormat("en-US",{style:"currency",currency:t}).format(e)}}},5497:(e,t,n)=>{let{sendEmail:r,mjml2html:o}=n(8165);e.exports=async function({email:e,aanbieder:t,message:o,amount:s}){try{let a=n(2009),{html:m}=a(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Je aanvraag voor een kadobon werd verstuurd:</mj-text>
              <mj-text>Aanbieder: ${t}</mj-text>
              <mj-text>Vraag: ${o}</mj-text>
              <mj-text>Bedrag: ${s}</mj-text>
              <mj-text>Bedankt voor je bestelling. Ik maak de geschenkenbon klaar</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);return await r({to:e,subject:"Giftcard Order",html:m}),{success:!0}}catch(e){return console.log(e),{success:!1,error:e}}}},8958:(e,t,n)=>{let{sendEmail:r}=n(8165),o=n(5497),s=n(7911),a=n(5345);e.exports={sendEmail:r,sendGiftCard:o,sendOrderConfirmation:s,sendUserMagicLink:a}},7911:(e,t,n)=>{let{formatCurrency:r}=n(5444),{orders:o}=n(6784),{sendEmail:s}=n(8165);process.env.EMAIL_FROM,e.exports=async function(e){try{let t=await o.getOrder(e),a=t.customer.addresses?.[1],{email:m}=t.customer.addresses[0],l=JSON.parse(t.additionalInformation),{deliveryMethod:c}=l.order_metadata;if(!m)return{success:!1,error:"No email is conntected with the customer object"};function setDeliveryMessage(){return"shipping"===c?`<p>
        Verzendkosten: <strong>${r({amount:8,currency:t.total.currency})}</strong>
      </p>
      <p>Leveradres: ${a.street} ${a.streetNumber}, ${a.postalCode} ${a.city}</p>
      `:"pickup"===c?"<p>Geen verzendkosten (ophalen in winkel)</p>":"email"===c?`<p>Je kadobon wordt gemaild naar ${m} </p>`:void 0}let i=n(2009),{html:d}=i(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Bestelgegevens</h1>
              <p>Bedankt voor je bestelling! 
              We maken deze zo spoedig mogelijk klaar voor je.  Graag nog even wachten met ophalen tot je de mail met klaar voor ophalen ontvangen hebt.  
              Hieronder een kopie van je bestelling voor referentie</p>
              <p>
                Bestelnummer: <strong>#${t.id}</strong>
              </p>
              <p>
                Voornaam: <strong>${t.customer.firstName}</strong><br />
                Naam: <strong>${t.customer.lastName}</strong><br />
                Email: <strong>${m}</strong>
              </p>
              ${setDeliveryMessage()}
              <p>
                Totaal: <strong>${r({amount:t.total.gross,currency:t.total.currency})}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Naam</th>
                <th style="padding: 0 15px;">Hoeveelheid</th>
                <th style="padding: 0 0 0 15px;">Totaal</th>
              </tr>
              ${t.cart.map(e=>`<tr>
                  <td style="padding: 0 15px 0 0;">${e.name} (${e.sku})</td>
                  <td style="padding: 0 15px;">${e.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${r({amount:e.price.gross*e.quantity,currency:e.price.currency})}</td>
                </tr>`)}
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
    `),{html:p}=i(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Nieuw Bestelling</h1>
              <p>Er werd een nieuwe bestelling geplaatst</p>
              <p>
                Bestelnummer: <strong>#${t.id}</strong>
              </p>
              <p>
                Voornaam: <strong>${t.customer.firstName}</strong><br />
                Naam: <strong>${t.customer.lastName}</strong><br />
                Email: <strong>${m}</strong>
              </p>
              ${setDeliveryMessage()}
              <p>
                Totaal: <strong>${r({amount:t.total.gross,currency:t.total.currency})}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Naam</th>
                <th style="padding: 0 15px;">Hoeveelheid</th>
                <th style="padding: 0 0 0 15px;">Totaal</th>
              </tr>
              ${t.cart.map(e=>`<tr>
                  <td style="padding: 0 15px 0 0;">${e.name} (${e.sku})</td>
                  <td style="padding: 0 15px;">${e.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${r({amount:e.price.gross*e.quantity,currency:e.price.currency})}</td>
                </tr>`)}
            </mj-table>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);return await s({to:m,subject:"Bestelgegevens",html:d}),await s({to:"info@anniek-lambrecht.be",subject:"Nieuwe Bestelling",html:p}),{success:!0}}catch(e){return console.log(e),{success:!1,error:e}}}},5345:(e,t,n)=>{let{sendEmail:r}=n(8165);e.exports=async function({loginLink:e,email:t}){try{let o=n(2009),{html:s}=o(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hi there! Simply follow the link below to login.</mj-text>
              <mj-button href="${e}" align="left">Click here to login</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);return await r({to:t,subject:"Magic link login",html:s}),{success:!0}}catch(e){return console.log(e),{success:!1,error:e}}}},8165:(e,t,n)=>{let r=n(7644),o=process.env.SENDGRID_API_KEY,s=process.env.EMAIL_FROM;e.exports={sendEmail(e){r(o,"process.env.SENDGRID_API_KEY not defined"),r(s,"process.env.EMAIL_FROM is not defined");let t=n(2139);return t.setApiKey(o),t.send({from:s,...e})}}}};