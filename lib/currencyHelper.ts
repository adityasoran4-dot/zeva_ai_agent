// lib/currencyHelper.ts
// Currency symbols map
export const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  AED: "د.إ",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  SAR: "﷼",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
};

// List of supported currencies for the dropdown
export const supportedCurrencies = [
  { code: "INR", label: "INR – Indian Rupee (₹)" },
  { code: "USD", label: "USD – US Dollar ($)" },
  { code: "AED", label: "AED – UAE Dirham (د.إ)" },
  { code: "EUR", label: "EUR – Euro (€)" },
  { code: "GBP", label: "GBP – British Pound (£)" },
  { code: "SGD", label: "SGD – Singapore Dollar (S$)" },
  { code: "SAR", label: "SAR – Saudi Riyal (﷼)" },
  { code: "CAD", label: "CAD – Canadian Dollar (C$)" },
  { code: "AUD", label: "AUD – Australian Dollar (A$)" },
  { code: "JPY", label: "JPY – Japanese Yen (¥)" },
];

/**
 * Format an amount with the given currency using Intl.NumberFormat.
 * Falls back to a simple symbol + amount if Intl is not supported.
 */
export const formatCurrency = (amount: number | string, currency: string = "INR"): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencySymbols[currency] ?? currency} 0`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const symbol = currencySymbols[currency] ?? currency;
    return `${symbol}${num.toLocaleString()}`;
  }
};

/**
 * Get the currency symbol for a given currency code.
 */
export const getCurrencySymbol = (currency: string = "INR"): string => {
  return currencySymbols[currency] ?? currency;
};
