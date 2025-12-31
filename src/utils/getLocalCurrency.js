const defaultCurrency = 'USD';

const regionToCurrency = {
  US: 'USD',
  PL: 'PLN',
  GB: 'GBP',
  CH: 'CHF',
  JP: 'JPY',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  LT: 'EUR',
  LV: 'EUR',
  EE: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  GR: 'EUR',
  CY: 'EUR',
  MT: 'EUR',
};

export const getLocalCurrency = (supportedCurrencies = []) => {
  if (typeof navigator === 'undefined') return defaultCurrency;
  const locale = navigator.language || 'en-US';
  const regionMatch = locale.match(/-([A-Z]{2})$/);
  const region = regionMatch ? regionMatch[1] : null;
  const detected = region ? regionToCurrency[region] : null;
  const candidate = detected || defaultCurrency;

  if (supportedCurrencies.length === 0) {
    return candidate;
  }

  return supportedCurrencies.includes(candidate) ? candidate : defaultCurrency;
};
