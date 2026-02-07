// src/lib/sales/index.ts
// Módulo de Vendas — Máquina Comercial IA v2

// Agents
export { BaseAgent, HunterAgent, CloserAgent, OnboardingAgent, CSAgent } from './agents'
export type { LeadContext, SalesLead, ConversationMessage, ProductConfig } from './agents'

// Message Processor
export { processSalesMessage, classifyIntent, detectObjection } from './message-processor'

// Product Config
export { getProductConfig, getPlanByName, formatPrice, getObjectionResponse } from './product-config'
export { OCCHIALE_CONFIG, EKKLE_CONFIG } from './product-config'

// Evolution Client
export { sendWhatsAppMessage, sendWhatsAppMedia } from './evolution-client'

// Scoring
export { calculateLeadScore } from './scoring'

// Scraper
export { runLeadScraper } from './scraper'

// Logger
export { logger, measurePerformance } from './logger'

// Monitoring
export { withMonitoring, getHealthStatus, recordMetric, getMetrics, checkAlerts } from './monitoring'

// Rate Limiter
export { checkRateLimit, checkMinInterval, validatePagarmeSignature, validateEvolutionWebhook } from './rate-limiter'
