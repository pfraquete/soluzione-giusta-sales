# Máquina Comercial IA v2 — Resumo do Documento

## Visão Geral
Arquitetura 100% nativa (sem n8n) para máquina comercial da Soluzione Giusta.
Stack: Next.js + Supabase + Claude + Evolution API

## Estrutura Principal
- 4 Agentes IA: Hunter, Closer, Onboarding, CS
- Multi-Produto: Occhiale (óticas) e EKKLE (igrejas)
- Cron Jobs via pg_cron ou Vercel Cron
- WhatsApp via Evolution API
- Pagamento via Pagar.me
- Scraping via Google Places API

## Arquivos Core Definidos no Documento
- base-agent.ts, message-processor.ts, evolution-client.ts
- hunter.ts, closer.ts, onboarding.ts, cs.ts
- product-config.ts, scoring.ts, scraper.ts
- Webhook routes, cron routes, admin routes
- Schema SQL completo (sales_leads, sales_conversations, sales_metrics)

## Roadmap: 6 semanas
- Semana 1: Core Engine
- Semana 2: Hunter Agent
- Semana 3: Closer Agent
- Semana 4: Cron Jobs + Scraper
- Semana 5: Ads + Landing
- Semana 6: Onboarding + CS
