import { SalesSidebar } from '@/components/sales/sidebar'

export default function VendasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <SalesSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
