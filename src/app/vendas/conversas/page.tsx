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
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
          <p className="text-gray-500">Histórico de conversas com IA</p>
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
            defaultValue={searchParams.product || ''}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os Produtos</option>
            <option value="occhiale">Occhiale</option>
            <option value="ekkle">EKKLE</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
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
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${
                isInbound ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-emerald-400'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isInbound ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    {isInbound ? 'IN' : 'AI'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lead?.name || lead?.phone || 'Desconhecido'}
                      <span className="text-gray-400 font-normal ml-2">
                        {lead?.company_name || ''}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        lead?.product === 'occhiale' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {lead?.product === 'occhiale' ? 'Occhiale' : 'EKKLE'}
                      </span>
                      {conv.agent && (
                        <span className="text-xs text-gray-400 capitalize">
                          Agente: {conv.agent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(conv.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className={`ml-11 ${isSystem ? 'text-gray-400 text-xs italic' : 'text-sm text-gray-700'}`}>
                {conv.content?.substring(0, 300)}
                {conv.content?.length > 300 && '...'}
              </div>

              {conv.tools_called?.length > 0 && (
                <div className="ml-11 mt-2 flex gap-1">
                  {conv.tools_called.map((tool: string) => (
                    <span key={tool} className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {conversations.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            Nenhuma conversa encontrada.
          </div>
        )}
      </div>
    </div>
  )
}
