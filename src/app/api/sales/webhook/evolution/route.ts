// src/app/api/sales/webhook/evolution/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processSalesMessage } from '@/lib/sales/message-processor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Log para debug (remover em produção)
    console.log('Evolution webhook recebido:', JSON.stringify(body, null, 2))

    // Evolution API envia diferentes tipos de eventos
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ ok: true, ignored: 'event_not_supported' })
    }

    const message = body.data
    
    // Extrair dados da mensagem
    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '') || ''
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || 
                 message.message?.imageMessage?.caption ||
                 message.message?.videoMessage?.caption || 
                 ''

    // Ignorar mensagens enviadas por nós (evitar loop)
    if (message.key?.fromMe) {
      return NextResponse.json({ ok: true, ignored: 'message_from_me' })
    }

    // Ignorar se não tem texto
    if (!text || !phone) {
      return NextResponse.json({ ok: true, ignored: 'no_text_or_phone' })
    }

    // Determinar produto pela instância que recebeu
    const instance = body.instance || ''
    let product: 'occhiale' | 'ekkle'
    
    if (instance.includes('occhiale')) {
      product = 'occhiale'
    } else if (instance.includes('ekkle')) {
      product = 'ekkle'
    } else {
      // Fallback: determinar por algum outro critério ou usar padrão
      console.warn(`Instância desconhecida: ${instance}, usando occhiale como padrão`)
      product = 'occhiale'
    }

    console.log(`Processando mensagem: ${phone} (${product}) → "${text.substring(0, 100)}..."`)

    // Processar async (não bloquear webhook)
    processSalesMessage(phone, text, product)
      .catch(err => {
        console.error('Erro ao processar mensagem de vendas:', err)
      })

    // Responder imediatamente para Evolution
    return NextResponse.json({ 
      ok: true, 
      processed: true,
      phone,
      product,
      messageLength: text.length
    })

  } catch (error) {
    console.error('Erro no webhook Evolution:', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'webhook_processing_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Método GET para testar se webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'soluzione-giusta-sales-webhook',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
}