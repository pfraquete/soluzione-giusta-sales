// src/app/api/sales/webhook/evolution/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processSalesMessage } from '@/lib/sales/message-processor'
import { logger } from '@/lib/sales/logger'
import { checkRateLimit, checkMinInterval, validateEvolutionWebhook } from '@/lib/sales/rate-limiter'

export async function POST(req: NextRequest) {
  try {
    // Validar origem do webhook
    if (!validateEvolutionWebhook(req)) {
      logger.warn('webhook.evolution', 'Webhook rejeitado: API key invalida')
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    logger.debug('webhook.evolution', 'Webhook recebido', { event: body.event, instance: body.instance })

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

    // Rate limiting
    const rateCheck = checkRateLimit(phone)
    if (!rateCheck.allowed) {
      logger.warn('webhook.evolution', 'Rate limit excedido', { phone, remaining: rateCheck.remaining })
      return NextResponse.json({ ok: false, error: 'rate_limited', resetAt: rateCheck.resetAt }, { status: 429 })
    }

    if (!checkMinInterval(phone)) {
      logger.debug('webhook.evolution', 'Intervalo minimo nao atingido', { phone })
      return NextResponse.json({ ok: true, ignored: 'too_fast' })
    }

    // Determinar produto pela instância que recebeu
    const instance = body.instance || ''
    let product: 'occhiale' | 'ekkle'

    if (instance.includes('occhiale')) {
      product = 'occhiale'
    } else if (instance.includes('ekkle')) {
      product = 'ekkle'
    } else {
      logger.warn('webhook.evolution', `Instancia desconhecida: ${instance}, usando occhiale como padrao`)
      product = 'occhiale'
    }

    logger.info('webhook.evolution', 'Processando mensagem', {
      phone,
      product,
      messageLength: text.length,
      remaining: rateCheck.remaining,
    })

    // Processar async (não bloquear webhook)
    processSalesMessage(phone, text, product)
      .catch(err => {
        logger.error('webhook.evolution', 'Erro ao processar mensagem', {
          phone,
          product,
          error: err instanceof Error ? err.message : String(err),
        })
      })

    // Responder imediatamente para Evolution
    return NextResponse.json({
      ok: true,
      processed: true,
      phone,
      product,
      messageLength: text.length,
    })
  } catch (error) {
    logger.error('webhook.evolution', 'Erro no webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { ok: false, error: 'webhook_processing_error', message: error instanceof Error ? error.message : 'Unknown error' },
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
    version: '2.0.0',
  })
}
