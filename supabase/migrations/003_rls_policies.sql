-- 003_rls_policies.sql
-- Row Level Security para tabelas sales_*

-- Habilitar RLS em todas as tabelas
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_scraping_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_demo_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_payment_links ENABLE ROW LEVEL SECURITY;

-- Policies: service_role tem acesso total (para server actions e cron jobs)
CREATE POLICY "service_role_all_sales_leads" ON sales_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_conversations" ON sales_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_metrics" ON sales_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_scraping_queue" ON sales_scraping_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_campaigns" ON sales_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_demo_schedules" ON sales_demo_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_proposals" ON sales_proposals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sales_payment_links" ON sales_payment_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Bloquear acesso anon (nenhuma policy = bloqueado por padrao com RLS)
-- Authenticated users so podem ver se forem SUPER_ADMIN (controlado pelo middleware)
