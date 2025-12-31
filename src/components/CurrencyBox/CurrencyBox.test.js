import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import CurrencyBox from './CurrencyBox';

describe('Component CurrencyBox', () => {
  it('should render cached last update date from ECB', async () => {
    const cachedPayload = {
      fetchedAt: Date.now(),
      lastUpdated: '2024-02-10',
      rates: { USD: 1.1, PLN: 4.5 },
    };

    window.localStorage.setItem('ecbRatesCache', JSON.stringify(cachedPayload));

    const user = userEvent.setup ? userEvent.setup() : userEvent;
    render(<CurrencyBox />);

    const amountField = screen.getByTestId('amount');
    const fromField = screen.getByTestId('from-select');
    const toField = screen.getByTestId('to-select');
    const submitButton = screen.getByText('Convert');

    await user.type(amountField, '100');
    await user.selectOptions(fromField, 'PLN');
    await user.selectOptions(toField, 'USD');
    await user.click(submitButton);

    expect(await screen.findByText('Last update: 2024-02-10 (ECB)')).toBeInTheDocument();

    cleanup();
    window.localStorage.removeItem('ecbRatesCache');
  });
});
