function formatCurrency({ amount, currency }) {
  console.log(currency)
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency }).format(
    amount
  );
}

module.exports = {
  formatCurrency,
};
