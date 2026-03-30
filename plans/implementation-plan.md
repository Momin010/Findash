# Financial Dashboard - Implementation Plan

## Project Summary
Personalized financial dashboard powered by Vertex AI for internal use by founder and co-founder. Tracks multiple account types, provides AI-driven insights, and offers comprehensive financial management.

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript + Bun
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)
- **AI**: Google Cloud Vertex AI (Gemini 2.5 Pro/Flash)
- **Deployment**: Vercel + Custom Domain
- **UI**: Tailwind CSS + Shadcn/ui

## Implementation Steps

### Step 1: Project Setup
```bash
# Initialize monorepo structure
mkdir financial-dashboard && cd financial-dashboard
bun init

# Create client (Vite + React)
bun create vite client --template react-ts
cd client && bun install

# Install frontend dependencies
bun add @supabase/supabase-js @tanstack/react-query zustand react-router-dom
bun add react-hook-form @hookform/resolvers zod recharts lucide-react
bun add -D tailwindcss postcss autoprefixer @types/react-router-dom

# Create server (Node.js)
cd .. && mkdir server && cd server
bun init
bun add express cors dotenv @supabase/supabase-js @google-cloud/aiplatform
bun add -D typescript @types/express @types/cors tsx
```

### Step 2: Database Schema (Supabase)
Create these tables in Supabase dashboard or via migrations:

**Core Tables:**
- `users` - User profiles and preferences
- `accounts` - Financial accounts (bank, credit card, investment, crypto, PayPal, Stripe)
- `transactions` - All financial transactions
- `categories` - Transaction categories with colors/icons
- `budgets` - Budget limits per category
- `investments` - Investment holdings
- `invoices` - Generated invoices
- `invoice_items` - Line items for invoices
- `payments` - Payment records
- `chat_sessions` - AI chat sessions
- `messages` - Chat messages
- `uploaded_files` - User uploaded documents
- `tax_records` - Tax calculation records

**Key Features:**
- UUID primary keys
- User_id foreign keys for data isolation
- Multi-currency support (currency field)
- JSONB for flexible metadata
- Timestamps for audit trails

### Step 3: Authentication Setup
```typescript
// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Enable Row Level Security (RLS) on all tables
// Create policies: users can only access their own data
```

### Step 4: Backend API Structure
```
server/src/
├── index.ts              # Express server entry
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── accounts.ts       # Account CRUD
│   ├── transactions.ts   # Transaction CRUD + import
│   ├── budgets.ts        # Budget management
│   ├── investments.ts    # Investment tracking
│   ├── invoices.ts       # Invoice management
│   ├── chat.ts           # AI chat endpoints
│   ├── analytics.ts      # Financial analytics
│   └── files.ts          # File upload/management
├── middleware/
│   ├── auth.ts           # JWT verification
│   └── validation.ts     # Request validation
├── services/
│   ├── supabase.ts       # Supabase client
│   ├── vertex-ai.ts      # Vertex AI integration
│   ├── analytics.ts      # Financial calculations
│   └── tax.ts            # Tax calculations
└── types/
    └── index.ts          # TypeScript interfaces
```

### Step 5: Frontend Structure
```
client/src/
├── components/
│   ├── ui/               # Shadcn/ui components
│   ├── layout/           # Layout components
│   ├── onboarding/       # Onboarding flow
│   ├── dashboard/        # Main dashboard
│   ├── accounts/         # Account management
│   ├── transactions/     # Transaction list/forms
│   ├── budgets/          # Budget planning
│   ├── investments/      # Portfolio tracking
│   ├── invoices/         # Invoice management
│   ├── chat/             # AI chat interface
│   └── analytics/        # Charts and reports
├── hooks/                # Custom React hooks
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── stores/               # Zustand state stores
├── types/                # TypeScript types
└── pages/                # Route pages
```

### Step 6: Vertex AI Integration
```typescript
// server/src/services/vertex-ai.ts
import { PredictionServiceClient } from '@google-cloud/aiplatform'

const client = new PredictionServiceClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

export async function generateFinancialInsights(
  userContext: any,
  query: string
) {
  // Build context from user's financial data
  // Call Gemini model via Vertex AI
  // Return structured insights
}
```

### Step 7: Key Features Implementation

**Onboarding Flow:**
1. Welcome screen with company branding
2. User profile setup (name, company)
3. Currency selection
4. Initial account connection
5. AI introduction and capabilities

**Account Management:**
- Add/edit/delete accounts
- Account types: bank, credit card, investment, crypto, PayPal, Stripe
- Multi-currency support with conversion
- Real-time balance tracking

**Transaction Management:**
- Manual entry with category selection
- CSV/bank statement import
- AI-powered auto-categorization
- Search, filter, and sort
- Recurring transaction detection

**Budget Planning:**
- Set budgets per category
- Monthly/quarterly/annual periods
- Visual progress indicators
- Overspending alerts
- AI budget recommendations

**Investment Portfolio:**
- Track stocks, crypto, other assets
- Portfolio performance visualization
- Gain/loss calculations
- Asset allocation charts
- AI investment insights

**Invoice Management:**
- Create professional invoices
- Client database
- Payment tracking
- Overdue reminders
- Revenue forecasting

**Tax Reporting:**
- Income/expense summaries
- Tax category mapping
- Deduction tracking
- Tax liability estimation
- Export for tax software

**AI Chat Interface:**
- Context-aware conversations
- Financial health analysis
- Spending pattern insights
- Budget optimization tips
- Investment recommendations
- Document analysis (PDFs, Pitchdex)

### Step 8: Analytics Dashboard
- Financial health score
- Cash flow projections
- Spending patterns visualization
- Income trends
- Budget vs actual comparisons
- Investment performance
- Custom date range reports

### Step 9: File Upload System
- PDF document upload
- Pitchdex file support
- Text extraction from documents
- AI analysis of uploaded files
- Secure storage in Supabase Storage

### Step 10: Multi-Currency Support
- Store amounts in original currency
- Convert to base currency for reports
- Real-time exchange rates
- Currency preference settings

### Step 11: Deployment to Vercel
```bash
# Build configuration
# vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "client/dist",
  "installCommand": "bun install",
  "framework": "vite"
}

# Environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - GOOGLE_CLOUD_PROJECT
# - GOOGLE_CLOUD_LOCATION
# - GOOGLE_APPLICATION_CREDENTIALS (as JSON)
```

## Development Order

**Week 1-2: Foundation**
- Project setup and configuration
- Database schema creation
- Authentication system
- Basic UI components

**Week 3-4: Core Features**
- Account management
- Transaction tracking
- Basic budgeting
- File upload system

**Week 5-6: Advanced Features**
- Investment portfolio
- Invoice management
- Tax reporting
- Advanced analytics

**Week 7-8: AI Integration**
- Vertex AI setup
- Chat interface
- Context-aware responses
- File analysis

**Week 9-10: Polish & Deploy**
- UI/UX refinement
- Performance optimization
- Security audit
- Vercel deployment

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}

# API
API_PORT=3001
API_SECRET=your-secret-key

# App
VITE_APP_URL=https://yourdomain.com
```

## Security Checklist

- [ ] Enable RLS on all Supabase tables
- [ ] Create RLS policies for user data isolation
- [ ] Implement JWT verification on all API routes
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Implement rate limiting on API
- [ ] Secure file upload validation
- [ ] HTTPS only (Vercel provides this)
- [ ] Environment variables for secrets
- [ ] Audit logging for sensitive operations

## Next Actions

1. Review and approve this plan
2. Set up Supabase project
3. Configure Google Cloud Vertex AI
4. Initialize project structure
5. Begin implementation

---

**Ready to proceed with implementation when you approve this plan.**

## Project Summary
Personalized financial dashboard powered by Vertex AI for internal use by founder and co-founder. Tracks multiple account types, provides AI-driven insights, and offers comprehensive financial management.

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript + Bun
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)
- **AI**: Google Cloud Vertex AI (Gemini 2.5 Pro/Flash)
- **Deployment**: Vercel + Custom Domain
- **UI**: Tailwind CSS + Shadcn/ui

## Implementation Steps

### Step 1: Project Setup
```bash
# Initialize monorepo structure
mkdir financial-dashboard && cd financial-dashboard
bun init

# Create client (Vite + React)
bun create vite client --template react-ts
cd client && bun install

# Install frontend dependencies
bun add @supabase/supabase-js @tanstack/react-query zustand react-router-dom
bun add react-hook-form @hookform/resolvers zod recharts lucide-react
bun add -D tailwindcss postcss autoprefixer @types/react-router-dom

# Create server (Node.js)
cd .. && mkdir server && cd server
bun init
bun add express cors dotenv @supabase/supabase-js @google-cloud/aiplatform
bun add -D typescript @types/express @types/cors tsx
```

### Step 2: Database Schema (Supabase)
Create these tables in Supabase dashboard or via migrations:

**Core Tables:**
- `users` - User profiles and preferences
- `accounts` - Financial accounts (bank, credit card, investment, crypto, PayPal, Stripe)
- `transactions` - All financial transactions
- `categories` - Transaction categories with colors/icons
- `budgets` - Budget limits per category
- `investments` - Investment holdings
- `invoices` - Generated invoices
- `invoice_items` - Line items for invoices
- `payments` - Payment records
- `chat_sessions` - AI chat sessions
- `messages` - Chat messages
- `uploaded_files` - User uploaded documents
- `tax_records` - Tax calculation records

**Key Features:**
- UUID primary keys
- User_id foreign keys for data isolation
- Multi-currency support (currency field)
- JSONB for flexible metadata
- Timestamps for audit trails

### Step 3: Authentication Setup
```typescript
// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Enable Row Level Security (RLS) on all tables
// Create policies: users can only access their own data
```

### Step 4: Backend API Structure
```
server/src/
├── index.ts              # Express server entry
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── accounts.ts       # Account CRUD
│   ├── transactions.ts   # Transaction CRUD + import
│   ├── budgets.ts        # Budget management
│   ├── investments.ts    # Investment tracking
│   ├── invoices.ts       # Invoice management
│   ├── chat.ts           # AI chat endpoints
│   ├── analytics.ts      # Financial analytics
│   └── files.ts          # File upload/management
├── middleware/
│   ├── auth.ts           # JWT verification
│   └── validation.ts     # Request validation
├── services/
│   ├── supabase.ts       # Supabase client
│   ├── vertex-ai.ts      # Vertex AI integration
│   ├── analytics.ts      # Financial calculations
│   └── tax.ts            # Tax calculations
└── types/
    └── index.ts          # TypeScript interfaces
```

### Step 5: Frontend Structure
```
client/src/
├── components/
│   ├── ui/               # Shadcn/ui components
│   ├── layout/           # Layout components
│   ├── onboarding/       # Onboarding flow
│   ├── dashboard/        # Main dashboard
│   ├── accounts/         # Account management
│   ├── transactions/     # Transaction list/forms
│   ├── budgets/          # Budget planning
│   ├── investments/      # Portfolio tracking
│   ├── invoices/         # Invoice management
│   ├── chat/             # AI chat interface
│   └── analytics/        # Charts and reports
├── hooks/                # Custom React hooks
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── stores/               # Zustand state stores
├── types/                # TypeScript types
└── pages/                # Route pages
```

### Step 6: Vertex AI Integration
```typescript
// server/src/services/vertex-ai.ts
import { PredictionServiceClient } from '@google-cloud/aiplatform'

const client = new PredictionServiceClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

export async function generateFinancialInsights(
  userContext: any,
  query: string
) {
  // Build context from user's financial data
  // Call Gemini model via Vertex AI
  // Return structured insights
}
```

### Step 7: Key Features Implementation

**Onboarding Flow:**
1. Welcome screen with company branding
2. User profile setup (name, company)
3. Currency selection
4. Initial account connection
5. AI introduction and capabilities

**Account Management:**
- Add/edit/delete accounts
- Account types: bank, credit card, investment, crypto, PayPal, Stripe
- Multi-currency support with conversion
- Real-time balance tracking

**Transaction Management:**
- Manual entry with category selection
- CSV/bank statement import
- AI-powered auto-categorization
- Search, filter, and sort
- Recurring transaction detection

**Budget Planning:**
- Set budgets per category
- Monthly/quarterly/annual periods
- Visual progress indicators
- Overspending alerts
- AI budget recommendations

**Investment Portfolio:**
- Track stocks, crypto, other assets
- Portfolio performance visualization
- Gain/loss calculations
- Asset allocation charts
- AI investment insights

**Invoice Management:**
- Create professional invoices
- Client database
- Payment tracking
- Overdue reminders
- Revenue forecasting

**Tax Reporting:**
- Income/expense summaries
- Tax category mapping
- Deduction tracking
- Tax liability estimation
- Export for tax software

**AI Chat Interface:**
- Context-aware conversations
- Financial health analysis
- Spending pattern insights
- Budget optimization tips
- Investment recommendations
- Document analysis (PDFs, Pitchdex)

### Step 8: Analytics Dashboard
- Financial health score
- Cash flow projections
- Spending patterns visualization
- Income trends
- Budget vs actual comparisons
- Investment performance
- Custom date range reports

### Step 9: File Upload System
- PDF document upload
- Pitchdex file support
- Text extraction from documents
- AI analysis of uploaded files
- Secure storage in Supabase Storage

### Step 10: Multi-Currency Support
- Store amounts in original currency
- Convert to base currency for reports
- Real-time exchange rates
- Currency preference settings

### Step 11: Deployment to Vercel
```bash
# Build configuration
# vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "client/dist",
  "installCommand": "bun install",
  "framework": "vite"
}

# Environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - GOOGLE_CLOUD_PROJECT
# - GOOGLE_CLOUD_LOCATION
# - GOOGLE_APPLICATION_CREDENTIALS (as JSON)
```

## Development Order

**Week 1-2: Foundation**
- Project setup and configuration
- Database schema creation
- Authentication system
- Basic UI components

**Week 3-4: Core Features**
- Account management
- Transaction tracking
- Basic budgeting
- File upload system

**Week 5-6: Advanced Features**
- Investment portfolio
- Invoice management
- Tax reporting
- Advanced analytics

**Week 7-8: AI Integration**
- Vertex AI setup
- Chat interface
- Context-aware responses
- File analysis

**Week 9-10: Polish & Deploy**
- UI/UX refinement
- Performance optimization
- Security audit
- Vercel deployment

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}

# API
API_PORT=3001
API_SECRET=your-secret-key

# App
VITE_APP_URL=https://yourdomain.com
```

## Security Checklist

- [ ] Enable RLS on all Supabase tables
- [ ] Create RLS policies for user data isolation
- [ ] Implement JWT verification on all API routes
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Implement rate limiting on API
- [ ] Secure file upload validation
- [ ] HTTPS only (Vercel provides this)
- [ ] Environment variables for secrets
- [ ] Audit logging for sensitive operations

## Next Actions

1. Review and approve this plan
2. Set up Supabase project
3. Configure Google Cloud Vertex AI
4. Initialize project structure
5. Begin implementation

---

**Ready to proceed with implementation when you approve this plan.**

