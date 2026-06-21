# Global Conflict Dashboard

A modern, data-driven web application providing visual insights into active armed conflicts worldwide.

## Features

- Interactive world map showing conflict locations
- Real-time news aggregation from multiple sources
- Conflict filtering by type, status, intensity, and region
- Detailed conflict views with parties and analysis
- Dark mode professional interface
- Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Map**: Leaflet + OpenStreetMap
- **State Management**: Zustand, TanStack Query
- **Hosting**: Vercel (free tier)

## Getting Started

### Prerequisites

- Node.js 20+ (required by Next.js 16)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd conflicts-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

4. Set up Supabase database:

Create a new Supabase project and run the SQL migrations from `supabase/migrations/` in the Supabase SQL Editor.

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
conflicts-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── conflicts/          # Conflict list and detail pages
│   │   ├── news/               # News pages
│   │   ├── about/              # About/methodology page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Header, footer
│   │   ├── map/                # Map components
│   │   ├── conflicts/          # Conflict components
│   │   ├── news/               # News components
│   │   └── dashboard/          # Dashboard widgets
│   ├── lib/                    # Utilities and configurations
│   │   ├── api/                # API clients
│   │   ├── supabase/           # Supabase client and types
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   └── stores/             # Zustand stores
│   └── supabase/               # Supabase configuration
│       ├── migrations/         # Database migrations
│       └── functions/          # Edge functions
├── public/                     # Static assets
├── tests/                      # Test files
└── package.json
```

## Database Schema

The application uses the following main tables:
- `conflicts`: Core conflict data
- `parties`: Actors involved in conflicts
- `news_items`: Aggregated news articles
- `analysis_links`: Research and analysis links
- `tags`: Conflict categorization
- `news_sources`: RSS feed and API configurations
- `ingestion_log`: Data ingestion tracking

See `ARCHITECTURE.md` for complete schema details.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

1. Place components in appropriate `components/` subdirectory
2. Use `'use client'` directive for client components
3. Follow the existing component patterns
4. Use the `cn()` utility for conditional class names

### Database Changes

1. Create new migration files in `supabase/migrations/`
2. Follow naming convention: `001_description.sql`, `002_description.sql`, etc.
3. Test migrations in Supabase SQL Editor before committing

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Environment Variables

See `.env.example` for all available environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Roadmap

- [x] Phase 1: Foundation and project setup
- [ ] Phase 2: Core data layer and conflict management
- [ ] Phase 3: Interactive map integration
- [ ] Phase 4: News aggregation and display
- [ ] Phase 5: Dashboard and statistics
- [ ] Phase 6: Analysis and enrichment
- [ ] Phase 7: Polish and optimization
- [ ] Phase 8: AI features (future)

## Support

For questions or issues, please open an issue on GitHub.

---

Built with Next.js, Supabase, and Leaflet.