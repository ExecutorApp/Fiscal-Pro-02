import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipo para um item de Estado e ICMS
 interface EstadoICMS {
   id: number
   estado: string
   percentual: string
   incentivo?: string
   contribuicaoNome?: string
   contribuicaoPercentual?: string
   contribuicaoValorFixo?: string
   contribuicaoTipo?: 'percentual' | 'monetario'
 }


// Tipo para o contexto
interface EstadosICMSContextType {
  estadosICMS: EstadoICMS[]
  addEstadoICMS: (estado: Omit<EstadoICMS, 'id'>) => void
  removeEstadoICMS: (id: number) => void
  updateEstadoICMS: (index: number, field: string, value: string) => void
  saveEstadosICMS: () => Promise<void>
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

// Dados padrão dos estados
  const estadosICMSPadrao: EstadoICMS[] = [
   { id: 1, estado: 'ACRE', percentual: '19%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 2, estado: 'ALAGOAS', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 3, estado: 'PIAUÍ', percentual: '21%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 4, estado: 'RIO GRANDE DO NORTE', percentual: '18%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 5, estado: 'AMAPÁ', percentual: '18%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 6, estado: 'AMAZONAS', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 7, estado: 'MARANHÃO', percentual: '22%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 8, estado: 'BAHIA', percentual: '20,50%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 9, estado: 'CEARÁ', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 10, estado: 'DISTRITO FEDERAL', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 11, estado: 'ESPIRITO SANTO', percentual: '17%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 12, estado: 'GOIÁS', percentual: '19%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 13, estado: 'MATO GROSSO', percentual: '17%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 14, estado: 'MATO GROSSO DO SUL', percentual: '17%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 15, estado: 'MINAS GERAIS', percentual: '18%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 16, estado: 'PARÁ', percentual: '19%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 17, estado: 'PARAÍBA', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 18, estado: 'PARANÁ', percentual: '19,50%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 19, estado: 'PERNAMBUCO', percentual: '20,50%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 20, estado: 'RIO DE JANEIRO', percentual: '22%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 21, estado: 'RIO GRANDE DO SUL', percentual: '17%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 22, estado: 'RONDÔNIA', percentual: '19,50%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 23, estado: 'RORAIMA', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 24, estado: 'SANTA CATARINA', percentual: '17%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 25, estado: 'SÃO PAULO', percentual: '18%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 26, estado: 'SERGIPE', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' },
   { id: 27, estado: 'TOCANTINS', percentual: '20%', incentivo: '', contribuicaoNome: '', contribuicaoPercentual: '', contribuicaoValorFixo: '', contribuicaoTipo: 'percentual' }
 ].sort((a, b) => a.estado.localeCompare(b.estado, 'pt-BR', { sensitivity: 'base' }))

// Contexto
const EstadosICMSContext = createContext<EstadosICMSContextType | undefined>(undefined)

// Provider
interface EstadosICMSProviderProps {
  children: ReactNode
}

export const EstadosICMSProvider: React.FC<EstadosICMSProviderProps> = ({ children }) => {
  const [estadosICMS, setEstadosICMS] = useState<EstadoICMS[]>(estadosICMSPadrao)
  const [isDirty, setIsDirty] = useState(false)
  const [nextId, setNextId] = useState(28)

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedData = localStorage.getItem('global_estadosICMS_data')
        
        if (savedData) {
          const parsedData = JSON.parse(savedData)
           // Migração segura: garantir que todos os campos existam
           const migratedData = parsedData.estadosICMS.map((estado: any) => ({
             ...estado,
             contribuicaoNome: estado.contribuicaoNome || '',
             contribuicaoPercentual: estado.contribuicaoPercentual || '',
             contribuicaoValorFixo: estado.contribuicaoValorFixo || '',
             contribuicaoTipo: estado.contribuicaoTipo || 'percentual'


           }))
           setEstadosICMS(migratedData)

          console.log('✅ Dados de Estados e ICMS carregados do armazenamento global!')
        } else {
          console.log('🔄 Usando dados padrão de Estados e ICMS - primeira vez')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados salvos de Estados e ICMS:', error)
        console.log('🔄 Usando dados padrão de Estados e ICMS')
      }
    }

    loadPersistedData()
  }, [])

  // Função para adicionar estado
  const addEstadoICMS = (novoEstado: Omit<EstadoICMS, 'id'>) => {
    const estadoToAdd = {
      id: nextId,
      ...novoEstado
    }
    const updatedList = [...estadosICMS, estadoToAdd].sort((a, b) => 
      a.estado.localeCompare(b.estado, 'pt-BR', { sensitivity: 'base' })
    )
    setEstadosICMS(updatedList)
    setNextId(nextId + 1)
    setIsDirty(true)
  }

  // Função para remover estado
  const removeEstadoICMS = (id: number) => {
    setEstadosICMS(estadosICMS.filter(item => item.id !== id))
    setIsDirty(true)
  }

  // Função para atualizar estado
  const updateEstadoICMS = (index: number, field: string, value: string) => {
    const updated = [...estadosICMS]
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
    }
    console.log('Atualizando no contexto:', { index, field, value, item: updated[index] }) // Debug
    setEstadosICMS(updated)
    setIsDirty(true)
  }

  // Função para salvar alterações
  const saveEstadosICMS = async () => {
    if (!isDirty) return

    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        estadosICMS: estadosICMS
      }

      console.log('=== DADOS PARA PERSISTÊNCIA GLOBAL - ESTADOS E ICMS ===')
      console.log('Salvando alterações dos Estados ICMS:', JSON.stringify(dataToSave, null, 2))

      localStorage.setItem('global_estadosICMS_data', JSON.stringify(dataToSave))
      
      console.log('✅ Dados de Estados e ICMS salvos permanentemente no navegador!')
      setIsDirty(false)

    } catch (error) {
      console.error('❌ Erro ao salvar dados de Estados e ICMS:', error)
      throw error
    }
  }

  const value = {
    estadosICMS,
    addEstadoICMS,
    removeEstadoICMS,
    updateEstadoICMS,
    saveEstadosICMS,
    isDirty,
    setIsDirty
  }

  return (
    <EstadosICMSContext.Provider value={value}>
      {children}
    </EstadosICMSContext.Provider>
  )
}

// Hook customizado para usar o contexto
export const useEstadosICMS = () => {
  const context = useContext(EstadosICMSContext)
  if (context === undefined) {
    throw new Error('useEstadosICMS deve ser usado dentro de um EstadosICMSProvider')
  }
  return context
}