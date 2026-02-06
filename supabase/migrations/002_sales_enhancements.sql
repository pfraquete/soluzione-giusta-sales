-- ====================================
-- SALES MODULE - Migration 002
-- Melhorias para Closer, Onboarding, CS Agents
-- ====================================

-- Adicionar campos extras na scraping_queue
ALTER TABLE sales_scraping_queue ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE sales_scraping_queue ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE sales_scraping_queue ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1);
ALTER TABLE sales_scraping_queue ADD COLUMN IF NOT EXISTS reviews_count INTEGER;
ALTER TABLE sales_scraping_queue ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Adicionar campo messages_in e messages_out na sales_metrics (para upsert do message-processor)
ALTER TABLE sales_metrics ADD COLUMN IF NOT EXISTS messages_in INTEGER DEFAULT 0;
ALTER TABLE sales_metrics ADD COLUMN IF NOT EXISTS messages_out INTEGER DEFAULT 0;

-- Tabela de agendamentos de demo (usado pelo schedule-demo tool)
CREATE TABLE IF NOT EXISTS sales_demo_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  meeting_link TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_schedules_lead ON sales_demo_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_schedules_date ON sales_demo_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_demo_schedules_status ON sales_demo_schedules(status);

-- Tabela de propostas comerciais (usado pelo generate-proposal tool)
CREATE TABLE IF NOT EXISTS sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  
  plan_name TEXT NOT NULL,
  original_price_cents INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  final_price_cents INTEGER NOT NULL,
  billing TEXT DEFAULT 'monthly' CHECK (billing IN ('monthly', 'annual')),
  
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'rejected', 'expired')),
  
  proposal_text TEXT,
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead ON sales_proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON sales_proposals(status);

-- Tabela de links de pagamento (usado pelo create-payment tool)
CREATE TABLE IF NOT EXISTS sales_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  
  plan_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  
  pagarme_order_id TEXT,
  payment_url TEXT,
  
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'sent', 'paid', 'failed', 'expired')),
  
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_links_lead ON sales_payment_links(lead_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON sales_payment_links(status);

-- Índice adicional para CS cron (clientes ativos sem contato recente)
CREATE INDEX IF NOT EXISTS idx_sales_leads_active_contact ON sales_leads(last_contact_at)
  WHERE stage = 'active';

-- Índice para nurturing cron
CREATE INDEX IF NOT EXISTS idx_sales_leads_nurturing ON sales_leads(next_followup_at)
  WHERE stage = 'nurturing';

-- View de onboarding progress
CREATE OR REPLACE VIEW sales_onboarding_progress AS
SELECT 
  id,
  name,
  company_name,
  product,
  won_plan,
  won_at,
  (metadata->>'onboarding_progress')::INTEGER as progress_percent,
  metadata->>'onboarding_last_step' as last_step,
  metadata->>'onboarding_last_step_at' as last_step_at,
  metadata->'onboarding_completed_steps' as completed_steps
FROM sales_leads
WHERE stage IN ('won', 'active')
ORDER BY won_at DESC;

-- View de CS health score
CREATE OR REPLACE VIEW sales_cs_health AS
SELECT 
  id,
  name,
  company_name,
  product,
  won_plan,
  last_contact_at,
  EXTRACT(DAY FROM NOW() - last_contact_at) as days_since_contact,
  (metadata->>'last_nps_score')::INTEGER as nps_score,
  CASE 
    WHEN EXTRACT(DAY FROM NOW() - last_contact_at) > 30 THEN 'high'
    WHEN EXTRACT(DAY FROM NOW() - last_contact_at) > 14 THEN 'medium'
    ELSE 'low'
  END as churn_risk
FROM sales_leads
WHERE stage = 'active'
ORDER BY last_contact_at ASC;

COMMENT ON TABLE sales_demo_schedules IS 'Agendamentos de demonstrações com leads';
COMMENT ON TABLE sales_proposals IS 'Propostas comerciais geradas pelo Closer Agent';
COMMENT ON TABLE sales_payment_links IS 'Links de pagamento Pagar.me gerados';
