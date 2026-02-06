// src/lib/sales/scraper.ts
import { createClient } from '@/lib/supabase/server'

interface PlaceResult {
  name: string
  formatted_address: string
  formatted_phone_number?: string
  place_id: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  website?: string
  business_status?: string
}

interface ScrapingResult {
  total: number
  new: number
  existing: number
  errors: number
}

// Cidades alvo para scraping (expandir conforme necessidade)
const TARGET_CITIES = [
  // São Paulo
  'São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São José dos Campos',
  'Sorocaba', 'Osasco', 'Guarulhos', 'São Bernardo do Campo', 'Santo André',
  // Rio de Janeiro
  'Rio de Janeiro', 'Niterói', 'Petrópolis', 'Nova Iguaçu', 'Duque de Caxias',
  // Minas Gerais
  'Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Contagem', 'Betim',
  // Sul
  'Curitiba', 'Porto Alegre', 'Florianópolis', 'Londrina', 'Maringá',
  // Nordeste
  'Salvador', 'Recife', 'Fortaleza', 'Natal', 'João Pessoa',
  // Centro-Oeste
  'Brasília', 'Goiânia', 'Campo Grande', 'Cuiabá',
  // Norte
  'Manaus', 'Belém'
]

export async function runLeadScraper(
  product: 'occhiale' | 'ekkle',
  cities?: string[]
): Promise<ScrapingResult> {
  const supabase = createClient()
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY não configurada')
    return { total: 0, new: 0, existing: 0, errors: 0 }
  }

  const targetCities = cities || TARGET_CITIES
  const query = product === 'occhiale' ? 'ótica' : 'igreja evangélica'

  let totalFound = 0
  let newLeads = 0
  let existingLeads = 0
  let errors = 0

  for (const city of targetCities) {
    try {
      // Buscar lugares via Google Places Text Search
      const searchQuery = `${query} em ${city}`
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&language=pt-BR&key=${apiKey}`

      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (searchData.status !== 'OK' || !searchData.results) {
        console.warn(`Google Places retornou ${searchData.status} para "${searchQuery}"`)
        continue
      }

      for (const place of searchData.results) {
        totalFound++

        try {
          // Buscar detalhes do lugar (telefone, website)
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,business_status&language=pt-BR&key=${apiKey}`

          const detailsResponse = await fetch(detailsUrl)
          const detailsData = await detailsResponse.json()
          const details: PlaceResult = detailsData.result || place

          // Verificar se já existe na fila de scraping
          const { data: existing } = await supabase
            .from('sales_scraping_queue')
            .select('id')
            .eq('google_place_id', place.place_id)
            .single()

          if (existing) {
            existingLeads++
            continue
          }

          // Extrair cidade e estado do endereço
          const addressParts = (details.formatted_address || '').split(',')
          const extractedCity = addressParts.length >= 2 ? addressParts[addressParts.length - 3]?.trim() : city
          const extractedState = addressParts.length >= 1 ? addressParts[addressParts.length - 2]?.trim()?.substring(0, 2) : ''

          // Formatar telefone
          let phone = details.formatted_phone_number?.replace(/\D/g, '') || ''
          if (phone && !phone.startsWith('55')) {
            phone = `55${phone}`
          }

          // Inserir na fila de scraping
          await supabase.from('sales_scraping_queue').insert({
            product,
            google_place_id: place.place_id,
            company_name: details.name,
            phone: phone || null,
            address: details.formatted_address,
            city: extractedCity,
            state: extractedState,
            website: details.website || null,
            rating: details.rating || null,
            reviews_count: details.user_ratings_total || null,
            status: phone ? 'ready' : 'no_phone',
            metadata: {
              business_status: details.business_status,
              scraped_at: new Date().toISOString(),
              source_query: searchQuery
            }
          })

          // Se tem telefone, criar lead automaticamente
          if (phone) {
            const { data: existingLead } = await supabase
              .from('sales_leads')
              .select('id')
              .eq('phone', phone)
              .eq('product', product)
              .single()

            if (!existingLead) {
              await supabase.from('sales_leads').insert({
                phone,
                product,
                source: 'scraping',
                stage: 'scraped',
                assigned_agent: 'hunter',
                company_name: details.name,
                city: extractedCity,
                state: extractedState,
                google_place_id: place.place_id,
                score: 0,
                followup_count: 0,
                next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                metadata: {
                  website: details.website,
                  rating: details.rating,
                  reviews_count: details.user_ratings_total,
                  scraped_from: 'google_places'
                }
              })
            }
          }

          newLeads++

          // Rate limit: 100ms entre requests para Google Places
          await new Promise(r => setTimeout(r, 100))

        } catch (detailError) {
          console.error(`Erro ao processar ${place.name}:`, detailError)
          errors++
        }
      }

      // Rate limit entre cidades: 500ms
      await new Promise(r => setTimeout(r, 500))

    } catch (cityError) {
      console.error(`Erro ao scraper cidade ${city}:`, cityError)
      errors++
    }
  }

  console.log(`Scraping ${product} concluído: ${totalFound} encontrados, ${newLeads} novos, ${existingLeads} existentes, ${errors} erros`)

  return {
    total: totalFound,
    new: newLeads,
    existing: existingLeads,
    errors
  }
}
