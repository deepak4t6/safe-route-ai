# Safe Route AI — Production Deployment Guide

Deploy Safe Route AI across modern cloud platforms using free and cost-effective tiers:
- **Frontend:** Vercel / Netlify
- **Backend API:** Render / Railway / Fly.io
- **AI Microservice:** Render / Railway / Google Cloud Run
- **Database:** Supabase / Neon (Serverless PostgreSQL with PostGIS)

---

## 1. Database Setup (Supabase / Neon)

### Option A: Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Copy the entire content of [`database/schema.sql`](file:///C:/Users/Deepak%20Gupta/.gemini/antigravity/scratch/safe-route-ai/database/schema.sql) and click **Run**.
5. Copy [`database/seed_data.sql`](file:///C:/Users/Deepak%20Gupta/.gemini/antigravity/scratch/safe-route-ai/database/seed_data.sql) and click **Run**.
6. Copy your Database Connection String (`postgres://...`) from **Project Settings -> Database**.

---

## 2. Backend Deployment (Render / Railway)

### On Render.com:
1. Create a new **Web Service** pointing to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Configure Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `postgres://user:password@host:5432/db`
   - `JWT_SECRET`: `your_random_64_char_secret_key`
   - `AI_ENGINE_URL`: `https://your-ai-engine.onrender.com`
6. Deploy!

---

## 3. Python AI Engine Deployment (Render / Cloud Run)

1. Create a new **Web Service** on Render.
2. Set **Root Directory** to `ai-engine`.
3. Set **Runtime:** `Python 3`
4. Set **Build Command:** `pip install -r requirements.txt`
5. Set **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Copy the assigned URL (e.g. `https://safe-route-ai-engine.onrender.com`) and paste it as `AI_ENGINE_URL` in the backend service.

---

## 4. Frontend Deployment (Vercel)

1. Import your repository into [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Set Environment Variables:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
7. Click **Deploy**.

---

## 5. Local Quick Run (Zero External Setup)

You can run the entire platform locally on your machine immediately:

```bash
# Terminal 1: Backend
cd backend
npm install
npm start
# -> Backend starts on http://localhost:5000 (auto-detects in-memory store)

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# -> Frontend launches on http://localhost:5173

# Optional Terminal 3: AI Microservice
cd ai-engine
pip install -r requirements.txt
python main.py
# -> AI Engine runs on http://localhost:8000
```
