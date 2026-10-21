-- ==========================================================
-- DORIAN FINANZAS: Esquema de Base de Datos Bimonetaria (USD / VES)
-- ==========================================================

-- 1. TABLA: Cuentas y Bolsillos (Exclusivas de Dorian)
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. TABLA: Categorías de Gastos
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABLA: Fuentes de Ingreso (Policía, Muebles Bellagio, etc.)
CREATE TABLE IF NOT EXISTS public.income_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
  employer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. TABLA: Transacciones (Gastos, Ingresos y Cambios de Divisa)
-- Regla Bimonetaria: Montos en céntimos enteros (BIGINT), tasa histórica rate_used
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'exchange')),
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
  rate_used NUMERIC(12, 4) NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  source_id TEXT REFERENCES public.income_sources(id) ON DELETE SET NULL,
  merchant TEXT,
  note TEXT,
  receipt_url TEXT,
  to_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. TABLA: Tareas y Recordatorios Financieros
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  due_time TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_financial BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_amount_minor BIGINT,
  estimated_currency TEXT CHECK (estimated_currency IN ('USD', 'VES')),
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. TABLA: Deudas y Compromisos
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  creditor TEXT NOT NULL,
  description TEXT,
  original_amount_minor BIGINT NOT NULL CHECK (original_amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
  start_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  is_paid_off BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TABLA: Abonos / Pagos de Deudas
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. TABLA: Historial de Tasas de Cambio Diarias
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  bcv_rate NUMERIC(12, 4) NOT NULL,
  binance_rate NUMERIC(12, 4) NOT NULL,
  active_source TEXT NOT NULL DEFAULT 'binance' CHECK (active_source IN ('bcv', 'binance')),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==========================================================
-- POLÍTICAS DE ACCESO RLS (Row Level Security)
-- ==========================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para uso personal ágil
CREATE POLICY "Permitir todo en accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en income_sources" ON public.income_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en debt_payments" ON public.debt_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en exchange_rates" ON public.exchange_rates FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- DATOS INICIALES (SEMILLAS)
-- ==========================================================

-- Las 5 Cuentas Oficiales de Dorian
INSERT INTO public.accounts (id, name, currency, icon) VALUES
  ('acc-usd-cash', 'Efectivo USD', 'USD', 'dollar-sign'),
  ('acc-ves-cash', 'Efectivo Bs', 'VES', 'banknote'),
  ('acc-bdv', 'Banco de Venezuela', 'VES', 'building-2'),
  ('acc-binance', 'Binance', 'USD', 'wallet-cards'),
  ('acc-zinli', 'Zinli', 'USD', 'credit-card')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency, icon = EXCLUDED.icon;

-- Categorías Predeterminadas
INSERT INTO public.categories (id, name, icon, color) VALUES
  ('cat-moto', 'Moto (Repuestos/Taller)', 'bike', '#f59e0b'),
  ('cat-gasolina', 'Gasolina', 'fuel', '#ef4444'),
  ('cat-comida', 'Comida & Mercado', 'utensils', '#10b981'),
  ('cat-ocio', 'Ocio & Salidas', 'beer', '#8b5cf6'),
  ('cat-transporte', 'Transporte', 'bus', '#3b82f6'),
  ('cat-hogar', 'Hogar & Familia', 'home', '#06b6d4'),
  ('cat-salud', 'Salud & Farmacia', 'heart-pulse', '#ec4899'),
  ('cat-servicios', 'Servicios (Luz, Teléfono)', 'zap', '#eab308'),
  ('cat-otros', 'Otros Gastos', 'more-horizontal', '#64748b')
ON CONFLICT (id) DO NOTHING;

-- Fuentes de Ingreso Iniciales
INSERT INTO public.income_sources (id, name, currency, employer) VALUES
  ('src-policia', 'Policía', 'VES', 'Policía'),
  ('src-bellagio', 'Muebles Bellagio', 'USD', 'Muebles Bellagio'),
  ('src-otro', 'Trabajo Extra / Otro', 'USD', 'Otro')
ON CONFLICT (id) DO NOTHING;
