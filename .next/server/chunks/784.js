"use strict";exports.id=784,exports.ids=[784],exports.modules={6784:(e,t,r)=>{let a=r(5141);e.exports={orders:a}},2203:(e,t,r)=>{let{callOrdersApi:a,normaliseOrderModel:o}=r(3780);e.exports=async function(e){let t=await a({variables:o(e),query:`
      mutation createOrder(
        $customer: CustomerInput!
        $cart: [OrderItemInput!]!
        $total: PriceInput
        $payment: [PaymentInput!]
        $additionalInformation: String
      ) {
        orders {
          create(
            input: {
              customer: $customer
              cart: $cart
              total: $total
              payment: $payment
              additionalInformation: $additionalInformation
            }
          ) {
            id
          }
        }
      }
    `});return t.data.orders.create}},5362:(e,t,r)=>{let{callOrdersApi:a}=r(3780);e.exports=async function(e){let t=await a({variables:{id:e},query:`
      query getOrder($id: ID!){
        orders {
          get(id: $id) {
            id
            total {
              net
              gross
              currency
              tax {
                name
                percent
              }
            }
            additionalInformation
            payment {
              ... on StripePayment {
                paymentMethod
              }
              ... on CustomPayment {
                provider
                properties {
                  property
                  value
                }
              }
            }
            cart {
              sku
              name
              quantity
              imageUrl
              price {
                net
                gross
                currency
              }
            }
            customer {
              firstName
              lastName
              addresses {
                type
                email
                street
                streetNumber
                postalCode
                city
              }
            }
          }
        }
      }
    `}),r=t.data.orders.get;if(!r)throw Error(`Cannot retrieve order "${e}"`);return r}},5141:(e,t,r)=>{let a=r(2203),o=r(7806),s=r(5362),i=r(5327);e.exports={createOrder:a,updateOrder:o,getOrder:s,waitForOrderToBePersistated:i}},7806:(e,t,r)=>{let{callPimApi:a,normaliseOrderModel:o}=r(3780);e.exports=async function(e,t){let r=await a({variables:{id:e,...o(t)},query:`
      mutation updateOrder(
        $id: ID!
        $customer: CustomerInput
        $payment: [PaymentInput!]
        $additionalInformation: String
      ) {
        order {
            update(
            id: $id,
            input: {
              customer: $customer
              payment: $payment
              additionalInformation: $additionalInformation
            }
          ) {
            id
          }
        }
      }
  `});return r.data.order.update}},5327:(e,t,r)=>{let{callOrdersApi:a}=r(3780);e.exports=function({id:e}){let t=0;return new Promise((r,o)=>{!async function check(){let s=await a({query:`
          {
            orders {
              get(id: "${e}") {
                id
                createdAt
              }
            }
          }
        `});s.data&&s.data.orders.get?r():(t+=1)>10?o(`Timeout out waiting for Crystallize order "${e}" to be persisted`):setTimeout(check,1e3)}()})}},3780:(e,t,r)=>{let a=r(7644),o=r(4809),s=process.env.CRYSTALLIZE_TENANT_IDENTIFIER,i=process.env.CRYSTALLIZE_ACCESS_TOKEN_ID,n=process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;function createApiCaller(e){return async function({query:t,variables:r,operationName:s}){a(i,"Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_ID"),a(n,"Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET");let l=await o(e,{method:"POST",headers:{"content-type":"application/json","X-Crystallize-Access-Token-Id":i,"X-Crystallize-Access-Token-Secret":n},body:JSON.stringify({operationName:s,query:t,variables:r})}),c=await l.json();return c.errors&&console.log(JSON.stringify(c.errors,null,2)),c}}a(s,"Missing process.env.CRYSTALLIZE_TENANT_IDENTIFIER"),e.exports={normaliseOrderModel:function({customer:e,cart:t,total:r,...a}){let o=e.addresses[1];return{...a,...r&&{total:{gross:r.gross,net:r.net,currency:r.currency,tax:r.tax}},...t&&{cart:t.map(function(e){let{images:t=[],name:r,sku:a,productid:o,productVariantId:s,quantity:i,price:n}=e;return{name:r,sku:a,productid:o,productVariantId:s,quantity:i,price:n,imageUrl:t&&t[0]&&t[0].url}})},...e&&{customer:{firstName:e.firstName||null,lastName:e.lastName||null,addresses:e.addresses||[{type:"billing",email:e.email||void 0},{type:"delivery",street:o.street,streetNumber:o.streetNumber,postalCode:o.postalCode,city:o.city}]}}}},callCatalogueApi:createApiCaller(`https://api.crystallize.com/${s}/catalogue`),callOrdersApi:createApiCaller(`https://api.crystallize.com/${s}/orders`),callPimApi:createApiCaller("https://pim.crystallize.com/graphql")}}};