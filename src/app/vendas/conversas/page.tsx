// src/app/vendas/conversas/page.tsx
import { getRecentConversations } from '@/actions/sales/conversations'

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: { product?: string }
}) {
  const { conversations } = await getRecentConversations({
    product: searchParams.product as 'occhiale' | 'ekkle' | undefined,
    limit: 50
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Conversas</h1>
        <p className="text-gray-500">Histórico de conversas com IA</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <form className="flex gap-3" method="GET">
          <select
            name="product"
            defaultValue={searchParams.product || ''}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {conversations.map((conv: any) => {
          const lead = conv.sales_leads
          const isInbound = conv.direction === 'inbound'
          const isSystem = conv.content?.startsWith('[')

          return (
            <div
              key={conv.id}
              className={`bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors ${
                isInbound ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-emerald-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                    isInbound
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                      : 'bg-gradient-to-br from-emerald-600 to-emerald-500'
                  }`}>
                    {isInbound ? 'IN' : 'AI'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {lead?.name || lead?.phone || 'Desconhecido'}
                      <span className="text-gray-600 font-normal ml-2">
                        {lead?.company_name || ''}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lead?.product === 'occhiale'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                          : 'bg-purple-900/50 text-purple-400 border border-purple-800'
                      }`}>
                        {lead?.product === 'occhiale' ? 'Occhiale' : 'EKKLE'}
                      </span>
                      {conv.agent && (
                        <span className="text-xs text-gray-600 capitalize">
                          Agente: {conv.agent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(conv.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className={`ml-12 ${isSystem ? 'text-gray-600 text-xs italic font-mono' : 'text-sm text-gray-400'}`}>
                {conv.content?.substring(0, 300)}
                {conv.content?.length > 300 && (
                  <span className="text-gray-600">...</span>
                )}
              </div>

              {conv.tools_called?.length > 0 && (
                <div className="ml-12 mt-2 flex flex-wrap gap-1.5">
                  {conv.tools_called.map((tool: string) => (
                    <span key={tool} className="text-xs bg-amber-900/30 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {conversations.length === 0 && (
          <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
            <span className="text-4xl block mb-3">💬</span>
            <p className="text-gray-600">Nenhuma conversa encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
