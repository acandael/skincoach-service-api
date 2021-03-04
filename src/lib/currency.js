function formatCurrency({ amount, currency }) {
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency }).format(
    amount
  );
}

module.exports = {
  formatCurrency,
};
