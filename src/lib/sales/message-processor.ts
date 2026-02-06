// src/lib/sales/message-processor.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from './evolution-client'
import { getProductConfig } from './product-config'
import { SalesLead, ConversationMessage } from './agents/base-agent'

import { BaseAgent } from './agents/base-agent'
import { HunterAgent } from './agents/hunter'
// import { CloserAgent } from './agents/closer'
// import { OnboardingAgent } from './agents/onboarding'
// import { CSAgent } from './agents/cs'

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

    // 4. Selecionar agente pelo estágio
    const agent = selectAgent(lead.stage)
    if (!agent) {
      console.log(`Agente ainda não implementado para stage: ${lead.stage}. Enviando mensagem padrão.`)
      
      // Resposta temporária enquanto agentes não estão implementados
      const productConfig = getProductConfig(product)
      const reply = product === 'occhiale' 
        ? `Olá! Sou a ${productConfig.agentName} da ${productConfig.name}. Estou sendo configurada e logo estarei pronta para te ajudar com nossa solução! 🚀`
        : `Oi! Sou a ${productConfig.agentName} do ${productConfig.name}. Estou em configuração e em breve vou poder te ajudar com nossa plataforma! ⚡`
      
      await sendWhatsAppMessage(phone, reply, product)
      
      await supabase.from('sales_conversations').insert({
        lead_id: lead.id,
        direction: 'outbound',
        content: reply,
        message_type: 'text',
        agent: 'system',
        ai_model: 'temporary_response'
      })
      
      return
    }

    // 5. Carregar configuração do produto
    const productConfig = getProductConfig(product)

    // 6. Processar com IA
    const reply = await agent.processMessage(message, {
      lead: lead as SalesLead,
      conversationHistory: (history || []) as ConversationMessage[],
      productConfig
    })

    // 7. Enviar via Evolution API
    await sendWhatsAppMessage(phone, reply, product)

    // 8. Salvar resposta
    await supabase.from('sales_conversations').insert({
      lead_id: lead.id,
      direction: 'outbound',
      content: reply,
      message_type: 'text',
      agent: lead.assigned_agent,
      ai_model: 'claude-3-5-sonnet-20241022'
    })

    // 9. Atualizar last_contact
    await supabase
      .from('sales_leads')
      .update({ 
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)

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

function selectAgent(stage: string): BaseAgent | null {
  switch (stage) {
    case 'new':
    case 'contacted':
    case 'qualifying':
      return new HunterAgent()
      
    case 'qualified':
    case 'presenting':
    case 'negotiating':
      // return new CloserAgent() // TASK 3
      return null
      
    case 'won':
      // return new OnboardingAgent() // TASK 6
      return null
      
    case 'active':
      // return new CSAgent() // TASK 6
      return null
      
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
  
  return null
}