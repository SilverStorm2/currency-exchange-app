import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RateChart from './RateChart';

const buildPayload = (dates, values) => ({
  dataSets: [
    {
      series: {
        '0:0:0:0:0': {
          observations: values.reduce((acc, value, index) => {
            acc[index] = [value];
            return acc;
          }, {}),
        },
      },
    },
  ],
  structure: {
    dimensions: {
      observation: [
        {
          values: dates.map(date => ({ id: date })),
        },
      ],
    },
  },
});

describe('Component RateChart', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render latest value when data loads', async () => {
    const dates = ['2024-02-08', '2024-02-09'];
    const usdPayload = buildPayload(dates, [1.1, 1.2]);
    const plnPayload = buildPayload(dates, [4.5, 4.6]);

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => usdPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => plnPayload });

    render(<RateChart from="USD" to="PLN" />);

    expect(await screen.findByText('Latest: 3.8333')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should show error state when request fails', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<RateChart from="USD" to="PLN" />);

    expect(await screen.findByText('Chart unavailable.')).toBeInTheDocument();
  });
});
