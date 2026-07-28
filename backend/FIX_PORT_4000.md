# Fix Port 4000 Already in Use (EADDRINUSE)

## 🔴 Error
```
Error: listen EADDRINUSE: address already in use :::4000
```

## ✅ Solution 1: Kill the Process Immediately (Terminal)

```powershell
# Step 1: Find the process using port 4000
netstat -ano | findstr :4000

# Step 2: Kill it (replace 12345 with actual PID from above)
taskkill /PID 12345 /F

# --- OR do it in one command: ---
for /f "tokens=5" %a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /PID %a /F

# --- OR use the npm script: ---
npm run kill-port
# (kills whatever is on port 4000)

# --- OR kill a specific port: ---
npm run kill-port 5000
```

## ✅ Solution 2: Change the Port Permanently

### Option A: Create/Edit `.env` file (Recommended)
Create `C:\Project\kapoy\CPCLMS_v3\backend\.env` with:
```
PORT=4001
```
Then restart the server.

### Option B: Edit the default fallback in code
In `src/config/env.ts`, change:
```ts
PORT: z.coerce.number().default(4000),
```
to:
```ts
PORT: z.coerce.number().default(4001),
```

## ✅ Solution 3: Prevent It From Happening Again

### Auto-kill on `npm run dev`
The `predev` script in `package.json` now automatically kills any process on the configured port before starting the dev server. Just run:
```powershell
npm run dev
```
It will kill the old process and start fresh.

### Automatic Port Fallback (Graceful Retry)
In `src/app.ts`, the server now has built-in retry logic:
- If port 4000 is busy → tries 4001
- If port 4001 is busy → tries 4002
- If port 4002 is busy → tries 4003
- If all fail → exits with error

### Kill Port Script
```powershell
npm run kill-port        # kills port 4000
npm run kill-port 3000   # kills port 3000
npm run kill-port 5000   # kills port 5000
```

## 📋 Quick Start After Fix

```powershell
cd C:\Project\kapoy\CPCLMS_v3\backend
npm run dev
```

