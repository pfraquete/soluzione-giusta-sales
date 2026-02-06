// src/lib/sales/scoring.ts
import { SalesLead } from './agents/base-agent'

interface ScoringInput {
  company_size?: string | null
  pain_points?: string[] | null
  urgency?: string | null
  score?: number
}

export function calculateLeadScore(input: ScoringInput): number {
  let score = 0
  
  // Score base
  score += 10
  
  // Pontuação por tamanho da empresa
  switch (input.company_size) {
    case 'micro':
      score += 5
      break
    case 'small':
      score += 15
      break
    case 'medium':
      score += 25
      break
    case 'large':
      score += 30
      break
  }
  
  // Pontuação por dores identificadas
  if (input.pain_points && input.pain_points.length > 0) {
    // Cada dor identificada vale 10 pontos (máx 30)
    score += Math.min(30, input.pain_points.length * 10)
    
    // Bônus se tiver 3+ dores = lead bem engajado
    if (input.pain_points.length >= 3) {
      score += 10
    }
  }
  
  // Pontuação por urgência
  switch (input.urgency) {
    case 'now':
      score += 30  // Quer resolver já!
      break
    case 'next_month':
      score += 15  // Vai resolver em breve
      break
    case 'researching':
      score += 5   // Só pesquisando
      break
  }
  
  // Limitar entre 0 e 100
  return Math.min(100, Math.max(0, score))
}

// Função para determinar ação baseada no score
export function getActionByScore(score: number): {
  action: 'transfer' | 'nurture' | 'qualify_more' | 'disqualify'
  message: string
} {
  if (score >= 70) {
    return {
      action: 'transfer',
      message: 'Lead quente! Transferir para Closer.'
    }
  }
  
  if (score >= 50) {
    return {
      action: 'qualify_more',
      message: 'Lead promissor. Continuar qualificação.'
    }
  }
  
  if (score >= 30) {
    return {
      action: 'nurture',
      message: 'Lead morno. Mover para nurturing.'
    }
  }
  
  return {
    action: 'disqualify',
    message: 'Lead frio. Pode descartar ou nurture longo.'
  }
}

// Função para analisar sentimento da mensagem
export function analyzeSentiment(message: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  intent: string
} {
  const msg = message.toLowerCase()
  
  // Palavras positivas
  const positiveWords = ['interessado', 'quero', 'gostei', 'bom', 'ótimo', 'excelente', 'sim', 'vamos', 'combina', 'perfeito', 'adorei', 'show']
  
  // Palavras negativas
  const negativeWords = ['não', 'nunca', 'ruim', 'péssimo', 'horrível', 'odeio', 'caro', 'desisti', 'não quero', 'não gostei', 'tchau']
  
  // Palavras de interesse de compra
  const buyingWords = ['preço', 'valor', 'custa', 'comprar', 'assinar', 'começar', 'quando', 'como faço', 'link']
  
  let positiveCount = 0
  let negativeCount = 0
  let buyingCount = 0
  
  positiveWords.forEach(word => {
    if (msg.includes(word)) positiveCount++
  })
  
  negativeWords.forEach(word => {
    if (msg.includes(word)) negativeCount++
  })
  
  buyingWords.forEach(word => {
    if (msg.includes(word)) buyingCount++
  })
  
  // Calcular score de sentimento (-1 a 1)
  const sentimentScore = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)
  
  // Determinar sentimento
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (sentimentScore > 0.2) sentiment = 'positive'
  if (sentimentScore < -0.2) sentiment = 'negative'
  
  // Determinar intenção
  let intent = 'general'
  if (buyingCount > 0) intent = 'buying_interest'
  if (negativeCount > 1) intent = 'rejection'
  if (positiveCount > 1) intent = 'engagement'
  
  return {
    sentiment,
    score: sentimentScore,
    intent
  }
}

// Função para extrair entidades da mensagem
export function extractEntities(message: string): {
  emails: string[]
  phones: string[]
  company_names: string[]
  cities: string[]
} {
  const entities = {
    emails: [] as string[],
    phones: [] as string[],
    company_names: [] as string[],
    cities: [] as string[]
  }
  
  // Regex para email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  entities.emails = message.match(emailRegex) || []
  
  // Regex para telefone brasileiro
  const phoneRegex = /(\(?\d{2}\)?\s?)?(\d{4,5})[-.\s]?(\d{4})/g
  entities.phones = message.match(phoneRegex) || []
  
  // Detectar nomes de empresa (heurística simples)
  const companyKeywords = ['ótica', 'igreja', 'empresa', 'loja', 'comércio']
  companyKeywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}\\s+([A-Z][a-zA-Z\s]+)`, 'gi')
    const matches = message.match(regex)
    if (matches) {
      entities.company_names.push(...matches)
    }
  })
  
  return entities
}