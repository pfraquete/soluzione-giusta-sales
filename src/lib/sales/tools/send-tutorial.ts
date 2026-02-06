// src/lib/sales/tools/send-tutorial.ts
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage, sendWhatsAppMedia } from '../evolution-client'

interface SendTutorialInput {
  step_name: string
  format?: 'text' | 'video' | 'image'
}

// Tutoriais por produto e step
const TUTORIALS: Record<string, Record<string, { text: string; videoUrl?: string; imageUrl?: string }>> = {
  occhiale: {
    welcome: {
      text: `🎉 *Bem-vindo(a) ao Occhiale!*

Que alegria ter você com a gente! Vamos configurar tudo para sua ótica começar a vender online.

📋 *Seu onboarding tem 8 passos simples:*
1️⃣ Boas-vindas e acesso ✅ (este aqui!)
2️⃣ Configurar loja virtual
3️⃣ Cadastrar produtos
4️⃣ Conectar WhatsApp
5️⃣ Configurar agente IA
6️⃣ Configurar pagamentos
7️⃣ Primeira venda
8️⃣ Treinamento final

Vamos começar? Me diga quando estiver pronto(a)! 🚀`
    },
    store_setup: {
      text: `🏪 *Passo 2: Configurar sua Loja Virtual*

Vamos personalizar sua loja! Preciso de algumas informações:

1. *Nome da ótica* (como aparece na fachada)
2. *Logo* (envie a imagem aqui)
3. *Endereço completo*
4. *Horário de funcionamento*
5. *Telefone de contato*
6. *Cores da marca* (se tiver preferência)

Pode ir enviando aos poucos! Vou montando tudo para você. 😊`
    },
    products_upload: {
      text: `📦 *Passo 3: Cadastrar Produtos*

Agora vamos colocar seus óculos na loja! Você pode:

*Opção 1 — Enviar fotos aqui:*
📸 Tire fotos dos óculos e envie com o nome e preço

*Opção 2 — Planilha:*
📊 Me envie uma planilha com: Nome, Marca, Preço, Categoria

*Opção 3 — Catálogo do fornecedor:*
📋 Me envie o catálogo e eu cadastro para você

Qual opção prefere? 🤓`
    },
    whatsapp_connect: {
      text: `📱 *Passo 4: Conectar WhatsApp*

Vamos conectar o WhatsApp da sua ótica ao sistema. É simples:

1. Acesse o painel: app.occhiale.com.br
2. Vá em Configurações > WhatsApp
3. Escaneie o QR Code com o WhatsApp da ótica
4. Pronto! O agente IA já começa a funcionar

⚠️ *Importante:* Use o WhatsApp Business da ótica, não o pessoal.

Precisa de ajuda? Posso te guiar passo a passo! 📲`
    },
    ai_agent_config: {
      text: `🤖 *Passo 5: Configurar Agente IA*

Seu atendente virtual precisa conhecer sua ótica! Me diga:

1. *Tom de voz:* Formal ou informal?
2. *Serviços especiais:* Faz exame de vista? Ajuste de armação?
3. *Marcas principais:* Quais marcas você mais vende?
4. *Promoções ativas:* Tem alguma promoção agora?
5. *Perguntas frequentes:* Quais perguntas seus clientes mais fazem?

Com essas informações, seu agente vai atender como se fosse você! 🎯`
    },
    payment_setup: {
      text: `💳 *Passo 6: Configurar Pagamentos*

Para receber pagamentos online, preciso de:

1. *CNPJ da ótica*
2. *Dados bancários* (banco, agência, conta)
3. *Formas de pagamento:* PIX, cartão, boleto?

Vou configurar tudo no Pagar.me para você. O dinheiro cai direto na sua conta! 💰`
    },
    first_sale: {
      text: `🎯 *Passo 7: Sua Primeira Venda!*

Tudo configurado! Agora vamos fazer sua primeira venda online:

1. Compartilhe o link da loja com 5 clientes fiéis
2. Poste no Instagram/Facebook da ótica
3. Coloque um QR Code no balcão da loja

💡 *Dica:* Ofereça 10% de desconto para quem comprar pelo site na primeira semana. Isso gera buzz!

Me avise quando fizer a primeira venda! Vou comemorar com você! 🎉`
    },
    training_complete: {
      text: `🎓 *Passo 8: Treinamento Completo!*

Parabéns! Você concluiu todo o onboarding! 🎉

📊 *Resumo do que está ativo:*
✅ Loja virtual online
✅ Produtos cadastrados
✅ WhatsApp conectado
✅ Agente IA funcionando
✅ Pagamentos configurados

🔑 *Próximos passos:*
• Acompanhe as métricas no painel
• Adicione novos produtos regularmente
• Responda avaliações dos clientes

A partir de agora, a Sofia (CS) vai cuidar de você! Qualquer dúvida, é só chamar. 🚀`
    }
  },
  ekkle: {
    welcome: {
      text: `🎉 *Bem-vindo(a) ao EKKLE!*

Que alegria ter sua igreja com a gente! Vamos configurar tudo para vocês.

📋 *Seu onboarding tem 8 passos simples:*
1️⃣ Boas-vindas e acesso ✅
2️⃣ Configurar dados da igreja
3️⃣ Importar células
4️⃣ Importar membros
5️⃣ Convidar líderes
6️⃣ Configurar cursos/EBD
7️⃣ Configurar financeiro
8️⃣ Treinamento final

Vamos começar? 🙏`
    },
    church_setup: {
      text: `⛪ *Passo 2: Configurar Dados da Igreja*

Vamos personalizar o EKKLE para sua igreja! Preciso de:

1. *Nome completo da igreja*
2. *Logo* (envie a imagem)
3. *Endereço*
4. *Nome do pastor titular*
5. *Quantidade aproximada de membros*
6. *Quantidade de células*

Pode enviar aos poucos! 😊`
    },
    cells_import: {
      text: `🏠 *Passo 3: Importar Células*

Vamos cadastrar suas células! Me envie:

1. *Nome de cada célula*
2. *Líder responsável*
3. *Dia e horário da reunião*
4. *Endereço (bairro)*
5. *Quantidade de membros*

Pode enviar por lista, planilha ou até foto de um caderno! Eu organizo tudo. 📋`
    },
    members_import: {
      text: `👥 *Passo 4: Importar Membros*

Agora vamos cadastrar os membros! Opções:

*Opção 1:* Envie uma planilha com Nome, Telefone, Célula
*Opção 2:* Envie uma lista aqui no WhatsApp
*Opção 3:* Os líderes cadastram pelo app

Qual prefere? O importante é ter todos no sistema! 🙏`
    },
    leaders_invite: {
      text: `👑 *Passo 5: Convidar Líderes*

Vamos dar acesso aos líderes de célula! Eles vão poder:

📱 Fazer relatório pelo celular
📊 Ver membros da célula
📝 Registrar frequência
🙏 Receber pedidos de oração

Me envie o nome e WhatsApp de cada líder que eu envio o convite! ⚡`
    },
    courses_setup: {
      text: `📚 *Passo 6: Configurar Cursos e EBD*

Vamos configurar a área de ensino! Me diga:

1. *Tem EBD?* Quantas turmas?
2. *Cursos ativos?* Quais?
3. *Material didático:* Tem apostilas? PDFs?
4. *Professores:* Quem ministra?

Posso criar tudo no sistema para você! 📖`
    },
    finance_setup: {
      text: `💰 *Passo 7: Configurar Financeiro*

Para o controle financeiro da igreja:

1. *Categorias de entrada:* Dízimo, oferta, campanha...
2. *Categorias de saída:* Aluguel, luz, água, salários...
3. *Dados bancários da igreja* (para relatórios)
4. *Quem terá acesso ao financeiro?*

Tudo será organizado e seguro! 📊`
    },
    training_complete: {
      text: `🎓 *Onboarding Completo!*

Parabéns, pastor(a)! O EKKLE está 100% configurado! 🎉

📊 *Resumo:*
✅ Igreja configurada
✅ Células importadas
✅ Membros cadastrados
✅ Líderes com acesso
✅ Cursos configurados
✅ Financeiro ativo

A partir de agora, estarei aqui para ajudar no dia a dia! 🙏`
    }
  }
}

export async function sendTutorial(
  leadId: string,
  input: SendTutorialInput,
  product: 'occhiale' | 'ekkle'
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { data: lead } = await supabase
      .from('sales_leads')
      .select('phone')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { success: false, message: 'Lead não encontrado' }
    }

    const tutorial = TUTORIALS[product]?.[input.step_name]

    if (!tutorial) {
      return { success: false, message: `Tutorial não encontrado para step "${input.step_name}"` }
    }

    // Enviar tutorial baseado no formato
    if (input.format === 'video' && tutorial.videoUrl) {
      await sendWhatsAppMedia(lead.phone, tutorial.videoUrl, tutorial.text.substring(0, 200), 'video', product)
    } else if (input.format === 'image' && tutorial.imageUrl) {
      await sendWhatsAppMedia(lead.phone, tutorial.imageUrl, tutorial.text.substring(0, 200), 'image', product)
    } else {
      await sendWhatsAppMessage(lead.phone, tutorial.text, product)
    }

    // Registrar
    await supabase.from('sales_conversations').insert({
      lead_id: leadId,
      direction: 'outbound',
      content: `[TUTORIAL: ${input.step_name}] ${tutorial.text.substring(0, 100)}...`,
      message_type: 'text',
      agent: 'onboarding',
      tools_called: ['send_tutorial']
    })

    return {
      success: true,
      message: `Tutorial "${input.step_name}" enviado com sucesso!`
    }

  } catch (error) {
    console.error('Erro ao enviar tutorial:', error)
    throw error
  }
}
