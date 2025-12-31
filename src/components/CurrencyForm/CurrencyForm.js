import { useEffect, useState } from 'react';
import TextInput from './../TextInput/TextInput';
import Select from './../Select/Select';
import Button from './../Button/Button';
import styles from './CurrencyForm.module.scss';
import { getLocalCurrency } from './../../utils/getLocalCurrency';

const CurrencyForm = ({ action, onPairChange, pairPreset }) => {
  const currencyOptions = ['EUR', 'USD', 'PLN', 'GBP', 'CHF', 'JPY'];
  const defaultFrom = getLocalCurrency(currencyOptions);
  const defaultTo = defaultFrom === 'USD' ? 'EUR' : 'USD';
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  useEffect(() => {
    if (!pairPreset) return;
    if (pairPreset.from) {
      setFrom(pairPreset.from);
    }
    if (pairPreset.to) {
      setTo(pairPreset.to);
    }
  }, [pairPreset]);

  useEffect(() => {
    if (onPairChange) {
      onPairChange({ from, to });
    }
  }, [from, to, onPairChange]);

  const handleSubmit = e => {
    e.preventDefault();

    action({ 
      amount: parseInt(amount),
      from,
      to,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>
        <span>Amount:</span>
        <TextInput data-testid="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
      </label>
      <label>
        <span>From</span>
        <Select data-testid="from-select" value={from} onChange={e => setFrom(e.target.value)}>
          {currencyOptions.map(currency => (
            <option key={`from-${currency}`} value={currency}>{currency}</option>
          ))}
        </Select>
      </label>
      <label>
        <span>To</span>
        <Select data-testid="to-select" value={to} onChange={e => setTo(e.target.value)}>
          {currencyOptions.map(currency => (
            <option key={`to-${currency}`} value={currency}>{currency}</option>
          ))}
        </Select>
      </label>
      <Button>Convert</Button>
    </form>
  );
};

export default CurrencyForm;
