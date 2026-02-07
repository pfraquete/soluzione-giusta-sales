// src/app/vendas/metricas/page.tsx
import { getDashboardMetrics, getDailyMetrics, getFunnelData } from '@/actions/sales/metrics'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

function getStatusColor(value: number, target: number, inverse = false): string {
  const ratio = inverse ? target / Math.max(value, 1) : value / Math.max(target, 1)
  if (ratio >= 1) return 'text-emerald-400'
  if (ratio >= 0.7) return 'text-yellow-400'
  return 'text-red-400'
}

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: { product?: string; days?: string }
}) {
  const product = searchParams.product as 'occhiale' | 'ekkle' | undefined
  const days = parseInt(searchParams.days || '30')

  const [
    { metrics },
    { metrics: dailyMetrics },
    { funnel }
  ] = await Promise.all([
    getDashboardMetrics(product),
    getDailyMetrics(product, days),
    getFunnelData(product)
  ])

  const [
    { metrics: occhialeMetrics },
    { metrics: ekkleMetrics }
  ] = await Promise.all([
    getDashboardMetrics('occhiale'),
    getDashboardMetrics('ekkle')
  ])

  if (!metrics) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Métricas</h1>
        <p className="mt-4 text-gray-500">Erro ao carregar métricas.</p>
      </div>
    )
  }

  // KPIs avançados calculados
  const costPerLead = metrics.totalLeads > 0 ? Math.round(metrics.aiCostTotal / metrics.totalLeads) : 0
  const costPerSale = metrics.dealsWon > 0 ? Math.round(metrics.aiCostTotal / metrics.dealsWon) : 0
  const roiIA = metrics.aiCostTotal > 0 ? Math.round((metrics.revenueTotal / metrics.aiCostTotal) * 100) / 100 : 0
  const escalationRate = metrics.totalLeads > 0 ? Math.round((metrics.escalations / metrics.totalLeads) * 10000) / 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Métricas Detalhadas</h1>
        <p className="text-gray-500">Análise completa da máquina comercial</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <form className="flex gap-3" method="GET">
          <select
            name="product"
            defaultValue={product || ''}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>
          <select
            name="days"
            defaultValue={days.toString()}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Aplicar
          </button>
        </form>
      </div>

      {/* KPIs Avançados — Metas do Documento v2 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">KPIs vs Metas</h2>
        <p className="text-xs text-gray-600 mb-5">Seção 8.1 — Máquina Comercial IA v2</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Taxa de Qualificação</p>
            <p className={`text-2xl font-bold ${getStatusColor(metrics.conversionRate, 40)}`}>
              {metrics.qualified > 0 && metrics.totalLeads > 0
                ? `${Math.round((metrics.qualified / metrics.totalLeads) * 100)}%`
                : '0%'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &gt; 40%</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Taxa de Conversão</p>
            <p className={`text-2xl font-bold ${getStatusColor(metrics.conversionRate, 5)}`}>
              {metrics.conversionRate}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &gt; 5%</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Churn Mensal</p>
            <p className={`text-2xl font-bold ${getStatusColor(5, metrics.churnRate, true)}`}>
              {metrics.churnRate}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &lt; 5%</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">CAC (Custo Aquisição)</p>
            <p className={`text-2xl font-bold ${getStatusColor(30000, costPerSale, true)}`}>
              {formatCurrency(costPerSale)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &lt; R$ 300</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Custo IA / Conversa</p>
            <p className={`text-2xl font-bold ${getStatusColor(5, costPerLead, true)}`}>
              {formatCurrency(costPerLead)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &lt; R$ 0,05</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Taxa de Escalação</p>
            <p className={`text-2xl font-bold ${getStatusColor(15, escalationRate, true)}`}>
              {escalationRate}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Meta: &lt; 15%</p>
          </div>
        </div>
      </div>

      {/* Comparativo por Produto */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Comparativo por Produto</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Métrica</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-emerald-400 uppercase tracking-wider">Occhiale</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-purple-400 uppercase tracking-wider">EKKLE</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-white uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Total de Leads</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{occhialeMetrics?.totalLeads || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{ekkleMetrics?.totalLeads || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-white">{metrics.totalLeads}</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Vendas Fechadas</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-emerald-400">{occhialeMetrics?.dealsWon || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-emerald-400">{ekkleMetrics?.dealsWon || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-emerald-400">{metrics.dealsWon}</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Revenue Total</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{formatCurrency(occhialeMetrics?.revenueTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{formatCurrency(ekkleMetrics?.revenueTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-white">{formatCurrency(metrics.revenueTotal)}</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Taxa de Conversão</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{occhialeMetrics?.conversionRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{ekkleMetrics?.conversionRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-white">{metrics.conversionRate}%</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Clientes Ativos</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{occhialeMetrics?.activeCustomers || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{ekkleMetrics?.activeCustomers || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-white">{metrics.activeCustomers}</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Churn Rate</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-red-400">{occhialeMetrics?.churnRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-red-400">{ekkleMetrics?.churnRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-red-400">{metrics.churnRate}%</td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-400">Custo IA</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{formatCurrency(occhialeMetrics?.aiCostTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-300">{formatCurrency(ekkleMetrics?.aiCostTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-white">{formatCurrency(metrics.aiCostTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Funil Detalhado */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Funil Detalhado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {funnel.map((stage) => {
            const colors: Record<string, string> = {
              scraped: 'border-gray-600', new: 'border-blue-600', contacted: 'border-cyan-600',
              qualifying: 'border-yellow-600', qualified: 'border-purple-600', presenting: 'border-orange-600',
              negotiating: 'border-amber-600', won: 'border-emerald-600', lost: 'border-red-600',
              nurturing: 'border-indigo-600', active: 'border-teal-600', churned: 'border-rose-600',
            }
            return (
              <div key={stage.stage} className={`text-center p-4 rounded-xl bg-gray-800/50 border-t-2 ${colors[stage.stage] || 'border-gray-600'}`}>
                <p className="text-2xl font-bold text-white">{stage.count}</p>
                <p className="text-xs text-gray-500 mt-1">{stage.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Eficiência da IA */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Eficiência da IA</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl">
            <p className="text-sm text-blue-400">Custo por Lead</p>
            <p className="text-xl font-bold text-blue-300 mt-1">{formatCurrency(costPerLead)}</p>
          </div>
          <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl">
            <p className="text-sm text-emerald-400">Custo por Venda</p>
            <p className="text-xl font-bold text-emerald-300 mt-1">{formatCurrency(costPerSale)}</p>
          </div>
          <div className="p-4 bg-purple-900/20 border border-purple-800/30 rounded-xl">
            <p className="text-sm text-purple-400">ROI da IA</p>
            <p className="text-xl font-bold text-purple-300 mt-1">{roiIA > 0 ? `${roiIA}x` : 'N/A'}</p>
          </div>
          <div className="p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl">
            <p className="text-sm text-amber-400">Taxa de Escalação</p>
            <p className="text-xl font-bold text-amber-300 mt-1">{escalationRate}%</p>
          </div>
        </div>
      </div>

      {/* Histórico Diário */}
      {dailyMetrics.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Histórico Diário</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendas</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {dailyMetrics.map((m: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-sm text-gray-400">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2.5 px-3 text-sm text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.product === 'occhiale'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                          : 'bg-purple-900/50 text-purple-400 border border-purple-800'
                      }`}>
                        {m.product === 'occhiale' ? 'Occhiale' : 'EKKLE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-right font-medium text-white">{m.deals_won || 0}</td>
                    <td className="py-2.5 px-3 text-sm text-right font-medium text-emerald-400">{formatCurrency(m.revenue_cents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
