// src/lib/sales/tools/generate-proposal.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'
import { getProductConfig, formatPrice } from '../product-config'

interface GenerateProposalInput {
  plan: string
  discount_percent?: number
  billing?: 'monthly' | 'annual'
}

export async function generateProposal(
  leadId: string,
  input: GenerateProposalInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string; proposalText: string }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado', proposalText: '' }
    }

    const config = getProductConfig(product)
    const plan = config.plans.find(p => p.name.toLowerCase() === input.plan.toLowerCase())

    if (!plan) {
      return {
        success: false,
        message: `Plano "${input.plan}" não encontrado. Planos disponíveis: ${config.plans.map(p => p.name).join(', ')}`,
        proposalText: ''
      }
    }

    const discountPercent = Math.min(input.discount_percent || 0, 20)
    const originalPrice = plan.price
    const discountAmount = Math.round(originalPrice * discountPercent / 100)
    const finalPrice = originalPrice - discountAmount
    const billing = input.billing || 'monthly'

    const leadName = lead.name || 'amigo(a)'

    let proposalText: string

    if (product === 'occhiale') {
      proposalText = `📋 *PROPOSTA COMERCIAL — ${config.name.toUpperCase()}*

Olá, ${leadName}! Preparei uma proposta especial para você:

━━━━━━━━━━━━━━━━━━━━━━

*Plano ${plan.name}*
${plan.features.map((f: string) => `✅ ${f}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━

💰 *Investimento:*
${discountPercent > 0
        ? `~${formatPrice(originalPrice)}/mês~ → *${formatPrice(finalPrice)}/mês*\n🎉 Desconto especial de ${discountPercent}%!`
        : `*${formatPrice(finalPrice)}/mês*`
      }
${billing === 'annual' ? `\n📅 Pagamento anual: *${formatPrice(finalPrice * 10)}/ano* (economia de 2 meses!)` : ''}

━━━━━━━━━━━━━━━━━━━━━━

🚀 *O que você ganha:*
• Loja virtual no ar em até 3 dias
• Configuração completa pela nossa equipe
• Treinamento gratuito
• Suporte contínuo

💡 *Garantia:* 7 dias para testar. Se não gostar, devolvemos 100% do valor.

Quer seguir com essa proposta? Posso gerar o link de pagamento agora! 😊`
    } else {
      proposalText = `📋 *PROPOSTA COMERCIAL — ${config.name.toUpperCase()}*

Pastor(a) ${leadName}, preparei uma proposta especial:

━━━━━━━━━━━━━━━━━━━━━━

*Plano ${plan.name}*
${plan.features.map((f: string) => `✅ ${f}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━

💰 *Investimento:*
${discountPercent > 0
        ? `~${formatPrice(originalPrice)}~ → *${formatPrice(finalPrice)}*\n🎉 Desconto especial de ${discountPercent}%!`
        : `*${formatPrice(finalPrice)}*`
      }
${billing === 'annual' ? `\n📅 Pagamento anual com economia de 4 meses!` : ''}

━━━━━━━━━━━━━━━━━━━━━━

🚀 *O que a igreja ganha:*
• Plataforma ativa em até 48 horas
• Configuração completa pela nossa equipe
• Treinamento gratuito para líderes
• Suporte pastoral dedicado

💡 *Garantia:* 7 dias para testar. Se não servir para a igreja, devolvemos 100%.

Quer seguir com essa proposta? Posso gerar o link de pagamento agora! 🙏`
    }

    // Enviar proposta via WhatsApp
    await sendWhatsAppMessage(lead.phone, proposalText, product)

    // Salvar proposta no Supabase
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: proposalText,
      message_type: 'text',
      agent: 'closer',
      tools_called: ['generate_proposal']
    })

    // Atualizar estágio para negotiating
    if (lead.stage !== 'negotiating') {
      await supabase.from('sales_leads')
        .update({ stage: 'negotiating' })
        .eq('id', leadId)
    }

    return {
      success: true,
      message: `Proposta enviada! Plano ${plan.name} por ${formatPrice(finalPrice)}${discountPercent > 0 ? ` (${discountPercent}% de desconto)` : ''}.`,
      proposalText
    }

  } catch (error) {
    console.error('Erro ao gerar proposta:', error)
    throw error
  }
}
