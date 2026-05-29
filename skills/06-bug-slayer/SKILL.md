---
name: Rapid Bug Detection & System Resilience
description: "Five levels of advanced debugging, common hackathon bugs with instant fixes, and pre-demo system resilience. 100/100 level."
version: 2.0.0
tier: Master
tags: [hackathon, debugging, troubleshooting, resilience, error-handling]
---

# Rapid Bug Detection & System Resilience - The Bug Slayer

This skill provides a high-speed, systematic framework for diagnosing, isolating, and resolving coding exceptions, database lockups, and integration failures under high-pressure conditions.

---

## 🔍 PART 1: THE 5-LEVEL DEBUGGING METHODOLOGY

When an error occurs, do not throw random changes at the code. Follow these diagnostic steps:

```
LEVEL 1: System Isolation (0 - 60 seconds)
├─ Is it a Client (Frontend) or Server (Backend) issue?
├─ Check the Network Tab: What is the status code? (500 = Backend Crash, 404 = Wrong Endpoint, 401/403 = Auth Failure)
└─ Result: Isolate the source instantly.

LEVEL 2: State Logging (60 - 180 seconds)
├─ Log the raw parameters entering and leaving the broken function.
├─ In Frontend: inspect the state management engine (Zustand, React State).
└─ Result: Identify where data formats mismatch.

LEVEL 3: Query & Schema Check (3 - 5 minutes)
├─ Run the database query directly on your database manager (Prisma Studio, pgAdmin).
├─ Check for missing parameters, type mismatches, or constraint violations.
└─ Result: Isolate DB issues.

LEVEL 4: Downgrade / Sandbox (5 - 10 minutes)
├─ Isolate the broken component into a sandbox environment or dummy file.
├─ Strip down non-essential styles and secondary hooks until the core logic functions.
└─ Result: Expose complex hook interactions.

LEVEL 5: Scope Reduction Protocol (10 minutes+)
├─ If the bug is still unresolved: Do not waste another hour.
├─ Cut the dynamic feature out and mock the UI with realistic animated static data.
└─ Result: Preserve the MVP and protect the live demo.
```

---

## 🩹 PART 2: COMMON HACKATHON BUGS & INSTANT FIXES

### 1. The Dreaded CORS Policy Exception
*   **Symptom**: Frontend console throws: *"Access to XMLHttpRequest at... blocked by CORS policy..."*
*   **Instant Fix (Express)**: Install CORS middleware and configure it globally:
    ```javascript
    import cors from 'cors';
    app.use(cors({ origin: '*' })); // Allow all sources during development/hackathons
    ```

### 2. React Infinite Re-Render Loop
*   **Symptom**: Browser freezes, console shows: *"Too many re-renders. React limits the number of renders..."*
*   **Instant Fix**: Check your `useEffect` dependencies. Ensure you are not updating a state variable that is also listed as a dependency:
    ```typescript
    // BAD
    useEffect(() => {
      setData(fetchNewData());
    }, [data]);

    // GOOD
    useEffect(() => {
      fetchNewData().then(res => setData(res));
    }, []); // Empty dependency array runs only on mount
    ```

### 3. Database Connection Exceeded
*   **Symptom**: Backend logs: *"Too many connections"* or *"Connection timeout..."*
*   **Instant Fix**: Stop creating a new database connection client on every API request. Use a single global instance:
    ```typescript
    // lib/db.ts
    import { PrismaClient } from '@prisma/client';

    const globalForPrisma = global as unknown as { prisma: PrismaClient };

    export const prisma =
      globalForPrisma.prisma ||
      new PrismaClient({
        log: ['error'],
      });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
    ```

---

## 🛡️ PART 3: PRE-DEMO SYSTEM RESILIENCE CHECKLIST

Execute this checklist exactly **2 hours before** presentation:

- [ ] **Staging Sync**: Deploy the latest master branch to staging (Vercel, Render, Railway). Verify that env variables match production exactly.
- [ ] **Offline Mode Check**: Verify that your API wrappers are configured with their local mock fallback data.
- [ ] **Wi-Fi Redundancy**: Set up a mobile hotspot. Ensure your presentation laptop is pre-connected in case the local venue Wi-Fi crashes.
- [ ] **Clean Seed**: Clear all temporary or mock user names from the database and seed it with clean, realistic showcase data.
- [ ] **Backup Video Capture**: Screen record a complete end-to-end walkthrough of the working application. Keep the video file loaded and paused in the background.
