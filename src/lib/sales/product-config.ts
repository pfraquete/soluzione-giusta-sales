// src/lib/sales/product-config.ts
import { ProductConfig } from './agents/base-agent'

export const OCCHIALE_CONFIG: ProductConfig = {
  id: 'occhiale',
  name: 'Occhiale',
  agentName: 'Ana',
  description: 'Plataforma completa para óticas: loja virtual, atendimento IA no WhatsApp, gestão de estoque e vendas online.',
  targetAudience: 'Donos de óticas no Brasil',
  painPoints: [
    'Vendas caindo por causa de concorrência online',
    'Atendimento WhatsApp consome tempo demais',
    'Não tem presença digital profissional',
    'Perde clientes que pesquisam antes de comprar online',
    'Dificuldade para competir com grandes redes',
    'Falta de controle de estoque integrado',
    'Clientes pedem desconto por preço da internet'
  ],
  plans: [
    {
      name: 'Essencial',
      price: 19700, // R$ 197,00 em centavos
      features: [
        'Loja virtual profissional',
        'Atendente IA no WhatsApp',
        'Catálogo de produtos ilimitado',
        'Sistema de pedidos',
        'Dashboard de vendas',
        'Suporte por WhatsApp'
      ]
    },
    {
      name: 'Pro',
      price: 39700, // R$ 397,00 em centavos
      features: [
        'Tudo do plano Essencial',
        'Integração com estoque',
        'Campanhas de marketing automatizadas',
        'Relatórios avançados',
        'Multi-usuários (3 pessoas)',
        'Suporte prioritário',
        'Consultoria mensal (1h)',
        'Integração com redes sociais'
      ]
    }
  ],
  objections: [
    {
      trigger: 'caro|preço|custo|investimento|dinheiro',
      response: 'Entendo sua preocupação com o investimento! Vamos fazer uma conta rápida: se você vender apenas 2 óculos a mais por mês através da loja online, já pagou o sistema. E o atendente IA trabalha 24/7 sem férias nem salário. Qual seria o custo de contratar alguém só para o WhatsApp? 😊'
    },
    {
      trigger: 'já tenho site|tenho loja|já uso',
      response: 'Ótimo que você já tem presença digital! A diferença do Occhiale é a integração completa: sua loja conversa direto com o WhatsApp através da IA. Seus clientes podem ver os óculos no site e finalizar a compra pelo WhatsApp com atendimento automático. É como ter um vendedor expert trabalhando 24h. Posso te mostrar como funciona?'
    },
    {
      trigger: 'não entendo de tecnologia|sou leigo|complicado',
      response: 'Pode ficar tranquilo(a)! O Occhiale foi feito pensando exatamente em quem não é da área técnica. Tudo é simples de usar, com botões grandes e explicações claras. Além disso, nossa equipe faz toda a configuração inicial para você e oferece treinamento gratuito. Em 1 semana você já está vendendo online! 🚀'
    },
    {
      trigger: 'preciso pensar|vou analisar|conversar|sócio',
      response: 'Claro, é uma decisão importante para o negócio! Para te ajudar na análise, que tal eu enviar um case de sucesso de uma ótica similar à sua? Também posso agendar uma demonstração rápida de 15 minutos para você ver funcionando. Assim fica mais fácil tomar a decisão, não acha?'
    },
    {
      trigger: 'não tenho tempo|ocupado|corrido',
      response: 'Entendo perfeitamente! Ótica dá muito trabalho mesmo. Mas justamente por isso o Occhiale vai te ajudar a ganhar tempo. O atendente IA resolve 80% das dúvidas dos clientes sozinho, e você só precisa intervir para fechar a venda. É como ter um funcionário que nunca pede folga! 😄 Que tal uma demo de 15 minutos quando você tiver um tempinho?'
    },
    {
      trigger: 'meus clientes não compram online|preferem presencial',
      response: 'Entendo! Mas sabia que 73% das pessoas pesquisam online antes de ir na loja física? Com o Occhiale, mesmo quem prefere comprar presencialmente vai conhecer seus produtos primeiro pela internet. E para quem mora longe ou tem dificuldade de sair de casa, você não perde mais essas vendas. É expandir seu raio de alcance! 🎯'
    },
    {
      trigger: 'vou esperar|mais tarde|próximo mês',
      response: 'Compreendo a estratégia de timing! Mas deixe eu te fazer uma pergunta: quantas vendas você acha que está perdendo por dia sem ter presença online? Se for só 1 óculos por semana, em um mês já daria para pagar o sistema inteiro. Que tal começarmos agora para não perder mais vendas? Posso fazer um desconto especial para quem decide hoje! 💰'
    }
  ],
  caseStudies: [
    {
      company: 'Ótica Visão Clara - SP',
      result: '300% de aumento nas vendas online em 3 meses',
      quote: '"O atendente IA do WhatsApp revolucionou nossa ótica. Agora vendemos até de madrugada!" - Maria Silva, proprietária'
    },
    {
      company: 'Ótica do Centro - MG',
      result: 'R$ 15.000 de vendas online no primeiro mês',
      quote: '"Pensei que internet não funcionava para ótica. Me enganei completamente! Hoje 40% das vendas vem do online." - José Santos'
    },
    {
      company: 'Ótica Família - RS',
      result: 'Reduziu 60% do tempo gasto no WhatsApp',
      quote: '"Agora tenho tempo para focar no que realmente importa: atender bem quem vem na loja." - Ana Paula'
    }
  ],
  competitorComparison: 'Diferente de outros sistemas, o Occhiale integra loja virtual + atendimento IA + gestão em uma plataforma única, especializada para óticas.',
  evolutionInstance: 'occhiale-sales',
  scrapingCNAE: '4774-1/00', // Comércio varejista de artigos de óptica
  scrapingQuery: 'ótica {city}'
}

export const EKKLE_CONFIG: ProductConfig = {
  id: 'ekkle',
  name: 'EKKLE',
  agentName: 'Sofia',
  description: 'Plataforma completa de gestão para igrejas: células, membros, cursos EBD, eventos e comunicação integrada.',
  targetAudience: 'Pastores, líderes de células e administradores de igrejas evangélicas',
  painPoints: [
    'Gestão de células desorganizada e manual',
    'Comunicação com membros fragmentada (WhatsApp, papel, etc)',
    'Controle financeiro da igreja sem sistema digital',
    'Cursos e EBD sem plataforma adequada',
    'Relatórios de frequência e crescimento manuais',
    'Dificuldade para acompanhar discipulado',
    'Eventos e campanhas sem controle centralizado',
    'Pastores sobrecarregados com tarefas administrativas'
  ],
  plans: [
    {
      name: 'Mensal',
      price: 5700, // R$ 57,00 em centavos
      features: [
        'Gestão completa de células',
        'Cadastro ilimitado de membros',
        'Sistema de cursos e EBD',
        'Controle financeiro básico',
        'Relatórios de frequência',
        'App mobile para líderes',
        'Suporte por WhatsApp'
      ]
    },
    {
      name: 'Anual',
      price: 39700, // R$ 397,00 (economia de 4 meses)
      features: [
        'Tudo do plano mensal',
        '4 meses de economia',
        'Módulo eventos avançado',
        'Integrações personalizadas',
        'Relatórios executivos',
        'Consultoria pastoral mensal',
        'Suporte prioritário',
        'Backup automático'
      ]
    }
  ],
  objections: [
    {
      trigger: 'caro|preço|custo|dinheiro|ofertas',
      response: 'Pastor(a), entendo a preocupação com o orçamento da igreja! Mas vamos fazer um cálculo: R$ 57/mês são menos de R$ 2 por dia. É o preço de um cafezinho! E o EKKLE vai economizar horas da sua semana que você gasta organizando células manualmente. Seu tempo pastoral não tem preço, né? 🙏'
    },
    {
      trigger: 'já uso|já tenho|planilha|papel',
      response: 'Que bom que vocês já têm organização! Isso mostra que são uma igreja séria. A diferença do EKKLE é automatizar tudo isso: imagine seus líderes de célula enviando relatório direto pelo celular, você vendo o crescimento da igreja em tempo real, e tudo sincronizado. É levar sua organização para o século 21! 📱'
    },
    {
      trigger: 'não entendo tecnologia|complicado|difícil',
      response: 'Pastor(a), pode ficar tranquilo! O EKKLE foi desenvolvido pensando em líderes que focam no espiritual, não na tecnologia. É tão fácil quanto usar WhatsApp. E nossa equipe faz toda instalação e treinamento gratuito. Em poucos dias você e sua equipe estarão usando normalmente. A tecnologia deve servir ao reino! ⚡'
    },
    {
      trigger: 'igreja pequena|poucos membros|começando',
      response: 'Que lindo, pastor! Toda grande árvore começou pequena. O EKKLE é perfeito justamente para igrejas em crescimento, porque desde o início vocês terão dados organizados. Quando a igreja crescer (e vai crescer!), você já terá todo histórico estruturado. É plantar hoje para colher amanhã! 🌱'
    },
    {
      trigger: 'preciso orar|pensar|conversar|diretoria',
      response: 'Claro, pastor! Decisões importantes devem ser levadas em oração mesmo. Que tal eu enviar um testemunho de outros pastores que usam o EKKLE? E posso agendar uma demonstração rápida para a liderança ver como funciona? Assim Deus pode falar através da sabedoria prática também! 🙏'
    },
    {
      trigger: 'não tenho tempo|ocupado|ministério',
      response: 'Pastor, entendo perfeitamente! Ministério consome muito tempo mesmo. Mas justamente por isso o EKKLE vai te ajudar. Imagina quantas horas por semana você gasta organizando células, contando frequência, fazendo relatórios? O EKKLE automatiza isso tudo. É ter mais tempo para pastorear de verdade! ⏰'
    },
    {
      trigger: 'congregação velha|não usa celular|resistência',
      response: 'Compreendo a realidade! Mas o legal é que o EKKLE não obriga ninguém a mudar. Os membros continuam indo na célula normalmente. Só o líder usa o app para fazer o relatório rapidinho. E você, pastor, ganha uma visão geral que nunca teve antes. É modernizar a gestão sem mudar a essência! 📊'
    }
  ],
  caseStudies: [
    {
      company: 'Igreja Águas Vivas - SP',
      result: '40% de crescimento nas células em 6 meses',
      quote: '"Com o EKKLE conseguimos identificar células que precisavam de apoio e as que estavam prontas para multiplicar. Resultado: crescimento estratégico!" - Pastor Ricardo'
    },
    {
      company: 'Igreja Nova Vida - RJ',
      result: 'Economia de 15 horas semanais na administração',
      quote: '"Antes eu passava todo sábado organizando relatórios. Agora tenho mais tempo para visitas pastorais e oração." - Pastora Marcia'
    },
    {
      company: 'Igreja Fonte de Vida - MG',
      result: '200 novos convertidos organizados digitalmente',
      quote: '"O acompanhamento de novos convertidos ficou muito mais eficiente. Ninguém mais se perde no meio!" - Pastor João'
    }
  ],
  competitorComparison: 'Diferente de sistemas genéricos, o EKKLE foi desenvolvido especificamente para a realidade das igrejas evangélicas brasileiras, com foco em células e discipulado.',
  evolutionInstance: 'ekkle-sales',
  scrapingCNAE: '9491-0/00', // Atividades de organizações religiosas
  scrapingQuery: 'igreja evangélica {city}'
}

export function getProductConfig(product: 'occhiale' | 'ekkle'): ProductConfig {
  switch (product) {
    case 'occhiale':
      return OCCHIALE_CONFIG
    case 'ekkle':
      return EKKLE_CONFIG
    default:
      throw new Error(`Produto não suportado: ${product}`)
  }
}

// Helper para obter plano por nome
export function getPlanByName(product: 'occhiale' | 'ekkle', planName: string) {
  const config = getProductConfig(product)
  return config.plans.find(plan => 
    plan.name.toLowerCase() === planName.toLowerCase()
  )
}

// Helper para formatar preço
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

// Helper para obter resposta de objeção
export function getObjectionResponse(product: 'occhiale' | 'ekkle', message: string): string | null {
  const config = getProductConfig(product)
  
  for (const objection of config.objections) {
    const regex = new RegExp(objection.trigger, 'i')
    if (regex.test(message)) {
      return objection.response
    }
  }
  
  return null
}