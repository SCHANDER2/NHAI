import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherDashboard.css';

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  icon: string;
  description: string;
  sunrise: number;
  sunset: number;
}

interface ForecastData {
  date: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
}

export const WeatherDashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [city, setCity] = useState('London');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // Fetch current weather
  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          q: cityName,
          appid: API_KEY,
          units: 'metric', // Use Celsius
        },
      });

      const data = response.data;
      setWeather({
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        pressure: data.main.pressure,
        icon: data.weather[0].icon,
        description: data.weather[0].description,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
      });

      // Fetch 5-day forecast
      fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
      setError('City not found. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 5-day forecast
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
        },
      });

      // Process forecast data (one entry per day at 12:00 PM)
      const dailyForecasts: { [key: string]: ForecastData } = {};

      response.data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: item.weather[0].icon,
            humidity: item.main.humidity,
          };
        }
      });

      setForecast(Object.values(dailyForecasts).slice(0, 5));
    } catch (err) {
      console.error('Forecast fetch error:', err);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city);
    }
  };

  useEffect(() => {
    fetchWeather('London'); // Default city
  }, []);

  if (!weather) {
    return <div className="loading">Loading weather data...</div>;
  }

  const weatherIconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  return (
    <div className="weather-dashboard">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>🌤️ Weather Dashboard</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search city..."
              className="search-input"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Current Weather Card */}
        <div className="current-weather-card">
          <div className="weather-header">
            <div>
              <h2>
                {weather.city}, {weather.country}
              </h2>
              <p className="description">{weather.description.toUpperCase()}</p>
            </div>
            <img src={weatherIconUrl} alt={weather.condition} className="weather-icon" />
          </div>

          <div className="temperature-section">
            <div className="temp-display">
              <span className="temp">{weather.temperature}°C</span>
              <span className="feels-like">Feels like {weather.feelsLike}°C</span>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="details-grid">
            <div className="detail-box">
              <span className="label">💧 Humidity</span>
              <span className="value">{weather.humidity}%</span>
            </div>
            <div className="detail-box">
              <span className="label">💨 Wind Speed</span>
              <span className="value">{weather.windSpeed} km/h</span>
            </div>
            <div className="detail-box">
              <span className="label">🔽 Pressure</span>
              <span className="value">{weather.pressure} hPa</span>
            </div>
            <div className="detail-box">
              <span className="label">🌅 Sunrise</span>
              <span className="value">
                {new Date(weather.sunrise * 1000).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="detail-box">
              <span className="label">🌇 Sunset</span>
              <span className="value">
                {new Date(weather.sunset * 1000).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div className="forecast-section">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              {forecast.map((day, index) => (
                <div key={index} className="forecast-card">
                  <p className="date">{day.date}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                    alt={day.condition}
                    className="forecast-icon"
                  />
                  <p className="forecast-temp">{day.temp}°C</p>
                  <p className="forecast-condition">{day.condition}</p>
                  <p className="forecast-humidity">💧 {day.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDashboard;