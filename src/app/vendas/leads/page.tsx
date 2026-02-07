// src/app/vendas/leads/page.tsx
import { getLeads } from '@/actions/sales/leads'

const stageColors: Record<string, string> = {
  scraped: 'bg-gray-100 text-gray-700',
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-cyan-100 text-cyan-700',
  qualifying: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  presenting: 'bg-orange-100 text-orange-700',
  negotiating: 'bg-amber-100 text-amber-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  nurturing: 'bg-indigo-100 text-indigo-700',
  active: 'bg-teal-100 text-teal-700',
  churned: 'bg-rose-100 text-rose-700',
}

const stageLabels: Record<string, string> = {
  scraped: 'Scraped',
  new: 'Novo',
  contacted: 'Contatado',
  qualifying: 'Qualificando',
  qualified: 'Qualificado',
  presenting: 'Apresentando',
  negotiating: 'Negociando',
  won: 'Ganho',
  lost: 'Perdido',
  nurturing: 'Nurturing',
  active: 'Ativo',
  churned: 'Churned',
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { product?: string; stage?: string; search?: string; page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const { leads, total, totalPages } = await getLeads({
    product: searchParams.product as 'occhiale' | 'ekkle' | undefined,
    stage: searchParams.stage,
    search: searchParams.search,
    page,
    limit: 25
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">{total} leads no total</p>
        </div>
        <a href="/vendas" className="text-sm text-blue-600 hover:underline">
          Voltar ao Dashboard
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form className="flex flex-wrap gap-4" method="GET">
          <select
            name="product"
            defaultValue={searchParams.product || ''}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>

          <select
            name="stage"
            defaultValue={searchParams.stage || ''}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os Estágios</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="text"
            name="search"
            placeholder="Buscar por nome, empresa ou telefone..."
            defaultValue={searchParams.search || ''}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estágio</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fonte</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Último Contato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{lead.company_name || lead.phone}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    lead.product === 'occhiale' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {lead.product === 'occhiale' ? 'Occhiale' : 'EKKLE'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColors[lead.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {stageLabels[lead.stage] || lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          lead.score >= 70 ? 'bg-emerald-500' :
                          lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{lead.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{lead.assigned_agent}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{lead.source?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.last_contact_at
                    ? new Date(lead.last_contact_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })
                    : 'Nunca'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum lead encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Pagination */}
      {(totalPages ?? 0) > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages ?? 0 }, (_, i) => i + 1).map((p: number) => (
            <a
              key={p}
              href={`/vendas/leads?page=${p}${searchParams.product ? `&product=${searchParams.product}` : ''}${searchParams.stage ? `&stage=${searchParams.stage}` : ''}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
              className={`px-3 py-1 rounded-lg text-sm ${
                p === page ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
