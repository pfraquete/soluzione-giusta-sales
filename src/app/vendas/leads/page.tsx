// src/app/vendas/leads/page.tsx
import { getLeads } from '@/actions/sales/leads'

const stageColors: Record<string, string> = {
  scraped: 'bg-gray-700/50 text-gray-300 border border-gray-600',
  new: 'bg-blue-900/50 text-blue-300 border border-blue-700',
  contacted: 'bg-cyan-900/50 text-cyan-300 border border-cyan-700',
  qualifying: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  qualified: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  presenting: 'bg-orange-900/50 text-orange-300 border border-orange-700',
  negotiating: 'bg-amber-900/50 text-amber-300 border border-amber-700',
  won: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
  lost: 'bg-red-900/50 text-red-300 border border-red-700',
  nurturing: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700',
  active: 'bg-teal-900/50 text-teal-300 border border-teal-700',
  churned: 'bg-rose-900/50 text-rose-300 border border-rose-700',
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
    limit: 10
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-gray-500">{total} leads no total</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <form className="flex flex-wrap gap-3" method="GET">
          <select
            name="product"
            defaultValue={searchParams.product || ''}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>

          <select
            name="stage"
            defaultValue={searchParams.stage || ''}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
            className="bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estágio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Agente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fonte</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Último Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="font-medium text-white text-sm">{lead.name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.company_name || lead.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      lead.product === 'occhiale'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                        : 'bg-purple-900/50 text-purple-300 border border-purple-700'
                    }`}>
                      {lead.product === 'occhiale' ? 'Occhiale' : 'EKKLE'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stageColors[lead.stage] || 'bg-gray-700/50 text-gray-300 border border-gray-600'}`}>
                      {stageLabels[lead.stage] || lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            lead.score >= 70 ? 'bg-emerald-500' :
                            lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        lead.score >= 70 ? 'text-emerald-400' :
                        lead.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400 capitalize">{lead.assigned_agent}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-500">{lead.source?.replace(/_/g, ' ') || '-'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-500">
                      {lead.last_contact_at
                        ? new Date(lead.last_contact_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })
                        : 'Nunca'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leads.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <span className="text-4xl block mb-3">🔍</span>
            Nenhum lead encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Pagination */}
      {(totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages} ({total} resultados)
          </p>
          <div className="flex gap-1.5">
            {page > 1 && (
              <a
                href={`/vendas/leads?page=${page - 1}${searchParams.product ? `&product=${searchParams.product}` : ''}${searchParams.stage ? `&stage=${searchParams.stage}` : ''}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Anterior
              </a>
            )}
            {Array.from({ length: totalPages ?? 0 }, (_, i) => i + 1)
              .filter((p: number) => p === 1 || p === (totalPages ?? 0) || Math.abs(p - page) <= 2)
              .map((p: number, idx: number, arr: number[]) => (
                <span key={p} className="flex items-center gap-1.5">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-gray-600 px-1">...</span>
                  )}
                  <a
                    href={`/vendas/leads?page=${p}${searchParams.product ? `&product=${searchParams.product}` : ''}${searchParams.stage ? `&stage=${searchParams.stage}` : ''}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {p}
                  </a>
                </span>
              ))}
            {page < (totalPages ?? 0) && (
              <a
                href={`/vendas/leads?page=${page + 1}${searchParams.product ? `&product=${searchParams.product}` : ''}${searchParams.stage ? `&stage=${searchParams.stage}` : ''}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
