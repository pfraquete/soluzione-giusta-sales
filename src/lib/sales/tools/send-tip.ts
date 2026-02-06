// src/lib/sales/tools/send-tip.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '../evolution-client'

interface SendTipInput {
  tip_category: 'growth' | 'feature' | 'best_practice' | 'seasonal'
  custom_tip?: string
}

const TIPS: Record<string, Record<string, string[]>> = {
  occhiale: {
    growth: [
      `💡 *Dica de Crescimento*\n\nVocê sabia que óticas que postam 3x por semana no Instagram vendem 40% mais online? Tire fotos dos óculos com boa iluminação e poste com o link da sua loja! 📸`,
      `💡 *Dica de Crescimento*\n\nCrie um programa de indicação! Ofereça 10% de desconto para quem indicar um amigo. No Occhiale, você pode gerar cupons personalizados para cada cliente. 🎯`,
      `💡 *Dica de Crescimento*\n\nColoque um QR Code no balcão da loja apontando para sua loja virtual. Clientes que visitam a loja física também compram online depois! 📱`
    ],
    feature: [
      `🔧 *Feature que você pode não conhecer*\n\nNo painel, vá em Relatórios > Produtos Mais Vistos. Isso mostra quais óculos seus clientes mais olham online. Use para decidir o que colocar na vitrine! 📊`,
      `🔧 *Feature que você pode não conhecer*\n\nVocê pode configurar mensagens automáticas de aniversário para seus clientes! Vá em Configurações > Automações > Aniversário. 🎂`,
      `🔧 *Feature que você pode não conhecer*\n\nO agente IA pode enviar fotos de óculos similares quando o cliente descreve o que procura. Ative em Configurações > IA > Recomendações Visuais. 🤖`
    ],
    best_practice: [
      `✅ *Boa Prática*\n\nAtualize os preços e estoque pelo menos 1x por semana. Clientes que encontram preço errado ou produto indisponível não voltam. 📋`,
      `✅ *Boa Prática*\n\nResponda as avaliações dos clientes (positivas e negativas). Isso melhora sua reputação e o Google mostra sua loja para mais pessoas! ⭐`,
      `✅ *Boa Prática*\n\nUse fotos reais dos seus óculos, não fotos de catálogo. Clientes confiam mais em fotos tiradas na loja! 📸`
    ],
    seasonal: [
      `🌞 *Dica Sazonal*\n\nVerão chegando! É hora de destacar os óculos de sol na loja virtual. Crie uma categoria especial "Verão 2026" e coloque na página inicial! ☀️`,
      `🎄 *Dica Sazonal*\n\nNatal é a melhor época para óticas! Crie combos de presente (óculos + case + lenço de limpeza) com preço especial. 🎁`,
      `📚 *Dica Sazonal*\n\nVolta às aulas! Muitos pais procuram óculos para crianças nessa época. Destaque a categoria infantil na loja! 🎒`
    ]
  },
  ekkle: {
    growth: [
      `💡 *Dica de Crescimento*\n\nIgrejas que usam o relatório de célula semanalmente crescem 30% mais rápido. Incentive seus líderes a preencher toda semana! 📊`,
      `💡 *Dica de Crescimento*\n\nCrie um grupo de WhatsApp para líderes e compartilhe os insights do EKKLE semanalmente. Líderes informados multiplicam mais! 🙏`,
      `💡 *Dica de Crescimento*\n\nUse o módulo de visitantes para acompanhar novos convertidos. Nenhum novo membro deve ficar sem acompanhamento! 🌱`
    ],
    feature: [
      `🔧 *Feature que você pode não conhecer*\n\nNo EKKLE, você pode gerar relatórios automáticos para a diretoria. Vá em Relatórios > Agendar Envio e escolha semanal ou mensal. 📋`,
      `🔧 *Feature que você pode não conhecer*\n\nO módulo de pedidos de oração permite que membros enviem pedidos pelo app e os líderes acompanhem. Ative em Configurações > Oração! 🙏`,
      `🔧 *Feature que você pode não conhecer*\n\nVocê pode criar enquetes e pesquisas para a igreja direto pelo EKKLE. Ótimo para decidir horários de culto, temas de estudo, etc! 📝`
    ],
    best_practice: [
      `✅ *Boa Prática*\n\nFaça uma reunião mensal com os líderes mostrando os dados do EKKLE. Quando líderes veem os números, eles se engajam mais! 📊`,
      `✅ *Boa Prática*\n\nCadastre novos membros no mesmo dia da visita. Quanto mais rápido o acompanhamento, maior a chance de permanência! ⚡`,
      `✅ *Boa Prática*\n\nUse o financeiro do EKKLE para gerar relatórios de transparência. Membros que confiam na gestão contribuem mais! 💰`
    ],
    seasonal: [
      `🎄 *Dica Sazonal*\n\nFinal de ano é época de campanhas especiais! Use o EKKLE para organizar a campanha de Natal e acompanhar as metas. 🎁`,
      `📚 *Dica Sazonal*\n\nNovo semestre de EBD! Cadastre os novos cursos e turmas no EKKLE para ter controle de frequência desde o primeiro dia. 📖`,
      `🌱 *Dica Sazonal*\n\nInício de ano é ótimo para multiplicação de células! Use os dados do EKKLE para identificar quais células estão prontas. 🏠`
    ]
  }
}

export async function sendTip(
  leadId: string,
  input: SendTipInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('phone, metadata')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' }
    }

    let tipText: string

    if (input.custom_tip) {
      tipText = input.custom_tip
    } else {
      const categoryTips = TIPS[product]?.[input.tip_category] || []
      const tipsSent: number = lead.metadata?.tips_sent_count || 0
      const tipIndex = tipsSent % categoryTips.length
      tipText = categoryTips[tipIndex] || 'Dica em breve!'
    }

    await sendWhatsAppMessage(lead.phone, tipText, product)

    // Atualizar contador de dicas
    await supabase.from('sales_leads')
      .update({
        metadata: {
          ...lead.metadata,
          tips_sent_count: (lead.metadata?.tips_sent_count || 0) + 1,
          last_tip_at: new Date().toISOString(),
          last_tip_category: input.tip_category
        }
      })
      .eq('id', leadId)

    // Registrar na conversa
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[TIP: ${input.tip_category}] ${tipText.substring(0, 100)}...`,
      message_type: 'text',
      agent: 'cs',
      tools_called: ['send_tip']
    })

    return {
      success: true,
      message: `Dica de "${input.tip_category}" enviada com sucesso!`
    }

  } catch (error) {
    console.error('Erro ao enviar dica:', error)
    throw error
  }
}
