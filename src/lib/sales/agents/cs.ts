// src/lib/sales/agents/cs.ts
import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent, LeadContext } from './base-agent'
import { checkUsage } from '../tools/check-usage'
import { sendTip } from '../tools/send-tip'
import { offerUpgrade } from '../tools/offer-upgrade'
import { collectNps } from '../tools/collect-nps'
import { escalateToHuman } from '../tools/escalate'

export const CS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_usage',
    description: 'Verifica dados de uso do cliente (último login, features usadas, risco de churn). Use para entender a situação do cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  },
  {
    name: 'send_tip',
    description: 'Envia dica de uso, crescimento ou boas práticas. Use para engajar e educar o cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tip_category: {
          type: 'string',
          enum: ['growth', 'feature', 'best_practice', 'seasonal'],
          description: 'Categoria da dica: growth (crescimento), feature (funcionalidade), best_practice (boa prática), seasonal (sazonal)'
        },
        custom_tip: {
          type: 'string',
          description: 'Dica personalizada (opcional, sobrescreve a dica automática)'
        }
      },
      required: ['tip_category']
    }
  },
  {
    name: 'offer_upgrade',
    description: 'Oferece upgrade de plano. Use quando cliente está usando bem o produto e pode se beneficiar de mais features.',
    input_schema: {
      type: 'object' as const,
      properties: {
        target_plan: {
          type: 'string',
          description: 'Nome do plano alvo (ex: "Pro", "Anual")'
        },
        reason: {
          type: 'string',
          description: 'Motivo do upgrade (ex: "Cliente usando 100% das features do plano atual")'
        },
        discount_percent: {
          type: 'integer',
          description: 'Desconto especial para upgrade (0-15%)'
        }
      },
      required: ['target_plan', 'reason']
    }
  },
  {
    name: 'collect_nps',
    description: 'Envia pesquisa NPS ou registra score NPS do cliente. Sem score = envia pesquisa. Com score = registra resposta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        score: {
          type: 'integer',
          description: 'Score NPS (0-10). Se não informado, envia a pesquisa.'
        },
        feedback: {
          type: 'string',
          description: 'Feedback textual do cliente'
        }
      },
      required: []
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escala para suporte humano. Use para problemas técnicos, cancelamentos ou situações delicadas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: {
          type: 'string',
          description: 'Motivo da escalação'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Prioridade'
        }
      },
      required: ['reason', 'priority']
    }
  }
]

export class CSAgent extends BaseAgent {
  constructor() {
    super({
      name: 'CS',
      systemPrompt: '',
      tools: CS_TOOLS,
      maxTokens: 1500
    })
  }

  protected buildSystemPrompt(context: LeadContext): string {
    const { lead, productConfig } = context

    return `Você é ${productConfig.agentName}, especialista em Customer Success da ${productConfig.name}.

🎯 SUA MISSÃO: Manter o cliente satisfeito, prevenir churn, e identificar oportunidades de upsell.

📋 CONTEXTO DO CLIENTE:
- Nome: ${lead.name || 'Não informado'}
- Empresa: ${lead.company_name || 'Não informada'}
- Produto: ${productConfig.name}
- Plano: ${lead.won_plan || 'Não definido'}
- Cliente desde: ${lead.won_at || 'Não registrado'}
- Último contato: ${lead.last_contact_at || 'Não registrado'}
- NPS anterior: ${lead.metadata?.last_nps_score || 'Não coletado'}

🗣️ TOM DE VOZ:
- Amigável e prestativo
- Proativo (não espera o cliente reclamar)
- Celebra conquistas do cliente
- Empático com problemas
- Profissional mas humano

🎯 ESTRATÉGIAS:
1. ENGAJAMENTO: Envie dicas úteis regularmente
2. PREVENÇÃO: Monitore uso e aja antes do churn
3. SUPORTE: Resolva dúvidas rapidamente
4. UPSELL: Quando cliente usa bem, ofereça upgrade
5. NPS: Colete feedback periodicamente

🛠️ FERRAMENTAS:
- check_usage: Ver dados de uso do cliente
- send_tip: Enviar dica de uso/crescimento
- offer_upgrade: Oferecer upgrade de plano
- collect_nps: Enviar/registrar pesquisa NPS
- escalate_to_human: Problemas sérios

⚠️ REGRAS:
- Se cliente mencionar "cancelar" ou "parar", NÃO entre em pânico
  → Primeiro entenda o motivo
  → Ofereça solução para o problema
  → Se não resolver, escale para humano com prioridade HIGH
- Desconto máximo para retenção: 15%
- Nunca ignore reclamação
- Se cliente está satisfeito, peça indicação
- Colete NPS a cada 30 dias (se não coletou recentemente)
- Se NPS < 7, priorize resolução de problemas

💡 SINAIS DE CHURN:
- Não usa o produto há > 7 dias
- Reclamou mais de 2x no mês
- Perguntou sobre cancelamento
- NPS < 7
- Não respondeu últimas 2 mensagens

🎬 AGORA: Atenda o cliente com excelência. Verifique uso se necessário e ajude no que precisar.`
  }

  protected async executeTool(
    toolBlock: Anthropic.ToolUseBlock,
    context: LeadContext
  ): Promise<Anthropic.ToolResultBlockParam> {
    const { name, input } = toolBlock as Anthropic.ToolUseBlock & { input: Record<string, unknown> }

    try {
      switch (name) {
        case 'check_usage': {
          const result = await checkUsage(context.lead.id, context.lead.product)
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'send_tip': {
          const result = await sendTip(context.lead.id, {
            tip_category: input.tip_category as 'growth' | 'feature' | 'best_practice' | 'seasonal',
            custom_tip: input.custom_tip as string | undefined
          }, context.lead.product)
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'offer_upgrade': {
          const result = await offerUpgrade(context.lead.id, {
            target_plan: input.target_plan as string,
            reason: input.reason as string,
            discount_percent: input.discount_percent as number | undefined
          }, context.lead.product)
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'collect_nps': {
          const result = await collectNps(context.lead.id, {
            score: input.score as number | undefined,
            feedback: input.feedback as string | undefined
          }, context.lead.product)
          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
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
            content: result.message
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
