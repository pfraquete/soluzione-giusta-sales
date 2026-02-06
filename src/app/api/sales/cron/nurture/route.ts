// src/app/api/sales/cron/nurture/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/sales/evolution-client'
import { getProductConfig } from '@/lib/sales/product-config'

// Conteúdo de nurturing por produto (drip campaign)
const NURTURE_CONTENT: Record<string, string[]> = {
  occhiale: [
    `📊 *Você sabia?*\n\n73% dos consumidores pesquisam online antes de comprar óculos. Se sua ótica não aparece na internet, você está perdendo vendas todos os dias.\n\nQuer saber como mudar isso? Me responda "sim"! 😊`,
    `💡 *Case Real*\n\nA Ótica Visão Clara de SP começou a vender online há 3 meses. Resultado: *R$ 15.000 de vendas extras por mês*.\n\n"Pensei que internet não funcionava para ótica. Me enganei!" — José Santos, proprietário.\n\nQuer saber como eles fizeram? 🚀`,
    `🤖 *Tendência 2026*\n\nÓticas que usam IA para atender no WhatsApp vendem 3x mais que as que atendem manualmente. O motivo? Resposta instantânea, 24 horas por dia.\n\nQuer ver como funciona na prática? 📱`,
    `💰 *Conta rápida*\n\nSe você vender apenas 3 óculos a mais por mês pela internet (média de R$ 300 cada), são R$ 900 extras. O Occhiale custa R$ 197/mês.\n\n*ROI de 356% no primeiro mês.*\n\nFaz sentido para você? 🎯`,
    `🎬 *Última chance*\n\nEstamos com uma condição especial para óticas que querem começar a vender online este mês.\n\nSe tiver interesse, me responda e eu te conto os detalhes! 😊\n\n_Se preferir não receber mais mensagens, basta me dizer._`
  ],
  ekkle: [
    `📊 *Você sabia?*\n\nIgrejas que usam gestão digital crescem em média 30% mais rápido que as que usam planilhas ou papel.\n\nQuer saber como organizar sua igreja digitalmente? Me responda "sim"! 🙏`,
    `💡 *Testemunho Real*\n\nA Igreja Águas Vivas de SP cresceu 40% nas células em 6 meses usando o EKKLE.\n\n"Conseguimos identificar células que precisavam de apoio e as prontas para multiplicar." — Pastor Ricardo.\n\nQuer saber como? ⚡`,
    `⏰ *Quanto tempo você gasta?*\n\nPastores gastam em média 15 horas por semana com tarefas administrativas. Com o EKKLE, esse tempo cai para 2 horas.\n\n*13 horas a mais para pastorear de verdade.*\n\nFaz sentido para você? 🙏`,
    `💰 *Investimento x Retorno*\n\nR$ 57/mês = menos de R$ 2 por dia. É o preço de um cafezinho.\n\nEm troca: gestão de células, membros, cursos, finanças e comunicação. Tudo em um só lugar.\n\nQuer conhecer? 📱`,
    `🎬 *Última mensagem*\n\nEstamos com uma condição especial para igrejas que querem se organizar digitalmente este mês.\n\nSe tiver interesse, me responda! 🙏\n\n_Se preferir não receber mais mensagens, é só me dizer._`
  ]
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  try {
    // Buscar leads em nurturing que precisam de contato
    const { data: leads } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('stage', 'nurturing')
      .lt('next_followup_at', new Date().toISOString())
      .order('next_followup_at', { ascending: true })
      .limit(20)

    if (!leads?.length) {
      return NextResponse.json({ processed: 0, message: 'Nenhum lead para nurture' })
    }

    let processed = 0

    for (const lead of leads) {
      try {
        await new Promise(r => setTimeout(r, 3000))

        const nurtureIndex = lead.metadata?.nurture_index || 0
        const content = NURTURE_CONTENT[lead.product] || []

        // Se já enviou todo o conteúdo, parar
        if (nurtureIndex >= content.length) {
          // Mover para lost (nurture esgotado)
          await supabase.from('sales_leads')
            .update({
              stage: 'lost',
              lost_at: new Date().toISOString(),
              lost_reason: 'Nurture campaign completed without response'
            })
            .eq('id', lead.id)
          continue
        }

        const message = content[nurtureIndex]
        await sendWhatsAppMessage(lead.phone, message, lead.product)

        // Atualizar lead
        await supabase.from('sales_leads')
          .update({
            last_contact_at: new Date().toISOString(),
            next_followup_at: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000 // +3 dias
            ).toISOString(),
            metadata: {
              ...lead.metadata,
              nurture_index: nurtureIndex + 1,
              last_nurture_at: new Date().toISOString()
            }
          })
          .eq('id', lead.id)

        // Salvar conversa
        await supabase.from('sales_conversations').insert({
          lead_id: lead.id,
          direction: 'outbound',
          content: `[NURTURE #${nurtureIndex + 1}] ${message.substring(0, 100)}...`,
          message_type: 'text',
          agent: 'hunter',
          ai_model: 'template_nurture'
        })

        processed++

      } catch (leadError) {
        console.error(`Erro no nurture do lead ${lead.id}:`, leadError)
      }
    }

    return NextResponse.json({
      processed,
      total: leads.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron nurture:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'online', job: 'nurture', description: 'Drip content para leads mornos' })
}
