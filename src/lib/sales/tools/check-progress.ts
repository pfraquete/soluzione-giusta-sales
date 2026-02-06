// src/lib/sales/tools/check-progress.ts
import { createClient } from '@/lib/supabase/server'
import { getOnboardingSteps } from './complete-step'

export async function checkProgress(
  leadId: string,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string; progress: number; completedSteps: string[]; pendingSteps: string[] }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado', progress: 0, completedSteps: [], pendingSteps: [] }
    }

    const allSteps = getOnboardingSteps(product)
    const completedSteps: string[] = lead.metadata?.onboarding_completed_steps || []
    const pendingSteps = allSteps.filter(s => !completedSteps.includes(s))
    const progress = Math.round((completedSteps.length / allSteps.length) * 100)

    return {
      success: true,
      message: `Progresso: ${progress}% (${completedSteps.length}/${allSteps.length} passos). Concluídos: ${completedSteps.join(', ') || 'nenhum'}. Pendentes: ${pendingSteps.join(', ') || 'nenhum'}.`,
      progress,
      completedSteps,
      pendingSteps
    }

  } catch (error) {
    console.error('Erro ao verificar progresso:', error)
    throw error
  }
}
