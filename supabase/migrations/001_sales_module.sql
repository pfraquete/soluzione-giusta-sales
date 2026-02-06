-- ====================================
-- SALES MODULE - Supabase Migration
-- Máquina Comercial IA Soluzione Giusta v2
-- ====================================

-- Enum de estágios do pipeline
CREATE TYPE sales_stage AS ENUM (
  'scraped',      -- Extraído do Google/CNPJ, sem contato
  'new',          -- Inbound, acabou de chegar
  'contacted',    -- Primeiro contato feito
  'qualifying',   -- Em processo de qualificação
  'qualified',    -- Qualificado, pronto pro Closer
  'presenting',   -- Closer apresentando produto
  'negotiating',  -- Em negociação (preço, objeções)
  'won',          -- Vendido! Pagamento confirmado
  'lost',         -- Perdido (com motivo)
  'nurturing',    -- Lead morno, drip campaign
  'active',       -- Cliente ativo (pós-onboarding)
  'churned'       -- Cancelou assinatura
);

-- Tabela principal de leads
CREATE TABLE sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Produto e origem
  product TEXT NOT NULL CHECK (product IN ('occhiale','ekkle')),
  source TEXT NOT NULL DEFAULT 'inbound_whatsapp',
  
  -- Dados pessoais
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Dados empresa
  company_name TEXT,
  company_size TEXT CHECK (company_size IN ('micro','small','medium','large')),
  city TEXT,
  state TEXT,
  cnpj TEXT,
  google_place_id TEXT,
  
  -- Pipeline
  stage sales_stage NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 0,
  assigned_agent TEXT DEFAULT 'hunter',
  pain_points TEXT[] DEFAULT '{}',
  objections TEXT[] DEFAULT '{}',
  
  -- Timing
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  followup_count INTEGER DEFAULT 0,
  
  -- Resultado
  won_at TIMESTAMPTZ,
  won_plan TEXT,
  won_amount_cents INTEGER,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  
  -- Referral
  referred_by UUID REFERENCES sales_leads(id),
  referral_code TEXT UNIQUE,
  
  -- Meta
  metadata JSONB DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(phone, product)
);

-- Índices para performance
CREATE INDEX idx_sales_leads_phone ON sales_leads(phone);
CREATE INDEX idx_sales_leads_stage ON sales_leads(stage);
CREATE INDEX idx_sales_leads_product ON sales_leads(product);
CREATE INDEX idx_sales_leads_followup ON sales_leads(next_followup_at) 
  WHERE stage IN ('contacted','qualifying','presenting');
CREATE INDEX idx_sales_leads_outbound ON sales_leads(next_followup_at) 
  WHERE stage = 'scraped';
CREATE INDEX idx_sales_leads_created ON sales_leads(created_at);

-- Conversas
CREATE TABLE sales_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  
  -- Dados da mensagem
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  
  -- IA
  agent TEXT, -- 'hunter','closer','onboarding','cs','human'
  ai_model TEXT,
  tools_called TEXT[] DEFAULT '{}',
  
  -- Custos
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_cents NUMERIC(10,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_conv_lead ON sales_conversations(lead_id);
CREATE INDEX idx_sales_conv_created ON sales_conversations(created_at);
CREATE INDEX idx_sales_conv_agent ON sales_conversations(agent);

-- Métricas diárias agregadas
CREATE TABLE sales_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  product TEXT NOT NULL,
  
  -- Funil
  leads_new INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_presenting INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  
  -- Financeiro
  revenue_cents BIGINT DEFAULT 0,
  ad_spend_cents BIGINT DEFAULT 0,
  
  -- Operacional
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  avg_response_ms INTEGER,
  
  -- Custos IA
  ai_cost_cents NUMERIC(10,2) DEFAULT 0,
  
  UNIQUE(date, product)
);

CREATE INDEX idx_sales_metrics_date ON sales_metrics(date);
CREATE INDEX idx_sales_metrics_product ON sales_metrics(product);

-- Tabela de scraping (leads potenciais)
CREATE TABLE sales_scraping_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  
  -- Dados coletados
  company_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  google_place_id TEXT,
  cnpj TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','failed','blacklist')),
  contact_attempts INTEGER DEFAULT 0,
  next_contact_at TIMESTAMPTZ,
  
  -- Dados originais
  raw_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ
);

CREATE INDEX idx_scraping_status ON sales_scraping_queue(status);
CREATE INDEX idx_scraping_next_contact ON sales_scraping_queue(next_contact_at);
CREATE INDEX idx_scraping_product ON sales_scraping_queue(product);

-- Campanhas e split tests
CREATE TABLE sales_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Config
  message_template TEXT NOT NULL,
  target_audience TEXT,
  active BOOLEAN DEFAULT TRUE,
  
  -- Split test
  variant TEXT DEFAULT 'A',
  weight INTEGER DEFAULT 100,
  
  -- Métricas
  sent_count INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sales_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_leads_updated
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_leads_updated_at();

-- Views úteis para dashboard
CREATE VIEW sales_funnel_summary AS
SELECT 
  product,
  COUNT(*) FILTER (WHERE stage = 'new') AS new_leads,
  COUNT(*) FILTER (WHERE stage IN ('contacted','qualifying')) AS in_qualification,
  COUNT(*) FILTER (WHERE stage = 'qualified') AS qualified,
  COUNT(*) FILTER (WHERE stage IN ('presenting','negotiating')) AS in_negotiation,
  COUNT(*) FILTER (WHERE stage = 'won') AS won,
  COUNT(*) FILTER (WHERE stage = 'lost') AS lost,
  ROUND(
    COUNT(*) FILTER (WHERE stage = 'won')::NUMERIC * 100 / 
    NULLIF(COUNT(*), 0), 
    2
  ) AS conversion_rate
FROM sales_leads
GROUP BY product;

CREATE VIEW sales_daily_metrics AS
SELECT 
  DATE(created_at) as date,
  product,
  COUNT(*) as leads_created,
  COUNT(*) FILTER (WHERE stage = 'won') as deals_won,
  SUM(won_amount_cents) FILTER (WHERE stage = 'won') as revenue_cents,
  ROUND(AVG(score), 1) as avg_lead_score
FROM sales_leads 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), product
ORDER BY date DESC;

-- RLS (Row Level Security) - Para multi-tenant se necessário
-- ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_metrics ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE sales_leads IS 'Leads e prospects do sistema de vendas IA';
COMMENT ON TABLE sales_conversations IS 'Histórico completo de conversas WhatsApp com IA';
COMMENT ON TABLE sales_metrics IS 'Métricas diárias agregadas para dashboard';
COMMENT ON TABLE sales_scraping_queue IS 'Fila de empresas coletadas via scraping Google Places';

-- Dados iniciais para testes
-- INSERT INTO sales_leads (phone, product, name, company_name, stage) VALUES
-- ('5511999999999', 'occhiale', 'Teste Silva', 'Ótica Teste', 'new'),
-- ('5511888888888', 'ekkle', 'Pastor João', 'Igreja Teste', 'new');