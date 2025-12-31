import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import HistoryPanel from './HistoryPanel';

describe('Component HistoryPanel', () => {
  const getUser = () => (userEvent.setup ? userEvent.setup() : userEvent);

  it('should render empty states', () => {
    render(
      <HistoryPanel
        history={[]}
        favorites={[]}
        onToggleFavorite={() => {}}
        onSelectFavorite={() => {}}
        onClearHistory={() => {}}
        onClearFavorites={() => {}}
      />
    );

    expect(screen.getByText('No favorites yet.')).toBeInTheDocument();
    expect(screen.getByText('No conversions yet.')).toBeInTheDocument();
  });

  it('should trigger callbacks for clear buttons and favorites', async () => {
    const onToggleFavorite = jest.fn();
    const onSelectFavorite = jest.fn();
    const onClearHistory = jest.fn();
    const onClearFavorites = jest.fn();
    const user = getUser();

    render(
      <HistoryPanel
        history={[
          { id: '1', amountText: 'USD 10.00', resultText: 'PLN 40.00', timestamp: '2024-02-10 12:00' },
        ]}
        favorites={[
          { from: 'USD', to: 'PLN', isCurrent: true },
        ]}
        onToggleFavorite={onToggleFavorite}
        onSelectFavorite={onSelectFavorite}
        onClearHistory={onClearHistory}
        onClearFavorites={onClearFavorites}
      />
    );

    await user.click(screen.getByText('Clear history'));
    await user.click(screen.getByText('Clear favorites'));
    await user.click(screen.getByText('USD → PLN'));
    await user.click(screen.getByText('Remove current pair'));

    expect(onClearHistory).toHaveBeenCalledTimes(1);
    expect(onClearFavorites).toHaveBeenCalledTimes(1);
    expect(onSelectFavorite).toHaveBeenCalledWith({ from: 'USD', to: 'PLN', isCurrent: true });
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
