import { getLocalCurrency } from '../getLocalCurrency';

describe('getLocalCurrency', () => {
  const originalNavigator = global.navigator;

  const setNavigatorLanguage = value => {
    Object.defineProperty(global.navigator, 'language', {
      value,
      configurable: true,
    });
  };

  beforeEach(() => {
    global.navigator = { language: 'en-US' };
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  it('should return detected currency when supported', () => {
    setNavigatorLanguage('pl-PL');
    expect(getLocalCurrency(['PLN', 'USD'])).toBe('PLN');
  });

  it('should fall back to USD when detected currency is unsupported', () => {
    setNavigatorLanguage('pl-PL');
    expect(getLocalCurrency(['EUR', 'JPY'])).toBe('USD');
  });

  it('should fall back to USD when region is missing', () => {
    setNavigatorLanguage('en');
    expect(getLocalCurrency(['USD', 'EUR'])).toBe('USD');
  });

  it('should return default when supported list is empty', () => {
    setNavigatorLanguage('gb-GB');
    expect(getLocalCurrency()).toBe('GBP');
  });
});
