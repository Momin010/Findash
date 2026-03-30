# Financial Dashboard

A personalized financial dashboard powered by Vertex AI for internal use by founder and co-founder.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Bun
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)
- **AI**: Google Cloud Vertex AI (Gemini 2.5 Pro/Flash)
- **UI**: Tailwind CSS
- **State**: Zustand + TanStack Query

## Features

- **Multi-Account Management**: Track bank accounts, credit cards, investments, crypto, PayPal, Stripe
- **Transaction Tracking**: Manual entry, CSV import, AI-powered auto-categorization
- **Budget Planning**: Set budgets per category with visual progress and alerts
- **Investment Portfolio**: Track stocks, crypto, and other assets with performance metrics
- **AI Chat Interface**: Context-aware financial insights using Vertex AI
- **Invoice Management**: Create and track professional invoices
- **Tax Reporting**: Income/expense summaries and deduction tracking
- **File Processing**: Upload and analyze PDFs, CSVs, bank statements
- **Multi-Currency Support**: Real-time exchange rates
- **Analytics Dashboard**: Visual charts and financial health scores

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- [Supabase](https://supabase.com) account
- [Google Cloud](https://cloud.google.com) account (for Vertex AI)

### 1. Clone and Install

```bash
cd financial-dashboard
bun install
```

### 2. Set Up Environment Variables

**Client (.env):**
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

**Server (.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
CLIENT_URL=http://localhost:5173
```

### 3. Set Up Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor
3. Copy the contents of `server/database/schema.sql`
4. Run the SQL to create all tables, indexes, and RLS policies

### 4. Start Development

```bash
# From the root directory
bun run dev
```

This starts both the client (port 5173) and server (port 3001).

## Project Structure

```
financial-dashboard/
├── client/                 # Vite + React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API client
│   │   ├── stores/         # Zustand state management
│   │   └── App.tsx         # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth and validation
│   │   ├── lib/            # Supabase client
│   │   └── index.ts        # Server entry
│   └── database/
│       └── schema.sql      # Database schema
├── shared/                 # Shared TypeScript types
│   └── types.ts
└── plans/                  # Project specifications
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics
- `GET /api/analytics/summary` - Financial summary
- `GET /api/analytics/spending-by-category` - Category breakdown
- `GET /api/analytics/monthly` - Monthly trends
- `GET /api/analytics/account-balances` - Account balances

## Development

### Client Only
```bash
cd client
bun run dev
```

### Server Only
```bash
cd server
bun run dev
```

### Build for Production
```bash
cd client
bun run build
```

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Railway/Render (Backend)
1. Connect your GitHub repo
2. Set environment variables
3. Deploy

## Environment Variables Reference

### Client
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | Backend API URL |

### Server
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | GCP region (e.g., us-central1) |
| `CLIENT_URL` | Frontend URL for CORS |

## Contributing

This is an internal project for founder and co-founder use.

## License

Private - All rights reserved.
