export const formatCurrency = (amount: number | null) => {
  if (amount == null) return "0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number | null) => {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
};

export const toNumber = (val: number | string | null | undefined): number => {
  if (val == null) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
};