async function getVouchersFromCrystallize() {
  const { callVouchersApi } = require("../crystallize/utils");

  const response = await callVouchersApi({
    query: `{
     catalogue(path: "/vouchers") {
       children {
         ... on Product {
           id
           name
           components {
             id
             name
             type
             content {
               ... on SingleLineContent {text}
               ... on ComponentChoiceContent {
                 selectedComponent {
                   id
                   name
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
    }`
  })

  const vouchers = response.data.catalogue.children;

  return vouchers
}

module.exports = {
  getVouchersFromCrystallize,
};