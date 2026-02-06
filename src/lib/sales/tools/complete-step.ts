// src/lib/sales/tools/complete-step.ts
import { createClient } from '@/lib/supabase/server'

interface CompleteStepInput {
  step_name: string
  notes?: string
}

// Passos de onboarding por produto
const ONBOARDING_STEPS: Record<string, string[]> = {
  occhiale: [
    'welcome',           // Boas-vindas e acesso
    'store_setup',       // Configurar loja virtual
    'products_upload',   // Cadastrar produtos
    'whatsapp_connect',  // Conectar WhatsApp
    'ai_agent_config',   // Configurar agente IA
    'payment_setup',     // Configurar pagamentos
    'first_sale',        // Primeira venda
    'training_complete'  // Treinamento concluído
  ],
  ekkle: [
    'welcome',           // Boas-vindas e acesso
    'church_setup',      // Configurar dados da igreja
    'cells_import',      // Importar células
    'members_import',    // Importar membros
    'leaders_invite',    // Convidar líderes
    'courses_setup',     // Configurar cursos/EBD
    'finance_setup',     // Configurar financeiro
    'training_complete'  // Treinamento concluído
  ]
}

export async function completeStep(
  leadId: string,
  input: CompleteStepInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string; progress: number }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado', progress: 0 }
    }

    const steps = ONBOARDING_STEPS[product] || []
    const completedSteps: string[] = lead.metadata?.onboarding_completed_steps || []

    // Adicionar step se ainda não foi completado
    if (!completedSteps.includes(input.step_name)) {
      completedSteps.push(input.step_name)
    }

    const progress = Math.round((completedSteps.length / steps.length) * 100)

    // Atualizar metadata do lead
    await supabase.from('sales_leads')
      .update({
        metadata: {
          ...lead.metadata,
          onboarding_completed_steps: completedSteps,
          onboarding_progress: progress,
          onboarding_last_step: input.step_name,
          onboarding_last_step_at: new Date().toISOString()
        },
        // Se completou todos os passos, mover para active
        ...(progress >= 100 ? { stage: 'active', assigned_agent: 'cs' } : {})
      })
      .eq('id', leadId)

    // Registrar na conversa
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[ONBOARDING] Step "${input.step_name}" concluído. Progresso: ${progress}%${input.notes ? ` | Notas: ${input.notes}` : ''}`,
      message_type: 'text',
      agent: 'onboarding',
      tools_called: ['complete_step']
    })

    const nextStepIndex = steps.indexOf(input.step_name) + 1
    const nextStep = nextStepIndex < steps.length ? steps[nextStepIndex] : null

    return {
      success: true,
      message: `Step "${input.step_name}" concluído! Progresso: ${progress}%.${nextStep ? ` Próximo: "${nextStep}".` : ' ONBOARDING COMPLETO! Cliente movido para CS.'}`,
      progress
    }

  } catch (error) {
    console.error('Erro ao completar step:', error)
    throw error
  }
}

export function getOnboardingSteps(product: 'occhiale' | 'ekkle'): string[] {
  return ONBOARDING_STEPS[product] || []
}
