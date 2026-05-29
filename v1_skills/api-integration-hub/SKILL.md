---
name: Hackathon API Integration Hub
description: Quick integration guides for 50+ popular APIs and services
version: 1.0.0
tags: [hackathon, api, integration, libraries]
---

# Hackathon API Integration Hub

## Popular APIs (Free Tier Available)

### AI/ML APIs
- **OpenAI GPT**: Chat, embeddings, completions
- **Google Gemini**: Vision, text, embeddings
- **Hugging Face**: NLP models
- **Replicate**: Image generation, models
- **Together AI**: Open source LLMs

### Data APIs
- **Weather**: OpenWeatherMap, WeatherAPI
- **Finance**: Alpha Vantage, CoinGecko
- **News**: NewsAPI, Guardian API
- **Sports**: ESPN API, TheSportsDB

### Auth & Identity
- **Firebase**: Auth, database, hosting
- **Auth0**: Enterprise auth
- **Supabase**: PostgreSQL + auth

### Cloud & Deployment
- **Vercel**: Frontend hosting
- **Render**: Backend hosting
- **Railway**: Full-stack hosting

## Quick Integration Template

Ask: "Give me integration code for OpenAI + React"

Returns:
```javascript
// 1. Setup
npm install openai

// 2. Component
import { useState } from 'react';
import OpenAI from 'openai';

export function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
  });

  const handleSend = async () => {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [...messages, { role: 'user', content: input }]
    });
    setMessages([...messages, response.choices[0].message]);
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}

// 3. Environment
VITE_OPENAI_API_KEY=sk-...