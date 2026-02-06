// src/lib/sales/message-processor.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from './evolution-client'
import { getProductConfig } from './product-config'
import { SalesLead, ConversationMessage } from './agents/base-agent'

import { BaseAgent } from './agents/base-agent'
import { HunterAgent } from './agents/hunter'
import { CloserAgent } from './agents/closer'
import { OnboardingAgent } from './agents/onboarding'
import { CSAgent } from './agents/cs'

export async function processSalesMessage(
  phone: string,
  message: string,
  product: 'occhiale' | 'ekkle'
) {
  const supabase = createClient()

  try {
    // 1. Buscar ou criar lead
    let { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('phone', phone)
      .eq('product', product)
      .single()

    if (!lead) {
      console.log(`Criando novo lead: ${phone} (${product})`)
      
      const { data, error } = await supabase
        .from('sales_leads')
        .insert({
          phone,
          product,
          source: 'inbound_whatsapp',
          stage: 'new',
          assigned_agent: 'hunter',
          score: 0,
          followup_count: 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erro ao criar lead:', error)
        return
      }
      
      lead = data as SalesLead
    }

    // 2. Carregar histórico de conversas (últimas 50)
    const { data: history } = await supabase
      .from('sales_conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
      .limit(50)

    // 3. Salvar mensagem recebida
    await supabase.from('sales_conversations').insert({
      lead_id: lead.id,
      direction: 'inbound',
      content: message,
      message_type: 'text',
      agent: lead.assigned_agent
    })

    // 4. Detectar intenção e objeções para enriquecer contexto
    const intent = classifyIntent(message)
    const objection = detectObjection(message)

    // 4.1 Atualizar metadata do lead com intenção/objeção
    if (objection) {
      const currentObjections: string[] = lead.objections || []
      if (!currentObjections.includes(objection)) {
        currentObjections.push(objection)
        await supabase.from('sales_leads')
          .update({ objections: currentObjections })
          .eq('id', lead.id)
        lead.objections = currentObjections
      }
    }

    // 5. Selecionar agente pelo estágio
    const agent = selectAgent(lead.stage)

    // 6. Carregar configuração do produto
    const productConfig = getProductConfig(product)

    // 7. Processar com IA
    const reply = await agent.processMessage(message, {
      lead: lead as SalesLead,
      conversationHistory: (history || []) as ConversationMessage[],
      productConfig
    })

    // 8. Enviar via Evolution API
    await sendWhatsAppMessage(phone, reply, product)

    // 9. Salvar resposta
    await supabase.from('sales_conversations').insert({
      lead_id: lead.id,
      direction: 'outbound',
      content: reply,
      message_type: 'text',
      agent: lead.assigned_agent,
      ai_model: 'claude-sonnet-4-20250514'
    })

    // 10. Atualizar last_contact e resetar followup se inbound
    await supabase
      .from('sales_leads')
      .update({ 
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Resetar followup count quando lead responde
        followup_count: 0,
        next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', lead.id)

    // 11. Atualizar métricas diárias
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('sales_metrics')
      .upsert({
        date: today,
        product,
        messages_in: 1,
        messages_out: 1
      }, {
        onConflict: 'date,product'
      })

    console.log(`Mensagem processada para ${phone} (${product}): ${reply.substring(0, 100)}...`)

  } catch (error) {
    console.error('Erro ao processar mensagem de vendas:', error)
    
    // Resposta de fallback
    const fallbackMsg = product === 'occhiale' 
      ? 'Olá! Sou a Ana da Occhiale. Estou com uma instabilidade no momento, mas logo volto para te ajudar! 😊'
      : 'Oi! Sou a Sofia do EKKLE. Estou com um probleminha técnico, mas já volto para continuar nossa conversa! ⚡'
    
    await sendWhatsAppMessage(phone, fallbackMsg, product)
  }
}

function selectAgent(stage: string): BaseAgent {
  switch (stage) {
    case 'new':
    case 'contacted':
    case 'qualifying':
    case 'scraped':
    case 'nurturing':
      return new HunterAgent()
      
    case 'qualified':
    case 'presenting':
    case 'negotiating':
      return new CloserAgent()
      
    case 'won':
      return new OnboardingAgent()
      
    case 'active':
      return new CSAgent()
      
    default:
      return new HunterAgent()
  }
}

// Helper para classificar intenção da mensagem
export function classifyIntent(message: string): string {
  const msg = message.toLowerCase()
  
  if (msg.includes('preço') || msg.includes('valor') || msg.includes('custa')) {
    return 'pricing_inquiry'
  }
  
  if (msg.includes('demo') || msg.includes('teste') || msg.includes('ver')) {
    return 'demo_request'
  }
  
  if (msg.includes('não') && (msg.includes('interesse') || msg.includes('quero'))) {
    return 'not_interested'
  }
  
  if (msg.includes('sim') || msg.includes('quero') || msg.includes('interessante')) {
    return 'interested'
  }
  
  if (msg.includes('obrigad') || msg.includes('valeu') || msg.includes('tchau')) {
    return 'goodbye'
  }

  if (msg.includes('cancelar') || msg.includes('parar') || msg.includes('desistir')) {
    return 'cancel_request'
  }

  if (/^\d{1,2}$/.test(msg.trim())) {
    return 'nps_response'
  }
  
  return 'general_inquiry'
}

// Helper para detectar objeções
export function detectObjection(message: string): string | null {
  const msg = message.toLowerCase()
  
  if (msg.includes('caro') || msg.includes('preço alto') || msg.includes('muito dinheiro')) {
    return 'price_objection'
  }
  
  if (msg.includes('já tenho') || msg.includes('já uso')) {
    return 'already_have_solution'
  }
  
  if (msg.includes('não tenho tempo') || msg.includes('ocupado')) {
    return 'no_time'
  }
  
  if (msg.includes('preciso pensar') || msg.includes('vou analisar')) {
    return 'need_to_think'
  }
  
  if (msg.includes('não é pra mim') || msg.includes('não serve')) {
    return 'not_for_me'
  }

  if (msg.includes('não conheço') || msg.includes('nunca ouvi')) {
    return 'no_trust'
  }

  if (msg.includes('complicado') || msg.includes('difícil')) {
    return 'complexity_concern'
  }
  
  return null
}
