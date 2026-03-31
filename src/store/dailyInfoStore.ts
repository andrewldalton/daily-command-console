import { create } from 'zustand';
import type { WeatherData, Quote, BibleVerse, NationalDay } from '../types';
import { bibleVerses } from '../data/bibleVerses';
import { QUOTES } from '../data/quotes';
import { NATIONAL_DAYS } from '../data/nationalDays';

interface DailyInfoState {
  weather: WeatherData | null;
  quote: Quote | null;
  bibleVerse: BibleVerse | null;
  nationalDay: NationalDay | null;
  loading: boolean;
  loadDailyInfo: () => void;
  refreshWeather: () => void;
  refreshQuote: () => void;
}

const getDayOfYear = (date: Date = new Date()): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Fetch real weather from Open-Meteo (free, no API key needed)
// Omaha, NE coordinates: 41.2565, -95.9345
const fetchWeather = async (): Promise<WeatherData> => {
  try {
    const lat = 41.2565;
    const lon = -95.9345;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago` +
      `&forecast_days=1`
    );
    const data = await res.json();

    const weatherCodeToCondition = (code: number): string => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 57) return 'Drizzle';
      if (code <= 67) return 'Rain';
      if (code <= 77) return 'Snow';
      if (code <= 82) return 'Showers';
      if (code <= 86) return 'Snow Showers';
      if (code <= 99) return 'Thunderstorm';
      return 'Clear';
    };

    const currentHour = new Date().getHours();
    const hourlyTemps = data.hourly?.temperature_2m ?? [];
    const hourlyCodes = data.hourly?.weather_code ?? [];

    // Build next 8 hours from current hour
    const hourly = [];
    for (let i = 0; i < 8; i++) {
      const h = currentHour + i + 1;
      if (h < 24 && h < hourlyTemps.length) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        hourly.push({
          time: `${displayH}${ampm}`,
          temp: Math.round(hourlyTemps[h]),
          condition: weatherCodeToCondition(hourlyCodes[h] ?? 0),
          icon: h > 6 && h < 18 ? 'sun' : 'moon',
        });
      }
    }

    return {
      current: {
        temp: Math.round(data.current?.temperature_2m ?? 50),
        condition: weatherCodeToCondition(data.current?.weather_code ?? 0),
        icon: 'sun',
        humidity: Math.round(data.current?.relative_humidity_2m ?? 50),
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 10),
      },
      hourly,
      high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 55),
      low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 35),
      location: 'Omaha, NE',
    };
  } catch {
    // Fallback if API is unreachable — use conservative spring temps for Omaha
    return {
      current: {
        temp: 48,
        condition: 'Partly Cloudy',
        icon: 'cloud-sun',
        humidity: 55,
        windSpeed: 12,
      },
      hourly: [],
      high: 54,
      low: 36,
      location: 'Omaha, NE',
    };
  }
};

const getQuoteForDate = (date: Date = new Date()): Quote => {
  const dayOfYear = getDayOfYear(date);
  return QUOTES[dayOfYear % QUOTES.length];
};

const getBibleVerseForDate = (date: Date = new Date()): BibleVerse => {
  const dayOfYear = getDayOfYear(date);
  return bibleVerses[dayOfYear % bibleVerses.length];
};

const getNationalDayForDate = (date: Date = new Date()): NationalDay => {
  const month = date.getMonth();
  const day = date.getDate();
  const key = `${month + 1}-${day}`;
  return NATIONAL_DAYS[key] ?? { name: 'National Productivity Day', description: 'A great day to get things done and make progress on your goals.' };
};

export const useDailyInfoStore = create<DailyInfoState>((set) => ({
  weather: null,
  quote: null,
  bibleVerse: null,
  nationalDay: null,
  loading: false,

  loadDailyInfo: async () => {
    set({ loading: true });
    const now = new Date();
    const weather = await fetchWeather();
    set({
      weather,
      quote: getQuoteForDate(now),
      bibleVerse: getBibleVerseForDate(now),
      nationalDay: getNationalDayForDate(now),
      loading: false,
    });
  },

  refreshWeather: async () => {
    const weather = await fetchWeather();
    set({ weather });
  },

  refreshQuote: () => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    set({ quote: QUOTES[randomIndex] });
  },
}));
