const getCrystallizeVouchers = require("./get-vouchers-from-crystallize");

module.exports = {
  async get({ code, context }) {
    const { user } = context;

    const isAnonymousUser = !user || !user.email;

    const allCrystallizeVouchers = await getCrystallizeVouchers();

    const allVouchers = [...allCrystallizeVouchers];

    // As default, not all the vouchers work for anonymous users.
    // As you'll see in the configuration above, some need the user to be logged in
    if (isAnonymousUser) {
      const voucher = allVouchers
        .filter((v) => !v.onlyForAuthorisedUser)
        .find((v) => v.code === code);

      return {
        isValid: Boolean(voucher),
        voucher,
      };
    }

    // Search all vouchers for authenticated users
    let voucher = allVouchers.find((v) => v.code === code);

    return {
      isValid: Boolean(voucher),
      voucher,
    };
  },
};
