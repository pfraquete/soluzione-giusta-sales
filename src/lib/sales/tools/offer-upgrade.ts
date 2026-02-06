// src/lib/sales/tools/offer-upgrade.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'
import { getProductConfig, formatPrice } from '../product-config'

interface OfferUpgradeInput {
  target_plan: string
  reason: string
  discount_percent?: number
}

export async function offerUpgrade(
  leadId: string,
  input: OfferUpgradeInput,
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
    const targetPlan = config.plans.find(p => p.name.toLowerCase() === input.target_plan.toLowerCase())

    if (!targetPlan) {
      return { success: false, message: `Plano "${input.target_plan}" não encontrado` }
    }

    const discount = Math.min(input.discount_percent || 0, 15)
    const finalPrice = targetPlan.price - Math.round(targetPlan.price * discount / 100)

    const upgradeMessage = product === 'occhiale'
      ? `🚀 *Upgrade Especial para Você!*

Olá, ${lead.name || 'amigo(a)'}! Percebi que sua ótica está crescendo bastante. Que tal potencializar ainda mais?

*Plano ${targetPlan.name}* — Tudo que você tem hoje, mais:
${targetPlan.features.slice(-3).map((f: string) => `✨ ${f}`).join('\n')}

💰 *Investimento:* ${discount > 0 ? `~${formatPrice(targetPlan.price)}~ → ` : ''}*${formatPrice(finalPrice)}/mês*
${discount > 0 ? `🎉 Desconto especial de ${discount}% por ser nosso cliente!` : ''}

Quer saber mais sobre o upgrade? 😊`
      : `🚀 *Upgrade Especial para sua Igreja!*

Pastor(a) ${lead.name || ''}! O EKKLE está fazendo diferença na gestão da igreja. Que tal ir além?

*Plano ${targetPlan.name}* — Tudo que vocês têm hoje, mais:
${targetPlan.features.slice(-3).map((f: string) => `✨ ${f}`).join('\n')}

💰 *Investimento:* ${discount > 0 ? `~${formatPrice(targetPlan.price)}~ → ` : ''}*${formatPrice(finalPrice)}*
${discount > 0 ? `🎉 Desconto especial de ${discount}% por serem nossos parceiros!` : ''}

Quer saber mais? 🙏`

    await sendWhatsAppMessage(lead.phone, upgradeMessage, product)

    // Registrar
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[UPGRADE OFFER] Plano ${targetPlan.name} — ${formatPrice(finalPrice)}`,
      message_type: 'text',
      agent: 'cs',
      tools_called: ['offer_upgrade']
    })

    return {
      success: true,
      message: `Oferta de upgrade para plano ${targetPlan.name} enviada! Valor: ${formatPrice(finalPrice)}.`
    }

  } catch (error) {
    console.error('Erro ao oferecer upgrade:', error)
    throw error
  }
}
