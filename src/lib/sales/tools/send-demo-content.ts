// src/lib/sales/tools/send-demo-content.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMedia, sendWhatsAppMessage } from '../evolution-client'

interface SendDemoInput {
  content_type: 'video_storefront' | 'video_whatsapp_agent' | 'video_dashboard' | 'screenshot_demo' | 'case_study'
  context?: string
}

// URLs dos conteúdos demo (configurar com URLs reais)
const DEMO_CONTENT: Record<string, Record<string, { url: string; caption: string; type: 'video' | 'image' | 'text' }>> = {
  occhiale: {
    video_storefront: {
      url: process.env.DEMO_VIDEO_OCCHIALE_STOREFRONT || 'https://occhiale.com.br/demo/storefront.mp4',
      caption: '🎬 Veja como fica a loja virtual da sua ótica! Seus clientes podem navegar pelos óculos, filtrar por categoria e finalizar a compra direto pelo WhatsApp.',
      type: 'video'
    },
    video_whatsapp_agent: {
      url: process.env.DEMO_VIDEO_OCCHIALE_WHATSAPP || 'https://occhiale.com.br/demo/whatsapp-agent.mp4',
      caption: '🤖 Olha só o atendente IA em ação! Ele responde dúvidas, mostra produtos e até agenda consultas. Tudo automaticamente, 24 horas por dia.',
      type: 'video'
    },
    video_dashboard: {
      url: process.env.DEMO_VIDEO_OCCHIALE_DASHBOARD || 'https://occhiale.com.br/demo/dashboard.mp4',
      caption: '📊 Este é o painel de controle. Você acompanha vendas, estoque, clientes e tudo mais em tempo real. Simples e intuitivo!',
      type: 'video'
    },
    screenshot_demo: {
      url: process.env.DEMO_SCREENSHOT_OCCHIALE || 'https://occhiale.com.br/demo/screenshot.png',
      caption: '📱 Veja como fica a loja no celular do seu cliente. Design profissional, rápido e fácil de navegar!',
      type: 'image'
    },
    case_study: {
      url: '',
      caption: '',
      type: 'text'
    }
  },
  ekkle: {
    video_storefront: {
      url: process.env.DEMO_VIDEO_EKKLE_CELLS || 'https://ekkle.com.br/demo/cells.mp4',
      caption: '🎬 Veja o módulo de gestão de células em ação! Relatórios automáticos, acompanhamento de frequência e multiplicação.',
      type: 'video'
    },
    video_whatsapp_agent: {
      url: process.env.DEMO_VIDEO_EKKLE_WHATSAPP || 'https://ekkle.com.br/demo/whatsapp.mp4',
      caption: '🤖 Olha a comunicação integrada! Envie avisos, receba pedidos de oração e acompanhe seus membros pelo WhatsApp.',
      type: 'video'
    },
    video_dashboard: {
      url: process.env.DEMO_VIDEO_EKKLE_DASHBOARD || 'https://ekkle.com.br/demo/dashboard.mp4',
      caption: '📊 O painel pastoral: crescimento da igreja, frequência, finanças e células. Tudo em um só lugar!',
      type: 'video'
    },
    screenshot_demo: {
      url: process.env.DEMO_SCREENSHOT_EKKLE || 'https://ekkle.com.br/demo/screenshot.png',
      caption: '📱 Veja como fica o app no celular dos líderes. Interface limpa, intuitiva e feita para quem não é da área de tecnologia!',
      type: 'image'
    },
    case_study: {
      url: '',
      caption: '',
      type: 'text'
    }
  }
}

// Case studies formatados para texto WhatsApp
const CASE_STUDIES_TEXT: Record<string, string> = {
  occhiale: `📋 *Case de Sucesso — Ótica Visão Clara (SP)*

📈 *Resultado:* 300% de aumento nas vendas online em 3 meses

_"O atendente IA do WhatsApp revolucionou nossa ótica. Agora vendemos até de madrugada!"_ — Maria Silva, proprietária

🔑 *O que mudou:*
• Loja virtual profissional no ar em 3 dias
• Atendente IA respondendo 80% das dúvidas automaticamente
• Clientes comprando pelo WhatsApp sem precisar ir na loja
• Faturamento online passou de R$ 0 para R$ 15.000/mês

Quer ver como ficaria para a sua ótica? 😊`,

  ekkle: `📋 *Case de Sucesso — Igreja Águas Vivas (SP)*

📈 *Resultado:* 40% de crescimento nas células em 6 meses

_"Com o EKKLE conseguimos identificar células que precisavam de apoio e as que estavam prontas para multiplicar. Resultado: crescimento estratégico!"_ — Pastor Ricardo

🔑 *O que mudou:*
• Relatórios de célula automáticos pelo celular
• Visão em tempo real do crescimento da igreja
• Economia de 15 horas semanais na administração
• Acompanhamento de novos convertidos sem perder ninguém

Quer ver como ficaria para a sua igreja? 🙏`
}

export async function sendDemoContent(
  leadId: string,
  input: SendDemoInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Buscar dados do lead
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('phone')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' }
    }

    const content = DEMO_CONTENT[product]?.[input.content_type]

    if (input.content_type === 'case_study') {
      // Case study é texto puro
      const caseText = CASE_STUDIES_TEXT[product] || 'Case de sucesso em breve!'
      await sendWhatsAppMessage(lead.phone, caseText, product)
    } else if (content) {
      if (content.type === 'text') {
        await sendWhatsAppMessage(lead.phone, content.caption, product)
      } else {
        // Enviar mídia (vídeo ou imagem)
        await sendWhatsAppMedia(
          lead.phone,
          content.url,
          content.caption,
          content.type === 'video' ? 'video' : 'image',
          product
        )
      }
    }

    // Registrar na conversa
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[DEMO: ${input.content_type}] ${content?.caption || CASE_STUDIES_TEXT[product]?.substring(0, 100) || ''}`,
      message_type: content?.type === 'video' ? 'video' : content?.type === 'image' ? 'image' : 'text',
      agent: 'closer',
      tools_called: ['send_demo_content']
    })

    return {
      success: true,
      message: `Conteúdo demo "${input.content_type}" enviado com sucesso! ${input.context ? `Contexto: ${input.context}` : ''}`
    }

  } catch (error) {
    console.error('Erro ao enviar demo content:', error)
    throw error
  }
}
