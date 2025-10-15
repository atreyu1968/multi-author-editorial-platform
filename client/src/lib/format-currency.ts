export function formatCurrency(amount: number, currency: string = "USD", symbol: string = "$"): string {
  return `${symbol}${amount.toFixed(2)} ${currency}`;
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    MXN: "$",
    ARS: "$",
    COP: "$",
    CLP: "$",
    PEN: "S/",
    BRL: "R$",
  };
  return symbols[currency] || "$";
}
