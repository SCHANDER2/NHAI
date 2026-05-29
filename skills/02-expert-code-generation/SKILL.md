---
name: Expert Code Generation & Architecture
description: "Production-grade code generation with architectural excellence, design patterns, scalability, and optimization. 100/100 level."
version: 2.0.0
tier: Expert
tags: [code-generation, architecture, design-patterns, optimization, scalability]
---

# Expert Code Generation & Architecture - The Architect

This skill provides immediate, production-grade boilerplate, architectural advice, and implementation code optimized for speed, reliability, and visual excellence under intense hackathon time constraints.

---

## 🏗️ PART 1: THE HACKATHON ARCHITECTURE MATRIX

### 1. Choosing the Right Architecture

| Hackathon Duration | Optimal Architecture | Rationale |
| :--- | :--- | :--- |
| **24 Hours** | Monolith with Unified Deployment (e.g., Next.js) | Minimize deployment friction and API contract setup. |
| **48 Hours** | Split Client-Server (React + Express or Supabase) | Allows parallel development between frontend and backend devs with zero blocking. |
| **72 Hours+** | Modular Monolith / Microservices | Best for projects with highly specialized background workers or distinct database architectures. |

### 2. The 24-Hour "No-Lag" Tech Stack (Battle-Tested)

```
Frontend:
├─ React 18 / Next.js 14 (Vite for rapid client-side hot-reloads)
├─ Tailwind CSS (Eliminates CSS design overhead)
├─ Zustand (Ultra-lightweight state management, zero boilerplate)
├─ React Query / SWR (Seamless data fetching, caching, and loading state sync)
└─ Vercel / Netlify (0-config serverless deployment)

Backend:
├─ Node.js + Express (Fast, robust, easy middleware integration)
├─ PostgreSQL or SQLite (Reliable relational data models)
├─ Prisma (Type-safe ORM for ultra-fast queries and migrations)
└─ Railway / Render / Supabase (Instance setup in under 5 minutes)
```

---

## 💻 PART 2: PRODUCTION-GRADE CODE MODULES

### 1. Resilient Database Schema Design (Prisma)
Ensure relational databases are secure, fast, and fully indexed:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  avatar        String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  chats         Chat[]
  notifications Notification[]

  @@map("users")
}

model Chat {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@map("chats")
}

model Message {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String   // "user", "system", "assistant"
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([chatId])
  @@map("messages")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // "info", "alert", "success"
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("notifications")
}
```

### 2. Self-Healing Frontend Error Boundary (React)
Never allow a minor UI render failure or null pointer exception to crash your live demo before the judges:

```typescript
// components/shared/ErrorBoundary.tsx
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled crash:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 backdrop-blur-md border border-red-200 rounded-xl shadow-lg max-w-md mx-auto my-12 text-center">
          <div className="w-12 h-12 flex items-center justify-center bg-red-100 text-red-600 rounded-full mb-4 text-2xl animate-pulse">
            ⚠️
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">System Restoring Connection</h3>
          <p className="text-sm text-red-600 mb-6">
            An unexpected error occurred. Our self-healing layer is preserving the active state.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-md"
            >
              Recover UI State
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Force Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Bulletproof API Client Wrapper (With Backoff and Retries)
Eliminate network latency crashes, token expiration issues, and rate-limiting errors:

```javascript
// lib/apiClient.js
import axios from 'axios';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  const method = options.method || 'GET';
  
  try {
    const response = await axios({
      url,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    
    // Retry on Network Errors, Timeout (no response), Rate Limits (429), or Server Issues (5xx)
    if (retries > 0 && (!error.response || status === 429 || status >= 500)) {
      console.warn(`[API WARNING] ${method} request failed with status: ${status || 'Network Error'}. Retrying in ${backoff}ms... (${retries} left)`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    // Throw client-side errors immediately (400, 401, 403, 404)
    throw error;
  }
}
```

---

## ⚡ PART 3: HARDENING & PERFORMANCE OPTIMIZATION

### 1. The Hackathon Polish Protocol
Before submitting or demonstrating your project, execute these performance quick-wins:
1.  **Purge Unused CSS**: Ensure Tailwind imports are restricted to the source files (`content` field in `tailwind.config.js`).
2.  **State Memoization**: Wrap computationally heavy components in `React.memo` and expensive computations in `useMemo` to prevent render lag.
3.  **Connection Pooling**: Ensure PostgreSQL does not exceed max connections during simultaneous judge reviews by routing through a connection pooler (e.g., PgBouncer / Prisma Accelerate).
4.  **CDN Asset Caching**: Serve all heavy images and media assets via a global CDN or Cloudinary rather than local static files.
