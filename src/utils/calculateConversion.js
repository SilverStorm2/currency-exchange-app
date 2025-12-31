import { convertUSDToPLN } from './convertUSDToPLN';
import { convertPLNToUSD } from './convertPLNToUSD';
import { formatAmountInCurrency } from './formatAmountInCurrency';
import { convertWithFallbackRates } from './convertWithFallbackRates';

export const calculateConversion = ({ amount, from, to, rates }) => {
  if (amount < 0) return null;

  if (rates && rates[from] && rates[to]) {
    const amountInEur = amount / rates[from];
    const amountInTarget = amountInEur * rates[to];
    return formatAmountInCurrency(amountInTarget, to);
  }

  if (from === 'USD' && to === 'PLN') return convertUSDToPLN(amount);
  if (from === 'PLN' && to === 'USD') return convertPLNToUSD(amount);
  return convertWithFallbackRates(amount, from, to);
};
