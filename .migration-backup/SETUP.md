# Global Conflict Dashboard - Setup Guide

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Choose a name and password
4. Wait for project to be created (~2 minutes)

### 2. Get Your Credentials

1. **Log into your Supabase project** at https://supabase.com
2. **Look at the LEFT SIDEBAR** - you'll see a list of icons
3. **Find the GEAR ICON** (⚙️) at the BOTTOM of the sidebar
4. **Click the gear icon** - this opens "Project Settings"
5. **In the settings page**, look at the LEFT MENU (inside settings)
6. **Click "API"** (it's near the top of the settings menu)
7. **You'll see a page with your credentials:**

```
Project URL: https://your-project-id.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Copy these three values** - you'll need them in the next step.

**Visual guide:**
```
Supabase Dashboard
├── Table Editor
├── SQL Editor
├── Authentication
├── Storage
├── Edge Functions
├── Settings (gear icon ⚙️) ← CLICK THIS
│   ├── API ← CLICK THIS
│   ├── Database
│   ├── Auth
│   ├── Storage
│   └── ...
└── ...
```

### 3. Set Up Database Schema

1. In Supabase, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

This creates all the tables, enums, indexes, and security policies.

### 4. (Optional) Load Sample Data

**Skip this if you want to add your own data or build an ingestion pipeline first.**

To load sample data for testing:
1. In SQL Editor, click **"New query"**
2. Copy the entire contents of `scripts/seed-data.sql`
3. Paste into the SQL editor
4. Click **"Run"**
5. You should see "Success. No rows returned"

This adds:
- 10 sample conflicts (Ukraine, Gaza, Sudan, etc.)
- 10 parties (military forces, rebel groups)
- 5 news sources
- 5 sample news items
- 5 analysis links

### 5. Configure Environment Variables

**WHERE TO CREATE THE FILE:**

The file goes in: `/Users/attilioporchia/Documents/conflicts-dashboard/.env.local`

**HOW TO CREATE IT:**

**Option A: Using VS Code (Easiest)**
1. In VS Code, right-click in the Explorer panel
2. Select "New File"
3. Name it: `.env.local` (with the dot at the start)
4. Paste the content below

**Option B: Using Terminal**
```bash
cd /Users/attilioporchia/Documents/conflicts-dashboard
touch .env.local
open -a TextEdit .env.local
```

**Option C: Using Finder**
1. Open Finder
2. Go to: Documents → conflicts-dashboard
3. Press `Cmd + Shift + .` (this shows hidden files)
4. Right-click → New File
5. Name it: `.env.local`

**EXACT CONTENT TO WRITE:**

```env
# Supabase Configuration
# Get these from: Supabase Dashboard → Settings (gear icon) → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**WHAT TO REPLACE:**

1. `https://your-project-id.supabase.co` → Your actual Project URL from Supabase
2. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (first one) → Your anon/public key
3. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (second one) → Your service_role key

**EXAMPLE OF WHAT IT SHOULD LOOK LIKE:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFic2RlZmdoaWprbG1ub3AiLCJpYXQiOjE3MTk4OTk4MDAsImV4cCI6MjAzNDQ3NTgwMH0.abc123xyz
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFic2RlZmdoaWprbG1ub3AiLCJpYXQiOjE3MTk4OTk4MDAsImV4cCI6MjAzNDQ3NTgwMH0.xyz789abc

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**IMPORTANT NOTES:**
- The file must be named exactly `.env.local` (with the dot at the start)
- It must be in the project root folder (same level as `package.json`)
- Don't add quotes around the values
### Option 2: Via API (For Development)
Use the API endpoints to add data programmatically:
```bash
# Example: Add a conflict via curl
curl -X POST http://localhost:3000/api/conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Conflict",
    "slug": "my-conflict",
    "type": "civil_war",
    "status": "ongoing",
    "intensity": "medium",
    "start_date": "2024-01-01",
    "latitude": 48.3794,
    "longitude": 31.1656,
    "region": "europe",
    "countries_involved": ["Country1", "Country2"]
  }'
```

### Option 3: Build Ingestion Pipeline (Phase 4)
Follow the architecture in `ARCHITECTURE.md` Section 6 to build automated news ingestion from RSS feeds, GDELT, etc.

## Project Structure

```
conflicts-dashboard/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── conflicts/        # Conflict CRUD endpoints
│   │   └── news/             # News endpoints
│   ├── conflicts/            # Conflict pages (to be built)
│   ├── news/                 # News pages (to be built)
│   ├── about/                # About page (to be built)
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage (✅ DONE)
├── components/               # React components
│   ├── layout/               # Header, Footer (✅ DONE)
│   ├── map/                  # Leaflet map (✅ DONE)
│   ├── conflicts/            # Conflict components (to be built)
│   ├── news/                 # News components (to be built)
│   └── dashboard/            # Dashboard widgets (✅ DONE)
├── lib/                      # Utilities
│   ├── supabase/             # Supabase client & types (✅ DONE)
│   ├── types/                # TypeScript definitions (✅ DONE)
│   └── utils/                # Helper functions (✅ DONE)
├── supabase/
│   └── migrations/           # Database migrations (✅ DONE)
├── scripts/
│   ├── seed-data.sql         # Sample data (optional)
│   └── ingest-news.js        # News ingestion placeholder
├── public/                   # Static assets
├── ARCHITECTURE.md           # Complete architecture doc
├── README.md                 # Project overview
└── SETUP.md                  # This file
```

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env.local` exists in the project root
- Verify the variable names match exactly (no typos)
- Restart the dev server after creating `.env.local`

### "Failed to fetch conflicts"
- Verify Supabase credentials are correct
- Check that you ran the migration SQL
- Ensure your Supabase project is active (not paused)
- Check browser console for detailed errors

### Map not showing markers
- Conflicts need latitude and longitude values
- Check that conflicts have coordinates in the database
- Open browser console to see if there are JavaScript errors

### TypeScript path errors
- The `tsconfig.json` has been configured with `"@/*": ["./*"]`
- Restart VS Code's TypeScript server if needed
- Run `npm run build` to check for errors

## Next Steps

See **SETUP.md** for the complete implementation roadmap.

## Support

- **Architecture**: See `ARCHITECTURE.md`
- **Setup**: See `SETUP.md` (this file)
- **Issues**: Check browser console and Supabase logs