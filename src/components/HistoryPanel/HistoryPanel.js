import PropTypes from 'prop-types';
import styles from './HistoryPanel.module.scss';

const HistoryPanel = ({
  history,
  favorites,
  onToggleFavorite,
  onSelectFavorite,
  onClearHistory,
  onClearFavorites,
}) => {
  return (
    <section className={styles.panel}>
      <div className={styles.block}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>Favorite pairs</h3>
          <button type="button" className={styles.clear} onClick={onClearFavorites}>
            Clear favorites
          </button>
        </div>
        {favorites.length === 0 ? (
          <p className={styles.empty}>No favorites yet.</p>
        ) : (
          <div className={styles.favorites}>
            {favorites.map(pair => (
              <button
                type="button"
                key={`${pair.from}-${pair.to}`}
                className={styles.favoriteButton}
                onClick={() => onSelectFavorite(pair)}
              >
                {pair.from} → {pair.to}
              </button>
            ))}
          </div>
        )}
        <button type="button" className={styles.toggle} onClick={onToggleFavorite}>
          {favorites.some(pair => pair.isCurrent) ? 'Remove current pair' : 'Save current pair'}
        </button>
      </div>
      <div className={styles.block}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>Recent conversions</h3>
          <button type="button" className={styles.clear} onClick={onClearHistory}>
            Clear history
          </button>
        </div>
        {history.length === 0 ? (
          <p className={styles.empty}>No conversions yet.</p>
        ) : (
          <ul className={styles.history}>
            {history.map(entry => (
              <li key={entry.id} className={styles.historyItem}>
                <span className={styles.historyRow}>
                  {entry.amountText} → {entry.resultText}
                </span>
                <span className={styles.historyMeta}>
                  {entry.timestamp}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

HistoryPanel.propTypes = {
  history: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    amountText: PropTypes.string.isRequired,
    resultText: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
  })).isRequired,
  favorites: PropTypes.arrayOf(PropTypes.shape({
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    isCurrent: PropTypes.bool,
  })).isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onSelectFavorite: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired,
  onClearFavorites: PropTypes.func.isRequired,
};

export default HistoryPanel;
