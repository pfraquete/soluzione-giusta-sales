// src/actions/sales/metrics.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardMetrics {
  totalLeads: number
  newLeadsToday: number
  inQualification: number
  qualified: number
  inNegotiation: number
  dealsWon: number
  dealsLost: number
  revenueTotal: number
  revenueThisMonth: number
  conversionRate: number
  avgResponseMs: number
  aiCostTotal: number
  aiCostThisMonth: number
  escalations: number
  activeCustomers: number
  churnRate: number
}

export async function getDashboardMetrics(product?: 'occhiale' | 'ekkle'): Promise<{
  metrics: DashboardMetrics | null
  error?: string
}> {
  const supabase = createClient()

  try {
    // Buscar todos os leads
    let leadsQuery = supabase.from('sales_leads').select('*')
    if (product) leadsQuery = leadsQuery.eq('product', product)
    const { data: leads } = await leadsQuery

    if (!leads) return { metrics: null, error: 'Erro ao buscar leads' }

    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    // Calcular métricas
    const totalLeads = leads.length
    const newLeadsToday = leads.filter(l => l.created_at?.startsWith(today)).length
    const inQualification = leads.filter(l => ['contacted', 'qualifying'].includes(l.stage)).length
    const qualified = leads.filter(l => l.stage === 'qualified').length
    const inNegotiation = leads.filter(l => ['presenting', 'negotiating'].includes(l.stage)).length
    const dealsWon = leads.filter(l => l.stage === 'won' || l.stage === 'active').length
    const dealsLost = leads.filter(l => l.stage === 'lost').length
    const activeCustomers = leads.filter(l => l.stage === 'active').length
    const churned = leads.filter(l => l.stage === 'churned').length

    // Revenue
    const revenueTotal = leads
      .filter(l => l.won_amount_cents)
      .reduce((sum, l) => sum + (l.won_amount_cents || 0), 0)

    const revenueThisMonth = leads
      .filter(l => l.won_at && l.won_at >= thisMonthStart && l.won_amount_cents)
      .reduce((sum, l) => sum + (l.won_amount_cents || 0), 0)

    // Conversion rate
    const conversionRate = totalLeads > 0
      ? Math.round((dealsWon / totalLeads) * 10000) / 100
      : 0

    // Churn rate
    const churnRate = (activeCustomers + churned) > 0
      ? Math.round((churned / (activeCustomers + churned)) * 10000) / 100
      : 0

    // AI costs from conversations
    let convQuery = supabase.from('sales_conversations').select('cost_cents, created_at, tools_called')
    if (product) {
      // Need to join with leads to filter by product
      convQuery = supabase
        .from('sales_conversations')
        .select('cost_cents, created_at, tools_called, sales_leads!inner(product)')
    }
    const { data: conversations } = await convQuery

    const aiCostTotal = (conversations || [])
      .reduce((sum, c) => sum + (parseFloat(String(c.cost_cents)) || 0), 0)

    const aiCostThisMonth = (conversations || [])
      .filter(c => c.created_at >= thisMonthStart)
      .reduce((sum, c) => sum + (parseFloat(String(c.cost_cents)) || 0), 0)

    const escalations = (conversations || [])
      .filter(c => c.tools_called?.includes('escalate_to_human'))
      .length

    return {
      metrics: {
        totalLeads,
        newLeadsToday,
        inQualification,
        qualified,
        inNegotiation,
        dealsWon,
        dealsLost,
        revenueTotal,
        revenueThisMonth,
        conversionRate,
        avgResponseMs: 0, // Calculado separadamente se necessário
        aiCostTotal,
        aiCostThisMonth,
        escalations,
        activeCustomers,
        churnRate
      }
    }

  } catch (error) {
    console.error('Erro ao calcular métricas:', error)
    return { metrics: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getDailyMetrics(
  product?: 'occhiale' | 'ekkle',
  days: number = 30
) {
  const supabase = createClient()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let query = supabase
    .from('sales_metrics')
    .select('*')
    .gte('date', startDate)
    .order('date', { ascending: true })

  if (product) query = query.eq('product', product)

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar métricas diárias:', error)
    return { metrics: [], error: error.message }
  }

  return { metrics: data || [] }
}

export async function getFunnelData(product?: 'occhiale' | 'ekkle') {
  const supabase = createClient()

  let query = supabase.from('sales_leads').select('stage')
  if (product) query = query.eq('product', product)

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar dados do funil:', error)
    return { funnel: [] }
  }

  const stageCounts: Record<string, number> = {}
  for (const lead of data || []) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] || 0) + 1
  }

  const stageOrder = [
    'scraped', 'new', 'contacted', 'qualifying', 'qualified',
    'presenting', 'negotiating', 'won', 'active', 'nurturing', 'lost', 'churned'
  ]

  const stageLabels: Record<string, string> = {
    scraped: 'Scraped',
    new: 'Novo',
    contacted: 'Contatado',
    qualifying: 'Qualificando',
    qualified: 'Qualificado',
    presenting: 'Apresentando',
    negotiating: 'Negociando',
    won: 'Ganho',
    active: 'Ativo',
    nurturing: 'Nurturing',
    lost: 'Perdido',
    churned: 'Churned'
  }

  const funnel = stageOrder.map(stage => ({
    stage,
    label: stageLabels[stage] || stage,
    count: stageCounts[stage] || 0
  }))

  return { funnel }
}
