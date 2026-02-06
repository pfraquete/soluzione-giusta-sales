export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Máquina Comercial IA v2
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de vendas IA para Occhiale e EKKLE
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ <strong>TASK 1 CONCLUÍDA:</strong> Core Engine implementado com sucesso!
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">
              🕶️ Occhiale
            </h2>
            <p className="text-gray-600 mb-4">
              Plataforma completa para óticas com atendimento IA no WhatsApp
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Loja virtual profissional</li>
              <li>• Atendente IA 24/7</li>
              <li>• Gestão de estoque integrada</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-purple-600 mb-4">
              ⛪ EKKLE
            </h2>
            <p className="text-gray-600 mb-4">
              Sistema de gestão para igrejas com foco em células e discipulado
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Gestão completa de células</li>
              <li>• Sistema de cursos e EBD</li>
              <li>• Controle financeiro digital</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Status da Implementação</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Base Agent (Claude Sonnet 4.5)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Message Processor</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Evolution Client</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Product Config (Multi-produto)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Database Schema</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">🟡</span>
              <span>Hunter Agent (TASK 2)</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}