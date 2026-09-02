export function formatBdt(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    currency: 'BDT',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount)
}
