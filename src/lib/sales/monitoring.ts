// src/lib/sales/monitoring.ts
import { logger, measurePerformance } from './logger'

interface PerformanceMetric { count: number; totalMs: number; minMs: number; maxMs: number; errors: number }
const metrics: Record<string, PerformanceMetric> = {}

export function recordMetric(name: string, durationMs: number, isError = false) {
  if (!metrics[name]) metrics[name] = { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0, errors: 0 }
  const m = metrics[name]
  m.count++
  m.totalMs += durationMs
  m.minMs = Math.min(m.minMs, durationMs)
  m.maxMs = Math.max(m.maxMs, durationMs)
  if (isError) m.errors++
}

export function getMetrics() {
  const result: Record<string, any> = {}
  for (const [name, m] of Object.entries(metrics)) {
    result[name] = {
      count: m.count,
      avgMs: m.count > 0 ? Math.round(m.totalMs / m.count) : 0,
      minMs: m.minMs === Infinity ? 0 : m.minMs,
      maxMs: m.maxMs,
      errorRate: m.count > 0 ? Math.round((m.errors / m.count) * 10000) / 100 : 0,
    }
  }
  return result
}

export function resetMetrics() {
  for (const key of Object.keys(metrics)) delete metrics[key]
}

interface AlertThreshold { metric: string; condition: 'above' | 'below'; value: number; severity: 'warning' | 'critical'; message: string }

const ALERT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'response_time', condition: 'above', value: 10000, severity: 'critical', message: 'Tempo de resposta acima de 10s' },
  { metric: 'response_time', condition: 'above', value: 5000, severity: 'warning', message: 'Tempo de resposta acima de 5s' },
  { metric: 'escalation_rate', condition: 'above', value: 15, severity: 'warning', message: 'Taxa de escalacao acima de 15%' },
  { metric: 'ai_cost_per_conversation', condition: 'above', value: 5, severity: 'warning', message: 'Custo IA por conversa acima de R$ 0,05' },
]

export function checkAlerts(currentMetrics: Record<string, number>) {
  const triggered: AlertThreshold[] = []
  for (const threshold of ALERT_THRESHOLDS) {
    const value = currentMetrics[threshold.metric]
    if (value === undefined) continue
    const shouldTrigger = threshold.condition === 'above' ? value > threshold.value : value < threshold.value
    if (shouldTrigger) {
      triggered.push(threshold)
      logger.warn('monitoring', `ALERT [${threshold.severity}]: ${threshold.message}`, { metric: threshold.metric, currentValue: value, threshold: threshold.value })
    }
  }
  return triggered
}

export async function withMonitoring<T>(agentName: string, operation: string, fn: () => Promise<T>): Promise<T> {
  const perf = measurePerformance(agentName, operation)
  try {
    const result = await fn()
    const duration = perf.end()
    recordMetric(`${agentName}.${operation}`, duration)
    if (duration > 10000) checkAlerts({ response_time: duration })
    return result
  } catch (error) {
    const duration = perf.error(error instanceof Error ? error : new Error(String(error)))
    recordMetric(`${agentName}.${operation}`, duration, true)
    throw error
  }
}

export function getHealthStatus() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    agents: ['hunter', 'closer', 'onboarding', 'cs'],
    metrics: getMetrics(),
    uptime: process.uptime ? process.uptime() : 0,
  }
}
