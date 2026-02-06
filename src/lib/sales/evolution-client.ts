// src/lib/sales/evolution-client.ts

interface EvolutionConfig {
  baseUrl: string
  apiKey: string
  instance: string
}

interface SendMessagePayload {
  number: string
  text?: string
  media?: {
    mediatype: 'image' | 'video' | 'audio' | 'document'
    fileName?: string
    caption?: string
    media: string // base64 ou URL
  }
}

interface SendMessageResponse {
  success: boolean
  message?: string
  error?: string
}

// Configurações por produto
const EVOLUTION_CONFIGS = {
  occhiale: {
    baseUrl: process.env.EVOLUTION_OCCHIALE_URL!,
    apiKey: process.env.EVOLUTION_OCCHIALE_API_KEY!,
    instance: process.env.EVOLUTION_OCCHIALE_INSTANCE || 'occhiale-sales'
  },
  ekkle: {
    baseUrl: process.env.EVOLUTION_EKKLE_URL!,
    apiKey: process.env.EVOLUTION_EKKLE_API_KEY!,
    instance: process.env.EVOLUTION_EKKLE_INSTANCE || 'ekkle-sales'
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  product: 'occhiale' | 'ekkle'
): Promise<boolean> {
  const config = EVOLUTION_CONFIGS[product]
  
  // Formatar número (remover caracteres especiais e garantir formato correto)
  const formattedPhone = phone.replace(/\D/g, '')
  const phoneNumber = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`
  
  const payload: SendMessagePayload = {
    number: `${phoneNumber}@s.whatsapp.net`,
    text: message
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/message/sendText/${config.instance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': config.apiKey
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Evolution API error (${response.status}):`, errorText)
      return false
    }

    const result = await response.json()
    console.log(`Mensagem enviada para ${phoneNumber} (${product}):`, result)
    
    return result.success !== false // Evolution às vezes retorna sem campo success
    
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error)
    return false
  }
}

export async function sendWhatsAppMedia(
  phone: string,
  mediaUrl: string,
  caption: string,
  mediaType: 'image' | 'video' | 'audio' | 'document',
  product: 'occhiale' | 'ekkle'
): Promise<boolean> {
  const config = EVOLUTION_CONFIGS[product]
  
  const formattedPhone = phone.replace(/\D/g, '')
  const phoneNumber = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`
  
  const payload: SendMessagePayload = {
    number: `${phoneNumber}@s.whatsapp.net`,
    media: {
      mediatype: mediaType,
      caption,
      media: mediaUrl // URL ou base64
    }
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/message/sendMedia/${config.instance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': config.apiKey
        },
        body: JSON.stringify(payload)
      }
    )

    const result = await response.json()
    return result.success !== false
    
  } catch (error) {
    console.error('Erro ao enviar mídia WhatsApp:', error)
    return false
  }
}

export async function getEvolutionInstanceStatus(
  product: 'occhiale' | 'ekkle'
): Promise<{ connected: boolean; qrcode?: string }> {
  const config = EVOLUTION_CONFIGS[product]
  
  try {
    const response = await fetch(
      `${config.baseUrl}/instance/connectionState/${config.instance}`,
      {
        headers: {
          'ApiKey': config.apiKey
        }
      }
    )

    const result = await response.json()
    
    return {
      connected: result.state === 'open',
      qrcode: result.qrcode
    }
    
  } catch (error) {
    console.error('Erro ao verificar status Evolution:', error)
    return { connected: false }
  }
}

// Helper para formatar mensagens com emojis e formatação WhatsApp
export function formatWhatsAppMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold: **texto** → *texto*
    .replace(/__(.*?)__/g, '_$1_')     // Italico: __texto__ → _texto_
    .replace(/`(.*?)`/g, '```$1```')   // Mono: `texto` → ```texto```
    .trim()
}

// Rate limiting para evitar ban do WhatsApp
const messageQueue: Array<{ phone: string; message: string; product: string; timestamp: number }> = []
const RATE_LIMIT_MS = 3000 // 3 segundos entre mensagens
let isProcessingQueue = false

export async function sendWhatsAppMessageSafe(
  phone: string,
  message: string,
  product: 'occhiale' | 'ekkle'
): Promise<void> {
  // Adicionar na fila
  messageQueue.push({
    phone,
    message: formatWhatsAppMessage(message),
    product,
    timestamp: Date.now()
  })

  // Processar fila se não estiver processando
  if (!isProcessingQueue) {
    processMessageQueue()
  }
}

async function processMessageQueue(): Promise<void> {
  if (messageQueue.length === 0) {
    isProcessingQueue = false
    return
  }

  isProcessingQueue = true
  
  const item = messageQueue.shift()!
  const now = Date.now()
  const timeSinceLastMessage = now - (item.timestamp || 0)
  
  // Rate limiting: garantir pelo menos 3s entre mensagens
  if (timeSinceLastMessage < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastMessage))
  }

  await sendWhatsAppMessage(item.phone, item.message, item.product as 'occhiale' | 'ekkle')
  
  // Processar próxima mensagem
  setTimeout(processMessageQueue, RATE_LIMIT_MS)
}