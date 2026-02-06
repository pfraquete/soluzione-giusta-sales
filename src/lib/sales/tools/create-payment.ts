// src/lib/sales/tools/create-payment.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'
import { getProductConfig, formatPrice } from '../product-config'

interface CreatePaymentInput {
  plan: string
  amount_cents: number
  customer_name?: string
  customer_email?: string
}

interface PagarmeOrderResponse {
  id: string
  status: string
  checkouts: Array<{
    id: string
    payment_url: string
  }>
}

export async function createPaymentLink(
  leadId: string,
  input: CreatePaymentInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string; paymentUrl?: string }> {
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
    const customerName = input.customer_name || lead.name || 'Cliente'
    const customerEmail = input.customer_email || lead.email || ''

    // Criar pedido na Pagar.me
    const pagarmeApiKey = process.env.PAGARME_API_KEY
    if (!pagarmeApiKey) {
      console.error('PAGARME_API_KEY não configurada')
      return { success: false, message: 'Sistema de pagamento não configurado' }
    }

    const orderPayload = {
      items: [
        {
          amount: input.amount_cents,
          description: `${config.name} — Plano ${input.plan}`,
          quantity: 1,
          code: `${product}-${input.plan.toLowerCase().replace(/\s/g, '-')}`
        }
      ],
      customer: {
        name: customerName,
        email: customerEmail || undefined,
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: lead.phone.substring(0, 2),
            number: lead.phone.substring(2)
          }
        }
      },
      payments: [
        {
          payment_method: 'checkout',
          checkout: {
            expires_in: 172800, // 48 horas
            billing_address_editable: false,
            customer_editable: true,
            accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
            success_url: `https://app.${product === 'occhiale' ? 'occhiale.com.br' : 'ekkle.com.br'}/welcome?lead=${leadId}`,
            credit_card: {
              installments: [
                { number: 1, total: input.amount_cents },
                { number: 2, total: input.amount_cents },
                { number: 3, total: input.amount_cents }
              ]
            },
            pix: {
              expires_in: 86400 // 24 horas
            }
          }
        }
      ],
      metadata: {
        lead_id: leadId,
        product,
        plan: input.plan,
        source: 'sales_machine_v2'
      }
    }

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
      },
      body: JSON.stringify(orderPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pagar.me error:', errorText)
      return { success: false, message: 'Erro ao criar link de pagamento. Tente novamente.' }
    }

    const order: PagarmeOrderResponse = await response.json()
    const paymentUrl = order.checkouts?.[0]?.payment_url

    if (!paymentUrl) {
      return { success: false, message: 'Link de pagamento não gerado. Tente novamente.' }
    }

    // Enviar link via WhatsApp
    const paymentMessage = product === 'occhiale'
      ? `💳 *Link de Pagamento — ${config.name}*

Aqui está o link para finalizar sua assinatura do *Plano ${input.plan}*:

🔗 ${paymentUrl}

💰 Valor: *${formatPrice(input.amount_cents)}*

✅ Aceita: Cartão de crédito, PIX e boleto
⏰ Link válido por 48 horas

Após o pagamento, nossa equipe já começa a configurar sua loja! 🚀

Qualquer dúvida, é só me chamar! 😊`
      : `💳 *Link de Pagamento — ${config.name}*

Pastor(a), aqui está o link para ativar o EKKLE na sua igreja:

🔗 ${paymentUrl}

💰 Valor: *${formatPrice(input.amount_cents)}*

✅ Aceita: Cartão de crédito, PIX e boleto
⏰ Link válido por 48 horas

Após o pagamento, já iniciamos a configuração da plataforma para sua igreja! 🙏

Qualquer dúvida, estou aqui! ⚡`

    await sendWhatsAppMessage(lead.phone, paymentMessage, product)

    // Salvar no Supabase
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[PAYMENT LINK] ${paymentUrl} — Plano ${input.plan} — ${formatPrice(input.amount_cents)}`,
      message_type: 'text',
      agent: 'closer',
      tools_called: ['create_payment_link']
    })

    // Salvar referência do pedido no lead metadata
    await supabase.from('sales_leads')
      .update({
        metadata: {
          ...lead.metadata,
          last_pagarme_order_id: order.id,
          last_payment_url: paymentUrl,
          last_payment_plan: input.plan,
          last_payment_amount: input.amount_cents
        }
      })
      .eq('id', leadId)

    return {
      success: true,
      message: `Link de pagamento enviado! Plano ${input.plan} — ${formatPrice(input.amount_cents)}. Link: ${paymentUrl}`,
      paymentUrl
    }

  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error)
    throw error
  }
}
