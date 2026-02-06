// src/lib/sales/agents/closer.ts
import Anthropic from '@anthropic-ai/sdk'
import { BaseAgent, LeadContext } from './base-agent'
import { sendDemoContent } from '../tools/send-demo-content'
import { generateProposal } from '../tools/generate-proposal'
import { createPaymentLink } from '../tools/create-payment'
import { scheduleDemo } from '../tools/schedule-demo'
import { updateStage } from '../tools/update-stage'
import { escalateToHuman } from '../tools/escalate'

export const CLOSER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'send_demo_content',
    description: 'Envia vídeo demo, screenshot ou case de sucesso do produto. Use para mostrar o produto em ação e gerar desejo.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content_type: {
          type: 'string',
          enum: ['video_storefront', 'video_whatsapp_agent', 'video_dashboard', 'screenshot_demo', 'case_study'],
          description: 'Tipo de conteúdo: video_storefront (loja), video_whatsapp_agent (IA), video_dashboard (painel), screenshot_demo (tela), case_study (caso de sucesso)'
        },
        context: {
          type: 'string',
          description: 'Contexto de por que está enviando (ex: "Lead perguntou como funciona a loja")'
        }
      },
      required: ['content_type']
    }
  },
  {
    name: 'generate_proposal',
    description: 'Gera proposta comercial personalizada com plano, preço e desconto. Use quando lead demonstra interesse real em comprar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plan: {
          type: 'string',
          description: 'Nome do plano (ex: "Essencial", "Pro", "Mensal", "Anual")'
        },
        discount_percent: {
          type: 'integer',
          description: 'Percentual de desconto (0-20%). Use apenas se necessário para fechar.'
        },
        billing: {
          type: 'string',
          enum: ['monthly', 'annual'],
          description: 'Tipo de cobrança: mensal ou anual'
        }
      },
      required: ['plan']
    }
  },
  {
    name: 'create_payment_link',
    description: 'Cria link de pagamento Pagar.me e envia via WhatsApp. Use APENAS quando lead confirmar que quer comprar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plan: {
          type: 'string',
          description: 'Nome do plano'
        },
        amount_cents: {
          type: 'integer',
          description: 'Valor em centavos (ex: 19700 = R$ 197,00)'
        },
        customer_name: {
          type: 'string',
          description: 'Nome do cliente'
        },
        customer_email: {
          type: 'string',
          description: 'Email do cliente (para nota fiscal)'
        }
      },
      required: ['plan', 'amount_cents']
    }
  },
  {
    name: 'schedule_demo_call',
    description: 'Agenda chamada de demonstração com especialista humano. Use quando lead quer ver o produto ao vivo antes de decidir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        preferred_date: {
          type: 'string',
          description: 'Data preferida (formato: YYYY-MM-DD)'
        },
        preferred_time: {
          type: 'string',
          description: 'Horário preferido (formato: HH:MM)'
        }
      },
      required: ['preferred_date']
    }
  },
  {
    name: 'update_stage',
    description: 'Atualiza estágio do lead no pipeline. Use para registrar progresso ou resultado da negociação.',
    input_schema: {
      type: 'object' as const,
      properties: {
        new_stage: {
          type: 'string',
          enum: ['presenting', 'negotiating', 'won', 'lost'],
          description: 'Novo estágio: presenting (mostrando produto), negotiating (negociando), won (vendido!), lost (perdido)'
        },
        reason: {
          type: 'string',
          description: 'Motivo da mudança (obrigatório para "lost")'
        }
      },
      required: ['new_stage']
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escala para atendente humano. Use em negociações complexas, descontos acima de 20%, ou reclamações.',
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
          description: 'Prioridade da escalação'
        }
      },
      required: ['reason', 'priority']
    }
  }
]

export class CloserAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Closer',
      systemPrompt: '',
      tools: CLOSER_TOOLS,
      maxTokens: 2000
    })
  }

  protected buildSystemPrompt(context: LeadContext): string {
    const { lead, productConfig } = context

    return `Você é ${productConfig.agentName}, especialista em fechamento de vendas da ${productConfig.name}.

🎯 SUA MISSÃO: Apresentar o produto, tratar objeções e FECHAR A VENDA.

📋 CONTEXTO DO LEAD:
- Nome: ${lead.name || 'Não informado'}
- Empresa: ${lead.company_name || 'Não informada'}
- Tamanho: ${lead.company_size || 'Não informado'}
- Produto: ${productConfig.name}
- Estágio: ${lead.stage}
- Score: ${lead.score}
- Dores identificadas: ${lead.pain_points?.join(', ') || 'Nenhuma'}
- Objeções anteriores: ${lead.objections?.join(', ') || 'Nenhuma'}

🗣️ TOM DE VOZ:
- Consultivo e confiante (você SABE que o produto resolve o problema)
- Empático mas assertivo
- Usa storytelling e cases de sucesso
- Cria urgência sem ser agressivo
- Profissional e próximo

🎯 ESTRATÉGIA DE FECHAMENTO:
1. APRESENTAR: Mostre demos e cases relevantes para as dores do lead
2. PROPOR: Quando sentir interesse, gere proposta personalizada
3. TRATAR OBJEÇÕES: Use os scripts de objeção abaixo
4. FECHAR: Quando lead concordar, crie link de pagamento imediatamente
5. ALTERNATIVA: Se lead quiser ver ao vivo, agende demo com especialista

🛠️ FERRAMENTAS:
- send_demo_content: Enviar vídeos/screenshots/cases
- generate_proposal: Gerar proposta com preço
- create_payment_link: Criar link Pagar.me (SÓ quando lead confirmar compra)
- schedule_demo_call: Agendar demo ao vivo
- update_stage: Atualizar pipeline (won/lost/etc)
- escalate_to_human: Casos complexos

💰 PLANOS E PREÇOS:
${productConfig.plans.map(p => `- ${p.name}: ${(p.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês\n  Features: ${p.features.join(', ')}`).join('\n')}

💡 TRATAMENTO DE OBJEÇÕES:
${productConfig.objections.map(o => `- Gatilho: "${o.trigger}"\n  Resposta: ${o.response.substring(0, 150)}...`).join('\n\n')}

📊 CASES DE SUCESSO:
${productConfig.caseStudies.map(c => `- ${c.company}: ${c.result}\n  "${c.quote}"`).join('\n\n')}

⚠️ REGRAS:
- Desconto MÁXIMO de 20% (use só se necessário para fechar)
- NUNCA crie link de pagamento sem lead confirmar que quer comprar
- Se lead pedir desconto > 20%, escale para humano
- Se lead disser "não quero", respeite e marque como lost com motivo
- SEMPRE tente fechar antes de marcar como lost
- Use cases de sucesso para gerar confiança
- Crie senso de urgência: "vagas limitadas", "preço promocional"

🎬 AGORA: Continue a conversa de forma consultiva. Mostre valor, trate objeções e conduza para o fechamento.`
  }

  protected async executeTool(
    toolBlock: Anthropic.ToolUseBlock,
    context: LeadContext
  ): Promise<Anthropic.ToolResultBlockParam> {
    const { name, input } = toolBlock as Anthropic.ToolUseBlock & { input: Record<string, unknown> }

    try {
      switch (name) {
        case 'send_demo_content': {
          const result = await sendDemoContent(context.lead.id, {
            content_type: input.content_type as any,
            context: input.context as string | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'generate_proposal': {
          const result = await generateProposal(context.lead.id, {
            plan: input.plan as string,
            discount_percent: input.discount_percent as number | undefined,
            billing: input.billing as 'monthly' | 'annual' | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'create_payment_link': {
          const result = await createPaymentLink(context.lead.id, {
            plan: input.plan as string,
            amount_cents: input.amount_cents as number,
            customer_name: input.customer_name as string | undefined,
            customer_email: input.customer_email as string | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'schedule_demo_call': {
          const result = await scheduleDemo(context.lead.id, {
            preferred_date: input.preferred_date as string,
            preferred_time: input.preferred_time as string | undefined
          }, context.lead.product)

          return {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: result.message
          }
        }

        case 'update_stage': {
          const result = await updateStage(context.lead.id, {
            new_stage: input.new_stage as 'presenting' | 'negotiating' | 'won' | 'lost',
            reason: input.reason as string | undefined
          })

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
