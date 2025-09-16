"use strict";exports.id=741,exports.ids=[741],exports.modules={8284:e=>{e.exports={calculateVoucherDiscountAmount:function({voucher:e,amount:t}){let r=!!e.discountAmount;if(r)return e.discountAmount;let n=t*e.discountPercent/100;return function(e,t=2){let r=e.toFixed(t);return parseFloat(r)}(n)}}},2702:(e,t,r)=>{async function getProductsFromCrystallize({paths:e,language:t}){if(0===e.length)return[];let{callCatalogueApi:n}=r(3780),o=await n({query:`{
      ${e.map((e,r)=>`
        product${r}: catalogue(path: "${e}", language: "${t}") {
          path
          ... on Product {
            vatType {
              name
              percent
            }
            variants {
              sku
              name
              stock
              priceVariants {
                price
                identifier
                currency
              }
              attributes {
                attribute
                value
              }
              images {
                url
                variants {
                  url
                  width
                  height
                }
              }
            }
          }
        }
      `)}
    }`});return e.map((e,t)=>o.data[`product${t}`]).filter(e=>!!e)}e.exports={getProductsFromCrystallize}},1805:(e,t,r)=>{e.exports={async get({basketModel:e,context:t}){let n,o;let{locale:s,voucherCode:i,...a}=e;if(i){let e=r(4203),o=await e.get({code:i,context:t});o.isValid&&(n=o.voucher)}let{getProductsFromCrystallize:c}=r(2702),p=await c({paths:a.cart.map(e=>e.path),language:s.crystallizeCatalogueLanguage}),u=a.cart.map(e=>{let t=p.find(t=>t.variants.some(t=>t.sku===e.sku));o=t.vatType;let r=t.variants.find(t=>t.sku===e.sku),{price:n,currency:s}=r.priceVariants.find(t=>t.identifier===e.priceVariantIdentifier)||r.priceVariants.find(e=>"default"===e.identifier),i=100*n/(100+o.percent);return{path:t.path,quantity:e.quantity||1,vatType:o,price:{gross:n,net:i,tax:o,currency:s},...r}}),d=function({cart:e,vatType:t}){return e.reduce((e,t)=>{let{quantity:r,price:n}=t;if(n){e.currency=n.currency;let{discounted:t}=n;t?(e.gross+=n.discounted.gross*r,e.net+=n.discounted.net*r):(e.gross+=n.gross*r,e.net+=n.net*r)}return e},{gross:0,net:0,tax:t,discount:0,currency:"N/A"})}({cart:u,vatType:o}),l=u;if(u.length>0&&n){let{calculateVoucherDiscountAmount:e}=r(8284),t=e({voucher:n,amount:d.gross});l=u.map(e=>{if("shipping"===e.name)return!1;let r=d.gross/(e.price.gross*e.quantity),n=e.price.gross-t*r,o=100*n/(100+e.vatType.percent);return{...e,price:{...e.price,gross:n,net:o}}}),d.gross-=t,d.discount=t;let o={name:n.code,quantity:1,price:{gross:-1*t,net:-1*t,currency:d.currency}},s=`--voucher--${n.code.toLowerCase().replace(/\s/g,"-")}`;o.sku=s,u.push(o)}return{voucher:n,cart:u,cartWithDiscountedPrice:l,total:d}}}},8837:(e,t,r)=>{let n=r(6784),o=r(8958),{getClient:s}=r(768);e.exports=async function({crystallizeOrderId:e,onSuccessURL:t,onErrorURL:r}){let i="",a=await s(),c=await a.getOrderDetails({orderId:e}),[p]=c.transactionLogHistory.sort((e,t)=>new Date(t.timeStamp)-new Date(e.timeStamp));if("RESERVE"===p.operation&&p.operationSuccess){i=t;let{userDetails:{userId:r,firstName:s,lastName:a,email:p,mobileNumber:u}={},shippingDetails:{address:{addressLine1:d,addressLine2:l,postCode:m,city:g,country:f}={}}={}}=c;await n.orders.updateOrder(e,{payment:[{provider:"custom",custom:{properties:[{property:"PaymentProvider",value:"Vipps"},{property:"Vipps orderId",value:e},{property:"Vipps userId",value:r}]}}],customer:{identifier:p,firstName:s,lastName:a,addresses:[{type:"delivery",email:p,firstName:s,lastName:a,phone:u,street:d,street2:l,postalCode:m,city:g,country:f}]}}),await o.sendOrderConfirmation(e)}else i=r,console.log(JSON.stringify(p,null,2));return{redirectTo:i}}},741:(e,t,r)=>{let n=process.env.VIPPS_CLIENT_ID,o=process.env.VIPPS_CLIENT_SECRET,s=process.env.VIPPS_MERCHANT_SERIAL,i=process.env.VIPPS_SUB_KEY,a=r(3222),c=r(8837),p=r(8786),u=r(4405);e.exports={enabled:!!(n&&o&&s&&i),frontendConfig:{},initiatePayment:a,fallback:c,orderUpdate:p,userConsentRemoval:u}},3222:(e,t,r)=>{let n=r(7644),o=r(1805),s=r(6784),{getClient:i}=r(768),a=process.env.VIPPS_MERCHANT_SERIAL;e.exports=async function({checkoutModel:e,context:t}){n(a,"process.env.VIPPS_MERCHANT_SERIAL is undefined");let{basketModel:r,customer:c,confirmationURL:p,checkoutURL:u}=e,{user:d,serviceCallbackHost:l}=t,m=await o.get({basketModel:r,user:d}),{total:g}=m,f=await s.orders.createOrder({...m,customer:c}),y=f.id,v=new URL(`${l}/webhooks/payment-providers/vipps/fallback/${y}`);v.searchParams.append("confirmation",encodeURIComponent(p.replace("{crystallizeOrderId}",y))),v.searchParams.append("checkout",encodeURIComponent(u));let h=await i(),P=await h.initiatePayment({order:{merchantInfo:{merchantSerialNumber:a,fallBack:v.toString(),callbackPrefix:`${l}/webhooks/payment-providers/vipps/order-update`,shippingDetailsPrefix:`${l}/webhooks/payment-providers/vipps/shipping`,consentRemovalPrefix:`${l}/webhooks/payment-providers/vipps/constent-removal`,paymentType:"eComm Express Payment",isApp:!1,staticShippingDetails:[{isDefault:"Y",priority:0,shippingCost:0,shippingMethod:"Posten Servicepakke",shippingMethodId:"posten-servicepakke"}]},customerInfo:{},transaction:{orderId:y,amount:parseInt(100*g.gross,10),transactionText:"Crystallize test transaction"}}});return{success:!0,checkoutLink:P.url,crystallizeOrderId:y}}},8786:e=>{e.exports=async function({crystallizeOrderId:e}){console.log("VIPPS order update"),console.log({crystallizeOrderId:e})}},4405:e=>{e.exports=async function({vippsUserId:e}){console.log("VIPPS user consent removal"),console.log({vippsUserId:e})}},768:(e,t,r)=>{let n;let o=r(6085),s=r(7644),i=process.env.VIPPS_CLIENT_ID,a=process.env.VIPPS_CLIENT_SECRET,c=process.env.VIPPS_SUB_KEY;e.exports={getClient:()=>(s(i,"process.env.VIPPS_CLIENT_ID is not defined"),s(a,"process.env.VIPPS_CLIENT_SECRET is not defined"),s(c,"process.env.VIPPS_SUB_KEY is not defined"),n||(n=new o({testDrive:!0,id:i,secret:a,subscriptionId:c})),n)}},1521:(e,t,r)=>{let{callCatalogueApi:n}=r(3780);e.exports=async function(){let e=await n({query:`
      {
        catalogue(language: "en", path: "/vouchers") {
          children {
            name
            code: component(id: "code") {
              content {
                ... on SingleLineContent {
                  text
                }
              }
            }
            discount: component(id: "korting") {
              content {
                ... on ComponentChoiceContent {
                  selectedComponent {
                    id
                    content {
                      ... on NumericContent {
                        number
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `});return e.data&&e.data.catalogue?e.data.catalogue.children.map(e=>{let t=e.discount.content.selectedComponent,r=null,n=null;return"percent"===t.id?n=t.content.number:r=t.content.number,{code:e.code.content.text,discountAmount:r,discountPercent:n,onlyForAuthorisedUser:!1}}):[]}},4203:(e,t,r)=>{let n=r(1521);e.exports={async get({code:e,context:t}){let{user:r}=t,o=!r||!r.email,s=await n(),i=[...s];if(o){let t=i.filter(e=>!e.onlyForAuthorisedUser).find(t=>t.code===e);return{isValid:!!t,voucher:t}}let a=i.find(t=>t.code===e);return{isValid:!!a,voucher:a}}}}};