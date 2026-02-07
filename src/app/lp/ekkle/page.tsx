import Link from 'next/link'

export const metadata = {
  title: 'EKKLE - App para Igrejas',
  description: 'O app mais completo para gestao de igrejas. Celulas, discipulado, financeiro e muito mais.',
}

export default function LPEkkle({ searchParams }: { searchParams: { utm_source?: string; utm_medium?: string; utm_campaign?: string } }) {
  const utmParams = new URLSearchParams()
  if (searchParams.utm_source) utmParams.set('utm_source', searchParams.utm_source)
  if (searchParams.utm_medium) utmParams.set('utm_medium', searchParams.utm_medium)
  if (searchParams.utm_campaign) utmParams.set('utm_campaign', searchParams.utm_campaign)
  const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent('Ola! Vi a pagina do EKKLE e quero saber mais.')}&${utmParams.toString()}`

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="relative py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full mb-6">App #1 para Igrejas</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Sua Igreja Conectada</h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Gestao de celulas, discipulado, financeiro, eventos e comunicacao. Tudo em um unico app.</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-purple-600/30">Falar com Especialista no WhatsApp</a>
        </div>
      </section>
      <section className="py-16 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { title: 'Gestao de Celulas', desc: 'Controle completo de celulas, lideres, membros e relatorios.' },
            { title: 'Discipulado', desc: 'Trilhas de discipulado personalizadas com acompanhamento.' },
            { title: 'Financeiro', desc: 'Dizimos, ofertas, relatorios e transparencia para a igreja.' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Somente o pastor paga</h2>
          <p className="text-gray-400 mb-12">Lideres, discipuladores e membros usam de graca.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Mensal</h3>
              <p className="text-4xl font-bold text-purple-400 mb-4">R$ 57<span className="text-lg text-gray-500">/mes</span></p>
              <ul className="text-gray-400 text-sm space-y-2 mb-6"><li>Todas as funcionalidades</li><li>Membros ilimitados</li><li>Suporte prioritario</li></ul>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg text-center font-semibold">Quero esse plano</a>
            </div>
            <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-8 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full">Economize 42%</span>
              <h3 className="text-xl font-semibold mb-2">Anual</h3>
              <p className="text-4xl font-bold text-purple-400 mb-4">R$ 397<span className="text-lg text-gray-500">/ano</span></p>
              <ul className="text-gray-400 text-sm space-y-2 mb-6"><li>Todas as funcionalidades</li><li>Membros ilimitados</li><li>Suporte VIP</li><li>2 meses gratis</li></ul>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg text-center font-semibold">Quero esse plano</a>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para conectar sua igreja?</h2>
          <p className="text-gray-400 mb-8">Fale com um especialista agora.</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl text-lg font-semibold">Iniciar conversa no WhatsApp</a>
        </div>
      </section>
    </div>
  )
}
