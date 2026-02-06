// src/app/api/sales/webhook/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/sales/evolution-client'
import { getProductConfig } from '@/lib/sales/product-config'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-hub-signature') || ''

    // Validar assinatura do webhook Pagar.me
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')

      if (signature !== `sha256=${expectedSignature}`) {
        console.warn('Webhook Pagar.me: assinatura inválida')
        // Não rejeitar em dev, apenas logar
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    console.log('Webhook Pagar.me recebido:', JSON.stringify(body, null, 2))

    const supabase = createClient()
    const event = body.type || body.event
    const order = body.data || body

    // Extrair metadata
    const metadata = order.metadata || order.order?.metadata || {}
    const leadId = metadata.lead_id
    const product = metadata.product as 'occhiale' | 'ekkle'
    const plan = metadata.plan

    if (!leadId) {
      console.warn('Webhook Pagar.me sem lead_id no metadata')
      return NextResponse.json({ ok: true, ignored: 'no_lead_id' })
    }

    // Buscar lead
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      console.warn(`Lead ${leadId} não encontrado`)
      return NextResponse.json({ ok: true, ignored: 'lead_not_found' })
    }

    const config = getProductConfig(product || lead.product)

    switch (event) {
      case 'order.paid':
      case 'charge.paid': {
        // PAGAMENTO CONFIRMADO!
        const amount = order.amount || order.charge?.amount || 0

        // Atualizar lead para WON
        await supabase.from('sales_leads')
          .update({
            stage: 'won',
            won_at: new Date().toISOString(),
            won_plan: plan || 'unknown',
            won_amount_cents: amount,
            assigned_agent: 'onboarding',
            metadata: {
              ...lead.metadata,
              pagarme_order_id: order.id,
              payment_confirmed_at: new Date().toISOString(),
              payment_method: order.charges?.[0]?.payment_method || 'unknown'
            }
          })
          .eq('id', leadId)

        // Registrar na conversa
        await supabase.from('sales_conversations').insert({
          lead_id: leadId,
          direction: 'outbound',
          content: `[PAYMENT CONFIRMED] Plano: ${plan} | Valor: R$ ${(amount / 100).toFixed(2)} | Método: ${order.charges?.[0]?.payment_method || 'N/A'}`,
          message_type: 'text',
          agent: 'system',
          tools_called: ['payment_webhook']
        })

        // Enviar mensagem de confirmação via WhatsApp
        const confirmMessage = product === 'occhiale'
          ? `🎉 *Pagamento Confirmado!*

${lead.name || 'Amigo(a)'}, seu pagamento foi confirmado com sucesso!

✅ *Plano:* ${plan}
💰 *Valor:* R$ ${(amount / 100).toFixed(2)}

🚀 *Próximos passos:*
Nossa equipe já vai começar a configurar sua loja virtual! Em breve você receberá as instruções de acesso.

Bem-vindo(a) ao ${config.name}! 🎊`
          : `🎉 *Pagamento Confirmado!*

Pastor(a) ${lead.name || ''}, o pagamento foi confirmado!

✅ *Plano:* ${plan}
💰 *Valor:* R$ ${(amount / 100).toFixed(2)}

🚀 *Próximos passos:*
Vamos configurar o ${config.name} para sua igreja! Em breve você receberá as instruções de acesso.

Bem-vindo(a) ao ${config.name}! 🙏🎊`

        await sendWhatsAppMessage(lead.phone, confirmMessage, product || lead.product)

        // Atualizar métricas
        const today = new Date().toISOString().split('T')[0]
        await supabase.from('sales_metrics')
          .upsert({
            date: today,
            product: product || lead.product,
            deals_won: 1,
            revenue_cents: amount
          }, {
            onConflict: 'date,product'
          })

        console.log(`VENDA CONFIRMADA! Lead ${leadId} — ${plan} — R$ ${(amount / 100).toFixed(2)}`)
        break
      }

      case 'order.payment_failed':
      case 'charge.payment_failed': {
        // Pagamento falhou
        const failMessage = product === 'occhiale'
          ? `⚠️ ${lead.name || 'Amigo(a)'}, parece que houve um problema com o pagamento. Não se preocupe! Pode tentar novamente pelo mesmo link, ou me diga se prefere outra forma de pagamento. 😊`
          : `⚠️ Pastor(a) ${lead.name || ''}, parece que houve um problema com o pagamento. Não se preocupe! Pode tentar novamente pelo mesmo link, ou me diga se prefere outra forma de pagamento. 🙏`

        await sendWhatsAppMessage(lead.phone, failMessage, product || lead.product)

        await supabase.from('sales_conversations').insert({
          lead_id: leadId,
          direction: 'outbound',
          content: `[PAYMENT FAILED] ${order.charges?.[0]?.last_transaction?.gateway_response?.message || 'Motivo desconhecido'}`,
          message_type: 'text',
          agent: 'system',
          tools_called: ['payment_webhook']
        })

        break
      }

      case 'order.canceled':
      case 'charge.refunded': {
        // Cancelamento/reembolso
        await supabase.from('sales_conversations').insert({
          lead_id: leadId,
          direction: 'outbound',
          content: `[PAYMENT ${event.includes('cancel') ? 'CANCELED' : 'REFUNDED'}]`,
          message_type: 'text',
          agent: 'system',
          tools_called: ['payment_webhook']
        })

        break
      }

      default:
        console.log(`Evento Pagar.me não tratado: ${event}`)
    }

    return NextResponse.json({ ok: true, event, lead_id: leadId })

  } catch (error) {
    console.error('Erro no webhook Pagar.me:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'pagarme-webhook',
    timestamp: new Date().toISOString()
  })
}
