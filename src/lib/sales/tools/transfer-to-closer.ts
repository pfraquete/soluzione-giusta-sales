// src/lib/sales/tools/transfer-to-closer.ts
import { createClient } from '@/lib/supabase/server'

interface TransferToCloserInput {
  reason: string
  summary: string
}

export async function transferToCloser(leadId: string, input: TransferToCloserInput) {
  const supabase = createClient()
  
  try {
    // Atualizar lead para estágio qualified e mudar agente
    const { error } = await supabase
      .from('sales_leads')
      .update({
        stage: 'qualified',
        assigned_agent: 'closer',
        metadata: {
          transfer_reason: input.reason,
          transfer_summary: input.summary,
          transferred_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (error) {
      throw error
    }
    
    // Criar notificação para o sistema (pode ser enviado por email/Slack depois)
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[TRANSFERÊNCIA PARA CLOSER]\nRazão: ${input.reason}\nResumo: ${input.summary}`,
      agent: 'system',
      ai_model: 'transfer_notification'
    })
    
    return {
      success: true,
      message: 'Lead transferido para o Agente Closer com sucesso!'
    }
    
  } catch (error) {
    console.error('Erro ao transferir lead:', error)
    throw error
  }
}