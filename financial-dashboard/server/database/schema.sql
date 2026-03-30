-- ============================================================
-- Enable UUID extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper: auto-update updated_at on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL UNIQUE,
    name            TEXT,
    company_name    TEXT,
    base_currency   TEXT DEFAULT 'USD',
    timezone        TEXT DEFAULT 'UTC',
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('bank','credit_card','investment','crypto','paypal','stripe','cash','mobilepay','other')),
    currency        TEXT NOT NULL DEFAULT 'USD',
    balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
    color       TEXT DEFAULT '#3B82F6',
    icon        TEXT DEFAULT 'tag',
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_system   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique only among system categories (user_id IS NULL); per-user rows are unrestricted
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_name_type
    ON categories(name, type)
    WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    exchange_rate       DECIMAL(10,6) DEFAULT 1,
    transaction_date    DATE NOT NULL,
    transaction_type    TEXT NOT NULL CHECK (transaction_type IN ('income','expense','transfer')),
    status              TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
    is_recurring        BOOLEAN DEFAULT FALSE,
    recurring_pattern   TEXT,
    tags                TEXT[],
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id      UUID REFERENCES categories(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    period           TEXT NOT NULL CHECK (period IN ('weekly','monthly','quarterly','yearly')),
    start_date       DATE NOT NULL,
    end_date         DATE,
    alert_threshold  DECIMAL(5,2) DEFAULT 0.8,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id      UUID REFERENCES accounts(id) ON DELETE SET NULL,
    symbol          TEXT NOT NULL,
    name            TEXT NOT NULL,
    asset_type      TEXT NOT NULL CHECK (asset_type IN ('stock','bond','etf','mutual_fund','crypto','commodity','other')),
    quantity        DECIMAL(15,8) NOT NULL DEFAULT 0,
    avg_cost_basis  DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_price   DECIMAL(15,2),
    currency        TEXT NOT NULL DEFAULT 'USD',
    purchase_date   DATE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number  TEXT NOT NULL UNIQUE,
    client_name     TEXT NOT NULL,
    client_email    TEXT,
    client_address  TEXT,
    issue_date      DATE NOT NULL,
    due_date        DATE NOT NULL,
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate        DECIMAL(5,2) DEFAULT 0,
    tax_amount      DECIMAL(15,2) DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'USD',
    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(15,2) NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount          DECIMAL(15,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'USD',
    payment_date    DATE NOT NULL,
    payment_method  TEXT,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    context     JSONB DEFAULT '{}',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content     TEXT NOT NULL,
    tokens_used INTEGER,
    model       TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    original_name   TEXT NOT NULL,
    file_type       TEXT NOT NULL,
    file_size       INTEGER NOT NULL,
    storage_path    TEXT NOT NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
    extracted_text  TEXT,
    analysis        JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_records (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_year     INTEGER NOT NULL,
    category     TEXT NOT NULL,
    description  TEXT,
    amount       DECIMAL(15,2) NOT NULL,
    currency     TEXT NOT NULL DEFAULT 'USD',
    is_deductible BOOLEAN DEFAULT FALSE,
    metadata     JSONB DEFAULT '{}',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace configuration for 2-person shared access
CREATE TABLE IF NOT EXISTS workspace_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    allowed_emails  TEXT[] NOT NULL DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default workspace config (will be updated with actual emails)
INSERT INTO workspace_config (allowed_emails) 
SELECT ARRAY['momin.aldahdooh@mowisai.com', 'wasay@mowisai.com']
WHERE NOT EXISTS (SELECT 1 FROM workspace_config);

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('dashboard_invitation','transaction_alert','budget_alert','system')),
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    data        JSONB DEFAULT '{}',
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id        ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date        ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id         ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id     ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id        ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id   ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id     ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id  ON uploaded_files(user_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_accounts_updated_at') THEN
    CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated_at') THEN
    CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_transactions_updated_at') THEN
    CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_budgets_updated_at') THEN
    CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_investments_updated_at') THEN
    CREATE TRIGGER trg_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoices_updated_at') THEN
    CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chat_sessions_updated_at') THEN
    CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_uploaded_files_updated_at') THEN
    CREATE TRIGGER trg_uploaded_files_updated_at BEFORE UPDATE ON uploaded_files FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tax_records_updated_at') THEN
    CREATE TRIGGER trg_tax_records_updated_at BEFORE UPDATE ON tax_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shared_dashboards_updated_at') THEN
    CREATE TRIGGER trg_shared_dashboards_updated_at BEFORE UPDATE ON shared_dashboards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dashboard_collaborators_updated_at') THEN
    CREATE TRIGGER trg_dashboard_collaborators_updated_at BEFORE UPDATE ON dashboard_collaborators FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_dashboards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies (each in its own DO block, created only once)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_self' AND tablename = 'users') THEN
    CREATE POLICY users_self ON users
      FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounts_owner' AND tablename = 'accounts') THEN
    CREATE POLICY accounts_owner ON accounts
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_owner' AND tablename = 'categories') THEN
    -- Users see their own categories + all system categories
    CREATE POLICY categories_owner ON categories
      FOR ALL USING (auth.uid() = user_id OR is_system = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transactions_owner' AND tablename = 'transactions') THEN
    CREATE POLICY transactions_owner ON transactions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'budgets_owner' AND tablename = 'budgets') THEN
    CREATE POLICY budgets_owner ON budgets
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'investments_owner' AND tablename = 'investments') THEN
    CREATE POLICY investments_owner ON investments
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invoices_owner' AND tablename = 'invoices') THEN
    CREATE POLICY invoices_owner ON invoices
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invoice_items_owner' AND tablename = 'invoice_items') THEN
    CREATE POLICY invoice_items_owner ON invoice_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM invoices
          WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_owner' AND tablename = 'payments') THEN
    CREATE POLICY payments_owner ON payments
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chat_sessions_owner' AND tablename = 'chat_sessions') THEN
    CREATE POLICY chat_sessions_owner ON chat_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'messages_owner' AND tablename = 'messages') THEN
    CREATE POLICY messages_owner ON messages
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM chat_sessions
          WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uploaded_files_owner' AND tablename = 'uploaded_files') THEN
    CREATE POLICY uploaded_files_owner ON uploaded_files
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tax_records_owner' AND tablename = 'tax_records') THEN
    CREATE POLICY tax_records_owner ON tax_records
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shared_dashboards_access' AND tablename = 'shared_dashboards') THEN
    CREATE POLICY shared_dashboards_access ON shared_dashboards
      FOR ALL USING (
        auth.uid() = owner_id OR
        EXISTS (
          SELECT 1 FROM dashboard_collaborators
          WHERE dashboard_collaborators.dashboard_id = shared_dashboards.id
            AND dashboard_collaborators.user_id = auth.uid()
            AND dashboard_collaborators.is_active = TRUE
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dashboard_collaborators_access' AND tablename = 'dashboard_collaborators') THEN
    CREATE POLICY dashboard_collaborators_access ON dashboard_collaborators
      FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM shared_dashboards
          WHERE shared_dashboards.id = dashboard_collaborators.dashboard_id
            AND shared_dashboards.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_owner' AND tablename = 'notifications') THEN
    CREATE POLICY notifications_owner ON notifications
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- Helper function: dashboard access check
-- ============================================================
CREATE OR REPLACE FUNCTION check_dashboard_access(_dashboard_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM shared_dashboards
    WHERE id = _dashboard_id AND owner_id = _user_id
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM dashboard_collaborators
    WHERE dashboard_id = _dashboard_id
      AND user_id = _user_id
      AND is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Default system categories
-- ============================================================
INSERT INTO categories (name, type, color, icon, is_system) VALUES
  ('Salary',         'income',   '#10B981', 'wallet',          TRUE),
  ('Freelance',      'income',   '#34D399', 'briefcase',       TRUE),
  ('Investments',    'income',   '#6EE7B7', 'trending-up',     TRUE),
  ('Housing',        'expense',  '#EF4444', 'home',            TRUE),
  ('Food',           'expense',  '#F59E0B', 'utensils',        TRUE),
  ('Transportation', 'expense',  '#3B82F6', 'car',             TRUE),
  ('Utilities',      'expense',  '#8B5CF6', 'zap',             TRUE),
  ('Entertainment',  'expense',  '#EC4899', 'film',            TRUE),
  ('Healthcare',     'expense',  '#14B8A6', 'heart-pulse',     TRUE),
  ('Shopping',       'expense',  '#F97316', 'shopping-bag',    TRUE),
  ('Education',      'expense',  '#6366F1', 'book-open',       TRUE),
  ('Travel',         'expense',  '#06B6D4', 'plane',           TRUE),
  ('Transfer',       'transfer', '#6B7280', 'arrow-left-right',TRUE)
ON CONFLICT (name, type) WHERE user_id IS NULL DO NOTHING;