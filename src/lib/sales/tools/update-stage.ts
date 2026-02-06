// src/lib/sales/tools/update-stage.ts
import { createClient } from '@/lib/supabase/server'

interface UpdateStageInput {
  new_stage: 'presenting' | 'negotiating' | 'won' | 'lost'
  reason?: string
}

export async function updateStage(
  leadId: string,
  input: UpdateStageInput
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('stage, assigned_agent')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' }
    }

    const updateData: Record<string, any> = {
      stage: input.new_stage,
      updated_at: new Date().toISOString()
    }

    // Ações específicas por estágio
    switch (input.new_stage) {
      case 'won':
        updateData.won_at = new Date().toISOString()
        updateData.assigned_agent = 'onboarding'
        break
      case 'lost':
        updateData.lost_at = new Date().toISOString()
        updateData.lost_reason = input.reason || 'Não informado'
        break
      case 'presenting':
        updateData.assigned_agent = 'closer'
        break
      case 'negotiating':
        updateData.assigned_agent = 'closer'
        break
    }

    const { error } = await supabase
      .from('sales_leads')
      .update(updateData)
      .eq('id', leadId)

    if (error) {
      console.error('Erro ao atualizar estágio:', error)
      return { success: false, message: `Erro ao atualizar: ${error.message}` }
    }

    // Registrar mudança na conversa
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[STAGE CHANGE] ${lead.stage} → ${input.new_stage}${input.reason ? ` | Motivo: ${input.reason}` : ''}`,
      message_type: 'text',
      agent: 'system',
      tools_called: ['update_stage']
    })

    const stageMessages: Record<string, string> = {
      presenting: 'Lead movido para apresentação. Closer assumindo.',
      negotiating: 'Lead em negociação. Proposta sendo discutida.',
      won: 'VENDA FECHADA! Lead movido para onboarding.',
      lost: `Lead perdido. Motivo: ${input.reason || 'Não informado'}.`
    }

    return {
      success: true,
      message: stageMessages[input.new_stage] || `Estágio atualizado para ${input.new_stage}.`
    }

  } catch (error) {
    console.error('Erro ao atualizar estágio:', error)
    throw error
  }
}
