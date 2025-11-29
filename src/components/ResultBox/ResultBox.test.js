import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ResultBox from './ResultBox';

describe('Component ResultBox', () => {
  it('should render without crashing', () => {
    render(<ResultBox from="PLN" to="USD" amount={100} />);
  });

  it('should render proper info about conversion when PLN -> USD', () => {
    const testCases = [
      { amount: 100, expectedText: 'PLN 100.00 = $28.57' },
      { amount: 20, expectedText: 'PLN 20.00 = $5.71' },
      { amount: 200, expectedText: 'PLN 200.00 = $57.14' },
      { amount: 350, expectedText: 'PLN 350.00 = $100.00' },
    ];

    for (const testObj of testCases) {
      render(<ResultBox from="PLN" to="USD" amount={testObj.amount} />);
      const output = screen.getByTestId('output');
      expect(output).toHaveTextContent(testObj.expectedText);
      cleanup();
    }
  });

  it('should render proper info about conversion when USD -> PLN', () => {
    const testCases = [
      { amount: 100, expectedText: '$100.00 = PLN 350.00' },
      { amount: 20, expectedText: '$20.00 = PLN 70.00' },
      { amount: 200, expectedText: '$200.00 = PLN 700.00' },
      { amount: 345, expectedText: '$345.00 = PLN 1,207.50' },
    ];

    for (const testObj of testCases) {
      render(<ResultBox from="USD" to="PLN" amount={testObj.amount} />);
      const output = screen.getByTestId('output');
      expect(output).toHaveTextContent(testObj.expectedText);
      cleanup();
    }
  });

  it('should render "Wrong value..." when amount is negative', () => {
    render(<ResultBox from="PLN" to="USD" amount={-50} />);
    const output = screen.getByTestId('output');
    expect(output).toHaveTextContent('Wrong value...');
  });
});
