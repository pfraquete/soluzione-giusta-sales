// src/actions/sales/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { SalesLead } from '@/lib/sales/agents/base-agent'

export interface LeadFilters {
  product?: 'occhiale' | 'ekkle'
  stage?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export async function getLeads(filters: LeadFilters = {}) {
  const supabase = createClient()
  const {
    product,
    stage,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = filters

  let query = supabase
    .from('sales_leads')
    .select('*', { count: 'exact' })

  if (product) query = query.eq('product', product)
  if (stage) query = query.eq('stage', stage)
  if (search) {
    query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const offset = (page - 1) * limit
  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Erro ao buscar leads:', error)
    return { leads: [], total: 0, error: error.message }
  }

  return {
    leads: data as SalesLead[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getLeadById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar lead:', error)
    return { lead: null, error: error.message }
  }

  return { lead: data as SalesLead }
}

export async function updateLead(id: string, updates: Partial<SalesLead>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sales_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar lead:', error)
    return { lead: null, error: error.message }
  }

  return { lead: data as SalesLead }
}

export async function createLead(leadData: {
  phone: string
  product: 'occhiale' | 'ekkle'
  name?: string
  company_name?: string
  email?: string
  source?: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sales_leads')
    .insert({
      ...leadData,
      stage: 'new',
      assigned_agent: 'hunter',
      score: 0,
      followup_count: 0,
      source: leadData.source || 'manual'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar lead:', error)
    return { lead: null, error: error.message }
  }

  return { lead: data as SalesLead }
}

export async function deleteLead(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('sales_leads')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar lead:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getFunnelSummary(product?: 'occhiale' | 'ekkle') {
  const supabase = createClient()

  let query = supabase
    .from('sales_leads')
    .select('stage, product')

  if (product) query = query.eq('product', product)

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar funil:', error)
    return { funnel: {} }
  }

  const funnel: Record<string, number> = {}
  for (const lead of data || []) {
    funnel[lead.stage] = (funnel[lead.stage] || 0) + 1
  }

  return { funnel }
}
