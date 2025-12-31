import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './RateChart.module.scss';

const ranges = [
  { id: '1d', label: '24h', days: 1 },
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
];

const RateChart = ({ from, to }) => {
  const [rangeId, setRangeId] = useState('7d');
  const [series, setSeries] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const currentRange = ranges.find(range => range.id === rangeId) || ranges[1];

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const ecbBaseUrl = 'https://data-api.ecb.europa.eu/service/data/EXR';
    const seriesByCurrency = currency => `${ecbBaseUrl}/D.${currency}.EUR.SP00.A`;

    const formatDate = date => date.toISOString().slice(0, 10);

    const buildSeriesMap = payload => {
      const dataSeries = payload?.dataSets?.[0]?.series;
      if (!dataSeries) return {};
      const seriesKey = Object.keys(dataSeries)[0];
      const observations = dataSeries[seriesKey]?.observations || {};
      const dateValues = payload?.structure?.dimensions?.observation?.[0]?.values || [];
      const map = {};

      Object.keys(observations).forEach(key => {
        const date = dateValues[Number(key)]?.id;
        if (!date) return;
        const value = observations[key]?.[0];
        if (typeof value === 'number') {
          map[date] = value;
        }
      });

      return map;
    };

    const fetchSeries = async () => {
      try {
        setStatus('loading');
        setError(null);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - currentRange.days);

        const startPeriod = formatDate(startDate);
        const endPeriod = formatDate(endDate);
        const requestParams = `startPeriod=${startPeriod}&endPeriod=${endPeriod}&detail=dataonly`;

        const requests = [];
        if (from !== 'EUR') {
          requests.push({ key: 'from', url: `${seriesByCurrency(from)}?${requestParams}` });
        }
        if (to !== 'EUR') {
          requests.push({ key: 'to', url: `${seriesByCurrency(to)}?${requestParams}` });
        }

        const responses = await Promise.all(
          requests.map(request => fetch(request.url, { signal: controller.signal }))
        );

        if (responses.some(response => !response.ok)) {
          throw new Error('Chart request failed');
        }

        const payloads = await Promise.all(responses.map(response => response.json()));

        if (!isActive) return;

        const maps = {};
        requests.forEach((request, index) => {
          maps[request.key] = buildSeriesMap(payloads[index]);
        });

        const fromMap = from === 'EUR' ? {} : maps.from;
        const toMap = to === 'EUR' ? {} : maps.to;
        const dateSet = new Set();

        const collectDates = map => Object.keys(map || {}).forEach(date => dateSet.add(date));
        collectDates(fromMap);
        collectDates(toMap);

        const dates = Array.from(dateSet).sort();

        const dataPoints = dates.map(date => {
          const fromRate = from === 'EUR' ? 1 : fromMap[date];
          const toRate = to === 'EUR' ? 1 : toMap[date];
          if (typeof fromRate !== 'number' || typeof toRate !== 'number') return null;
          const value = (1 / fromRate) * toRate;
          return { date, value };
        }).filter(Boolean);

        setSeries(dataPoints);
        setStatus('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (!isActive) return;
        setError('Chart unavailable');
        setStatus('error');
      }
    };

    if (from && to && from !== to) {
      fetchSeries();
    } else {
      setSeries([]);
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [from, to, currentRange.days]);

  const chartPath = useMemo(() => {
    if (series.length < 2) return '';
    const values = series.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const width = 480;
    const height = 160;
    const padding = 16;
    const range = max - min || 1;

    const toX = (index, count) => {
      return padding + (index / (count - 1)) * (width - padding * 2);
    };
    const toY = value => {
      return height - padding - ((value - min) / range) * (height - padding * 2);
    };

    return series.map((point, index) => {
      const x = toX(index, series.length);
      const y = toY(point.value);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }, [series]);

  const latestValue = series.length > 0 ? series[series.length - 1].value : null;

  return (
    <section className={styles.chart}>
      <div className={styles.header}>
        <h3 className={styles.title}>Rate history</h3>
        <div className={styles.filters}>
          {ranges.map(range => (
            <button
              key={range.id}
              type="button"
              className={range.id === rangeId ? styles.activeFilter : styles.filter}
              onClick={() => setRangeId(range.id)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      {status === 'loading' ? <p className={styles.info}>Loading chart...</p> : null}
      {status === 'error' ? <p className={styles.info}>Chart unavailable.</p> : null}
      {status === 'ready' && series.length < 2 ? (
        <p className={styles.info}>Not enough data for chart.</p>
      ) : null}
      {chartPath ? (
        <div className={styles.canvas}>
          <svg viewBox="0 0 480 160" className={styles.svg}>
            <path d={chartPath} className={styles.line} />
          </svg>
          {latestValue ? (
            <p className={styles.latest}>Latest: {latestValue.toFixed(4)}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

RateChart.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

export default RateChart;
