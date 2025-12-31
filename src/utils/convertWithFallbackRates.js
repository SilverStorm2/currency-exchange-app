import { formatAmountInCurrency } from './formatAmountInCurrency';

const fallbackRates = {
  EUR: 1,
  USD: 1,
  PLN: 3.5,
  GBP: 0.8,
  CHF: 0.9,
  JPY: 150,
};

export const convertWithFallbackRates = (amount, from, to) => {
  if (typeof amount !== 'number') return 'Error';
  if (!fallbackRates[from] || !fallbackRates[to]) return formatAmountInCurrency(amount, from);

  const amountInBase = amount / fallbackRates[from];
  const amountInTarget = amountInBase * fallbackRates[to];

  return formatAmountInCurrency(amountInTarget, to);
};
