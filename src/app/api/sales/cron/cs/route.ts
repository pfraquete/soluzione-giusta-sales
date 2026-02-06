// src/app/api/sales/cron/cs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/sales/evolution-client'
import { getProductConfig } from '@/lib/sales/product-config'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const results = {
      churn_prevention: 0,
      nps_sent: 0,
      tips_sent: 0,
      total_processed: 0
    }

    // 1. Churn Prevention: clientes ativos sem contato há > 14 dias
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: churnRiskLeads } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('stage', 'active')
      .lt('last_contact_at', fourteenDaysAgo)
      .limit(10)

    for (const lead of churnRiskLeads || []) {
      try {
        await new Promise(r => setTimeout(r, 3000))

        const config = getProductConfig(lead.product)
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(lead.last_contact_at || lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        let message: string

        if (daysSinceContact > 30) {
          // Risco alto
          message = lead.product === 'occhiale'
            ? `Olá, ${lead.name || 'amigo(a)'}! 👋 Faz um tempinho que não nos falamos. Está tudo bem com a ${lead.company_name || 'sua ótica'}?\n\nNotei que faz ${daysSinceContact} dias que você não acessa o painel. Posso te ajudar com alguma coisa? Estou aqui para isso! 😊`
            : `Pastor(a) ${lead.name || ''}! 🙏 Faz um tempinho que não nos falamos. Como está a ${lead.company_name || 'igreja'}?\n\nNotei que faz ${daysSinceContact} dias sem acesso ao EKKLE. Posso ajudar com alguma dificuldade? Estou aqui! ⚡`
        } else {
          // Risco médio
          message = lead.product === 'occhiale'
            ? `Oi, ${lead.name || 'amigo(a)'}! 😊 Passando para dar uma dica rápida:\n\n💡 Você sabia que pode ver quais óculos seus clientes mais olham no site? Vá em Relatórios > Produtos Mais Vistos. Isso ajuda a montar a vitrine!\n\nPrecisa de algo? Estou aqui!`
            : `Oi, pastor(a) ${lead.name || ''}! 🙏 Passando com uma dica:\n\n💡 Lembre de pedir para os líderes preencherem o relatório de célula toda semana. Os dados ajudam a identificar células prontas para multiplicar!\n\nPrecisa de algo? Estou aqui! ⚡`
        }

        await sendWhatsAppMessage(lead.phone, message, lead.product)

        await supabase.from('sales_leads')
          .update({ last_contact_at: new Date().toISOString() })
          .eq('id', lead.id)

        await supabase.from('sales_conversations').insert({
          lead_id: lead.id,
          direction: 'outbound',
          content: `[CS TRIGGER: churn_prevention] ${message.substring(0, 100)}...`,
          message_type: 'text',
          agent: 'cs',
          ai_model: 'template_cs'
        })

        results.churn_prevention++
        results.total_processed++

      } catch (err) {
        console.error(`Erro CS churn prevention lead ${lead.id}:`, err)
      }
    }

    // 2. NPS: clientes ativos que não receberam NPS nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: npsLeads } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('stage', 'active')
      .limit(5)

    for (const lead of npsLeads || []) {
      const lastNpsDate = lead.metadata?.last_nps_date
      if (lastNpsDate && new Date(lastNpsDate) > new Date(thirtyDaysAgo)) {
        continue // NPS recente, pular
      }

      try {
        await new Promise(r => setTimeout(r, 3000))

        const npsMessage = lead.product === 'occhiale'
          ? `📊 *Pesquisa Rápida — Occhiale*\n\nOlá, ${lead.name || 'amigo(a)'}! Em uma escala de *0 a 10*, o quanto você recomendaria o Occhiale para outro dono de ótica?\n\nResponda com um número. Sua opinião é muito importante! 😊`
          : `📊 *Pesquisa Rápida — EKKLE*\n\nPastor(a) ${lead.name || ''}! Em uma escala de *0 a 10*, o quanto você recomendaria o EKKLE para outro pastor?\n\nResponda com um número. Sua opinião nos ajuda a melhorar! 🙏`

        await sendWhatsAppMessage(lead.phone, npsMessage, lead.product)

        await supabase.from('sales_conversations').insert({
          lead_id: lead.id,
          direction: 'outbound',
          content: '[CS TRIGGER: nps_survey]',
          message_type: 'text',
          agent: 'cs',
          ai_model: 'template_nps'
        })

        results.nps_sent++
        results.total_processed++

      } catch (err) {
        console.error(`Erro CS NPS lead ${lead.id}:`, err)
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron CS:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'online', job: 'cs', description: 'Customer Success triggers (churn prevention, NPS)' })
}
