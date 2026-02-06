// src/app/api/sales/cron/scraper/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { runLeadScraper } from '@/lib/sales/scraper'

export async function POST(req: NextRequest) {
  // Validar CRON_SECRET
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parsear body para opções (produto, cidades específicas)
    let product: 'occhiale' | 'ekkle' = 'occhiale'
    let cities: string[] | undefined

    try {
      const body = await req.json()
      if (body.product) product = body.product
      if (body.cities) cities = body.cities
    } catch {
      // Body vazio é ok, usar defaults
    }

    console.log(`Iniciando scraping para ${product}${cities ? ` (cidades: ${cities.join(', ')})` : ' (todas as cidades)'}`)

    // Executar scraping para o produto
    const result = await runLeadScraper(product, cities)

    console.log(`Scraping concluído: ${JSON.stringify(result)}`)

    return NextResponse.json({
      ...result,
      product,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no cron scraper:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    job: 'scraper',
    description: 'Google Places lead scraping (óticas e igrejas)',
    schedule: 'Domingos 08:00 BRT'
  })
}
