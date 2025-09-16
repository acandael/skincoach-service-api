"use strict";(()=>{var e={};e.id=702,e.ids=[702],e.modules={5854:e=>{e.exports=require("@crystallize/node-klarna")},6085:e=>{e.exports=require("@crystallize/node-vipps")},4400:e=>{e.exports=require("@mollie/api-client")},2139:e=>{e.exports=require("@sendgrid/mail")},4802:e=>{e.exports=require("cookie")},825:e=>{e.exports=require("graphql-tag")},7644:e=>{e.exports=require("invariant")},9344:e=>{e.exports=require("jsonwebtoken")},2009:e=>{e.exports=require("mjml")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},4809:e=>{e.exports=require("node-fetch")},8174:e=>{e.exports=require("stripe")},1386:(e,t,r)=>{r.r(t),r.d(t,{config:()=>g,default:()=>y,routeModule:()=>h});var a={};r.r(a),r.d(a,{config:()=>m,default:()=>graphql});var n=r(1802),s=r(7153),i=r(6249);let o=require("apollo-server-micro"),d=require("cors");var l=r.n(d),c=r(6111),p=r.n(c);let u=new o.ApolloServer(p()),m={api:{bodyParser:!1}};async function graphql(e,t){return await new Promise((r,a)=>{l()({origin:!0,methods:["GET","POST","OPTIONS"],credentials:!0})(e,t,e=>e instanceof Error?a(e):r(e))}),u.createHandler({path:"/api/graphql"})(e,t)}let y=(0,i.l)(a,"default"),g=(0,i.l)(a,"config"),h=new n.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/graphql",pathname:"/api/graphql",bundlePath:"",filename:""},userland:a})},9178:(e,t,r)=>{let a=r(4802),n=r(8020),s=r(8958),i=r(5041);e.exports=e=>{let{cookies:t,headers:r}=function(e){return e.event?e.event.headers&&!e.event.cookies?{headers:e.event.headers,cookies:a.parse(e.event.headers.cookie)}:e.event:e.req?e.req:e}(e),o=n.authenticate(t[n.USER_TOKEN_NAME]),d=i({headers:r}),l=process.env.SERVICE_CALLBACK_HOST||d;return{user:o,publicHost:d,serviceCallbackHost:l,userService:n,emailService:s}}},6111:(e,t,r)=>{let a=r(9178),n=r(4410),s=r(4704);e.exports={context:a,resolvers:n,typeDefs:s,introspection:!0,playground:{settings:{"request.credentials":"include"}}}},4410:(e,t,r)=>{let a=r(6784),n=r(1805),s=r(8020),i=r(4203),o=r(2752),d=r(8091),l=r(2816),c=r(741),p=r(4967);function paymentProviderResolver(e){return()=>({enabled:e.enabled,config:e.frontendConfig})}e.exports={Query:{myCustomBusinessThing:()=>({whatIsThis:"This is an example of a custom query for GraphQL demonstration purpuses. Check out the MyCustomBusinnessQueries resolvers for how to resolve additional fields apart from the 'whatIsThis' field"}),basket:(e,t,r)=>n.get({...t,context:r}),user:()=>({}),orders:()=>({}),paymentProviders:()=>({}),voucher:(e,t,r)=>i.get({...t,context:r})},MyCustomBusinnessQueries:{dynamicRandomInt:()=>(console.log("dynamicRandomInt called"),parseInt(100*Math.random())),youCanEvenGetTheUserDataHere:()=>({})},UserQueries:{isLoggedIn:(e,t,{user:r})=>!!(r&&"email"in r),email:(e,t,{user:r})=>r?r.email:null,logoutLink:(e,t,r)=>s.getLogoutLink({context:r})},PaymentProvidersQueries:{stripe:paymentProviderResolver(o),bancontact:paymentProviderResolver(d),klarna:paymentProviderResolver(l),vipps:paymentProviderResolver(c),mollie:paymentProviderResolver(p)},OrderQueries:{get:(e,t)=>a.orders.getOrder(t.id)},Mutation:{user:()=>({}),paymentProviders:()=>({})},UserMutations:{sendMagicLink:(e,t,r)=>s.sendMagicLink({...t,context:r}),sendGiftCard:(e,t,r)=>s.sendGiftCard({...t,context:r})},PaymentProvidersMutations:{stripe:()=>({}),bancontact:()=>({}),klarna:()=>({}),mollie:()=>({}),vipps:()=>({})},StripeMutations:{createPaymentIntent:(e,t,r)=>o.createPaymentIntent({...t,context:r}),confirmOrder:(e,t,r)=>o.confirmOrder({...t,context:r})},BancontactMutations:{createPaymentIntent:(e,t,r)=>d.createPaymentIntent({...t,context:r}),confirmOrder:(e,t,r)=>d.confirmOrder({...t,context:r})},KlarnaMutations:{renderCheckout:(e,t,r)=>l.renderCheckout({...t,context:r})},MollieMutations:{createPayment:(e,t,r)=>p.createPayment({...t,context:r})},VippsMutations:{initiatePayment:(e,t,r)=>c.initiatePayment({...t,context:r})}}},4704:(e,t,r)=>{let a=r(825);e.exports=a`
  scalar JSON

  type Query {
    myCustomBusinessThing: MyCustomBusinnessQueries!
    basket(basketModel: BasketModelInput!): Basket!
    user: UserQueries!
    paymentProviders: PaymentProvidersQueries!
    orders: OrderQueries!
    voucher(code: String!): VoucherResponse!
  }

  type VoucherResponse {
    voucher: Voucher
    isValid: Boolean!
  }

  type MyCustomBusinnessQueries {
    whatIsThis: String!
    dynamicRandomInt: Int!
    youCanEvenGetTheUserDataHere: UserQueries!
  }

  type Basket {
    cart: [CartItem!]!
    total: Price!
    voucher: Voucher
  }

  type CartItem {
    sku: String!
    name: String
    path: String
    quantity: Int!
    vatType: VatType
    stock: Int
    price: Price
    priceVariants: [PriceVariant!]
    attributes: [Attribute!]
    images: [Image!]
  }

  type PriceVariant {
    price: Float
    identifier: String!
    currency: String!
  }

  type Attribute {
    attribute: String!
    value: String
  }

  type Image {
    url: String!
    variants: [ImageVariant!]
  }

  type ImageVariant {
    url: String!
    width: Int
    height: Int
  }

  type Price {
    gross: Float!
    net: Float!
    currency: String
    tax: Tax
    taxAmount: Float
    discount: Float!
  }

  type Tax {
    name: String
    percent: Float
  }

  type VatType {
    name: String!
    percent: Int!
  }

  type UserQueries {
    logoutLink: String!
    isLoggedIn: Boolean!
    email: String
  }

  type PaymentProvidersQueries {
    stripe: PaymentProvider!
    klarna: PaymentProvider!
    vipps: PaymentProvider!
    mollie: PaymentProvider!
    bancontact: PaymentProvider!
  }

  type PaymentProvider {
    enabled: Boolean!
    config: JSON
  }

  type OrderQueries {
    get(id: String!): JSON
  }

  type Voucher {
    code: String!
    discountAmount: Int
    discountPercent: Float
  }

  type Mutation {
    user: UserMutations
    paymentProviders: PaymentProvidersMutations!
  }

  type MutationResponse {
    success: Boolean!
    error: String
  }

  input BasketModelInput {
    locale: LocaleInput!
    cart: [SimpleCartItem!]!
    voucherCode: String
    crystallizeOrderId: String
    klarnaOrderId: String
  }

  input LocaleInput {
    locale: String!
    displayName: String
    appLanguage: String!
    crystallizeCatalogueLanguage: String
    crystallizePriceVariant: String
  }

  input SimpleCartItem {
    sku: String!
    path: String!
    quantity: Int
    priceVariantIdentifier: String!
  }

  type UserMutations {
    sendMagicLink(
      email: String!
      redirectURLAfterLogin: String!
    ): MutationResponse!,
    sendGiftCard(
      email: String!
      aanbieder: String!
      message: String!
      amount: String!
    ): MutationResponse!
  }

  input CheckoutModelInput {
    basketModel: BasketModelInput!
    metadata: JSON
    customer: CustomerInput
    confirmationURL: String!
    checkoutURL: String!
    termsURL: String!
  }

  input CustomerInput {
    firstName: String
    lastName: String
    addresses: [AddressInput!]
  }

  input AddressInput {
    type: String
    email: String
    street: String
    streetNumber: String
    postalCode: String
    city: String
  }

  type PaymentProvidersMutations {
    stripe: StripeMutations!
    bancontact: BancontactMutations!
    klarna: KlarnaMutations!
    mollie: MollieMutations!
    vipps: VippsMutations!
  }

  type StripeMutations {
    createPaymentIntent(checkoutModel: CheckoutModelInput!): JSON
    confirmOrder(
      checkoutModel: CheckoutModelInput!
      paymentIntentId: String!
    ): StripeConfirmOrderResponse!
  }

  type StripeConfirmOrderResponse {
    success: Boolean!
    orderId: String
  }

  type BancontactMutations {
    createPaymentIntent(checkoutModel: CheckoutModelInput!): JSON
    confirmOrder(
      checkoutModel: CheckoutModelInput!
      paymentIntentId: String!
    ): BancontactConfirmOrderResponse!
  }

  type BancontactConfirmOrderResponse {
    success: Boolean!
    orderId: String
  }

  type KlarnaMutations {
    renderCheckout(
      checkoutModel: CheckoutModelInput!
    ): KlarnaRenderCheckoutReponse!
  }

  type KlarnaRenderCheckoutReponse {
    html: String!
    klarnaOrderId: String!
    crystallizeOrderId: String!
  }

  type MollieMutations {
    createPayment(
      checkoutModel: CheckoutModelInput!
    ): MollieCreatePaymentResponse!
  }

  type MollieCreatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type VippsMutations {
    initiatePayment(
      checkoutModel: CheckoutModelInput!
    ): VippsInitiatePaymentResponse!
  }

  type VippsInitiatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }
`},5041:e=>{e.exports=function({headers:e}){let{"x-forwarded-proto":t,"x-forwarded-host":r}=e;if(t&&r)return`${t}://${r}`;let{host:a}=e;if(a&&a.startsWith("localhost"))return`http://${a}`;if(process.env.HOST_URL)return process.env.HOST_URL;if(process.env.VERCEL_URL)return`https://${process.env.VERCEL_URL}`;if(!a)throw Error("Cannot determine host for the current request context");return`https://${a}`}},1902:(e,t,r)=>{e.exports=async function({paymentIntentId:e,checkoutModel:t,context:a}){let n=r(6784),s=r(8958),i=r(1805),o=r(3405),{basketModel:d}=t,l=await i.get({basketModel:d,context:a}),c=await o({basket:l,checkoutModel:t,paymentIntentId:e}),p=await n.orders.createOrder(c);return await n.orders.waitForOrderToBePersistated({id:p.id}),await s.sendOrderConfirmation(p.id),{success:!0,orderId:p.id}}},5037:(e,t,r)=>{e.exports=async function({checkoutModel:e,context:t}){let a=r(1805),{getClient:n}=r(4311),{basketModel:s}=e,i=await a.get({basketModel:s,context:t}),o=await n().paymentIntents.create({amount:100*i.total.gross,currency:i.total.currency,payment_method_types:["bancontact"]});return o}},8091:(e,t,r)=>{let a=r(5037),n=r(1902),s=process.env.STRIPE_SECRET_KEY,i=process.env.STRIPE_PUBLISHABLE_KEY;e.exports={enabled:!!(s&&i),frontendConfig:{publishableKey:i},createPaymentIntent:a,confirmOrder:n}},3405:(e,t,r)=>{e.exports=async function({basket:e,checkoutModel:t,paymentIntentId:a}){let{getClient:n}=r(4311),s=await n().paymentIntents.retrieve(a),{data:i}=s.charges,o=i[0],d=o.billing_details.name.split(" "),l=o.receipt_email;if(!l&&t.customer&&t.customer.addresses){let e=t.customer.addresses.find(e=>!!e.email);e&&(l=e.email)}return console.log(e.total),{cart:e.cart,total:e.total,additionalInformation:JSON.stringify({stripe_merchant_data:s.merchant_data,order_metadata:t.metadata}),customer:{identifier:"",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],birthDate:Date,addresses:[{type:"billing",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],street:o.billing_details.address.line1,street2:o.billing_details.address.line2,postalCode:o.billing_details.address.postal_code,city:o.billing_details.address.city,state:o.billing_details.address.state,country:o.billing_details.address.country,phone:o.billing_details.phone,email:l},{type:"delivery",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],street:t.customer.addresses[1].street,streetNumber:t.customer.addresses[1].streetNumber,street2:o.billing_details.address.line2,postalCode:t.customer.addresses[1].postalCode,city:t.customer.addresses[1].city,state:o.billing_details.address.state,country:o.billing_details.address.country,phone:o.billing_details.phone,email:l}]},payment:[{provider:"stripe",stripe:{stripe:o.id,customerId:o.customer,orderId:o.payment_intent,paymentMethod:o.payment_method_details.type,paymentMethodId:o.payment_method,paymentIntentId:o.payment_intent,subscriptionId:o.subscription,metadata:""}}]}}},4311:(e,t,r)=>{let a;let n=r(7644),s=process.env.STRIPE_SECRET_KEY;e.exports={getClient:()=>{if(n(s,"process.env.STRIPE_SECRET_KEY is not defined"),!a){let e=r(8174);a=e(s)}return a}}},2816:(e,t,r)=>{let a=process.env.KLARNA_USERNAME,n=process.env.KLARNA_PASSWORD,s=r(9902),{getClient:i}=r(6062);e.exports={enabled:!!(a&&n),frontendConfig:{},getClient:i,renderCheckout:s}},9902:(e,t,r)=>{let a=r(6784),n=r(1805),{getClient:s}=r(6062),i=r(2715);e.exports=async function({checkoutModel:e,context:t}){let{basketModel:r,customer:o,confirmationURL:d,termsURL:l,checkoutURL:c}=e,{user:p,serviceCallbackHost:u}=t,{crystallizeOrderId:m,klarnaOrderId:y}=r,g=await n.get({basketModel:r,user:p});if(m)await a.orders.updateOrder(m,{...g,customer:o});else{let e=await a.orders.createOrder({...g,customer:o});m=e.id}let h=new URL(d.replace("{crystallizeOrderId}",m));h.searchParams.append("klarnaOrderId","{checkout.order.id}");let f={...i(g),purchase_country:"NO",purchase_currency:g.total.currency||"NOK",locale:"no-nb",merchant_urls:{terms:l,checkout:c,confirmation:h.toString(),push:`${u}/webhooks/payment-providers/klarna/push?crystallizeOrderId=${m}&klarnaOrderId={checkout.order.id}`}},I=await s(),_="";if(y){let{error:e,response:t}=await I.checkoutV3.updateOrder(y,f);if(e)throw Error(e);_=t.html_snippet,y=t.order_id}else{let{error:e,response:t}=await I.checkoutV3.createOrder(f);if(e)throw Error(e);_=t.html_snippet,y=t.order_id}return await a.orders.waitForOrderToBePersistated({id:m}),await a.orders.updateOrder(m,{...g,additionalInformation:JSON.stringify({klarnaOrderId:y,klarnaStatus:"not-completed"})}),{html:_,klarnaOrderId:y,crystallizeOrderId:m}}},2715:(e,t,r)=>{let{getClient:a}=r(6062);e.exports=function(e){let{total:t,cart:r}=e,a=100*t.gross;return{order_amount:a,order_tax_amount:a-100*t.net,order_lines:r.map(({quantity:e,price:t,name:r,sku:a,productId:n,productVariantId:s,imageUrl:i})=>{let{gross:o,net:d,tax:l}=t,c=100*o,p=c*e;return{name:r,reference:a,unit_price:c,quantity:e,total_amount:p,total_tax_amount:p-d*e*100,type:"physical",tax_rate:100*l.percent,image_url:i,merchant_data:JSON.stringify({productId:n,productVariantId:s,taxGroup:l})}})}}},6062:(e,t,r)=>{let a;let n=r(7644),{Klarna:s}=r(5854),i=process.env.KLARNA_USERNAME,o=process.env.KLARNA_PASSWORD;e.exports={getClient:()=>(n(i,"process.env.KLARNA_USERNAME is not defined"),n(o,"process.env.KLARNA_PASSWORD is not defined"),!a&&i&&o&&(a=new s({username:i,password:o,apiEndpoint:"api.playground.klarna.com"})),a)}},184:(e,t,r)=>{let a=r(1805),n=r(6784),{getClient:s}=r(6954);e.exports=async function({checkoutModel:e,context:t}){let{basketModel:r,customer:i,confirmationURL:o}=e,{user:d,serviceCallbackHost:l}=t,c=await a.get({basketModel:r,user:d}),{total:p}=c,{crystallizeOrderId:u}=r;if(u)await n.orders.updateOrder(u,{...c,customer:i,additionalInformation:JSON.stringify({isSubscription:!1})});else{let e=await n.orders.createOrder({...c,customer:i,additionalInformation:JSON.stringify({isSubscription:!1})});u=e.id}let m=await s(),y=await m.customers.create({name:`${i.firstName} ${i.lastName}`.trim()||"Jane Doe",email:i.addresses[0].email}),g=new URL(o.replace("{crystallizeOrderId}",u)),h={amount:{currency:process.env.MOLLIE_DEFAULT_CURRENCY||p.currency.toUpperCase(),value:p.gross.toFixed(2)},customerId:y.id,sequenceType:"first",description:"Mollie test transaction",redirectUrl:g.toString(),webhookUrl:`${l}/webhooks/payment-providers/mollie/order-update`,metadata:{crystallizeOrderId:u}},f=await m.payments.create(h);return{success:!0,checkoutLink:f._links.checkout.href,crystallizeOrderId:u}}},4967:(e,t,r)=>{let{getClient:a}=r(6954),n=r(9514),s=r(184);e.exports={enabled:!!process.env.MOLLIE_API_KEY,frontendConfig:{},getClient:a,toCrystallizeOrderModel:n,createPayment:s}},2641:e=>{e.exports={REQUIRED_STRIPE_CONFIG:{apiVersion:"2020-08-27"}}},3155:(e,t,r)=>{e.exports=async function({paymentIntentId:e,checkoutModel:t,context:a}){let n=r(6784),s=r(8958),i=r(1805),o=r(4071),{getClient:d}=r(7937),{basketModel:l}=t,c=await i.get({basketModel:l,context:a}),p=d();try{let t=await p.paymentIntents.retrieve(e);if("requires_confirmation"===t.status&&(t=await p.paymentIntents.confirm(e,{return_url:`${process.env.NEXT_PUBLIC_URL||"https://your-domain.com"}/order/confirmation`})),"succeeded"!==t.status)throw Error(`Payment not completed. Status: ${t.status}`);console.log(`Payment intent ${e} confirmed successfully with status: ${t.status}`)}catch(e){throw console.error("Payment intent verification/confirmation failed:",e),Error(`Payment verification failed: ${e.message}`)}let u=await o({basket:c,checkoutModel:t,paymentIntentId:e}),m=await n.orders.createOrder(u);return await n.orders.waitForOrderToBePersistated({id:m.id}),await s.sendOrderConfirmation(m.id),{success:!0,orderId:m.id}}},2071:(e,t,r)=>{e.exports=async function({checkoutModel:e,context:t}){let a=r(1805),{getClient:n}=r(7937),{basketModel:s,customer:i}=e;console.log("CreatePaymentIntent - Checkout Model:",{basketId:s?.basketId,customer:{email:i?.email,firstName:i?.firstName,lastName:i?.lastName,hasAddress:!!i?.streetAddress}});let o=await a.get({basketModel:s,context:t});console.log("CreatePaymentIntent - Basket Details:",{total:o.total,currency:o.total.currency,calculatedAmount:Math.round(100*o.total.gross)});try{let e=s?.basketId?`pi_${s.basketId}_${o.total.gross}`:`pi_${Date.now()}_${o.total.gross}`,t={amount:Math.round(100*o.total.gross),currency:o.total.currency.toLowerCase(),payment_method_types:["card"],confirmation_method:"automatic",metadata:{basketId:s?.basketId||`basket_${Date.now()}`,customerName:`${i?.firstName||""} ${i?.lastName||""}`.trim()||"Guest"}};i?.email&&(t.receipt_email=i.email,t.metadata.customerEmail=i.email),(i?.firstName||i?.lastName)&&(t.description=`Order for ${i.firstName||""} ${i.lastName||""}`.trim()),i?.streetAddress&&(t.shipping={name:`${i.firstName||""} ${i.lastName||""}`.trim(),address:{line1:i.streetAddress,postal_code:i.postalCode||"",city:i.city||"",country:i.country||"BE",state:i.state||null}}),console.log("Creating Payment Intent:",{data:t,idempotencyKey:e});let r=await n().paymentIntents.create(t,{idempotencyKey:e});return console.log("Payment Intent Created:",{id:r.id,clientSecret:r.client_secret?"present":"missing",status:r.status}),r}catch(e){throw console.error("Stripe Error:",{type:e.type,code:e.code,message:e.message,param:e.param,requestId:e.requestId,...e.raw&&{raw:e.raw}}),e}}},2752:(e,t,r)=>{let a=r(2071),n=r(3155),s=process.env.STRIPE_SECRET_KEY,i=process.env.STRIPE_PUBLISHABLE_KEY;e.exports={enabled:!!(s&&i),frontendConfig:{publishableKey:i},createPaymentIntent:a,confirmOrder:n}},4071:(e,t,r)=>{e.exports=async function({basket:e,checkoutModel:t,paymentIntentId:a}){let{getClient:n}=r(7937),s=await n().paymentIntents.retrieve(a),{data:i}=s.charges,o=i[0],d=o.billing_details.name.split(" "),l=o.receipt_email;if(!l&&t.customer&&t.customer.addresses){let e=t.customer.addresses.find(e=>!!e.email);e&&(l=e.email)}return{cart:e.cart,total:e.total,additionalInformation:JSON.stringify({stripe_merchant_data:s.merchant_data,order_metadata:t.metadata}),customer:{identifier:"",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],birthDate:Date,addresses:[{type:"billing",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],street:o.billing_details.address.line1,street2:o.billing_details.address.line2,postalCode:o.billing_details.address.postal_code,city:o.billing_details.address.city,state:o.billing_details.address.state,country:o.billing_details.address.country,phone:o.billing_details.phone,email:l},{type:"delivery",firstName:d[0],middleName:d.slice(1,d.length-1).join(),lastName:d[d.length-1],street:t.customer.addresses[1].street,streetNumber:t.customer.addresses[1].streetNumber,street2:o.billing_details.address.line2,postalCode:t.customer.addresses[1].postalCode,city:t.customer.addresses[1].city,state:o.billing_details.address.state,country:o.billing_details.address.country,phone:o.billing_details.phone,email:l}]},payment:[{provider:"stripe",stripe:{stripe:o.id,customerId:o.customer,orderId:o.payment_intent,paymentMethod:o.payment_method_details.type,paymentMethodId:o.payment_method,paymentIntentId:o.payment_intent,subscriptionId:o.subscription,metadata:""}}]}}},7937:(e,t,r)=>{let a;let n=r(7644),{REQUIRED_STRIPE_CONFIG:s}=r(2641),i=process.env.STRIPE_SECRET_KEY;e.exports={getClient:()=>{if(n(i,"process.env.STRIPE_SECRET_KEY is not defined"),!a){let e=r(8174);a=e(i,s)}return a}}}};var t=require("../../webpack-api-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),r=t.X(0,[222,784,958,741,46,911],()=>__webpack_exec__(1386));module.exports=r})();