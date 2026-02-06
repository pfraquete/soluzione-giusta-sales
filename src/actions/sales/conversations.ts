// src/actions/sales/conversations.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { ConversationMessage } from '@/lib/sales/agents/base-agent'

export async function getConversations(leadId: string, options?: {
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  const { data, count, error } = await supabase
    .from('sales_conversations')
    .select('*', { count: 'exact' })
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Erro ao buscar conversas:', error)
    return { conversations: [], total: 0, error: error.message }
  }

  return {
    conversations: data as ConversationMessage[],
    total: count || 0
  }
}

export async function getRecentConversations(options?: {
  product?: 'occhiale' | 'ekkle'
  limit?: number
}) {
  const supabase = createClient()
  const limit = options?.limit || 20

  let query = supabase
    .from('sales_conversations')
    .select(`
      *,
      sales_leads!inner (
        id, name, phone, company_name, product, stage
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.product) {
    query = query.eq('sales_leads.product', options.product)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar conversas recentes:', error)
    return { conversations: [], error: error.message }
  }

  return { conversations: data || [] }
}

export async function getConversationStats(leadId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sales_conversations')
    .select('direction, ai_model, tokens_input, tokens_output, cost_cents, created_at')
    .eq('lead_id', leadId)

  if (error) {
    console.error('Erro ao buscar stats:', error)
    return { stats: null, error: error.message }
  }

  const messages = data || []
  const inbound = messages.filter(m => m.direction === 'inbound').length
  const outbound = messages.filter(m => m.direction === 'outbound').length
  const totalTokensInput = messages.reduce((sum, m) => sum + (m.tokens_input || 0), 0)
  const totalTokensOutput = messages.reduce((sum, m) => sum + (m.tokens_output || 0), 0)
  const totalCost = messages.reduce((sum, m) => sum + (parseFloat(String(m.cost_cents)) || 0), 0)

  // Calcular tempo médio de resposta
  let avgResponseMs = 0
  let responsePairs = 0
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].direction === 'outbound' && messages[i - 1].direction === 'inbound') {
      const diff = new Date(messages[i].created_at).getTime() - new Date(messages[i - 1].created_at).getTime()
      avgResponseMs += diff
      responsePairs++
    }
  }
  if (responsePairs > 0) avgResponseMs = Math.round(avgResponseMs / responsePairs)

  return {
    stats: {
      totalMessages: messages.length,
      inbound,
      outbound,
      totalTokensInput,
      totalTokensOutput,
      totalCostCents: totalCost,
      avgResponseMs,
      firstMessage: messages[0]?.created_at || null,
      lastMessage: messages[messages.length - 1]?.created_at || null
    }
  }
}
