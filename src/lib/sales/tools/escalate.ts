// src/lib/sales/tools/escalate.ts
import { createClient } from '@/lib/supabase/server'

interface EscalateInput {
  reason: string
  priority: 'low' | 'medium' | 'high'
}

export async function escalateToHuman(leadId: string, input: EscalateInput) {
  const supabase = createClient()
  
  try {
    // Buscar dados do lead
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('phone, product, name')
      .eq('id', leadId)
      .single()
    
    // Atualizar lead
    const { error } = await supabase
      .from('sales_leads')
      .update({
        assigned_agent: 'human',
        metadata: {
          escalation_reason: input.reason,
          escalation_priority: input.priority,
          escalated_at: new Date().toISOString(),
          needs_attention: true
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (error) {
      throw error
    }
    
    // Criar alerta de escalação
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[ESCALAÇÃO - PRIORIDADE ${input.priority.toUpperCase()}]\nMotivo: ${input.reason}\nLead: ${lead?.name || 'N/A'} (${lead?.phone})`,
      agent: 'system',
      ai_model: 'escalation_alert'
    })
    
    // Mensagem baseada na prioridade
    const priorityMessage = {
      high: '🚨 ESCALAÇÃO URGENTE! Um especialista vai entrar em contato em até 2 horas.',
      medium: '⏰ Caso transferido para um especialista. Retornaremos em até 24 horas.',
      low: '✅ Passamos seu caso para nossa equipe. Em breve alguém vai te ajudar!'
    }
    
    return {
      success: true,
      message: priorityMessage[input.priority],
      priority: input.priority
    }
    
  } catch (error) {
    console.error('Erro ao escalar lead:', error)
    throw error
  }
}