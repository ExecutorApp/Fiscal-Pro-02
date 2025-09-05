import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Interfaces
interface SegmentoBase {
  id: string
  nome: string
}

interface SegmentoSimplesNacional extends SegmentoBase {
  padrao: string
  alternativa?: string
}

interface SegmentoLucroPresumido extends SegmentoBase {
  pis: string
  cofins: string
  presuncaoIR: string
  presuncaoCSLL: string
  ir: string
  irAdicional: string
  irValorDeduzir: string
  csll: string
}

interface SegmentoLucroReal extends SegmentoBase {
  pis: string
  cofins: string
  ir: string
  irAdicional: string
  irValorDeduzir: string
  csll: string
}

interface NovoSegmentoForm {
  nome: string
  simplesNacional: {
    padrao: string
    alternativa: string
  }
  lucroPresumido: {
    pis: string
    cofins: string
    presuncaoIR: string
    presuncaoCSLL: string
    ir: string
    irAdicional: string
    irValorDeduzir: string
    csll: string
  }
  lucroReal: {
    pis: string
    cofins: string
    ir: string
    irAdicional: string
    irValorDeduzir: string
    csll: string
  }
}

interface SegmentosContextType {
  // Estados dos segmentos
  segmentosSimplesNacional: SegmentoSimplesNacional[]
  segmentosLucroPresumido: SegmentoLucroPresumido[]
  segmentosLucroReal: SegmentoLucroReal[]
  
  // Funções de manipulação
  adicionarSegmento: (novoSegmento: NovoSegmentoForm) => void
  editarSegmento: (id: string, dadosAtualizados: Partial<NovoSegmentoForm>) => void
  removerSegmento: (id: string | number) => void
  
  // Utilitários
  gerarProximoId: () => string
  verificarNomeExistente: (nome: string, idExcluir?: string) => boolean
}

const SegmentosContext = createContext<SegmentosContextType | undefined>(undefined)

interface SegmentosProviderProps {
  children: ReactNode
}

export const SegmentosProvider: React.FC<SegmentosProviderProps> = ({ children }) => {
  // Estados iniciais - serão carregados do localStorage ou usarão dados padrão
  const [segmentosSimplesNacional, setSegmentosSimplesNacional] = useState<SegmentoSimplesNacional[]>(() => {
    // Tentar carregar do localStorage primeiro
    const dadosSalvos = localStorage.getItem('segmentos_data')
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos)
        if (dados.segmentosSimplesNacional) {
          return dados.segmentosSimplesNacional
        }
      } catch (error) {
        console.error('Erro ao carregar segmentos Simples Nacional do localStorage:', error)
      }
    }
    // Se não houver dados salvos, usar dados padrão
    return [
    { id: '1', nome: 'Academias', padrao: 'V', alternativa: 'III' },
    { id: '2', nome: 'Administração e Locação de Imóveis', padrao: 'V', alternativa: 'III' },
    { id: '3', nome: 'Agência de Viagem', padrao: 'III' },
    { id: '4', nome: 'Agronomia', padrao: 'V', alternativa: 'III' },
    { id: '5', nome: 'Arquitetura e Engenharia', padrao: 'V', alternativa: 'III' },
    { id: '6', nome: 'Clínicas Médicas', padrao: 'V', alternativa: 'III' },
    { id: '7', nome: 'Clínicas Médicas-Equip.Hospitalar', padrao: 'V', alternativa: 'III' },
    { id: '8', nome: 'Comércio', padrao: 'I' },
    { id: '9', nome: 'Construção Civil e Incorporação', padrao: 'V', alternativa: 'III' },
    { id: '10', nome: 'Economia e Consultoria', padrao: 'V', alternativa: 'III' },
    { id: '11', nome: 'Elaboração de Programas', padrao: 'V', alternativa: 'III' },
    { id: '12', nome: 'Hotel', padrao: 'III' },
    { id: '13', nome: 'Indústria', padrao: 'II' },
    { id: '14', nome: 'Prestação de Serviços', padrao: 'III' },
    { id: '15', nome: 'Representação Comercial', padrao: 'V', alternativa: 'III' },
    { id: '16', nome: 'Serviços Advocatícios', padrao: 'IV' }
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  })

  const [segmentosLucroPresumido, setSegmentosLucroPresumido] = useState<SegmentoLucroPresumido[]>(() => {
    // Tentar carregar do localStorage primeiro
    const dadosSalvos = localStorage.getItem('segmentos_data')
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos)
        if (dados.segmentosLucroPresumido) {

          
          // Migrar dados existentes para incluir novos campos se necessário
          const dadosMigrados = dados.segmentosLucroPresumido.map((segmento: any) => ({
            ...segmento,
            ir: segmento.ir || '15%',
            irAdicional: segmento.irAdicional || '10%',
            irValorDeduzir: segmento.irValorDeduzir || 'R$ 0,00',
            csll: segmento.csll || '9%'
          }))
          
          // Verificar se há dados corrompidos
          const dadosValidos = dadosMigrados.every((s: any) => 
            s.pis && !s.pis.startsWith(',') && 
            s.cofins && !s.cofins.startsWith(',') &&
            s.presuncaoIR && !s.presuncaoIR.startsWith(',') &&
            s.presuncaoCSLL && !s.presuncaoCSLL.startsWith(',')
          )
          if (dadosValidos) {

            // Salvar dados migrados de volta no localStorage
            const dadosAtualizados = { ...dados, segmentosLucroPresumido: dadosMigrados }
            localStorage.setItem('segmentos_data', JSON.stringify(dadosAtualizados))
            return dadosMigrados
          } else {
            console.warn('Dados corrompidos detectados no localStorage, usando dados padrão')
            localStorage.removeItem('segmentos_data')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar segmentos Lucro Presumido do localStorage:', error)
      }
    }
    // Se não houver dados salvos, usar dados padrão

return [
  { id: '1', nome: 'Academias', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '2', nome: 'Administração e Locação de Imóveis', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '3', nome: 'Agência de Viagem', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '4', nome: 'Agronomia', pis: '0,65%', cofins: '3,00%', presuncaoIR: '8%', presuncaoCSLL: '12%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '5', nome: 'Arquitetura e Engenharia', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '6', nome: 'Clínicas Médicas', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '7', nome: 'Clínicas Médicas-Equip.Hospitalar', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '8', nome: 'Comércio', pis: '0,65%', cofins: '3,00%', presuncaoIR: '8%', presuncaoCSLL: '12%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '9', nome: 'Construção Civil e Incorporação', pis: '0,65%', cofins: '3,00%', presuncaoIR: '8%', presuncaoCSLL: '12%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '10', nome: 'Economia e Consultoria', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '11', nome: 'Elaboração de Programas', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '12', nome: 'Hotel', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '13', nome: 'Indústria', pis: '0,65%', cofins: '3,00%', presuncaoIR: '8%', presuncaoCSLL: '12%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '14', nome: 'Prestação de Serviços', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '15', nome: 'Representação Comercial', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '16', nome: 'Serviços Advocatícios', pis: '0,65%', cofins: '3,00%', presuncaoIR: '32%', presuncaoCSLL: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' }
].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  })

  const [segmentosLucroReal, setSegmentosLucroReal] = useState<SegmentoLucroReal[]>(() => {
    // Tentar carregar do localStorage primeiro
    const dadosSalvos = localStorage.getItem('segmentos_data')
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos)
        if (dados.segmentosLucroReal) {
          return dados.segmentosLucroReal
        }
      } catch (error) {
        console.error('Erro ao carregar segmentos Lucro Real do localStorage:', error)
      }
    }
    // Se não houver dados salvos, usar dados padrão
return [
  { id: '1', nome: 'Academias', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '2', nome: 'Administração e Locação de Imóveis', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '3', nome: 'Agência de Viagem', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '4', nome: 'Agronomia', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '5', nome: 'Arquitetura e Engenharia', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '6', nome: 'Clínicas Médicas', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '7', nome: 'Clínicas Médicas-Equip.Hospitalar', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '8', nome: 'Comércio', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '9', nome: 'Construção Civil e Incorporação', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '10', nome: 'Economia e Consultoria', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '11', nome: 'Elaboração de Programas', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '12', nome: 'Hotel', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '13', nome: 'Indústria', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '14', nome: 'Prestação de Serviços', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '15', nome: 'Representação Comercial', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' },
  { id: '16', nome: 'Serviços Advocatícios', pis: '1,65%', cofins: '7,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 0,00', csll: '9%' }
].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  })

  // Função para gerar próximo ID
  const gerarProximoId = (): string => {
    const todosIds = [
      ...segmentosSimplesNacional.map(s => parseInt(s.id)),
      ...segmentosLucroPresumido.map(s => parseInt(s.id)),
      ...segmentosLucroReal.map(s => parseInt(s.id))
    ]
    const maiorId = Math.max(...todosIds, 0)
    return (maiorId + 1).toString()
  }

  // Função para verificar se nome já existe
  const verificarNomeExistente = (nome: string, idExcluir?: string): boolean => {
    const nomeNormalizado = nome.toLowerCase().trim()
    
    const existeEmSimplesNacional = segmentosSimplesNacional.some(s => 
      s.id !== idExcluir && s.nome.toLowerCase().trim() === nomeNormalizado
    )
    
    return existeEmSimplesNacional
  }

  // Função para adicionar segmento em todas as categorias
  const adicionarSegmento = (novoSegmento: NovoSegmentoForm) => {
    console.log('🔍 [DEBUG] ===== INÍCIO ADICIONAR SEGMENTO =====')
    console.log('🔍 [DEBUG] adicionarSegmento chamada com dados:', novoSegmento)
    const novoId = gerarProximoId()
    console.log('🔍 [DEBUG] Novo ID gerado:', novoId)
    
    // Criar segmento para Simples Nacional
    const segmentoSN: SegmentoSimplesNacional = {
      id: novoId,
      nome: novoSegmento.nome,
      padrao: novoSegmento.simplesNacional.padrao,
      alternativa: novoSegmento.simplesNacional.alternativa || undefined
    }
    console.log('🔍 [DEBUG] Segmento Simples Nacional criado:', segmentoSN)

    // Criar segmento para Lucro Presumido
    const segmentoLP: SegmentoLucroPresumido = {
      id: novoId,
      nome: novoSegmento.nome,
      pis: novoSegmento.lucroPresumido.pis,
      cofins: novoSegmento.lucroPresumido.cofins,
      presuncaoIR: novoSegmento.lucroPresumido.presuncaoIR,
      presuncaoCSLL: novoSegmento.lucroPresumido.presuncaoCSLL
    }
    console.log('🔍 [DEBUG] Segmento Lucro Presumido criado:', segmentoLP)

    // Criar segmento para Lucro Real
    const segmentoLR: SegmentoLucroReal = {
      id: novoId,
      nome: novoSegmento.nome,
      pis: novoSegmento.lucroReal.pis,
      cofins: novoSegmento.lucroReal.cofins,
      ir: novoSegmento.lucroReal.ir,
      irAdicional: novoSegmento.lucroReal.irAdicional,
      irValorDeduzir: novoSegmento.lucroReal.irValorDeduzir,
      csll: novoSegmento.lucroReal.csll
    }
    console.log('🔍 [DEBUG] Segmento Lucro Real criado:', segmentoLR)

    console.log('🔍 [DEBUG] Estados ANTES da atualização:')
    console.log('🔍 [DEBUG] - Simples Nacional:', segmentosSimplesNacional.length, 'segmentos')
    console.log('🔍 [DEBUG] - Lucro Presumido:', segmentosLucroPresumido.length, 'segmentos')
    console.log('🔍 [DEBUG] - Lucro Real:', segmentosLucroReal.length, 'segmentos')

    // Adicionar aos estados (ordenado alfabeticamente)
    setSegmentosSimplesNacional(prev => {
      const newArray = [...prev, segmentoSN].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      console.log('🔍 [DEBUG] ✅ Simples Nacional ATUALIZADO para:', newArray.length, 'segmentos')
      console.log('🔍 [DEBUG] ✅ Último segmento SN adicionado:', newArray.find(s => s.id === novoId))
      return newArray
    })
    
    setSegmentosLucroPresumido(prev => {
      const newArray = [...prev, segmentoLP].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      console.log('🔍 [DEBUG] ✅ Lucro Presumido ATUALIZADO para:', newArray.length, 'segmentos')
      console.log('🔍 [DEBUG] ✅ Último segmento LP adicionado:', newArray.find(s => s.id === novoId))
      return newArray
    })
    
    setSegmentosLucroReal(prev => {
      const newArray = [...prev, segmentoLR].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      console.log('🔍 [DEBUG] ✅ Lucro Real ATUALIZADO para:', newArray.length, 'segmentos')
      console.log('🔍 [DEBUG] ✅ Último segmento LR adicionado:', newArray.find(s => s.id === novoId))
      return newArray
    })
    
    console.log('🔍 [DEBUG] ===== FIM ADICIONAR SEGMENTO =====')
    
    // Aguardar um pouco e verificar se os estados foram atualizados
    setTimeout(() => {
      console.log('🔍 [DEBUG] ===== VERIFICAÇÃO PÓS-ATUALIZAÇÃO (após 100ms) =====')
      console.log('🔍 [DEBUG] Estados APÓS atualização:')
      console.log('🔍 [DEBUG] - Simples Nacional:', segmentosSimplesNacional.length, 'segmentos')
      console.log('🔍 [DEBUG] - Lucro Presumido:', segmentosLucroPresumido.length, 'segmentos')
      console.log('🔍 [DEBUG] - Lucro Real:', segmentosLucroReal.length, 'segmentos')
      
      // Verificar se o segmento foi adicionado em cada categoria
      const segmentoSNAdicionado = segmentosSimplesNacional.find(s => s.id === novoId)
      const segmentoLPAdicionado = segmentosLucroPresumido.find(s => s.id === novoId)
      const segmentoLRAdicionado = segmentosLucroReal.find(s => s.id === novoId)
      
      console.log('🔍 [DEBUG] Segmento encontrado em SN:', !!segmentoSNAdicionado, segmentoSNAdicionado)
      console.log('🔍 [DEBUG] Segmento encontrado em LP:', !!segmentoLPAdicionado, segmentoLPAdicionado)
      console.log('🔍 [DEBUG] Segmento encontrado em LR:', !!segmentoLRAdicionado, segmentoLRAdicionado)
      console.log('🔍 [DEBUG] ===== FIM VERIFICAÇÃO PÓS-ATUALIZAÇÃO =====')
    }, 100)
  }

  // Função para editar campo específico de uma categoria
  const editarCampoSegmento = (id: string, campo: string, valor: string, categoria: 'simplesNacional' | 'lucroPresumido' | 'lucroReal') => {
    switch (categoria) {
      case 'simplesNacional':
        setSegmentosSimplesNacional(prev => 
          prev.map(s => s.id === id ? { ...s, [campo]: valor } : s)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
        )
        break
      case 'lucroPresumido':
        setSegmentosLucroPresumido(prev => 
          prev.map(s => s.id === id ? { ...s, [campo]: valor } : s)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
        )
        break
      case 'lucroReal':
        setSegmentosLucroReal(prev => 
          prev.map(s => s.id === id ? { ...s, [campo]: valor } : s)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
        )
        break
    }
  }

  // Função para editar segmento em todas as categorias
  const editarSegmento = (id: string, dadosAtualizados: Partial<NovoSegmentoForm>) => {
    console.log('🔄 editarSegmento called', { id, dadosAtualizados });
    
    if (dadosAtualizados.nome) {
      console.log('🔄 Updating nome to:', dadosAtualizados.nome);
      // Atualizar nome em todas as categorias
      setSegmentosSimplesNacional(prev => 
        prev.map(s => s.id === id ? { ...s, nome: dadosAtualizados.nome! } : s)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      )
      
      setSegmentosLucroPresumido(prev => 
        prev.map(s => s.id === id ? { ...s, nome: dadosAtualizados.nome! } : s)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      )
      
      setSegmentosLucroReal(prev => 
        prev.map(s => s.id === id ? { ...s, nome: dadosAtualizados.nome! } : s)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      )
    }

    // Atualizar dados específicos de cada categoria
    if (dadosAtualizados.simplesNacional) {
      console.log('🔄 Updating simplesNacional fields:', dadosAtualizados.simplesNacional);
      setSegmentosSimplesNacional(prev => {
        const updated = prev.map(s => s.id === id ? {
          ...s,
          padrao: dadosAtualizados.simplesNacional!.padrao ?? '',
          alternativa: dadosAtualizados.simplesNacional!.alternativa === '' ? undefined : dadosAtualizados.simplesNacional!.alternativa
        } : s);
        console.log('🔄 Updated segmentosSimplesNacional:', updated.find(s => s.id === id));
        return updated;
      })
    }

    if (dadosAtualizados.lucroPresumido) {
      console.log('🔍 [CONTEXTO DEBUG] ===== EDITANDO LUCRO PRESUMIDO =====');
      console.log('🔍 [CONTEXTO DEBUG] ID do segmento:', id);
      console.log('🔍 [CONTEXTO DEBUG] Dados recebidos:', JSON.stringify(dadosAtualizados.lucroPresumido, null, 2));
      
      setSegmentosLucroPresumido(prev => {
        console.log('🔍 [CONTEXTO DEBUG] Estado anterior:', prev.find(s => s.id === id));
        
        const updated = prev.map(s => s.id === id ? {
          ...s,
          pis: dadosAtualizados.lucroPresumido!.pis,
          cofins: dadosAtualizados.lucroPresumido!.cofins,
          presuncaoIR: dadosAtualizados.lucroPresumido!.presuncaoIR,
          presuncaoCSLL: dadosAtualizados.lucroPresumido!.presuncaoCSLL
        } : s);
        
        console.log('🔍 [CONTEXTO DEBUG] Estado atualizado:', updated.find(s => s.id === id));
        console.log('🔍 [CONTEXTO DEBUG] ===== FIM EDIÇÃO LUCRO PRESUMIDO =====');
        return updated;
      })
    }

    if (dadosAtualizados.lucroReal) {
      console.log('🔍 [CONTEXTO DEBUG] ===== EDITANDO LUCRO REAL =====');
      console.log('🔍 [CONTEXTO DEBUG] ID do segmento:', id);
      console.log('🔍 [CONTEXTO DEBUG] Dados recebidos:', JSON.stringify(dadosAtualizados.lucroReal, null, 2));
      
      setSegmentosLucroReal(prev => {
        console.log('🔍 [CONTEXTO DEBUG] Estado anterior:', prev.find(s => s.id === id));
        
        const updated = prev.map(s => s.id === id ? {
          ...s,
          pis: dadosAtualizados.lucroReal!.pis,
          cofins: dadosAtualizados.lucroReal!.cofins,
          ir: dadosAtualizados.lucroReal!.ir,
          irAdicional: dadosAtualizados.lucroReal!.irAdicional,
          irValorDeduzir: dadosAtualizados.lucroReal!.irValorDeduzir,
          csll: dadosAtualizados.lucroReal!.csll
        } : s);
        
        console.log('🔍 [CONTEXTO DEBUG] Estado atualizado:', updated.find(s => s.id === id));
        console.log('🔍 [CONTEXTO DEBUG] ===== FIM EDIÇÃO LUCRO REAL =====');
        return updated;
      })
    }
  }

  // Função para remover segmento de todas as categorias
  const removerSegmento = (id: string | number) => {
    // Converter ID para string para garantir compatibilidade
    const idString = String(id)
    
    console.log('🗑️ [DEBUG] ===== INÍCIO REMOVER SEGMENTO =====')
    console.log('🗑️ [DEBUG] removerSegmento chamada com ID:', id, 'convertido para:', idString)
    console.log('🗑️ [DEBUG] Estado ANTES da remoção:')
    console.log('🗑️ [DEBUG] - Simples Nacional:', segmentosSimplesNacional.length, 'segmentos')
    console.log('🗑️ [DEBUG] - Lucro Presumido:', segmentosLucroPresumido.length, 'segmentos')
    console.log('🗑️ [DEBUG] - Lucro Real:', segmentosLucroReal.length, 'segmentos')
    
    // Verificar se o segmento existe em cada categoria antes de remover
    console.log('🗑️ [DEBUG] IDs dos segmentos em cada categoria:')
    console.log('🗑️ [DEBUG] - Simples Nacional IDs:', segmentosSimplesNacional.map(s => s.id))
    console.log('🗑️ [DEBUG] - Lucro Presumido IDs:', segmentosLucroPresumido.map(s => s.id))
    console.log('🗑️ [DEBUG] - Lucro Real IDs:', segmentosLucroReal.map(s => s.id))
    console.log('🗑️ [DEBUG] - ID procurado:', idString, 'Tipo:', typeof idString)
    
    const segmentoSN = segmentosSimplesNacional.find(s => s.id === idString)
    const segmentoLP = segmentosLucroPresumido.find(s => s.id === idString)
    const segmentoLR = segmentosLucroReal.find(s => s.id === idString)
    
    console.log('🗑️ [DEBUG] Segmento encontrado em:')
    console.log('🗑️ [DEBUG] - Simples Nacional:', segmentoSN ? 'SIM' : 'NÃO', segmentoSN ? segmentoSN.nome : '')
    console.log('🗑️ [DEBUG] - Lucro Presumido:', segmentoLP ? 'SIM' : 'NÃO', segmentoLP ? segmentoLP.nome : '')
    console.log('🗑️ [DEBUG] - Lucro Real:', segmentoLR ? 'SIM' : 'NÃO', segmentoLR ? segmentoLR.nome : '')
    
    console.log('🗑️ [DEBUG] Removendo de Simples Nacional...')
    setSegmentosSimplesNacional(prev => {
      const filtered = prev.filter(s => s.id !== idString)
      console.log('🗑️ [DEBUG] Simples Nacional: de', prev.length, 'para', filtered.length, 'segmentos')
      return filtered
    })
    
    console.log('🗑️ [DEBUG] Removendo de Lucro Presumido...')
    setSegmentosLucroPresumido(prev => {
      const filtered = prev.filter(s => s.id !== idString)
      console.log('🗑️ [DEBUG] Lucro Presumido: de', prev.length, 'para', filtered.length, 'segmentos')
      return filtered
    })
    
    console.log('🗑️ [DEBUG] Removendo de Lucro Real...')
    setSegmentosLucroReal(prev => {
      const filtered = prev.filter(s => s.id !== idString)
      console.log('🗑️ [DEBUG] Lucro Real: de', prev.length, 'para', filtered.length, 'segmentos')
      return filtered
    })
    
    console.log('🗑️ [DEBUG] ===== FIM REMOVER SEGMENTO =====')
  }

  // Salvar no localStorage sempre que os estados mudarem
  useEffect(() => {
    const dados = {
      segmentosSimplesNacional,
      segmentosLucroPresumido,
      segmentosLucroReal
    }
    console.log('🔍 [DEBUG] Salvando no localStorage:')
    console.log('🔍 [DEBUG] - Simples Nacional:', segmentosSimplesNacional.length, 'segmentos')
    console.log('🔍 [DEBUG] - Lucro Presumido:', segmentosLucroPresumido.length, 'segmentos')
    console.log('🔍 [DEBUG] - Lucro Real:', segmentosLucroReal.length, 'segmentos')
    localStorage.setItem('segmentos_data', JSON.stringify(dados))
    console.log('🔍 [DEBUG] Dados salvos no localStorage com sucesso!')
  }, [segmentosSimplesNacional, segmentosLucroPresumido, segmentosLucroReal])



  const value: SegmentosContextType = {
    segmentosSimplesNacional,
    segmentosLucroPresumido,
    segmentosLucroReal,
    adicionarSegmento,
    editarSegmento,
    removerSegmento,
    gerarProximoId,
    verificarNomeExistente
  }

  return (
    <SegmentosContext.Provider value={value}>
      {children}
    </SegmentosContext.Provider>
  )
}

export const useSegmentos = () => {
  const context = useContext(SegmentosContext)
  if (context === undefined) {
    throw new Error('useSegmentos deve ser usado dentro de um SegmentosProvider')
  }
  return context
}