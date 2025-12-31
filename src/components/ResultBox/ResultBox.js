import PropTypes from 'prop-types';
import { formatAmountInCurrency } from './../../utils/formatAmountInCurrency';
import { useMemo } from 'react';
import { calculateConversion } from './../../utils/calculateConversion';
import styles from './ResultBox.module.scss';

const ResultBox = ({ from, to, amount, rates, lastUpdated, isLoading, error }) => {
  const convertedAmount = useMemo(() => {
    return calculateConversion({ amount, from, to, rates });
  }, [from, to, amount, rates]);

  const formattedAmount = useMemo(() => formatAmountInCurrency(amount, from), [amount, from]);

  if (amount < 0) {
    return <div data-testid="output" className={styles.result}>Wrong value...</div>;
  }

  return (
    <div data-testid="output" className={styles.result}>
      {formattedAmount} = {convertedAmount}
      {lastUpdated ? (
        <div className={styles.update}>Last update: {lastUpdated} (ECB)</div>
      ) : null}
      {isLoading ? (
        <div className={styles.status}>Loading latest rates...</div>
      ) : null}
      {!isLoading && error ? (
        <div className={styles.status}>Rates unavailable, using fallback.</div>
      ) : null}
    </div>
  );
};

ResultBox.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  rates: PropTypes.object,
  lastUpdated: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
}

export default ResultBox;
