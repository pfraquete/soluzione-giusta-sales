// src/app/vendas/metricas/page.tsx
import { getDashboardMetrics, getDailyMetrics, getFunnelData } from '@/actions/sales/metrics'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
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

  // Calcular métricas por produto
  const [
    { metrics: occhialeMetrics },
    { metrics: ekkleMetrics }
  ] = await Promise.all([
    getDashboardMetrics('occhiale'),
    getDashboardMetrics('ekkle')
  ])

  if (!metrics) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="mt-4 text-gray-500">Erro ao carregar métricas.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas Detalhadas</h1>
          <p className="text-gray-500">Análise completa da máquina comercial</p>
        </div>
        <a href="/vendas" className="text-sm text-blue-600 hover:underline">
          Voltar ao Dashboard
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form className="flex gap-4" method="GET">
          <select
            name="product"
            defaultValue={product || ''}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>
          <select
            name="days"
            defaultValue={days.toString()}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Aplicar
          </button>
        </form>
      </div>

      {/* Comparativo por Produto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparativo por Produto</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Métrica</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-blue-500 uppercase">Occhiale</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-purple-500 uppercase">EKKLE</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Total de Leads</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{occhialeMetrics?.totalLeads || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{ekkleMetrics?.totalLeads || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold">{metrics.totalLeads}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Vendas Fechadas</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-emerald-600">{occhialeMetrics?.dealsWon || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-emerald-600">{ekkleMetrics?.dealsWon || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-emerald-600">{metrics.dealsWon}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Revenue Total</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(occhialeMetrics?.revenueTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(ekkleMetrics?.revenueTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-bold">{formatCurrency(metrics.revenueTotal)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Taxa de Conversão</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{occhialeMetrics?.conversionRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{ekkleMetrics?.conversionRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-bold">{metrics.conversionRate}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Clientes Ativos</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{occhialeMetrics?.activeCustomers || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{ekkleMetrics?.activeCustomers || 0}</td>
                <td className="py-3 px-4 text-sm text-right font-bold">{metrics.activeCustomers}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Churn Rate</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-red-600">{occhialeMetrics?.churnRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-medium text-red-600">{ekkleMetrics?.churnRate || 0}%</td>
                <td className="py-3 px-4 text-sm text-right font-bold text-red-600">{metrics.churnRate}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm text-gray-700">Custo IA</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(occhialeMetrics?.aiCostTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(ekkleMetrics?.aiCostTotal || 0)}</td>
                <td className="py-3 px-4 text-sm text-right font-bold">{formatCurrency(metrics.aiCostTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Funil Detalhado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil Detalhado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {funnel.map((stage) => (
            <div key={stage.stage} className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
              <p className="text-xs text-gray-500 mt-1">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas de Eficiência IA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Eficiência da IA</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Custo por Lead</p>
            <p className="text-xl font-bold text-blue-700">
              {metrics.totalLeads > 0
                ? formatCurrency(Math.round(metrics.aiCostTotal / metrics.totalLeads))
                : 'R$ 0,00'}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-600">Custo por Venda</p>
            <p className="text-xl font-bold text-emerald-700">
              {metrics.dealsWon > 0
                ? formatCurrency(Math.round(metrics.aiCostTotal / metrics.dealsWon))
                : 'R$ 0,00'}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">ROI da IA</p>
            <p className="text-xl font-bold text-purple-700">
              {metrics.aiCostTotal > 0
                ? `${Math.round((metrics.revenueTotal / metrics.aiCostTotal) * 100) / 100}x`
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600">Taxa de Escalação</p>
            <p className="text-xl font-bold text-amber-700">
              {metrics.totalLeads > 0
                ? `${Math.round((metrics.escalations / metrics.totalLeads) * 10000) / 100}%`
                : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Histórico Diário */}
      {dailyMetrics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico Diário</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Produto</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Vendas</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyMetrics.map((m: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-sm">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-3 text-sm text-right capitalize">{m.product}</td>
                    <td className="py-2 px-3 text-sm text-right font-medium">{m.deals_won || 0}</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-emerald-600">{formatCurrency(m.revenue_cents || 0)}</td>
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
