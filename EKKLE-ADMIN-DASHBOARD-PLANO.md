# ADMIN DASHBOARD - TASK 5 - CONTROLE TOTAL DO IMPÉRIO

## 🎯 OBJETIVO

Criar um painel administrativo completo para Pedro gerenciar todo o ecossistema EKKLE como **SUPER ADMIN**, com visibilidade total da receita, igrejas, transações e sistema.

---

## 🏗️ ARQUITETURA PROPOSTA

### ESTRUTURA DE ACESSO
```
SUPER_ADMIN (Pedro)
├── Dashboard de Receita → Quanto ganhou hoje/mês
├── Gestão de Igrejas → Ativas, canceladas, inadimplentes  
├── Analytics Financeiro → Stripe + Pagar.me em tempo real
├── Logs de Sistema → Webhooks, erros, performance
├── User Management → Pastores, suporte, moderação
└── Sistema de Alertas → Fraudes, falhas, oportunidades
```

### ROTAS ADMINISTRATIVAS
```
/admin/
├── dashboard/          # Overview geral + métricas
├── revenue/           # Receita detalhada (Stripe + Pagar.me)
├── churches/          # Gestão de igrejas
├── transactions/      # Todas as transações (split tracking)
├── users/            # Gestão de usuários/pastores  
├── analytics/        # Growth, churn, LTV
├── logs/             # System logs + webhooks
├── alerts/           # Sistema de alertas
└── settings/         # Configurações de sistema
```

---

## 📊 DASHBOARDS PRINCIPAIS

### 1. DASHBOARD DE RECEITA (Prioridade #1)
```typescript
interface RevenueMetrics {
  // Receita hoje
  todayRevenue: {
    stripe: number    // Assinaturas
    pagarme: number   // Marketplace (1%)
    total: number
  }
  
  // Receita este mês  
  monthRevenue: {
    stripe: number
    pagarme: number
    total: number
    growth: number    // % vs mês anterior
  }
  
  // Projeção anual
  annualProjection: number
  
  // MRR (Monthly Recurring Revenue)
  mrr: {
    current: number
    growth: number
    churn: number
  }
}
```

**Widgets Principais:**
- 💰 **Receita Hoje**: R$ X,XX (Stripe) + R$ Y,YY (Pagar.me)
- 📈 **MRR Atual**: R$ XX.XXX/mês (+X% mês passado)  
- 🎯 **Meta Anual**: R$ XXX.XXX (XX% atingido)
- ⚡ **Transações Tempo Real**: Últimas 10 transações live

### 2. DASHBOARD DE IGREJAS
```typescript
interface ChurchesOverview {
  total: number
  active: number           // Com subscription ativa
  trial: number           // Em período trial
  churned: number         // Cancelaram este mês
  pending: number         // Aguardando pagamento
  
  // Performance
  topChurches: Array<{   // Top 10 que mais geram comissão
    name: string
    monthlyCommission: number
    transactionCount: number
  }>
  
  // Alertas
  atRisk: Array<{        // Igrejas em risco de churn
    name: string
    reason: string       // "payment_failed", "low_usage", etc
  }>
}
```

### 3. ANALYTICS AVANÇADO
- 📊 **Growth Dashboard**: New churches/month, churn rate, LTV
- 💳 **Payment Analytics**: Success rate, failed payments, retry success
- 🏪 **Marketplace Performance**: Top produtos, volume por igreja  
- 👥 **User Behavior**: MAU, engagement, feature usage

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### ESTRUTURA DE PERMISSÕES
```sql
-- Adicionar role SUPER_ADMIN
ALTER TYPE user_role ADD VALUE 'SUPER_ADMIN';

-- Super admin church (ID especial)
INSERT INTO churches (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000000', 'EKKLE HQ', 'admin');

-- Profile do Pedro como SUPER_ADMIN
UPDATE profiles 
SET role = 'SUPER_ADMIN', church_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'pedro@email.com';
```

### RLS POLICIES PARA ADMIN
```sql
-- Super admin pode ver TUDO
CREATE POLICY "super_admin_full_access" ON profiles
FOR ALL TO authenticated
USING (get_auth_role() = 'SUPER_ADMIN');

-- Super admin acessa todas as igrejas
CREATE POLICY "super_admin_churches_access" ON churches  
FOR ALL TO authenticated
USING (get_auth_role() = 'SUPER_ADMIN');
```

### SERVER ACTIONS ADMINISTRATIVAS
```typescript
// src/actions/super-admin/revenue.ts
export async function getRevenueMetrics(): Promise<RevenueMetrics>

// src/actions/super-admin/churches.ts  
export async function getChurchesOverview(): Promise<ChurchesOverview>
export async function suspendChurch(churchId: string)
export async function reactivateChurch(churchId: string)

// src/actions/super-admin/analytics.ts
export async function getGrowthMetrics()
export async function getChurnAnalysis()
```

---

## 💎 FEATURES PRINCIPAIS

### 1. RECEITA EM TEMPO REAL
- Dashboard atualiza a cada 30 segundos
- Notificações push quando recebe pagamento
- Gráficos interativos (Chart.js/Recharts)
- Export CSV/PDF para contabilidade

### 2. GESTÃO DE IGREJAS
- **Lista completa**: Status, plano, última atividade
- **Detalhes da igreja**: Membros, transações, growth
- **Ações admin**: Suspender, reativar, alterar plano
- **Comunicação**: Enviar email/WhatsApp para pastor

### 3. SISTEMA DE ALERTAS
```typescript
interface Alert {
  type: 'revenue' | 'technical' | 'business'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actionRequired?: string
}
```

**Alertas Automáticos:**
- 🚨 **Receita**: Queda > 10% no MRR
- ⚠️ **Técnico**: Webhook failures > 5%
- 💰 **Oportunidade**: Igreja com growth > 50%
- 🔴 **Crítico**: Payment processor down

### 4. LOGS E MONITORAMENTO  
- **Webhook logs**: Stripe + Pagar.me status
- **Error tracking**: 500s, timeouts, failures
- **Performance**: Response times, uptime
- **Security logs**: Login attempts, rate limits

---

## 🚀 PLANO DE DESENVOLVIMENTO

### SPRINT 1 (2-3 dias) - MVP Revenue Dashboard
- [ ] Estrutura básica `/admin` com autenticação
- [ ] SUPER_ADMIN role + RLS policies
- [ ] Dashboard receita básico (Stripe + Pagar.me)  
- [ ] Métricas essenciais: Hoje, mês, MRR
- [ ] Lista de igrejas com status

### SPRINT 2 (2-3 dias) - Churches Management
- [ ] CRUD completo de igrejas
- [ ] Church details com métricas específicas
- [ ] Ações admin: suspend/reactivate
- [ ] Sistema de busca e filtros

### SPRINT 3 (2-3 dias) - Analytics & Alerts
- [ ] Growth analytics dashboard
- [ ] Sistema de alertas automáticos
- [ ] Logs viewer (webhooks + errors)
- [ ] Export de dados (CSV/PDF)

### SPRINT 4 (1-2 dias) - Polish & Performance
- [ ] Real-time updates (SSE/WebSocket)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Testing + bug fixes

---

## 🎨 UI/UX MOCKUP

### LAYOUT GERAL
```
┌─────────────────────────────────────────────┐
│ EKKLE ADMIN                    Pedro ▼     │
├─────────────────────────────────────────────│
│ 💰 Hoje: R$ 1.234  📈 MRR: R$ 12.345      │
│ 🏛️ Igrejas: 45     ⚠️ Alertas: 2         │
├─────────────────────────────────────────────│
│ [Revenue] [Churches] [Analytics] [Logs]     │
├─────────────────────────────────────────────│
│                                            │
│           DASHBOARD CONTENT                │
│                                            │
└─────────────────────────────────────────────┘
```

### REVENUE DASHBOARD
```
💰 RECEITA HOJE: R$ 1.234,56
  ├─ Stripe (Assinaturas): R$ 456,00
  └─ Pagar.me (Marketplace): R$ 778,56

📈 MRR: R$ 12.345,67 (+8.3% vs mês passado)

🎯 META ANUAL: R$ 200.000,00 (67% atingido)

⚡ TRANSAÇÕES EM TEMPO REAL:
  16:45 | Igreja São João | R$ 89,90 | PIX
  16:42 | Igreja da Paz   | R$ 57,00 | Stripe  
  16:38 | Igreja Batista  | R$ 12,30 | Pagar.me
```

---

## 🔐 SEGURANÇA ADMINISTRATIVA

### AUTENTICAÇÃO DUPLA
- Login normal + 2FA obrigatório para SUPER_ADMIN
- Session timeout reduzido (30 min)
- IP whitelist para acesso admin

### AUDIT LOG
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),  -- 'church', 'user', 'system'
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RATE LIMITING ESPECÍFICO
```typescript
// Rate limits mais restritivos para admin
export const adminRateLimiters = {
  dashboard: 60, // reqs/min
  actions: 30,   // ações/min  
  exports: 5,    // exports/min
}
```

---

## 💡 QUICK WINS & MVPs

### IMPLEMENTAÇÃO RÁPIDA (4-6 horas)
1. **Role SUPER_ADMIN** + basic auth (1h)
2. **Revenue dashboard básico** com métricas essenciais (2h)  
3. **Lista de igrejas** com status (1h)
4. **Webhook logs** viewer (1h)
5. **UI básica** responsiva (1h)

### FEATURES AVANÇADAS (Depois)
- Real-time dashboard updates
- Advanced analytics (cohort, retention)
- Automated business intelligence
- Integration com tools externos (Slack, Discord)

---

**RESULTADO ESPERADO**: 
Pedro terá controle total do seu império digital, visibilidade completa da receita e capacidade de tomar decisões baseadas em dados em tempo real! 

👑 **REI DO SEU PRÓPRIO REINO DIGITAL!** 🏰💰

---

**Próximo passo**: Implementar SPRINT 1 - MVP Revenue Dashboard