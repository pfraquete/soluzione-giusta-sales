// src/lib/sales/tools/collect-nps.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'

interface CollectNpsInput {
  score?: number
  feedback?: string
}

export async function collectNps(
  leadId: string,
  input: CollectNpsInput,
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

    if (input.score !== undefined) {
      // Salvar NPS score
      const npsHistory: Array<{ score: number; feedback?: string; date: string }> = lead.metadata?.nps_history || []
      npsHistory.push({
        score: input.score,
        feedback: input.feedback,
        date: new Date().toISOString()
      })

      await supabase.from('sales_leads')
        .update({
          metadata: {
            ...lead.metadata,
            nps_history: npsHistory,
            last_nps_score: input.score,
            last_nps_date: new Date().toISOString()
          }
        })
        .eq('id', leadId)

      // Registrar
      await supabase.from('sales_conversations').insert({
        lead_id: leadId,
        direction: 'outbound',
        content: `[NPS COLLECTED] Score: ${input.score}/10${input.feedback ? ` | Feedback: ${input.feedback}` : ''}`,
        message_type: 'text',
        agent: 'cs',
        tools_called: ['collect_nps']
      })

      // Resposta baseada no score
      let responseCategory: string
      if (input.score >= 9) {
        responseCategory = 'promoter'
      } else if (input.score >= 7) {
        responseCategory = 'passive'
      } else {
        responseCategory = 'detractor'
      }

      return {
        success: true,
        message: `NPS coletado: ${input.score}/10 (${responseCategory}). ${input.feedback ? `Feedback: "${input.feedback}"` : ''} ${responseCategory === 'detractor' ? 'ATENÇÃO: Cliente detrator! Priorizar resolução de problemas.' : responseCategory === 'promoter' ? 'Cliente promotor! Boa oportunidade para pedir indicação.' : 'Cliente passivo. Buscar formas de encantar.'}`
      }
    } else {
      // Enviar pesquisa NPS
      const npsMessage = product === 'occhiale'
        ? `📊 *Pesquisa Rápida — Occhiale*

Olá, ${lead.name || 'amigo(a)'}! Queremos melhorar sempre.

Em uma escala de *0 a 10*, o quanto você recomendaria o Occhiale para outro dono de ótica?

Responda com um número de 0 a 10. 😊

_Sua opinião é muito importante para nós!_`
        : `📊 *Pesquisa Rápida — EKKLE*

Pastor(a) ${lead.name || ''}! Queremos servir cada vez melhor.

Em uma escala de *0 a 10*, o quanto você recomendaria o EKKLE para outro pastor?

Responda com um número de 0 a 10. 🙏

_Sua opinião nos ajuda a melhorar!_`

      await sendWhatsAppMessage(lead.phone, npsMessage, product)

      await supabase.from('sales_conversations').insert({
        lead_id: leadId,
        direction: 'outbound',
        content: '[NPS SURVEY SENT]',
        message_type: 'text',
        agent: 'cs',
        tools_called: ['collect_nps']
      })

      return {
        success: true,
        message: 'Pesquisa NPS enviada! Aguardando resposta do cliente.'
      }
    }

  } catch (error) {
    console.error('Erro ao coletar NPS:', error)
    throw error
  }
}
