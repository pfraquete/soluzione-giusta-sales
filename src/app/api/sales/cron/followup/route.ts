// src/app/api/sales/cron/followup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processSalesMessage } from '@/lib/sales/message-processor'

export async function POST(req: NextRequest) {
  // Validar CRON_SECRET
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  try {
    // Buscar leads que precisam de follow-up
    const { data: leads } = await supabase
      .from('sales_leads')
      .select('*')
      .in('stage', ['contacted', 'qualifying', 'presenting'])
      .lt('next_followup_at', new Date().toISOString())
      .lt('followup_count', 3) // Máximo 3 follow-ups
      .order('next_followup_at', { ascending: true })
      .limit(20)

    if (!leads?.length) {
      return NextResponse.json({ processed: 0, message: 'Nenhum follow-up pendente' })
    }

    let processed = 0

    for (const lead of leads) {
      try {
        // Rate limit: 3 segundos entre mensagens
        await new Promise(r => setTimeout(r, 3000))

        // Gerar follow-up contextual via Claude
        // O message-processor vai usar o agente correto baseado no stage
        const followupMsg = `[FOLLOW-UP #${lead.followup_count + 1}] Retomando contato automaticamente.`
        await processSalesMessage(lead.phone, followupMsg, lead.product)

        // Atualizar contadores
        await supabase.from('sales_leads')
          .update({
            followup_count: lead.followup_count + 1,
            next_followup_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000 // +24h
            ).toISOString(),
          })
          .eq('id', lead.id)

        processed++

      } catch (leadError) {
        console.error(`Erro no follow-up do lead ${lead.id}:`, leadError)
      }
    }

    return NextResponse.json({
      processed,
      total: leads.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron followup:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'online', job: 'followup', description: 'Follow-up leads sem resposta' })
}
