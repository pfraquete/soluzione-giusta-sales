// src/lib/sales/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
interface LogEntry { timestamp: string; level: LogLevel; service: string; message: string; data?: Record<string, any> }

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'] || 1
const IS_DEBUG = process.env.DEBUG_SALES === 'true'

export function log(level: LogLevel, service: string, message: string, data?: Record<string, any>) {
  if (!IS_DEBUG && LOG_LEVELS[level] < MIN_LEVEL) return
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, service: `sales.${service}`, message, ...(data ? { data } : {}) }
  if (process.env.NODE_ENV === 'production') {
    const output = JSON.stringify(entry)
    if (level === 'error') console.error(output)
    else if (level === 'warn') console.warn(output)
    else console.log(output)
    return
  }
  const prefix = { debug: '[DEBUG]', info: '[INFO]', warn: '[WARN]', error: '[ERROR]' }[level]
  const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
  console.log(`${prefix} [${entry.timestamp}] [${service}] ${message}${dataStr}`)
}

export const logger = {
  debug: (service: string, message: string, data?: Record<string, any>) => log('debug', service, message, data),
  info: (service: string, message: string, data?: Record<string, any>) => log('info', service, message, data),
  warn: (service: string, message: string, data?: Record<string, any>) => log('warn', service, message, data),
  error: (service: string, message: string, data?: Record<string, any>) => log('error', service, message, data),
}

export function measurePerformance(service: string, operation: string) {
  const start = Date.now()
  return {
    end: (data?: Record<string, any>) => { const d = Date.now() - start; log('info', service, `${operation} completed`, { ...data, durationMs: d }); return d },
    error: (error: Error, data?: Record<string, any>) => { const d = Date.now() - start; log('error', service, `${operation} failed`, { ...data, durationMs: d, error: error.message }); return d },
  }
}
