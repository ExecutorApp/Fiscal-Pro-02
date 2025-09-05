import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipo para os dados do Imposto de Renda
interface ImpostoRendaData {
  ir: string
  irAdicional: string
  valorDeduzirMensal: string
  valorDeduzirTrimestral: string
  valorDeduzirAnual: string
  csll: string
}

// Tipo para o contexto
interface ImpostoRendaContextType {
  impostoRendaData: ImpostoRendaData
  selectedPeriodo: string
  originalImpostoRendaData: ImpostoRendaData
  originalSelectedPeriodo: string
  isSaveImpostoRendaDisabled: boolean
  showImpostoRendaModal: boolean
  showImpostoRendaExitConfirm: boolean
  
    // Estados globais das tabelas
  segmentoTributacaoLucroPresumido: any[]
  segmentoTributacaoLucroReal: any[]
  
  // Funções
  setImpostoRendaData: (data: ImpostoRendaData) => void
  setSelectedPeriodo: (periodo: string) => void
  setOriginalImpostoRendaData: (data: ImpostoRendaData) => void
  setOriginalSelectedPeriodo: (periodo: string) => void
  setIsSaveImpostoRendaDisabled: (disabled: boolean) => void
  setShowImpostoRendaModal: (show: boolean) => void
  setShowImpostoRendaExitConfirm: (show: boolean) => void
  setSegmentoTributacaoLucroPresumido: (data: any[]) => void
  setSegmentoTributacaoLucroReal: (data: any[]) => void
  
  // Funções do modal
  handleOpenImpostoRendaModal: () => void
  handleCloseImpostoRendaModal: () => void
  handleConfirmExitImpostoRenda: () => void
  handleBackToImpostoRenda: () => void
  handleSaveAndCloseModal: () => void
  updateBothTablesWithImpostoRenda: () => void
  addSegmentoToBothTables: (segmentoData: any) => { updatedLP: any[], updatedLR: any[] }
  removeSegmentoFromBothTables: (nomeSegmento: string) => { updatedLP: any[], updatedLR: any[] }
  checkImpostoRendaChanges: (current: ImpostoRendaData, original: ImpostoRendaData) => boolean
  getValorDeduzirByPeriodo: () => string
  buscarSegmentoPorNome: (nomeSegmento: string) => { lucroPresumido: any | null, lucroReal: any | null, encontrado: boolean }
}

// Dados padrão do Imposto de Renda
const impostoRendaDataPadrao: ImpostoRendaData = {
  ir: '15%',
  irAdicional: '10%',
  valorDeduzirMensal: 'R$ 20.000,00',
  valorDeduzirTrimestral: 'R$ 60.000,00',
  valorDeduzirAnual: 'R$ 240.000,00',
  csll: '9%'
}

 // Dados padrão para Lucro Presumido
 const segmentoTributacaoLucroPresumidoPadrao = [
    { id: 1, segmento: 'Academias', pis: '1,65%', cofins: '7,60%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 2, segmento: 'Administração e Locação de Imóveis', pis: '1,65%', cofins: '25,50%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 3, segmento: 'Agência de Viagem', pis: '0,65%', cofins: '3,00%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 4, segmento: 'Agronomia', pis: '1,65%', cofins: '7,60%', irPresuncao: '8%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '12%', csll: '9%' },
    { id: 5, segmento: 'Arquitetura e Engenharia', pis: '1,65%', cofins: '7,60%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 6, segmento: 'Clínicas Médicas', pis: '0,65%', cofins: '3,00%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 7, segmento: 'Clínicas Médicas-Equip.Hospitalar', pis: '0,65%', cofins: '3,00%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
    { id: 8, segmento: 'Comércio', pis: '1,65%', cofins: '7,60%', irPresuncao: '8%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '12%', csll: '9%' },
    { id: 9, segmento: 'Construção Civil e Incorporação', pis: '0,65%', cofins: '3,00%', irPresuncao: '8%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '12%', csll: '9%' },
    { id: 10, segmento: 'Economia e Consultoria', pis: '1,65%', cofins: '7,60%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
   { id: 11, segmento: 'Elaboração de Programas', pis: '1,65%', cofins: '7,60%', irPresuncao: '32%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '32%', csll: '9%' },
   { id: 12, segmento: 'Hotel', pis: '0%', cofins: '0%', irPresuncao: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '0%', csll: '9%' },
   { id: 13, segmento: 'Indústria', pis: '0%', cofins: '0%', irPresuncao: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '0%', csll: '9%' },
   { id: 14, segmento: 'Prestação de Serviços', pis: '0%', cofins: '0%', irPresuncao: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '0%', csll: '9%' },
   { id: 15, segmento: 'Representação Comercial', pis: '0%', cofins: '0%', irPresuncao: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '0%', csll: '9%' },
   { id: 16, segmento: 'Serviços Advocatícios', pis: '0%', cofins: '0%', irPresuncao: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csllPresuncao: '0%', csll: '9%' }

 ].sort((a, b) => a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' }))
 
 // Dados padrão para Lucro Real (sem colunas de presunção)
 const segmentoTributacaoLucroRealPadrao = [
    { id: 1, segmento: 'Academias', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 2, segmento: 'Administração e Locação de Imóveis', pis: '1,65%', cofins: '25,50%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 3, segmento: 'Agência de Viagem', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 4, segmento: 'Agronomia', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 5, segmento: 'Arquitetura e Engenharia', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 6, segmento: 'Clínicas Médicas', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 7, segmento: 'Clínicas Médicas-Equip.Hospitalar', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 8, segmento: 'Comércio', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 9, segmento: 'Construção Civil e Incorporação', pis: '0,65%', cofins: '3,00%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
    { id: 10, segmento: 'Economia e Consultoria', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 11, segmento: 'Elaboração de Programas', pis: '1,65%', cofins: '7,60%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 12, segmento: 'Hotel', pis: '0%', cofins: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 13, segmento: 'Indústria', pis: '0%', cofins: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 14, segmento: 'Prestação de Serviços', pis: '0%', cofins: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 15, segmento: 'Representação Comercial', pis: '0%', cofins: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' },
   { id: 16, segmento: 'Serviços Advocatícios', pis: '0%', cofins: '0%', ir: '15%', irAdicional: '10%', irValorDeduzir: 'R$ 240.000,00', csll: '9%' }

 ].sort((a, b) => a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' }))

// Contexto
const ImpostoRendaContext = createContext<ImpostoRendaContextType | undefined>(undefined)

 // Export do contexto para uso como wrapper
 export { ImpostoRendaContext }


// Provider
interface ImpostoRendaProviderProps {
  children: ReactNode
}

export const ImpostoRendaProvider: React.FC<ImpostoRendaProviderProps> = ({ children }) => {
  const [impostoRendaData, setImpostoRendaData] = useState<ImpostoRendaData>(impostoRendaDataPadrao)
  const [selectedPeriodo, setSelectedPeriodo] = useState('anual')
  const [originalImpostoRendaData, setOriginalImpostoRendaData] = useState<ImpostoRendaData>(impostoRendaDataPadrao)
  const [originalSelectedPeriodo, setOriginalSelectedPeriodo] = useState('anual')
  const [isSaveImpostoRendaDisabled, setIsSaveImpostoRendaDisabled] = useState(true)
  const [showImpostoRendaModal, setShowImpostoRendaModal] = useState(false)
  const [showImpostoRendaExitConfirm, setShowImpostoRendaExitConfirm] = useState(false)
  
  // Estados globais das tabelas
  const [segmentoTributacaoLucroPresumido, setSegmentoTributacaoLucroPresumido] = useState(segmentoTributacaoLucroPresumidoPadrao)
  const [segmentoTributacaoLucroReal, setSegmentoTributacaoLucroReal] = useState(segmentoTributacaoLucroRealPadrao)

  // Monitorar mudanças no localStorage para recarregar dados automaticamente
  useEffect(() => {
    console.log('🔍 [ImpostoRenda] useEffect - Monitorando mudanças no localStorage')
    
    const handleStorageChange = () => {
      console.log('🔍 [ImpostoRenda] Storage change detectado - recarregando dados')
      loadBothTablesData()
    }
    
    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // Verificar mudanças periodicamente (para mudanças na mesma aba)
    const interval = setInterval(() => {
      const currentData = localStorage.getItem('segmentos_data')
      if (currentData) {
        const parsedData = JSON.parse(currentData)
        const currentCount = {
          sn: parsedData.segmentosSimplesNacional?.length || 0,
          lp: parsedData.segmentosLucroPresumido?.length || 0,
          lr: parsedData.segmentosLucroReal?.length || 0
        }
        
        // Verificar se houve mudança no número de segmentos
        if (currentCount.lp !== segmentoTributacaoLucroPresumido.length || 
            currentCount.lr !== segmentoTributacaoLucroReal.length) {
          console.log('🔍 [ImpostoRenda] Mudança detectada no número de segmentos - recarregando')
          console.log('🔍 [ImpostoRenda] Contagem atual:', currentCount)
          console.log('🔍 [ImpostoRenda] Contagem estado:', {
            lp: segmentoTributacaoLucroPresumido.length,
            lr: segmentoTributacaoLucroReal.length
          })
          loadBothTablesData()
        }
      }
    }, 1000) // Verificar a cada 1 segundo
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [segmentoTributacaoLucroPresumido.length, segmentoTributacaoLucroReal.length])

 // Função centralizada para carregar dados persistidos de ambas as tabelas
 const loadBothTablesData = async () => {
   try {
     console.log('🔍 [ImpostoRenda] Carregando dados das tabelas...')
     
     // Carregar dados do novo SegmentosContext
     const savedSegmentsData = localStorage.getItem('segmentos_data')
     let loadedLP = [...segmentoTributacaoLucroPresumidoPadrao]
     let loadedLR = [...segmentoTributacaoLucroRealPadrao]
     
     if (savedSegmentsData) {
       const parsedSegments = JSON.parse(savedSegmentsData)
       console.log('🔍 [ImpostoRenda] Dados encontrados no SegmentosContext:', parsedSegments)
       
       // Converter segmentos do SegmentosContext para formato do ImpostoRendaContext
       if (parsedSegments.segmentosLucroPresumido && parsedSegments.segmentosLucroPresumido.length > 0) {
         loadedLP = parsedSegments.segmentosLucroPresumido.map((segmento) => ({
           id: parseInt(segmento.id),
           segmento: segmento.nome,
           pis: segmento.pis,
           cofins: segmento.cofins,
           irPresuncao: segmento.presuncaoIR,
           csllPresuncao: segmento.presuncaoCSLL,
           ir: '15%',
           irAdicional: '10%',
           irValorDeduzir: 'R$ 240.000,00',
           csll: '9%'
         }))
         console.log('🔍 [ImpostoRenda] Lucro Presumido carregado:', loadedLP.length, 'segmentos')
       }
       
       if (parsedSegments.segmentosLucroReal && parsedSegments.segmentosLucroReal.length > 0) {
         loadedLR = parsedSegments.segmentosLucroReal.map((segmento) => ({
           id: parseInt(segmento.id),
           segmento: segmento.nome,
           pis: segmento.pis,
           cofins: segmento.cofins,
           ir: segmento.ir,
           irAdicional: segmento.irAdicional,
           irValorDeduzir: segmento.irValorDeduzir,
           csll: segmento.csll
         }))
         console.log('🔍 [ImpostoRenda] Lucro Real carregado:', loadedLR.length, 'segmentos')
       }
     } else {
       console.log('🔍 [ImpostoRenda] Nenhum dado encontrado no SegmentosContext, usando dados padrão')
     }
     
     // SINCRONIZAÇÃO: Garantir que ambas as listas tenham os mesmos segmentos
     // Criar um conjunto unificado de segmentos baseado nos nomes
     const allSegmentNames = new Set([
       ...loadedLP.map(item => item.segmento),
       ...loadedLR.map(item => item.segmento)
     ])
     
     // Sincronizar Lucro Presumido - adicionar segmentos ausentes
     const syncedLP = [...loadedLP]
     allSegmentNames.forEach(segmentoName => {
       if (!syncedLP.find(item => item.segmento === segmentoName)) {
         // Buscar dados do segmento em Lucro Real para criar versão LP
         const segmentoLR = loadedLR.find(item => item.segmento === segmentoName)
         if (segmentoLR) {
           const newId = Math.max(...syncedLP.map(item => item.id), 0) + 1
           syncedLP.push({
             id: newId,
             segmento: segmentoName,
             pis: segmentoLR.pis || '1,65%',
             cofins: segmentoLR.cofins || '7,60%',
             irPresuncao: '32%', // Valor padrão para LP
             csllPresuncao: '32%', // Valor padrão para LP
             ir: segmentoLR.ir,
             irAdicional: segmentoLR.irAdicional,
             irValorDeduzir: segmentoLR.irValorDeduzir,
             csll: segmentoLR.csll
           })
         }
       }
     })
     
     // Sincronizar Lucro Real - adicionar segmentos ausentes
     const syncedLR = [...loadedLR]
     allSegmentNames.forEach(segmentoName => {
       if (!syncedLR.find(item => item.segmento === segmentoName)) {
         // Buscar dados do segmento em Lucro Presumido para criar versão LR
         const segmentoLP = syncedLP.find(item => item.segmento === segmentoName)
         if (segmentoLP) {
           const newId = Math.max(...syncedLR.map(item => item.id), 0) + 1
           syncedLR.push({
             id: newId,
             segmento: segmentoName,
             pis: segmentoLP.pis || '1,65%',
             cofins: segmentoLP.cofins || '7,60%',
             ir: segmentoLP.ir,
             irAdicional: segmentoLP.irAdicional,
             irValorDeduzir: segmentoLP.irValorDeduzir,
             csll: segmentoLP.csll
           })
         }
       }
     })
     
     // Ordenar ambas as listas
     syncedLP.sort((a, b) => a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' }))
     syncedLR.sort((a, b) => a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' }))
     
     // Atualizar estados
     setSegmentoTributacaoLucroPresumido(syncedLP)
     setSegmentoTributacaoLucroReal(syncedLR)
     
         // Aplicar dados do Imposto de Renda carregados do localStorage nas tabelas sincronizadas
    const savedImpostoRenda = localStorage.getItem('global_impostoRenda_data')
    if (savedImpostoRenda) {
      const parsedImpostoRenda = JSON.parse(savedImpostoRenda)
      const impostoRendaData = parsedImpostoRenda.impostoRendaData
      const selectedPeriodo = parsedImpostoRenda.selectedPeriodo || 'anual'
      
      // Calcular valor deduzir baseado no período salvo
      const getValorDeduzirFromPeriodo = (periodo: string) => {
        switch (periodo) {
          case 'mensal': return impostoRendaData.valorDeduzirMensal || 'R$ 20.000,00'
          case 'trimestral': return impostoRendaData.valorDeduzirTrimestral || 'R$ 60.000,00'
          case 'anual': return impostoRendaData.valorDeduzirAnual || 'R$ 240.000,00'
          default: return 'R$ 240.000,00'
        }
      }
      
      const valorDeduzir = getValorDeduzirFromPeriodo(selectedPeriodo)
      
      // Aplicar dados do IR às tabelas sincronizadas
      const syncedLPWithIR = syncedLP.map(item => ({
        ...item,
        ir: impostoRendaData.ir,
        irAdicional: impostoRendaData.irAdicional,
        irValorDeduzir: valorDeduzir,
        csll: impostoRendaData.csll
      }))
      
      const syncedLRWithIR = syncedLR.map(item => ({
        ...item,
        ir: impostoRendaData.ir,
        irAdicional: impostoRendaData.irAdicional,
        irValorDeduzir: valorDeduzir,
        csll: impostoRendaData.csll
      }))
      
      setSegmentoTributacaoLucroPresumido(syncedLPWithIR)
      setSegmentoTributacaoLucroReal(syncedLRWithIR)
      
      console.log('?? Listas sincronizadas com dados do IR aplicados - ambas têm', allSegmentNames.size, 'segmentos')
    } else {
      console.log('?? Listas sincronizadas - ambas têm', allSegmentNames.size, 'segmentos')
    }
     
   } catch (error) {
     console.error('? Erro ao carregar dados das tabelas:', error)
     console.log('?? Usando dados padrão devido ao erro')
   }
 }


  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedData = localStorage.getItem('global_impostoRenda_data')
        
        if (savedData) {
          const parsedData = JSON.parse(savedData)
         setImpostoRendaData(parsedData.impostoRendaData || impostoRendaDataPadrao)
         setSelectedPeriodo(parsedData.selectedPeriodo || 'anual')
         
         // Atualizar também os dados originais para refletir o que foi carregado
         setOriginalImpostoRendaData(parsedData.impostoRendaData || impostoRendaDataPadrao)
         setOriginalSelectedPeriodo(parsedData.selectedPeriodo || 'anual')

          console.log('✅ Dados de Imposto de Renda carregados do armazenamento global!')
       } else {
         console.log('?? Usando dados padrão de Imposto de Renda - primeira vez')

        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados salvos de Imposto de Renda:', error)
        console.log('🔄 Usando dados padrão devido ao erro')
      }
    }

    loadPersistedData()
  }, [])
  
   // Carregar dados das tabelas após inicialização do contexto
 useEffect(() => {
   // Aguardar um tick para garantir que o contexto foi inicializado
   const timer = setTimeout(() => {
     loadBothTablesData()
   }, 0)
   
   return () => clearTimeout(timer)
 }, []) // Executar apenas uma vez


  // Função para verificar mudanças nos dados do Imposto de Renda
  const checkImpostoRendaChanges = (current: ImpostoRendaData, original: ImpostoRendaData): boolean => {
    if (!current || !original) return false
    
    const normalizeValue = (value: string): string => {
      if (!value) return ''
      return value.trim().toLowerCase()
    }
    
    const hasDataChanges = (
      normalizeValue(current.ir) !== normalizeValue(original.ir) ||
      normalizeValue(current.irAdicional) !== normalizeValue(original.irAdicional) ||
      normalizeValue(current.valorDeduzirMensal) !== normalizeValue(original.valorDeduzirMensal) ||
      normalizeValue(current.valorDeduzirTrimestral) !== normalizeValue(original.valorDeduzirTrimestral) ||
      normalizeValue(current.valorDeduzirAnual) !== normalizeValue(original.valorDeduzirAnual) ||
      normalizeValue(current.csll) !== normalizeValue(original.csll)
    )
    
    const hasPeriodoChanges = selectedPeriodo !== originalSelectedPeriodo
    
    return hasDataChanges || hasPeriodoChanges
  }

  // Função para obter valor deduzir baseado no período selecionado
  const getValorDeduzirByPeriodo = (): string => {
    switch (selectedPeriodo) {
      case 'mensal':
        return impostoRendaData.valorDeduzirMensal
      case 'trimestral':
        return impostoRendaData.valorDeduzirTrimestral
      case 'anual':
        return impostoRendaData.valorDeduzirAnual
      default:
        return impostoRendaData.valorDeduzirAnual
    }
  }

  // Funções para o modal de Imposto de Renda
  const handleOpenImpostoRendaModal = () => {
    // Salvar dados originais para comparação
    setOriginalImpostoRendaData(JSON.parse(JSON.stringify(impostoRendaData)))
    setOriginalSelectedPeriodo(selectedPeriodo)
    setIsSaveImpostoRendaDisabled(true) // Iniciar com botão desabilitado
    setShowImpostoRendaModal(true)
  }

  const handleCloseImpostoRendaModal = () => {
    // Verificar se há alterações pendentes antes de fechar
    if (!isSaveImpostoRendaDisabled) {
      setShowImpostoRendaExitConfirm(true)
    } else {
      setShowImpostoRendaModal(false)
    }
  }

  // Função para confirmar saída sem salvar
  const handleConfirmExitImpostoRenda = () => {
    // Restaurar dados originais
    setImpostoRendaData(JSON.parse(JSON.stringify(originalImpostoRendaData)))
    setSelectedPeriodo(originalSelectedPeriodo)
    setShowImpostoRendaExitConfirm(false)
    setShowImpostoRendaModal(false)
  }

  // Função para voltar ao modal de edição
  const handleBackToImpostoRenda = () => {
    setShowImpostoRendaExitConfirm(false)
  }
  
    // Função para atualizar ambas as tabelas com dados do Imposto de Renda
  const updateBothTablesWithImpostoRenda = () => {
    const valorDeduzir = getValorDeduzirByPeriodo()
    
    // Atualizar Lucro Presumido
    const updatedLucroPresumido = segmentoTributacaoLucroPresumido.map(item => ({
      ...item,
      ir: impostoRendaData.ir,
      irAdicional: impostoRendaData.irAdicional,
      irValorDeduzir: valorDeduzir,
      csll: impostoRendaData.csll
    }))
    
    // Atualizar Lucro Real
    const updatedLucroReal = segmentoTributacaoLucroReal.map(item => ({
      ...item,
      ir: impostoRendaData.ir,
      irAdicional: impostoRendaData.irAdicional,
      irValorDeduzir: valorDeduzir,
      csll: impostoRendaData.csll
    }))
    
    // Atualizar estados
    setSegmentoTributacaoLucroPresumido(updatedLucroPresumido)
    setSegmentoTributacaoLucroReal(updatedLucroReal)
    
    // Salvar no localStorage
    const dataLucroPresumido = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      segmentoTributacao: updatedLucroPresumido
    }
    const dataLucroReal = {
      timestamp: new Date().toISOString(),
      version: "1.0", 
      segmentoTributacao: updatedLucroReal
    }
    
    localStorage.setItem('segmentoTributacao_data', JSON.stringify(dataLucroPresumido))
    localStorage.setItem('lucroReal_data', JSON.stringify(dataLucroReal))
    
    console.log('?? Ambas as tabelas atualizadas com novos dados de IR!')
  }
  
   // Função para adicionar segmento em ambas as tabelas
 const addSegmentoToBothTables = (segmentoData: any) => {
   const valorDeduzir = getValorDeduzirByPeriodo()
   
   // Encontrar próximo ID para Lucro Presumido
   const nextIdLP = Math.max(...segmentoTributacaoLucroPresumido.map(item => item.id), 0) + 1
   
   // Encontrar próximo ID para Lucro Real
   const nextIdLR = Math.max(...segmentoTributacaoLucroReal.map(item => item.id), 0) + 1
   
   // Criar segmento para Lucro Presumido (com presunções)
   const segmentoLP = {
     id: nextIdLP,
     segmento: segmentoData.nomeSegmento,
     pis: segmentoData.lucroPresumido.pis,
     cofins: segmentoData.lucroPresumido.cofins,
     irPresuncao: segmentoData.lucroPresumido.irPresuncao,
     csllPresuncao: segmentoData.lucroPresumido.csllPresuncao,
     ir: impostoRendaData.ir,
     irAdicional: impostoRendaData.irAdicional,
     irValorDeduzir: valorDeduzir,
     csll: impostoRendaData.csll
   }
   
   // Criar segmento para Lucro Real (sem presunções)
   const segmentoLR = {
     id: nextIdLR,
     segmento: segmentoData.nomeSegmento,
     pis: segmentoData.lucroReal.pis,
     cofins: segmentoData.lucroReal.cofins,
     ir: impostoRendaData.ir,
     irAdicional: impostoRendaData.irAdicional,
     irValorDeduzir: valorDeduzir,
     csll: impostoRendaData.csll
   }
   
   // Adicionar e ordenar
   const updatedLP = [...segmentoTributacaoLucroPresumido, segmentoLP].sort((a, b) => 
     a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' })
   )
   
   const updatedLR = [...segmentoTributacaoLucroReal, segmentoLR].sort((a, b) => 
     a.segmento.localeCompare(b.segmento, 'pt-BR', { sensitivity: 'base' })
   )
   
   // Atualizar estados
   setSegmentoTributacaoLucroPresumido(updatedLP)
   setSegmentoTributacaoLucroReal(updatedLR)
   
   // Salvar no localStorage
   const dataLP = {
     timestamp: new Date().toISOString(),
     version: "1.0",
     segmentoTributacao: updatedLP
   }
   const dataLR = {
     timestamp: new Date().toISOString(),
     version: "1.0",
     segmentoTributacao: updatedLR
   }
   
   localStorage.setItem('segmentoTributacao_data', JSON.stringify(dataLP))
   localStorage.setItem('lucroReal_data', JSON.stringify(dataLR))
   
   console.log('?? Novo segmento adicionado em ambas as tabelas!')
   
   return { updatedLP, updatedLR }
 }
 
 // Função para remover segmento de ambas as tabelas pelo nome
 const removeSegmentoFromBothTables = (nomeSegmento: string) => {
   // Remover das duas listas usando o nome do segmento como chave
   const updatedLP = segmentoTributacaoLucroPresumido.filter(item => item.segmento !== nomeSegmento)
   const updatedLR = segmentoTributacaoLucroReal.filter(item => item.segmento !== nomeSegmento)

   
   // Atualizar estados no contexto
   setSegmentoTributacaoLucroPresumido(updatedLP)
   setSegmentoTributacaoLucroReal(updatedLR)
   
   // Salvar no localStorage ambas as tabelas
   const dataLP = {
     timestamp: new Date().toISOString(),
     version: "1.0",
     segmentoTributacao: updatedLP
   }
   const dataLR = {
     timestamp: new Date().toISOString(),
     version: "1.0",
     segmentoTributacao: updatedLR
   }
   
   localStorage.setItem('segmentoTributacao_data', JSON.stringify(dataLP))
   localStorage.setItem('lucroReal_data', JSON.stringify(dataLR))
   
   console.log(`🗑️ Segmento "${nomeSegmento}" removido de ambas as tabelas e sincronizado!`)
   
   return { updatedLP, updatedLR }
 }

  
   // Função para buscar segmento por nome
 const buscarSegmentoPorNome = (nomeSegmento: string) => {
   const segmentoLP = segmentoTributacaoLucroPresumido.find(
     seg => seg.segmento.toLowerCase().includes(nomeSegmento.toLowerCase())
   )
   const segmentoLR = segmentoTributacaoLucroReal.find(
     seg => seg.segmento.toLowerCase().includes(nomeSegmento.toLowerCase())
   )
   
   return {
     lucroPresumido: segmentoLP || null,
     lucroReal: segmentoLR || null,
     encontrado: !!(segmentoLP || segmentoLR)
   }
 }

  // Função para fechar modal diretamente após salvar (sem verificar mudanças)
 const handleSaveAndCloseModal = () => {
    // Salvar dados imediatamente antes de fechar
   const dataToSave = {
     timestamp: new Date().toISOString(),
     version: "1.0",
     impostoRendaData: impostoRendaData,
     selectedPeriodo: selectedPeriodo
   }
   localStorage.setItem('global_impostoRenda_data', JSON.stringify(dataToSave))
   console.log('?? Dados de Imposto de Renda salvos manualmente no modal!')
   
   // Atualizar ambas as tabelas
    updateBothTablesWithImpostoRenda()

   // Resetar estado de modificação
   setIsSaveImpostoRendaDisabled(true)
   // Atualizar dados originais para refletir o salvamento
   setOriginalImpostoRendaData(JSON.parse(JSON.stringify(impostoRendaData)))
   setOriginalSelectedPeriodo(selectedPeriodo)
   // Fechar modal diretamente
   setShowImpostoRendaModal(false)
 }

  // Salvar dados automaticamente quando houver mudanças
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = {
          timestamp: new Date().toISOString(),
          version: "1.0",
          impostoRendaData: impostoRendaData,
          selectedPeriodo: selectedPeriodo
        }

        localStorage.setItem('global_impostoRenda_data', JSON.stringify(dataToSave))
        console.log('💾 Dados de Imposto de Renda salvos automaticamente!')
      } catch (error) {
        console.error('❌ Erro ao salvar dados de Imposto de Renda:', error)
      }
    }

   // Verificar se há mudanças reais nos dados antes de salvar
   const hasChanges = JSON.stringify(impostoRendaData) !== JSON.stringify(originalImpostoRendaData) || 
                     selectedPeriodo !== originalSelectedPeriodo
   
   // Salvar apenas se houver mudanças reais e não estivermos na inicialização
   if (hasChanges && originalImpostoRendaData !== impostoRendaDataPadrao) {
     saveData()
   }
  }, [impostoRendaData, selectedPeriodo])

  // Monitorar mudanças para habilitar/desabilitar botão salvar
  useEffect(() => {
    const hasChanges = checkImpostoRendaChanges(impostoRendaData, originalImpostoRendaData) || 
                      selectedPeriodo !== originalSelectedPeriodo
    setIsSaveImpostoRendaDisabled(!hasChanges)
  }, [impostoRendaData, originalImpostoRendaData, selectedPeriodo, originalSelectedPeriodo])

  const value = {
    impostoRendaData,
    selectedPeriodo,
    originalImpostoRendaData,
    originalSelectedPeriodo,
    isSaveImpostoRendaDisabled,
    showImpostoRendaModal,
    showImpostoRendaExitConfirm,
	    segmentoTributacaoLucroPresumido,
    segmentoTributacaoLucroReal,

    
    setImpostoRendaData,
    setSelectedPeriodo,
    setOriginalImpostoRendaData,
    setOriginalSelectedPeriodo,
    setIsSaveImpostoRendaDisabled,
    setShowImpostoRendaModal,
    setShowImpostoRendaExitConfirm,
	    setSegmentoTributacaoLucroPresumido,
    setSegmentoTributacaoLucroReal,

    
    handleOpenImpostoRendaModal,
    handleCloseImpostoRendaModal,
    handleConfirmExitImpostoRenda,
    handleBackToImpostoRenda,
	handleSaveAndCloseModal,
	updateBothTablesWithImpostoRenda,
	addSegmentoToBothTables,
	removeSegmentoFromBothTables,
    checkImpostoRendaChanges,
    getValorDeduzirByPeriodo,
    buscarSegmentoPorNome
  } 

  return (
    <ImpostoRendaContext.Provider value={value}>
      {children} 
    </ImpostoRendaContext.Provider>
  )
}

// Hook customizado para usar o contexto
export const useImpostoRenda = () => {
  const context = useContext(ImpostoRendaContext)
  if (context === undefined) {
    throw new Error('useImpostoRenda deve ser usado dentro de um ImpostoRendaProvider')
  }
  return context
}