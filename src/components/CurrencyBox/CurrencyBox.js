import { useEffect, useState } from 'react';
import CurrencyForm from './../CurrencyForm/CurrencyForm';
import ResultBox from './../ResultBox/ResultBox';
import HistoryPanel from './../HistoryPanel/HistoryPanel';
import RateChart from './../RateChart/RateChart';
import { calculateConversion } from './../../utils/calculateConversion';
import { formatAmountInCurrency } from './../../utils/formatAmountInCurrency';

const supportedCurrencies = ['EUR', 'USD', 'PLN', 'GBP', 'CHF', 'JPY'];
const cacheTtlMs = 24 * 60 * 60 * 1000;

const CurrencyBox = () => {
  const [data, setData] = useState({
    amount: 0,
    from: 'PLN',
    to: 'USD'
  });
  const [rates, setRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [pairPreset, setPairPreset] = useState(null);
  const [selectedPair, setSelectedPair] = useState({ from: 'PLN', to: 'USD' });
  const cacheKey = 'ecbRatesCache';
  const historyKey = 'conversionHistory';
  const favoritesKey = 'favoritePairs';

  const handleDataChange = data => {
    setData(data);

    const converted = calculateConversion({ ...data, rates });
    const entry = {
      id: `${Date.now()}-${data.from}-${data.to}-${data.amount}`,
      amountText: formatAmountInCurrency(data.amount, data.from),
      resultText: converted || 'N/A',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setHistory(prevHistory => [entry, ...prevHistory].slice(0, 10));
  }

  const handlePairChange = pair => {
    setSelectedPair(pair);
  };

  const handleToggleFavorite = () => {
    if (!selectedPair || selectedPair.from === selectedPair.to) return;
    setFavorites(prevFavorites => {
      const exists = prevFavorites.some(pair => (
        pair.from === selectedPair.from && pair.to === selectedPair.to
      ));
      if (exists) {
        return prevFavorites.filter(pair => (
          pair.from !== selectedPair.from || pair.to !== selectedPair.to
        ));
      }
      return [{ from: selectedPair.from, to: selectedPair.to }, ...prevFavorites];
    });
  };

  const handleSelectFavorite = pair => {
    setPairPreset(pair);
    setSelectedPair(pair);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedHistory = window.localStorage.getItem(historyKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedFavorites = window.localStorage.getItem(favoritesKey);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      // Ignore storage read failures.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      // Ignore storage write failures.
    }
  }, [history]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      // Ignore storage write failures.
    }
  }, [favorites]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const ecbBaseUrl = 'https://data-api.ecb.europa.eu/service/data/EXR';
    const seriesByCurrency = currency => `${ecbBaseUrl}/D.${currency}.EUR.SP00.A`;
    const requestParams = 'lastNObservations=1&detail=dataonly';

    const readCache = () => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = window.localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.fetchedAt || !parsed.rates) return null;
        if (Date.now() - parsed.fetchedAt > cacheTtlMs) return null;
        if (!parsed.rates.EUR) {
          parsed.rates.EUR = 1;
        }
        const hasAllRates = supportedCurrencies.every(currency => {
          return typeof parsed.rates[currency] === 'number';
        });
        if (!hasAllRates) return null;
        return parsed;
      } catch (error) {
        return null;
      }
    };

    const saveCache = payload => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (error) {
        // Ignore cache write failures (private mode / quota).
      }
    };

    const extractObservation = payload => {
      const series = payload?.dataSets?.[0]?.series;
      if (!series) return { value: null, date: null };
      const seriesKey = Object.keys(series)[0];
      const observations = series[seriesKey]?.observations;
      if (!observations) return { value: null, date: null };
      const observationKey = Object.keys(observations)[0];
      const value = observations[observationKey]?.[0] ?? null;
      const dateValues = payload?.structure?.dimensions?.observation?.[0]?.values;
      const date = dateValues?.[Number(observationKey)]?.id ?? null;
      return { value, date };
    };

    const fetchRates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const currenciesToFetch = supportedCurrencies.filter(currency => currency !== 'EUR');
        const requests = currenciesToFetch.map(currency => ({
          currency,
          url: `${seriesByCurrency(currency)}?${requestParams}`,
        }));

        const responses = await Promise.all(
          requests.map(request => fetch(request.url, { signal: controller.signal }))
        );

        if (responses.some(response => !response.ok)) {
          throw new Error('Rates request failed');
        }

        const payloads = await Promise.all(responses.map(response => response.json()));

        if (!isActive) return;

        const nextRates = { EUR: 1 };
        let observationDate = null;

        payloads.forEach((payload, index) => {
          const { value, date } = extractObservation(payload);
          const currency = requests[index].currency;
          nextRates[currency] = value;
          if (!observationDate && date) {
            observationDate = date;
          }
        });

        if (Object.values(nextRates).some(rate => rate === null)) {
          throw new Error('Rates missing');
        }

        setRates(nextRates);
        setLastUpdated(observationDate);
        setIsLoading(false);
        saveCache({
          fetchedAt: Date.now(),
          lastUpdated: observationDate,
          rates: nextRates,
        });
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (!isActive) return;
        setIsLoading(false);
        setError('Rates unavailable');
        setRates(null);
        setLastUpdated(null);
      }
    };

    const cached = readCache();
    if (cached) {
      setRates({ ...cached.rates, EUR: 1 });
      setLastUpdated(cached.lastUpdated || null);
      setIsLoading(false);
    } else {
      fetchRates();
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <main>
      <CurrencyForm action={handleDataChange} onPairChange={handlePairChange} pairPreset={pairPreset} />
      { data.amount ? (
        <ResultBox {...data} rates={rates} lastUpdated={lastUpdated} isLoading={isLoading} error={error} />
      ) : null }
      <HistoryPanel
        history={history}
        favorites={favorites.map(pair => ({
          ...pair,
          isCurrent: pair.from === selectedPair.from && pair.to === selectedPair.to,
        }))}
        onToggleFavorite={handleToggleFavorite}
        onSelectFavorite={handleSelectFavorite}
        onClearHistory={handleClearHistory}
        onClearFavorites={handleClearFavorites}
      />
      <RateChart from={selectedPair.from} to={selectedPair.to} />
    </main>
  );
};

export default CurrencyBox;
