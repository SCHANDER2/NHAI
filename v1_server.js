import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

app.use(cors());
app.use(express.json());

// Get weather by city
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      },
    });

    const data = response.data;
    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      pressure: data.main.pressure,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    });
  } catch (error) {
    res.status(404).json({ error: 'City not found' });
  }
});

// Get forecast
app.get('/api/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const weatherRes = await axios.get(`${BASE_URL}/weather`, {
      params: { q: city, appid: API_KEY, units: 'metric' },
    });

    const forecastRes = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat: weatherRes.data.coord.lat,
        lon: weatherRes.data.coord.lon,
        appid: API_KEY,
        units: 'metric',
      },
    });

    const dailyForecasts = {};
    forecastRes.data.list.forEach((item) => {
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

    res.json(Object.values(dailyForecasts).slice(0, 5));
  } catch (error) {
    res.status(404).json({ error: 'Forecast not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});