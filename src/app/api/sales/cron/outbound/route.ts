// src/app/api/sales/cron/outbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/sales/evolution-client'
import { getProductConfig } from '@/lib/sales/product-config'

export async function POST(req: NextRequest) {
  // Validar CRON_SECRET
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  try {
    // Buscar leads scraped prontos para primeiro contato
    const { data: leads } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('stage', 'scraped')
      .lte('next_followup_at', new Date().toISOString())
      .order('next_followup_at', { ascending: true })
      .limit(20) // Batch de 20

    if (!leads?.length) {
      return NextResponse.json({ processed: 0, message: 'Nenhum lead para contatar' })
    }

    let processed = 0

    for (const lead of leads) {
      try {
        // Rate limit: 3 segundos entre mensagens
        await new Promise(r => setTimeout(r, 3000))

        const config = getProductConfig(lead.product)

        // Mensagem personalizada de primeiro contato
        const message = lead.product === 'occhiale'
          ? `Olá! 👋 Sou a ${config.agentName} da ${config.name}.

Encontrei a *${lead.company_name || 'sua ótica'}*${lead.city ? ` em ${lead.city}` : ''} e fiquei curiosa: vocês já vendem óculos pela internet?

Pergunto porque temos ajudado óticas como a sua a faturar até *R$ 15.000/mês a mais* com vendas online, sem precisar de nenhum conhecimento técnico.

Posso te contar como funciona? Leva menos de 2 minutos! 😊`
          : `Olá, pastor(a)! 🙏 Sou a ${config.agentName} do ${config.name}.

Encontrei a *${lead.company_name || 'sua igreja'}*${lead.city ? ` em ${lead.city}` : ''} e gostaria de saber: como vocês organizam a gestão das células e membros hoje?

Temos ajudado igrejas a crescerem de forma organizada, com gestão digital de células, membros, cursos e finanças.

Posso te mostrar como funciona? É bem rápido! ⚡`

        await sendWhatsAppMessage(lead.phone, message, lead.product)

        // Atualizar lead
        await supabase.from('sales_leads')
          .update({
            stage: 'contacted',
            last_contact_at: new Date().toISOString(),
            next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +24h
            followup_count: 0
          })
          .eq('id', lead.id)

        // Salvar conversa
        await supabase.from('sales_conversations').insert({
          lead_id: lead.id,
          direction: 'outbound',
          content: message,
          message_type: 'text',
          agent: 'hunter',
          ai_model: 'template_outbound'
        })

        processed++

      } catch (leadError) {
        console.error(`Erro ao contatar lead ${lead.id}:`, leadError)
      }
    }

    return NextResponse.json({
      processed,
      total: leads.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron outbound:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'online', job: 'outbound', description: 'Primeiro contato com leads scraped' })
}
