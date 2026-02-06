// src/lib/sales/tools/mark-as-nurture.ts
import { createClient } from '@/lib/supabase/server'

interface MarkAsNurtureInput {
  reason: string
  next_contact_days?: number
}

export async function markAsNurture(leadId: string, input: MarkAsNurtureInput) {
  const supabase = createClient()
  
  try {
    const days = input.next_contact_days || 30
    const nextContactAt = new Date()
    nextContactAt.setDate(nextContactAt.getDate() + days)
    
    // Atualizar lead
    const { error } = await supabase
      .from('sales_leads')
      .update({
        stage: 'nurturing',
        next_followup_at: nextContactAt.toISOString(),
        metadata: {
          nurture_reason: input.reason,
          nurture_started_at: new Date().toISOString(),
          scheduled_contact: nextContactAt.toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      message: `Lead movido para nurturing. Próximo contato em ${days} dias (${nextContactAt.toLocaleDateString('pt-BR')})`
    }
    
  } catch (error) {
    console.error('Erro ao mover lead para nurture:', error)
    throw error
  }
}