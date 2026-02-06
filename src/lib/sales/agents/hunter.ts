// src/lib/sales/agents/hunter.ts
import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent, LeadContext } from './base-agent'
import { qualifyLead } from '../tools/qualify-lead'
import { transferToCloser } from '../tools/transfer-to-closer'
import { markAsNurture } from '../tools/mark-as-nurture'
import { escalateToHuman } from '../tools/escalate'
import { calculateLeadScore } from '../scoring'

export const HUNTER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'qualify_lead',
    description: 'Atualiza dados de qualificação do lead no CRM. Use após coletar informações BANT (Budget, Authority, Need, Timeline).',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Nome da empresa/ótica/igreja' },
        company_size: { 
          type: 'string', 
          enum: ['micro','small','medium','large'],
          description: 'Tamanho: micro (1-4), small (5-19), medium (20-99), large (100+)'
        },
        pain_points: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Problemas identificados do lead'
        },
        urgency: { 
          type: 'string', 
          enum: ['now','next_month','researching'],
          description: 'Urgência: now (quero já), next_month (mês que vem), researching (só pesquisando)'
        },
        score_adjustment: { 
          type: 'integer',
          description: 'Ajuste de score: +10 para muito interessado, -10 para pouco interessado'
        }
      },
      required: ['company_size', 'pain_points', 'urgency']
    }
  },
  {
    name: 'transfer_to_closer',
    description: 'Transfere lead qualificado (score >= 60) para o Agente Closer. Use quando lead demonstra interesse real e tem orçamento.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Por que está transferindo (ex: "Lead qualificado BANT, quer comprar esse mês")' },
        summary: { type: 'string', description: 'Resumo da conversa para o Closer (empresa, dores, orçamento)' }
      },
      required: ['reason', 'summary']
    }
  },
  {
    name: 'mark_as_nurture',
    description: 'Move lead para nurturing (lead morno). Use quando lead tem potencial mas não está pronto para comprar agora.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Por que está movendo para nurture (ex: "Só pesquisando, volta em 30 dias")' },
        next_contact_days: { 
          type: 'integer', 
          description: 'Dias até próximo contato (padrão: 30 dias)'
        }
      },
      required: ['reason']
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escala conversa para atendente humano. Use em casos complexos, reclamações, ou quando IA não consegue ajudar.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da escalação' },
        priority: { 
          type: 'string', 
          enum: ['low','medium','high'],
          description: 'Prioridade: high (problema sério), medium (dúvida complexa), low (caso simples)'
        }
      },
      required: ['reason', 'priority']
    }
  }
]

export class HunterAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Hunter',
      systemPrompt: '', // Será construído dinamicamente
      tools: HUNTER_TOOLS,
      maxTokens: 1500
    })
  }

  protected buildSystemPrompt(context: LeadContext): string {
    const { lead, productConfig } = context
    
    return `Você é ${productConfig.agentName}, especialista em vendas da ${productConfig.name}.

🎯 SUA MISSÃO: Qualificar leads e identificar oportunidades reais de venda.

📋 CONTEXTO DO LEAD:
- Nome: ${lead.name || 'Não informado'}
- Empresa: ${lead.company_name || 'Não informada'}
- Produto: ${productConfig.name}
- Estágio: ${lead.stage}
- Score atual: ${lead.score}

🗣️ TOM DE VOZ:
- Amigável e consultivo (não é vendedor agressivo)
- Direto e objetivo
- Empático com as dores do cliente
- Profissional mas próximo

🎯 SEU OBJETIVO:
1. Identificar se lead tem PROBLEMA REAL que ${productConfig.name} resolve
2. Descobrir se tem ORÇAMENTO/INVESTIMENTO disponível
3. Entender URGÊNCIA (quer resolver quando?)
4. Qualificar com método BANT

🛠️ FERRAMENTAS DISPONÍVEIS:
- qualify_lead: Registrar qualificação no CRM
- transfer_to_closer: Passar lead quente (score >= 60)
- mark_as_nurture: Lead morno (voltar depois)
- escalate_to_human: Caso complexo

⚠️ REGRAS IMPORTANTES:
- NUNCA prometa descontos sem autorização
- NUNCA diga preços exatos (só faixas)
- SEMPRE escute antes de vender
- Se lead disser "não tenho interesse", respeite e marque como nurture
- Se lead estiver irritado/reclamando, escale imediatamente

💡 DICAS DE OBJEÇÕES:
${productConfig.objections.slice(0, 3).map(o => `- "${o.trigger}": ${o.response.substring(0, 100)}...`).join('\n')}

💰 PLANOS E PREÇOS (para referência):
${productConfig.plans.map(p => `- ${p.name}: R$ ${(p.price/100).toFixed(2)}/mês`).join('\n')}

🎬 AGORA: Converse naturalmente, faça perguntas abertas para entender a situação do lead, e use as ferramentas quando tiver informações suficientes.`
  }

  protected async executeTool(
    toolBlock: Anthropic.ToolUseBlock,
    context: LeadContext
  ): Promise<Anthropic.ToolResultBlockParam> {
    const { name, input } = toolBlock as Anthropic.ToolUseBlock & { input: Record<string, unknown> }
    
    try {
      switch (name) {
        case 'qualify_lead': {
          const result = await qualifyLead(context.lead.id, {
            company_name: input.company_name as string | undefined,
            company_size: input.company_size as 'micro' | 'small' | 'medium' | 'large',
            pain_points: input.pain_points as string[],
            urgency: input.urgency as 'now' | 'next_month' | 'researching',
            score_adjustment: input.score_adjustment as number | undefined
          })
          
          // Recalcular score
          const newScore = calculateLeadScore({
            ...context.lead,
            company_size: input.company_size as string,
            pain_points: input.pain_points as string[],
            urgency: input.urgency as string,
            score: context.lead.score + (input.score_adjustment as number || 0)
          })
          
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Lead qualificado com sucesso! Novo score: ${newScore}. ${result.message}`
          }
        }
        
        case 'transfer_to_closer': {
          const result = await transferToCloser(context.lead.id, {
            reason: input.reason as string,
            summary: input.summary as string
          })
          
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Lead transferido para o Closer! ${result.message}`
          }
        }
        
        case 'mark_as_nurture': {
          const result = await markAsNurture(context.lead.id, {
            reason: input.reason as string,
            next_contact_days: input.next_contact_days as number | undefined
          })
          
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Lead movido para nurturing. ${result.message}`
          }
        }
        
        case 'escalate_to_human': {
          const result = await escalateToHuman(context.lead.id, {
            reason: input.reason as string,
            priority: input.priority as 'low' | 'medium' | 'high'
          })
          
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: `Caso escalado para humano! ${result.message}`
          }
        }
        
        default:
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: 'Tool não reconhecida',
            is_error: true
          }
      }
    } catch (error) {
      return {
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: `Erro ao executar tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
        is_error: true
      }
    }
  }
}