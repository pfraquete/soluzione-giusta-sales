// src/lib/sales/tools/check-usage.ts
import { createClient } from '@/lib/supabase/server'

export async function checkUsage(
  leadId: string,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string; usageData: Record<string, any> }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado', usageData: {} }
    }

    // Buscar métricas de uso do metadata ou de tabelas específicas do SaaS
    const usageData = lead.metadata?.usage || {}
    const lastLogin = usageData.last_login || 'Não registrado'
    const daysActive = usageData.days_active || 0
    const featureUsage = usageData.features_used || []

    // Calcular risco de churn
    const daysSinceLastContact = lead.last_contact_at
      ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    let churnRisk: 'low' | 'medium' | 'high' = 'low'
    if (daysSinceLastContact > 30) churnRisk = 'high'
    else if (daysSinceLastContact > 14) churnRisk = 'medium'

    const message = `Uso do cliente:
- Último login: ${lastLogin}
- Dias ativos: ${daysActive}
- Features usadas: ${featureUsage.length > 0 ? featureUsage.join(', ') : 'Nenhuma registrada'}
- Dias desde último contato: ${daysSinceLastContact}
- Risco de churn: ${churnRisk}
- Plano: ${lead.won_plan || 'Não definido'}
- Cliente desde: ${lead.won_at || lead.created_at}`

    return {
      success: true,
      message,
      usageData: {
        lastLogin,
        daysActive,
        featureUsage,
        daysSinceLastContact,
        churnRisk,
        plan: lead.won_plan,
        customerSince: lead.won_at || lead.created_at
      }
    }

  } catch (error) {
    console.error('Erro ao verificar uso:', error)
    throw error
  }
}
