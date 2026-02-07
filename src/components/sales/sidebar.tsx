'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/vendas', label: 'Dashboard', icon: '📊' },
  { href: '/vendas/leads', label: 'Leads', icon: '👥' },
  { href: '/vendas/conversas', label: 'Conversas', icon: '💬' },
  { href: '/vendas/metricas', label: 'Métricas', icon: '📈' },
]

export function SalesSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white">Soluzione Giusta</h2>
        <p className="text-xs text-gray-500 mt-1">Máquina Comercial IA v2</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-800">
        <p className="text-xs text-gray-600 px-3">Produtos</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Occhiale
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            EKKLE
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Voltar ao SaaS
        </Link>
      </div>
    </aside>
  )
}
