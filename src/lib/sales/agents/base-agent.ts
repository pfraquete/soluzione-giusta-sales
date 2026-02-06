// src/lib/sales/agents/base-agent.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/sales/evolution-client'

export interface AgentConfig {
  name: string // 'Hunter' | 'Closer' | 'Onboarding' | 'CS'
  systemPrompt: string // Prompt específico do agente
  tools: Anthropic.Tool[] // Tools disponíveis para este agente
  maxTokens?: number
}

export interface SalesLead {
  id: string
  product: 'occhiale' | 'ekkle'
  name: string | null
  phone: string
  email: string | null
  company_name: string | null
  company_size: string | null
  city: string | null
  state: string | null
  stage: string
  score: number
  assigned_agent: string
  pain_points: string[]
  objections: string[]
  last_contact_at: string | null
  next_followup_at: string | null
  followup_count: number
  won_plan: string | null
  won_amount_cents: number | null
  lost_reason: string | null
  metadata: any
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  lead_id: string
  direction: 'inbound' | 'outbound'
  content: string
  message_type: string
  agent: string | null
  ai_model: string | null
  tools_called: string[]
  tokens_input: number | null
  tokens_output: number | null
  cost_cents: number | null
  created_at: string
}

export interface ProductConfig {
  id: 'occhiale' | 'ekkle'
  name: string
  agentName: string
  description: string
  targetAudience: string
  painPoints: string[]
  plans: Array<{
    name: string
    price: number
    features: string[]
  }>
  objections: Array<{
    trigger: string
    response: string
  }>
  caseStudies: Array<{
    company: string
    result: string
    quote: string
  }>
  competitorComparison: string
  evolutionInstance: string
  scrapingCNAE: string
  scrapingQuery: string
}

export interface LeadContext {
  lead: SalesLead
  conversationHistory: ConversationMessage[]
  productConfig: ProductConfig
}

export abstract class BaseAgent {
  protected anthropic: Anthropic
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })
    this.config = config
  }

  async processMessage(
    incomingMessage: string,
    context: LeadContext
  ): Promise<string> {
    // 1. Montar mensagens com histórico
    const messages = this.buildMessages(incomingMessage, context)

    // 2. Chamar Claude com tool use
    let response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.maxTokens || 1024,
      system: this.buildSystemPrompt(context),
      messages,
      tools: this.config.tools.length > 0 ? this.config.tools : undefined,
    })

    // 3. Loop de tool use (Claude pode chamar múltiplos tools)
    while (response.stop_reason === 'tool_use') {
      const toolBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )
      
      const toolResults = await Promise.all(
        toolBlocks.map(tb => this.executeTool(tb, context))
      )

      messages.push(
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      )

      response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens || 1024,
        system: this.buildSystemPrompt(context),
        messages,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
      })
    }

    // 4. Extrair texto final
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    )
    
    return textBlock?.text || ''
  }

  private buildMessages(
    incomingMessage: string,
    context: LeadContext
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = []

    // Incluir histórico recente (últimas 10 mensagens)
    const recentHistory = context.conversationHistory.slice(-10)
    
    for (const msg of recentHistory) {
      messages.push({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content
      })
    }

    // Adicionar mensagem atual
    messages.push({
      role: 'user',
      content: incomingMessage
    })

    return messages
  }

  // Cada agente implementa seus próprios tool executors
  protected abstract executeTool(
    toolBlock: Anthropic.ToolUseBlock,
    context: LeadContext
  ): Promise<Anthropic.ToolResultBlockParam>

  // Cada agente customiza o system prompt com contexto do lead
  protected abstract buildSystemPrompt(
    context: LeadContext
  ): string

  // Helper para salvar métricas
  protected async saveMetrics(
    toolsUsed: string[],
    inputTokens: number,
    outputTokens: number,
    context: LeadContext
  ) {
    const supabase = createClient()
    
    // Calcular custo aproximado (Sonnet 3.5: $3/$15 per 1M tokens)
    const costCents = (inputTokens * 0.3 + outputTokens * 1.5) / 1000

    await supabase.from('sales_conversations').insert({
      lead_id: context.lead.id,
      direction: 'outbound',
      content: '[AI Processing]',
      agent: this.config.name.toLowerCase(),
      ai_model: 'claude-3-5-sonnet-20241022',
      tools_called: toolsUsed,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      cost_cents: costCents
    })
  }
}