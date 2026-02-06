// src/lib/sales/tools/qualify-lead.ts
import { createClient } from '@/lib/supabase/server'
import { calculateLeadScore } from '../scoring'

interface QualifyLeadInput {
  company_name?: string
  company_size: 'micro' | 'small' | 'medium' | 'large'
  pain_points: string[]
  urgency: 'now' | 'next_month' | 'researching'
  score_adjustment?: number
}

export async function qualifyLead(leadId: string, input: QualifyLeadInput) {
  const supabase = createClient()
  
  try {
    // Buscar lead atual
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()
    
    if (!lead) {
      throw new Error('Lead não encontrado')
    }
    
    // Calcular novo score baseado nos dados
    const baseScore = calculateLeadScore({
      ...lead,
      company_size: input.company_size,
      pain_points: input.pain_points,
      urgency: input.urgency
    })
    
    const finalScore = Math.min(100, Math.max(0, 
      baseScore + (input.score_adjustment || 0)
    ))
    
    // Determinar estágio baseado no score
    let newStage = lead.stage
    if (finalScore >= 60 && lead.stage === 'qualifying') {
      newStage = 'qualified'
    } else if (finalScore >= 40 && lead.stage === 'new') {
      newStage = 'qualifying'
    }
    
    // Atualizar lead
    const { error } = await supabase
      .from('sales_leads')
      .update({
        company_name: input.company_name || lead.company_name,
        company_size: input.company_size,
        pain_points: input.pain_points,
        stage: newStage,
        score: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      message: `Score atualizado para ${finalScore}/100. Estágio: ${newStage}`,
      score: finalScore,
      stage: newStage,
      shouldTransferToCloser: finalScore >= 60
    }
    
  } catch (error) {
    console.error('Erro ao qualificar lead:', error)
    throw error
  }
}