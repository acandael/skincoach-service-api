/**
 * Example of a voucher register
 * You can customise this to call an external service
 * or keep static vouchers like this
 */


//  const voucherRegister = [
//   {
//     code: "no-shipping-cost",
//     discountAmount: 8,
//     discountPercent: null,
//     onlyForAuthorisedUser: false,
//   }
// ];

module.exports = {
  async get({ code, context }) {

    const {
      getVouchersFromCrystallize,
    } = require("./get-vouchers-from-crystallize");
    
    const vouchers = await getVouchersFromCrystallize();

    const { user } = context;

    const isAnonymousUser = !user || !user.email;

    // As default, not all the vouchers work for anonymous users.
    // As you'll see in the configuration above, some need the user to be logged in
    if (isAnonymousUser) {
      const voucher = vouchers
        .filter((v) => !v.onlyForAuthorisedUser)
        .find((v) => v.components[0].content.text === code);

      return {
        isValid: Boolean(voucher),
        voucher,
      };
    }

    // We assume that none of the vouchers have repeated codes
    const voucher = vouchers.find((v) => v.code === code);

    return {
      isValid: Boolean(voucher),
      voucher,
    };
  },
};
