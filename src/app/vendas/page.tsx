// src/app/vendas/page.tsx
import { getDashboardMetrics, getFunnelData } from '@/actions/sales/metrics'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

export default async function DashboardComercial() {
  const { metrics } = await getDashboardMetrics()
  const { funnel } = await getFunnelData()

  if (!metrics) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Comercial</h1>
        <p className="mt-4 text-gray-500">Erro ao carregar métricas. Verifique a conexão com o Supabase.</p>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total de Leads', value: metrics.totalLeads, icon: '👥', color: 'from-blue-600 to-blue-500', accent: 'text-blue-400' },
    { label: 'Novos Hoje', value: metrics.newLeadsToday, icon: '🆕', color: 'from-cyan-600 to-cyan-500', accent: 'text-cyan-400' },
    { label: 'Em Qualificação', value: metrics.inQualification, icon: '🔍', color: 'from-yellow-600 to-yellow-500', accent: 'text-yellow-400' },
    { label: 'Qualificados', value: metrics.qualified, icon: '✅', color: 'from-purple-600 to-purple-500', accent: 'text-purple-400' },
    { label: 'Em Negociação', value: metrics.inNegotiation, icon: '🤝', color: 'from-orange-600 to-orange-500', accent: 'text-orange-400' },
    { label: 'Vendas Fechadas', value: metrics.dealsWon, icon: '🏆', color: 'from-emerald-600 to-emerald-500', accent: 'text-emerald-400' },
    { label: 'Clientes Ativos', value: metrics.activeCustomers, icon: '⚡', color: 'from-teal-600 to-teal-500', accent: 'text-teal-400' },
    { label: 'Perdidos', value: metrics.dealsLost, icon: '📉', color: 'from-red-600 to-red-500', accent: 'text-red-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Comercial</h1>
        <p className="text-gray-500 mt-1">Visão geral da Máquina Comercial IA v2</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{kpi.icon}</span>
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${kpi.color}`} />
            </div>
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.accent}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">Revenue Total</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(metrics.revenueTotal)}</p>
          <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">Revenue Este Mês</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(metrics.revenueThisMonth)}</p>
          <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: metrics.revenueTotal > 0 ? `${Math.min((metrics.revenueThisMonth / metrics.revenueTotal) * 100, 100)}%` : '0%' }} />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">Taxa de Conversão</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{metrics.conversionRate}%</p>
          <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${Math.min(metrics.conversionRate * 10, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* AI Costs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Custo IA Total</p>
          <p className="text-2xl font-bold text-gray-300">{formatCurrency(metrics.aiCostTotal)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Custo IA Este Mês</p>
          <p className="text-2xl font-bold text-gray-300">{formatCurrency(metrics.aiCostThisMonth)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Escalações p/ Humano</p>
          <p className="text-2xl font-bold text-amber-400">{metrics.escalations}</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Funil de Vendas</h2>
        <div className="space-y-3">
          {funnel.filter(f => f.count > 0).map((stage, index) => {
            const maxCount = Math.max(...funnel.map(f => f.count), 1)
            const width = Math.max((stage.count / maxCount) * 100, 8)
            const gradients = [
              'from-blue-600 to-blue-400',
              'from-cyan-600 to-cyan-400',
              'from-yellow-600 to-yellow-400',
              'from-purple-600 to-purple-400',
              'from-orange-600 to-orange-400',
              'from-emerald-600 to-emerald-400',
              'from-teal-600 to-teal-400',
              'from-red-600 to-red-400',
            ]
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-400 text-right font-medium">{stage.label}</div>
                <div className="flex-1">
                  <div
                    className={`h-9 rounded-lg bg-gradient-to-r ${gradients[index % gradients.length]} flex items-center px-3 transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-white text-sm font-bold drop-shadow">{stage.count}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {funnel.filter(f => f.count > 0).length === 0 && (
            <p className="text-center text-gray-600 py-8">Nenhum dado no funil ainda.</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/vendas/leads" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 hover:bg-gray-900/80 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👥</span>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Leads</h3>
          </div>
          <p className="text-sm text-gray-500">Gerenciar pipeline de leads</p>
        </a>
        <a href="/vendas/conversas" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-600/50 hover:bg-gray-900/80 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💬</span>
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Conversas</h3>
          </div>
          <p className="text-sm text-gray-500">Visualizar conversas com IA</p>
        </a>
        <a href="/vendas/metricas" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-600/50 hover:bg-gray-900/80 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Métricas</h3>
          </div>
          <p className="text-sm text-gray-500">KPIs detalhados e histórico</p>
        </a>
      </div>
    </div>
  )
}
