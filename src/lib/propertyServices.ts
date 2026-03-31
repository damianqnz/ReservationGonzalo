export const PROPERTY_SERVICES = {
  CONDICOES_GERAIS: {
    label: { pt: 'Condições Gerais' },
    services: [
      { key: 'agua_quente', label: { pt: 'Água quente' } },
      { key: 'estacionamento_rua', label: { pt: 'Estacionamento na rua' } },
      { key: 'estacionamento_privado', label: { pt: 'Estacionamento privado' } },
      { key: 'elevador', label: { pt: 'Elevador' } },
      { key: 'varanda', label: { pt: 'Varanda' } },
      { key: 'aquecimento', label: { pt: 'Aquecimento' } },
      { key: 'champo', label: { pt: 'Champô' } },
      { key: 'climatizacao', label: { pt: 'Climatização' } },
      { key: 'internet', label: { pt: 'Router de Internet' } },
      { key: 'maquina_lavar', label: { pt: 'Máquina de lavar' } },
      { key: 'maquina_louca', label: { pt: 'Máquina de lavar loiça' } },
      { key: 'limpeza_prof', label: { pt: 'Limpeza profissional' } },
      { key: 'checkin_contactless', label: { pt: 'Check-in sem contacto' } },
      { key: 'ferro_passar', label: { pt: 'Ferro e tábua de engomar' } },
      { key: 'proibido_fumar', label: { pt: 'Proibido fumar' } },
      { key: 'secador', label: { pt: 'Secador de cabelo' } },
      { key: 'estendal', label: { pt: 'Estendal de roupa' } },
      { key: 'wifi', label: { pt: 'WiFi' } },
      { key: 'ar_condicionado', label: { pt: 'Ar condicionado' } },
    ]
  },
  COZINHA: {
    label: { pt: 'Cozinha' },
    services: [
      { key: 'cafeteira', label: { pt: 'Cafeteira' } },
      { key: 'cozinha_equipada', label: { pt: 'Cozinha totalmente equipada' } },
      { key: 'basicos_cozinha', label: { pt: 'Básicos de cozinha' } },
      { key: 'congelador', label: { pt: 'Congelador' } },
      { key: 'chaleira', label: { pt: 'Chaleira' } },
      { key: 'mesa_jantar', label: { pt: 'Mesa de jantar' } },
      { key: 'microondas', label: { pt: 'Micro-ondas' } },
      { key: 'frigorifico', label: { pt: 'Frigorífico' } },
      { key: 'placa_cozinha', label: { pt: 'Placa de cozinha' } },
      { key: 'torradeira', label: { pt: 'Torradeira' } },
    ]
  },
  QUARTO: {
    label: { pt: 'Quarto' },
    services: [
      { key: 'cabides', label: { pt: 'Cabides' } },
      { key: 'toalhas_lencois', label: { pt: 'Toalhas e lençóis' } },
    ]
  },
  CRIANCAS: {
    label: { pt: 'Crianças' },
    services: [
      { key: 'apto_criancas', label: { pt: 'Apto para crianças (+2 anos)' } },
    ]
  },
  DESPORTO: {
    label: { pt: 'Desporto' },
    services: [
      { key: 'ciclismo', label: { pt: 'Ciclismo' } },
      { key: 'caminhadas', label: { pt: 'Caminhadas' } },
      { key: 'surf', label: { pt: 'Surf' } },
      { key: 'windsurf', label: { pt: 'Windsurf' } },
    ]
  },
  LAZER: {
    label: { pt: 'Lazer' },
    services: [
      { key: 'compras', label: { pt: 'Compras' } },
      { key: 'museus', label: { pt: 'Museus' } },
      { key: 'tv', label: { pt: 'TV' } },
    ]
  }
}

export const AMENITY_TO_SERVICE_KEY: Record<string, string> = {
  'WiFi': 'wifi',
  'Air conditioning': 'ar_condicionado',
  'Heating': 'aquecimento',
  'Washing machine': 'maquina_lavar',
  'Dishwasher': 'maquina_louca',
  'Full kitchen': 'cozinha_equipada',
  'Refrigerator': 'frigorifico',
  'Microwave': 'microondas',
  'Coffee maker': 'cafeteira',
  'Hair dryer': 'secador',
  'Smart TV': 'tv',
  'Netflix': 'tv',
  'Free parking': 'estacionamento_privado',
  'Private pool': 'piscina',
  'Garden': 'jardim',
  'Terrace': 'varanda',
  'BBQ grill': 'basicos_cozinha',
  'Linens provided': 'toalhas_lencois',
  'Iron': 'ferro_passar',
  'Smoke detector': 'wifi',
  'Hot water': 'agua_quente',
}

export function getServiceLabel(key: string, lang: 'pt' = 'pt'): string {
  for (const category of Object.values(PROPERTY_SERVICES)) {
    const service = category.services.find(s => s.key === key)
    if (service) return service.label[lang]
  }
  return key
}
