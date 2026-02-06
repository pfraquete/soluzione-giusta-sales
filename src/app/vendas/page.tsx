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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Comercial</h1>
        <p className="mt-4 text-gray-500">Erro ao carregar métricas. Verifique a conexão com o Supabase.</p>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total de Leads', value: metrics.totalLeads, color: 'bg-blue-500' },
    { label: 'Novos Hoje', value: metrics.newLeadsToday, color: 'bg-green-500' },
    { label: 'Em Qualificação', value: metrics.inQualification, color: 'bg-yellow-500' },
    { label: 'Qualificados', value: metrics.qualified, color: 'bg-purple-500' },
    { label: 'Em Negociação', value: metrics.inNegotiation, color: 'bg-orange-500' },
    { label: 'Vendas Fechadas', value: metrics.dealsWon, color: 'bg-emerald-500' },
    { label: 'Clientes Ativos', value: metrics.activeCustomers, color: 'bg-teal-500' },
    { label: 'Perdidos', value: metrics.dealsLost, color: 'bg-red-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Comercial</h1>
        <p className="text-gray-500 mt-1">Soluzione Giusta — Máquina Comercial IA v2</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className={`w-3 h-3 rounded-full ${kpi.color} mb-3`} />
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Revenue Total</p>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(metrics.revenueTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Revenue Este Mês</p>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(metrics.revenueThisMonth)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Taxa de Conversão</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.conversionRate}%</p>
        </div>
      </div>

      {/* AI Costs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Custo IA Total</p>
          <p className="text-2xl font-bold text-gray-700">{formatCurrency(metrics.aiCostTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Custo IA Este Mês</p>
          <p className="text-2xl font-bold text-gray-700">{formatCurrency(metrics.aiCostThisMonth)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Escalações p/ Humano</p>
          <p className="text-2xl font-bold text-amber-600">{metrics.escalations}</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil de Vendas</h2>
        <div className="space-y-3">
          {funnel.filter(f => f.count > 0).map((stage) => {
            const maxCount = Math.max(...funnel.map(f => f.count), 1)
            const width = Math.max((stage.count / maxCount) * 100, 5)
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-600 text-right">{stage.label}</div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded-md bg-gradient-to-r from-blue-500 to-blue-400 flex items-center px-3"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-white text-sm font-medium">{stage.count}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/vendas/leads" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Leads</h3>
          <p className="text-sm text-gray-500 mt-1">Gerenciar pipeline de leads</p>
        </a>
        <a href="/vendas/conversas" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Conversas</h3>
          <p className="text-sm text-gray-500 mt-1">Visualizar conversas com IA</p>
        </a>
        <a href="/vendas/metricas" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Métricas</h3>
          <p className="text-sm text-gray-500 mt-1">KPIs detalhados e histórico</p>
        </a>
      </div>
    </div>
  )
}
