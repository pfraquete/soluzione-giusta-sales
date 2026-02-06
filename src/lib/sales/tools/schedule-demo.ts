// src/lib/sales/tools/schedule-demo.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'
import { getProductConfig } from '../product-config'

interface ScheduleDemoInput {
  preferred_date: string
  preferred_time?: string
}

export async function scheduleDemo(
  leadId: string,
  input: ScheduleDemoInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' }
    }

    const config = getProductConfig(product)
    const preferredTime = input.preferred_time || '14:00'

    // Salvar agendamento no metadata do lead
    await supabase.from('sales_leads')
      .update({
        metadata: {
          ...lead.metadata,
          demo_scheduled: true,
          demo_date: input.preferred_date,
          demo_time: preferredTime,
          demo_scheduled_at: new Date().toISOString()
        },
        next_followup_at: new Date(`${input.preferred_date}T${preferredTime}:00-03:00`).toISOString()
      })
      .eq('id', leadId)

    // Mensagem de confirmação
    const confirmMessage = product === 'occhiale'
      ? `📅 *Demo Agendada!*

Perfeito! Sua demonstração do ${config.name} está confirmada:

📆 Data: *${input.preferred_date}*
⏰ Horário: *${preferredTime} (horário de Brasília)*
📱 Via: *Chamada de vídeo pelo WhatsApp*

Um especialista da nossa equipe vai te ligar nesse horário para mostrar tudo ao vivo!

💡 *Dica:* Tenha em mãos o catálogo de óculos da sua loja para simularmos juntos.

Até lá! 🚀`
      : `📅 *Demo Agendada!*

Pastor(a), sua demonstração do ${config.name} está confirmada:

📆 Data: *${input.preferred_date}*
⏰ Horário: *${preferredTime} (horário de Brasília)*
📱 Via: *Chamada de vídeo pelo WhatsApp*

Um especialista vai te ligar nesse horário para mostrar a plataforma ao vivo!

💡 *Dica:* Se possível, convide um líder de célula para ver junto.

Até lá! 🙏`

    await sendWhatsAppMessage(lead.phone, confirmMessage, product)

    // Registrar na conversa
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[DEMO AGENDADA] ${input.preferred_date} às ${preferredTime}`,
      message_type: 'text',
      agent: 'closer',
      tools_called: ['schedule_demo_call']
    })

    return {
      success: true,
      message: `Demo agendada para ${input.preferred_date} às ${preferredTime}. Lead será contatado por um especialista.`
    }

  } catch (error) {
    console.error('Erro ao agendar demo:', error)
    throw error
  }
}
