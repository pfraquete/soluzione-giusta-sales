// src/lib/sales/agents/onboarding.ts
import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent, LeadContext } from './base-agent'
import { completeStep } from '../tools/complete-step'
import { sendTutorial } from '../tools/send-tutorial'
import { checkProgress } from '../tools/check-progress'
import { escalateToHuman } from '../tools/escalate'

export const ONBOARDING_TOOLS: Anthropic.Tool[] = [
  {
    name: 'complete_step',
    description: 'Marca um passo do onboarding como concluído. Use quando o cliente completar uma etapa de configuração.',
    input_schema: {
      type: 'object' as const,
      properties: {
        step_name: {
          type: 'string',
          description: 'Nome do passo concluído (ex: "welcome", "store_setup", "products_upload", etc.)'
        },
        notes: {
          type: 'string',
          description: 'Observações sobre a conclusão do passo'
        }
      },
      required: ['step_name']
    }
  },
  {
    name: 'send_tutorial',
    description: 'Envia tutorial/guia do próximo passo do onboarding. Use para orientar o cliente sobre o que fazer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        step_name: {
          type: 'string',
          description: 'Nome do passo para enviar tutorial'
        },
        format: {
          type: 'string',
          enum: ['text', 'video', 'image'],
          description: 'Formato do tutorial (padrão: text)'
        }
      },
      required: ['step_name']
    }
  },
  {
    name: 'check_progress',
    description: 'Verifica o progresso atual do onboarding. Use para saber quais passos foram concluídos e quais faltam.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escala para suporte humano. Use quando o cliente tiver problemas técnicos ou dúvidas complexas.',
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

export class OnboardingAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Onboarding',
      systemPrompt: '',
      tools: ONBOARDING_TOOLS,
      maxTokens: 1500
    })
  }

  protected buildSystemPrompt(context: LeadContext): string {
    const { lead, productConfig } = context
    const completedSteps: string[] = lead.metadata?.onboarding_completed_steps || []
    const progress = lead.metadata?.onboarding_progress || 0

    return `Você é ${productConfig.agentName}, especialista em onboarding da ${productConfig.name}.

🎯 SUA MISSÃO: Guiar o novo cliente pela configuração completa do produto até ele estar 100% ativo.

📋 CONTEXTO DO CLIENTE:
- Nome: ${lead.name || 'Não informado'}
- Empresa: ${lead.company_name || 'Não informada'}
- Produto: ${productConfig.name}
- Plano: ${lead.won_plan || 'Não definido'}
- Progresso onboarding: ${progress}%
- Passos concluídos: ${completedSteps.join(', ') || 'Nenhum'}

🗣️ TOM DE VOZ:
- Paciente e didático (como um professor)
- Celebra cada conquista do cliente
- Proativo em oferecer ajuda
- Simplifica termos técnicos
- Usa emojis com moderação para ser amigável

🎯 FLUXO DE ONBOARDING:
${productConfig.id === 'occhiale' ? `
1. welcome — Boas-vindas e acesso ao painel
2. store_setup — Configurar loja virtual (nome, logo, cores)
3. products_upload — Cadastrar produtos (fotos, preços)
4. whatsapp_connect — Conectar WhatsApp Business
5. ai_agent_config — Configurar agente IA
6. payment_setup — Configurar recebimentos
7. first_sale — Realizar primeira venda
8. training_complete — Treinamento final` : `
1. welcome — Boas-vindas e acesso
2. church_setup — Dados da igreja
3. cells_import — Importar células
4. members_import — Importar membros
5. leaders_invite — Convidar líderes
6. courses_setup — Configurar cursos/EBD
7. finance_setup — Configurar financeiro
8. training_complete — Treinamento final`}

🛠️ FERRAMENTAS:
- complete_step: Marcar passo como concluído
- send_tutorial: Enviar guia do próximo passo
- check_progress: Ver progresso atual
- escalate_to_human: Problemas técnicos

⚠️ REGRAS:
- SEMPRE verifique o progresso antes de sugerir próximo passo
- Envie o tutorial do passo ANTES de pedir informações
- Celebre cada passo concluído com entusiasmo
- Se cliente ficar parado > 24h, envie lembrete gentil
- Se tiver problema técnico, escale imediatamente
- Objetivo: completar onboarding em até 7 dias

🎬 AGORA: Verifique o progresso e guie o cliente para o próximo passo.`
  }

  protected async executeTool(
    toolBlock: Anthropic.ToolUseBlock,
    context: LeadContext
  ): Promise<Anthropic.ToolResultBlockParam> {
    const { name, input } = toolBlock as Anthropic.ToolUseBlock & { input: Record<string, unknown> }

    try {
      switch (name) {
        case 'complete_step': {
          const result = await completeStep(context.lead.id, {
            step_name: input.step_name as string,
            notes: input.notes as string | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'send_tutorial': {
          const result = await sendTutorial(context.lead.id, {
            step_name: input.step_name as string,
            format: input.format as 'text' | 'video' | 'image' | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'check_progress': {
          const result = await checkProgress(context.lead.id, context.lead.product)

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
