
function truncateDecimalsOfNumber(originalNumber, numberOfDecimals = 2) {
  // toFixed() converts a number into a string by truncating it
  // with the number of decimals passed as parameter.
  const amountTruncated = originalNumber.toFixed(numberOfDecimals);
  // We use parseFloat() to return a transform the string into a number
  return parseFloat(amountTruncated);
}

function calculateVoucherDiscountAmount({ voucher, amount }) {
  // We assume that the voucher has the right format.
  // It either has `discountPercent` or `discountAmount`
  
  const discountAmount = voucher.components[1].content.selectedComponent.content.number;

  const selectedComponent = voucher.components[1].content.selectedComponent;

  if (selectedComponent.name === 'discountAmount') {
    return discountAmount;
  }

  const amountToDiscount = (amount * discountAmount) / 100;

  return truncateDecimalsOfNumber(amountToDiscount);
}

module.exports = {
  calculateVoucherDiscountAmount,
};