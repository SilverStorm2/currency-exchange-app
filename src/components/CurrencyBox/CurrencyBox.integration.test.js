import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrencyBox from './CurrencyBox';

const setupFetchMock = () => {
  const buildPayload = (date, value) => ({
    dataSets: [
      {
        series: {
          '0:0:0:0:0': {
            observations: {
              0: [value],
            },
          },
        },
      },
    ],
    structure: {
      dimensions: {
        observation: [
          {
            values: [{ id: date }],
          },
        ],
      },
    },
  });

  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => buildPayload('2024-02-10', 1.1) })
    .mockResolvedValueOnce({ ok: true, json: async () => buildPayload('2024-02-10', 4.5) });
};

describe('CurrencyBox integration', () => {
  const getUser = () => (userEvent.setup ? userEvent.setup() : userEvent);

  beforeEach(() => {
    setupFetchMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it('should add to history and favorites', async () => {
    const user = getUser();
    render(<CurrencyBox />);

    const amountField = screen.getByTestId('amount');
    const fromField = screen.getByTestId('from-select');
    const toField = screen.getByTestId('to-select');

    await user.type(amountField, '10');
    await user.selectOptions(fromField, 'USD');
    await user.selectOptions(toField, 'PLN');
    await user.click(screen.getByText('Convert'));

    expect(await screen.findByText('Recent conversions')).toBeInTheDocument();
    expect(screen.getByText('USD 10.00 → PLN 40.91')).toBeInTheDocument();

    await user.click(screen.getByText('Save current pair'));
    expect(screen.getByText('USD → PLN')).toBeInTheDocument();
  });

  it('should clear history and favorites', async () => {
    const user = getUser();
    render(<CurrencyBox />);

    await user.click(screen.getByText('Save current pair'));
    expect(screen.getByText('USD → PLN')).toBeInTheDocument();

    await user.type(screen.getByTestId('amount'), '10');
    await user.click(screen.getByText('Convert'));
    expect(await screen.findByText('Recent conversions')).toBeInTheDocument();

    await user.click(screen.getByText('Clear history'));
    await user.click(screen.getByText('Clear favorites'));

    expect(screen.getByText('No conversions yet.')).toBeInTheDocument();
    expect(screen.getByText('No favorites yet.')).toBeInTheDocument();
  });
});
