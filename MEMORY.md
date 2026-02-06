# Memoria de Longo Prazo — MAVIE

## Preferencias do Dono
- Sempre usar Supabase para auth/db/storage
- Deploy frontend na Vercel
- Dark mode por padrao em todas as UIs
- Commits direto no GitHub (sem PR)
- Paginacao de 10 itens em listas
- Stripe Checkout para pagamentos
- Modelo OpenAI mais avancado para programacao

## Decisoes Arquiteturais
- VPS: 129.121.37.41 (HostGator OCI NVMe 12, 4vCPU, 12GB RAM, 300GB NVMe)
- OpenClaw/Clawdbot rodando em Docker
- Signal como canal de comunicacao
- signal-cli 0.13.24 nativo dentro do container

## Contexto Ativo - EKKLE
- Data de criacao: 2026-02-06
- Versao do Clawdbot: 2026.1.25
- Modelo: anthropic/claude-sonnet-4-20250514
- Projeto principal: EKKLE (sistema de gestão de igrejas)
- Fase atual: Análise técnica pré-lançamento (TASK 1, 2, 3 e 4 COMPLETAS ✅)
- Status: Sistema PRODUCTION-READY com 87 Server Actions, Next.js 16, React 19, multi-tenant
- Performance: Otimizações identificadas (30-60% melhoria potencial com lazy loading)
- Segurança: FORT KNOX - Score 9.8/10, vulnerabilidades corrigidas, file validation implementada
- Pagamentos: MARKETPLACE COMPLETO - Stripe + Pagar.me com split automático 1%/99%
- Receita potencial: R$ 188k-3.3M/ano com R$ 57/mês (corrigido)
- Próximo: Admin Dashboard para controle total do negócio
- Arquitetura: Supabase + Stripe + Pagar.me + WhatsApp AI Agent + Multi-tenancy + RLS

## Preferencias de Trabalho do Pedro
- Estuda tudo antes de executar (planejamento detalhado)
- Divide projetos gigantes em tasks organizadas
- TDAH severo: precisa de desafios constantes para manter hiperfoco
- Troca de planos é normal - reorganizar sem problema
- Quer explicações técnicas do "porquê" (aprendendo há 5 meses)
- Prioriza sempre o que gera receita primeiro
