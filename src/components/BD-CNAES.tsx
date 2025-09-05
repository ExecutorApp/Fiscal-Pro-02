import React, { useState, useEffect, useMemo, useRef } from 'react'
import { CNAES, CNAE, searchCNAEs, normalizeCNAE } from '../data/cnaes'

// Ícones
const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

const ArrowLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
)

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
)

const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
)

const ChevronUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18,15 12,9 6,15"/>
  </svg>
)

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
)

// Interface para CNAEs Alternativos
interface CNAEAlternativo {
  id: string
  cnae: CNAE
  incentivos?: {
    icmsPorEstado: { uf: string; percentual: number }[]
    pis: number
    cofins: number
  }
}

// Interface para Tributos
interface Tributo {
  id: string
  tipo: string
  aliquota: number | null
  valorDiferido: {
    valor: number | null
    tipo: 'R$' | '%'
  }
  lei: string
  artigo: string
}

// Interface para Incentivos Estaduais
interface IncentivoEstadual {
  id: string
  estado: string
  tributos: Tributo[]
}

// Interface para Incentivos Federais
interface IncentivoFederal {
  tributos: Tributo[]
}

// Estados brasileiros
const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
]

interface BDCNAESProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDCNAES: React.FC<BDCNAESProps> = ({ onDataChange, onSaveComplete }) => {
  // Estados principais
  const [cnaes, setCnaes] = useState<CNAE[]>(CNAES)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchQueryAlternativos, setSearchQueryAlternativos] = useState('')
  const [cnaesAlternativos, setCnaesAlternativos] = useState<{ [cnaeId: string]: CNAEAlternativo[] }>({}) // Vínculo individual por CNAE
  const [selectedCnae, setSelectedCnae] = useState<CNAE | null>(null) // CNAE selecionado no painel esquerdo
  const [selectedCnaeIncentivos, setSelectedCnaeIncentivos] = useState<CNAEAlternativo | null>(null)
  
  // Estados para o novo modal de Incentivos Fiscais
  const [showIncentivosFiscaisModal, setShowIncentivosFiscaisModal] = useState(false)
  const [incentivosCnae, setIncentivosCnae] = useState<CNAEAlternativo | null>(null)
  const [incentivosEstaduais, setIncentivosEstaduais] = useState<IncentivoEstadual[]>([])
  const [incentivosFederais, setIncentivosFederais] = useState<IncentivoFederal>({ tributos: [] })
  const [abaAtiva, setAbaAtiva] = useState(0)
  const [estadoSelecionado, setEstadoSelecionado] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Estados para modais
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteAlternativoConfirm, setShowDeleteAlternativoConfirm] = useState(false)
  const [showDeleteEstadoConfirm, setShowDeleteEstadoConfirm] = useState(false)
  const [cnaeToEdit, setCnaeToEdit] = useState<CNAE | null>(null)
  const [cnaeToDelete, setCnaeToDelete] = useState<CNAE | null>(null)
  const [alternativoToDelete, setAlternativoToDelete] = useState<CNAEAlternativo | null>(null)
  
  // Estados para formulários
  const [formData, setFormData] = useState({ cnae: '', descricao: '', rat: '' })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  // Ref do carrossel vertical de abas de estados
  const estadoTabsRef = useRef<HTMLDivElement | null>(null)
  const scrollEstadoTabs = (delta: number) => {
    if (estadoTabsRef.current) {
      estadoTabsRef.current.scrollBy({ top: delta, behavior: 'smooth' })
    }
  }
  
  // Debounce para busca
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [debouncedSearchQueryAlternativos, setDebouncedSearchQueryAlternativos] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQueryAlternativos(searchQueryAlternativos)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQueryAlternativos])
  
  // CNAEs filtrados
  const filteredCnaes = useMemo(() => {
    return searchCNAEs(debouncedSearchQuery, cnaes)
  }, [debouncedSearchQuery, cnaes])
  
  // CNAEs disponíveis para adicionar como alternativos
  const availableCnaesAlternativos = useMemo(() => {
    const currentCnaeAlternativos = selectedCnae ? (cnaesAlternativos[selectedCnae.cnae] || []) : []
    const existingCnaes = new Set(currentCnaeAlternativos.map(alt => normalizeCNAE(alt.cnae.cnae)))
    const available = CNAES.filter(cnae => !existingCnaes.has(normalizeCNAE(cnae.cnae)))
    return searchCNAEs(debouncedSearchQueryAlternativos, available)
  }, [debouncedSearchQueryAlternativos, cnaesAlternativos, selectedCnae])
  
  // Validação do formulário
  const validateForm = (data: typeof formData): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    if (!data.cnae.trim()) {
      newErrors.cnae = 'CNAE é obrigatório'
    } else if (!/^\d{4}-?\d$/.test(data.cnae.trim())) {
      newErrors.cnae = 'CNAE deve ter o formato 0000-0'
    }
    
    if (!data.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    }
    
    if (!data.rat.trim()) {
      newErrors.rat = 'RAT é obrigatório'
    } else {
      const ratNum = parseFloat(data.rat)
      if (isNaN(ratNum) || ratNum < 0 || ratNum > 100) {
        newErrors.rat = 'RAT deve ser um número entre 0 e 100'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handlers para CRUD de CNAEs
  const handleAddCnae = () => {
    if (!validateForm(formData)) return
    
    const newCnae: CNAE = {
      cnae: formData.cnae.trim(),
      descricao: formData.descricao.trim(),
      rat: parseFloat(formData.rat)
    }
    
    setCnaes(prev => [...prev, newCnae])
    setFormData({ cnae: '', descricao: '', rat: '' })
    setShowAddModal(false)
    setErrors({})
  }
  
  const handleEditCnae = () => {
    if (!validateForm(formData) || !cnaeToEdit) return
    
    setCnaes(prev => prev.map(cnae => 
      cnae === cnaeToEdit ? {
        cnae: formData.cnae.trim(),
        descricao: formData.descricao.trim(),
        rat: parseFloat(formData.rat)
      } : cnae
    ))
    
    setFormData({ cnae: '', descricao: '', rat: '' })
    setShowEditModal(false)
    setCnaeToEdit(null)
    setErrors({})
  }
  
  const handleDeleteCnae = () => {
    if (!cnaeToDelete) return
    
    setCnaes(prev => prev.filter(cnae => cnae !== cnaeToDelete))
    setShowDeleteConfirm(false)
    setCnaeToDelete(null)
  }
  
  // Handlers para CNAEs Alternativos
  const handleAddAlternativo = (cnae: CNAE) => {
    if (!selectedCnae) return
    
    const newAlternativo: CNAEAlternativo = {
      id: Date.now().toString(),
      cnae,
      incentivos: {
        icmsPorEstado: [],
        pis: 0,
        cofins: 0
      }
    }
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: [...(prev[selectedCnae.cnae] || []), newAlternativo]
    }))
  }
  
  const handleDeleteAlternativo = () => {
    if (!alternativoToDelete || !selectedCnae) return
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: (prev[selectedCnae.cnae] || []).filter(alt => alt.id !== alternativoToDelete.id)
    }))
    setShowDeleteAlternativoConfirm(false)
    setAlternativoToDelete(null)
    
    // Se estava visualizando incentivos deste CNAE, fechar painel
    if (selectedCnaeIncentivos?.id === alternativoToDelete.id) {
      setSelectedCnaeIncentivos(null)
    }
  }
  
  // Handlers para Painel de Incentivos
  const handleAddICMSEstado = () => {
    if (!selectedCnaeIncentivos || !selectedCnae) return
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: (prev[selectedCnae.cnae] || []).map(alt => 
        alt.id === selectedCnaeIncentivos.id ? {
          ...alt,
          incentivos: {
            ...alt.incentivos!,
            icmsPorEstado: [...alt.incentivos!.icmsPorEstado, { uf: 'SP', percentual: 0 }]
          }
        } : alt
      )
    }))
    
    // Atualizar estado local
    setSelectedCnaeIncentivos(prev => prev ? {
      ...prev,
      incentivos: {
        ...prev.incentivos!,
        icmsPorEstado: [...prev.incentivos!.icmsPorEstado, { uf: 'SP', percentual: 0 }]
      }
    } : null)
  }
  
  const handleRemoveICMSEstado = (index: number) => {
    if (!selectedCnaeIncentivos || !selectedCnae) return
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: (prev[selectedCnae.cnae] || []).map(alt => 
        alt.id === selectedCnaeIncentivos.id ? {
          ...alt,
          incentivos: {
            ...alt.incentivos!,
            icmsPorEstado: alt.incentivos!.icmsPorEstado.filter((_, i) => i !== index)
          }
        } : alt
      )
    }))
    
    // Atualizar estado local
    setSelectedCnaeIncentivos(prev => prev ? {
      ...prev,
      incentivos: {
        ...prev.incentivos!,
        icmsPorEstado: prev.incentivos!.icmsPorEstado.filter((_, i) => i !== index)
      }
    } : null)
  }
  
  const handleUpdateICMSEstado = (index: number, field: 'uf' | 'percentual', value: string | number) => {
    if (!selectedCnaeIncentivos || !selectedCnae) return
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: (prev[selectedCnae.cnae] || []).map(alt => 
        alt.id === selectedCnaeIncentivos.id ? {
          ...alt,
          incentivos: {
            ...alt.incentivos!,
            icmsPorEstado: alt.incentivos!.icmsPorEstado.map((item, i) => 
              i === index ? { ...item, [field]: value } : item
            )
          }
        } : alt
      )
    }))
    
    // Atualizar estado local
    setSelectedCnaeIncentivos(prev => prev ? {
      ...prev,
      incentivos: {
        ...prev.incentivos!,
        icmsPorEstado: prev.incentivos!.icmsPorEstado.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    } : null)
  }
  
  const handleUpdateIncentivo = (field: 'pis' | 'cofins', value: number) => {
    if (!selectedCnaeIncentivos || !selectedCnae) return
    
    setCnaesAlternativos(prev => ({
      ...prev,
      [selectedCnae.cnae]: (prev[selectedCnae.cnae] || []).map(alt => 
        alt.id === selectedCnaeIncentivos.id ? {
          ...alt,
          incentivos: {
            ...alt.incentivos!,
            [field]: value
          }
        } : alt
      )
    }))
    
    // Atualizar estado local
    setSelectedCnaeIncentivos(prev => prev ? {
      ...prev,
      incentivos: {
        ...prev.incentivos!,
        [field]: value
      }
    } : null)
  }
  
  // Handlers para modais
  const openAddModal = () => {
    setFormData({ cnae: '', descricao: '', rat: '' })
    setErrors({})
    setShowAddModal(true)
  }
  
  const openEditModal = (cnae: CNAE) => {
    setFormData({
      cnae: cnae.cnae,
      descricao: cnae.descricao,
      rat: cnae.rat.toString()
    })
    setCnaeToEdit(cnae)
    setErrors({})
    setShowEditModal(true)
  }
  
  const openDeleteConfirm = (cnae: CNAE) => {
    setCnaeToDelete(cnae)
    setShowDeleteConfirm(true)
  }
  
  const openDeleteAlternativoConfirm = (alternativo: CNAEAlternativo) => {
    setAlternativoToDelete(alternativo)
    setShowDeleteAlternativoConfirm(true)
  }

  // Funções para o novo modal de Incentivos Fiscais
  const openIncentivosFiscaisModal = (cnaeAlternativo: CNAEAlternativo) => {
    setIncentivosCnae(cnaeAlternativo)
    setShowIncentivosFiscaisModal(true)
    setHasUnsavedChanges(false)
    // Carregar dados existentes ou inicializar vazios
    setIncentivosEstaduais([])
    setIncentivosFederais({ tributos: [] })
    setAbaAtiva(0)
    setEstadoSelecionado('')
  }

  const closeIncentivosFiscaisModal = () => {
    if (hasUnsavedChanges) {
      setShowConfirmModal(true)
    } else {
      setShowIncentivosFiscaisModal(false)
      setIncentivosCnae(null)
    }
  }

  const confirmCloseModal = () => {
    setShowIncentivosFiscaisModal(false)
    setIncentivosCnae(null)
    setShowConfirmModal(false)
    setHasUnsavedChanges(false)
  }

  // Utilitários de formatação para o modal Incentivos Fiscais
  const formatPercentDisplay = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return ''
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
  }
  const parsePercentInput = (raw: string): number | null => {
    if (raw === undefined || raw === null) return null
    const trimmed = String(raw).trim()
    if (trimmed === '') return null
    const cleaned = trimmed.replace(/%/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
  }
  const formatCurrencyBR = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return ''
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  const parseCurrencyBR = (raw: string): number | null => {
    if (raw === undefined || raw === null) return null
    const trimmed = String(raw).trim()
    if (trimmed === '') return null
    const cleaned = trimmed.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
  }

  const addEstado = () => {
    const newEstado: IncentivoEstadual = {
      id: Date.now().toString(),
      estado: '',
      tributos: []
    }
    setIncentivosEstaduais(prev => [...prev, newEstado])
    setAbaAtiva(incentivosEstaduais.length)
    setHasUnsavedChanges(true)
  }

  const removeEstado = (index: number) => {
    setIncentivosEstaduais(prev => prev.filter((_, i) => i !== index))
    if (abaAtiva >= incentivosEstaduais.length - 1) {
      setAbaAtiva(Math.max(0, incentivosEstaduais.length - 2))
    }
    setHasUnsavedChanges(true)
  }

  const removeEstadoAtivo = () => {
    if (incentivosEstaduais.length > 0) {
      removeEstado(abaAtiva)
      setShowDeleteEstadoConfirm(false)
    }
  }

  const addTributo = (tipo: 'estadual' | 'federal') => {
    const newTributo: Tributo = {
      id: Date.now().toString(),
      tipo: '',
      aliquota: 0,
      valorDiferido: { valor: 0, tipo: 'R$' },
      lei: '',
      artigo: ''
    }

    if (tipo === 'estadual' && incentivosEstaduais[abaAtiva]) {
      setIncentivosEstaduais(prev => prev.map((estado, index) => 
        index === abaAtiva 
          ? { ...estado, tributos: [...estado.tributos, newTributo] }
          : estado
      ))
    } else if (tipo === 'federal') {
      setIncentivosFederais(prev => ({
        ...prev,
        tributos: [...prev.tributos, newTributo]
      }))
    }
    setHasUnsavedChanges(true)
  }

  const removeTributo = (tipo: 'estadual' | 'federal', tributoId: string) => {
    if (tipo === 'estadual') {
      setIncentivosEstaduais(prev => prev.map((estado, index) => 
        index === abaAtiva 
          ? { ...estado, tributos: estado.tributos.filter(t => t.id !== tributoId) }
          : estado
      ))
    } else {
      setIncentivosFederais(prev => ({
        ...prev,
        tributos: prev.tributos.filter(t => t.id !== tributoId)
      }))
    }
    setHasUnsavedChanges(true)
  }

  const updateTributo = (tipo: 'estadual' | 'federal', tributoId: string, field: keyof Tributo, value: any) => {
    if (tipo === 'estadual') {
      setIncentivosEstaduais(prev => prev.map((estado, index) => 
        index === abaAtiva 
          ? { 
              ...estado, 
              tributos: estado.tributos.map(t => 
                t.id === tributoId ? { ...t, [field]: value } : t
              )
            }
          : estado
      ))
    } else {
      setIncentivosFederais(prev => ({
        ...prev,
        tributos: prev.tributos.map(t => 
          t.id === tributoId ? { ...t, [field]: value } : t
        )
      }))
    }
    setHasUnsavedChanges(true)
  }

  const updateEstadoSelecionado = (estado: string) => {
    if (incentivosEstaduais[abaAtiva]) {
      setIncentivosEstaduais(prev => prev.map((est, index) => 
        index === abaAtiva ? { ...est, estado } : est
      ))
      setEstadoSelecionado(estado)
      setHasUnsavedChanges(true)
    }
  }

  const saveIncentivos = () => {
    // Salvar no localStorage
    const incentivosData = {
      cnaeId: incentivosCnae?.id,
      estaduais: incentivosEstaduais,
      federais: incentivosFederais
    }
    localStorage.setItem(`incentivos_${incentivosCnae?.id}`, JSON.stringify(incentivosData))
    setHasUnsavedChanges(false)
    setShowIncentivosFiscaisModal(false)
    setIncentivosCnae(null)
  }
  
  // Renderização do Painel de Incentivos
  if (selectedCnaeIncentivos) {
    return (
      <div className="h-full flex flex-col">
        {/* Header do Painel */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedCnaeIncentivos(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon size={16} />
            Voltar
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 text-center flex-1">
            {selectedCnaeIncentivos.cnae.cnae} • {selectedCnaeIncentivos.cnae.descricao}
          </h3>
          
          <button
            onClick={() => setSelectedCnaeIncentivos(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>
        
        {/* Conteúdo do Painel */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* ICMS por Estado */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">ICMS por Estado</h4>
              <button
                onClick={handleAddICMSEstado}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <PlusIcon size={12} />
                Adicionar
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedCnaeIncentivos.incentivos?.icmsPorEstado.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.uf}
                    onChange={(e) => handleUpdateICMSEstado(index, 'uf', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ESTADOS_BRASIL.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.percentual}
                    onChange={(e) => handleUpdateICMSEstado(index, 'percentual', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Percentual"
                  />
                  
                  <button
                    onClick={() => handleRemoveICMSEstado(index)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
              
              {selectedCnaeIncentivos.incentivos?.icmsPorEstado.length === 0 && (
                <p className="text-sm text-gray-500 italic">Nenhum estado adicionado</p>
              )}
            </div>
          </div>
          
          {/* Incentivos Fixos */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Incentivos Fixos</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PIS (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={selectedCnaeIncentivos.incentivos?.pis || 0}
                  onChange={(e) => handleUpdateIncentivo('pis', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">COFINS (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={selectedCnaeIncentivos.incentivos?.cofins || 0}
                  onChange={(e) => handleUpdateIncentivo('cofins', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Renderização principal
  return (
    <div className="h-full grid grid-cols-2 overflow-hidden">
      {/* Coluna Esquerda - Lista de CNAEs */}
      <div className="border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Título */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CNAES Padrão</h3>
        </div>

        {/* Barra de busca e Botão Adicionar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por CNAE ou descrição..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpar pesquisa"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <PlusIcon size={16} />
            Adicionar CNAE
          </button>
        </div>
        
        {/* Tabela de CNAEs */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNAE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAT</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCnaes.map((cnae, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedCnae?.cnae === cnae.cnae ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCnae(cnae)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap w-16">{cnae.cnae}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-0 truncate w-500" title={cnae.descricao}>{cnae.descricao}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap w-10">{cnae.rat}%</td>
                  <td className="px-4 py-3 text-right w-16">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(cnae)
                        }}
                        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteConfirm(cnae)
                        }}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCnaes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum CNAE encontrado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Coluna Direita - CNAEs Alternativos */}
      <div className="flex flex-col overflow-hidden">
        {/* Título */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CNAES Alternativos</h3>
        </div>

        {/* Barra de busca */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQueryAlternativos}
              onChange={(e) => setSearchQueryAlternativos(e.target.value)}
              placeholder="Buscar CNAEs para adicionar..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQueryAlternativos && (
              <button
                onClick={() => setSearchQueryAlternativos('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpar pesquisa"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>
        
        {/* Lista de CNAEs disponíveis para adicionar */}
        {selectedCnae && searchQueryAlternativos && (
          <div className="border-b border-gray-200 max-h-48 overflow-y-auto flex-shrink-0 min-w-0">
            {availableCnaesAlternativos.map((cnae, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{cnae.cnae}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 truncate pr-2" title={cnae.descricao}>{cnae.descricao}</div>
                    <div className="text-xs text-gray-900 font-medium whitespace-nowrap">{cnae.rat}%</div>
                  </div>
                </div>
                <button
                  onClick={() => handleAddAlternativo(cnae)}
                  className="ml-3 p-1 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                  title="Adicionar"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            ))}
            
            {availableCnaesAlternativos.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQueryAlternativos ? 'Nenhum CNAE encontrado' : 'Todos os CNAEs já foram adicionados'}
              </div>
            )}
          </div>
        )}
        
        {/* Tabela de CNAEs Alternativos */}
        <div className="flex-1 overflow-y-auto">
          {!selectedCnae ? (
            <div className="p-8 text-center text-gray-500">
              <p>Selecione um CNAE no painel esquerdo</p>
              <p className="text-sm mt-1">para visualizar seus CNAEs alternativos</p>
            </div>
          ) : (
            (() => {
              const currentCnaeAlternativos = cnaesAlternativos[selectedCnae.cnae] || []
              return currentCnaeAlternativos.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-md mx-4 mt-4">
                  <p>Nenhum CNAE alternativo adicionado</p>
                  <p className="text-sm mt-1">Use a busca acima para adicionar CNAEs</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNAE</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAT</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCnaeAlternativos.map((alternativo) => (
                      <tr 
                        key={alternativo.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openIncentivosFiscaisModal(alternativo)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap w-16">{alternativo.cnae.cnae}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-0 truncate w-500" title={alternativo.cnae.descricao}>{alternativo.cnae.descricao}</td>
                         <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap w-10">{alternativo.cnae.rat}%</td>
                        <td className="px-4 py-3 text-right w-16">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteAlternativoConfirm(alternativo)
                            }}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
               )
             })()
           )}
          

        </div>
      </div>
      
      {/* Modal Adicionar/Editar CNAE */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {showAddModal ? 'Adicionar CNAE' : 'Editar CNAE'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNAE *</label>
                <input
                  type="text"
                  value={formData.cnae}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cnae ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0000-0"
                />
                {errors.cnae && <p className="text-xs text-red-600 mt-1">{errors.cnae}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.descricao ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Descrição da atividade"
                />
                {errors.descricao && <p className="text-xs text-red-600 mt-1">{errors.descricao}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RAT (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.rat}
                  onChange={(e) => setFormData(prev => ({ ...prev, rat: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rat ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.rat && <p className="text-xs text-red-600 mt-1">{errors.rat}</p>}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormData({ cnae: '', descricao: '', rat: '' })
                  setCnaeToEdit(null)
                  setErrors({})
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={showAddModal ? handleAddCnae : handleEditCnae}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {showAddModal ? 'Adicionar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Confirmar Exclusão CNAE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir o CNAE <strong>{cnaeToDelete?.cnae}</strong>?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setCnaeToDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCnae}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Confirmar Exclusão Alternativo */}
      {showDeleteAlternativoConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir o CNAE alternativo <strong>{alternativoToDelete?.cnae.cnae}</strong>?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteAlternativoConfirm(false)
                  setAlternativoToDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAlternativo}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Novo Modal de Incentivos Fiscais */}
      {showIncentivosFiscaisModal && incentivosCnae && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg w-[95vw] h-[90vh] flex flex-col">
            {/* Header Fixo */}
            <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg shadow-sm">
              <div className="flex items-center space-x-4">
                <button
                  onClick={closeIncentivosFiscaisModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon size={20} />
                </button>
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Incentivos Fiscais</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {incentivosCnae.cnae.cnae} - {incentivosCnae.cnae.descricao}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={saveIncentivos}
                  className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={closeIncentivosFiscaisModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal - Duas Colunas */}
            <div className="flex-1 flex overflow-hidden">
              {/* Coluna Esquerda - Estaduais */}
              <div className="w-1/2 border-r flex">
                {/* Navegação Vertical - Estados */}
                <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col">
                  {/* Header da navegação */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={addEstado}
                        disabled={false}
                        className="p-1.5 bg-[#1777CF] text-white rounded hover:bg-[#1565C0] flex items-center justify-center"
                        title="Adicionar Estado"
                      >
                        <PlusIcon size={14} />
                      </button>
                      <button
                        onClick={() => removeEstado(abaAtiva)}
                        disabled={incentivosEstaduais.length === 0}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                          incentivosEstaduais.length === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Remover Estado"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                    
                  {/* Abas dos Estados - com setas e centralização */}
                  <div className="flex-1 flex flex-col py-2">
                    {/* Seta para cima */}
                    <div className="flex justify-center mb-2 px-2">
                      <button
                        type="button"
                        onClick={() => scrollEstadoTabs(-120)}
                        disabled={incentivosEstaduais.length === 0}
                        className={`w-12 min-w-[3rem] py-2 flex items-center justify-center rounded-md transition-colors ${
                          incentivosEstaduais.length === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                        }`}
                        aria-label="Rolar para cima"
                        title="Anterior"
                      >
                        <ChevronUpIcon size={16} />
                      </button>
                    </div>

                    {/* Lista de abas */}
                    <div
                      ref={estadoTabsRef}
                      className="flex-1 overflow-y-auto hide-scrollbar px-2"
                    >
                      <div className="flex flex-col items-center gap-2">
                        {incentivosEstaduais.map((incentivo, index) => (
                          <button
                            key={index}
                            onClick={() => setAbaAtiva(index)}
                            className={`w-12 min-w-[3rem] px-0 py-2 text-xs border border-gray-300 rounded-md transition-colors text-center ${
                              abaAtiva === index
                                ? 'bg-[#1777CF] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                            title={incentivo.estado ? `${incentivo.estado}` : `Estado ${index + 1}`}
                          >
                            <div className="font-medium">{String(index + 1).padStart(2, '0')}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seta para baixo */}
                    <div className="flex justify-center mt-2 px-2">
                      <button
                        type="button"
                        onClick={() => scrollEstadoTabs(120)}
                        disabled={incentivosEstaduais.length === 0}
                        className={`w-12 min-w-[3rem] py-2 flex items-center justify-center rounded-md transition-colors ${
                          incentivosEstaduais.length === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                        }`}
                        aria-label="Rolar para baixo"
                        title="Próximo"
                      >
                        <ChevronDownIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Conteúdo Principal */}
                <div className="flex-1 flex flex-col">
                  {/* Header da Coluna Estaduais */}
                  <div className="px-[15px] pt-[20px] pb-[0px] border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Estaduais</h3>
                      <button
                        onClick={() => addTributo('estadual')}
                        disabled={incentivosEstaduais.length === 0}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          incentivosEstaduais.length === 0 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-[#1777CF] text-white hover:bg-[#1565C0]'
                        }`}
                      >
                        + Tributo
                      </button>
                    </div>

                    {/* Dropdown de Estado */}
                    {incentivosEstaduais.length > 0 && (
                      <div className="w-full pb-[20px]">
                        <select
                          value={incentivosEstaduais[abaAtiva]?.estado || ''}
                          onChange={(e) => updateEstadoSelecionado(e.target.value)}
                          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none appearance-none bg-white ${
                            incentivosEstaduais[abaAtiva]?.estado ? 'text-gray-700' : 'text-[#91929E]'
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23d1d5db' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em'
                          }}
                        >
                          <option value="" className="text-[#91929E]">Selecione um estado</option>
                          <option value="" disabled>----------</option>
                          {ESTADOS_BRASIL.map(estado => (
                            <option key={estado.sigla} value={estado.sigla} className="text-gray-700">
                              {estado.sigla} - {estado.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>

                {/* Conteúdo Rolável - Estaduais */}
                <div className="flex-1 overflow-y-auto p-4">
                  {incentivosEstaduais.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Nenhum tributo adicionado</p>
                      <p className="text-sm mt-2">Clique no botão azul "+ Tributo" para adicionar um tributo</p>
                    </div>
                  ) : (
                    incentivosEstaduais[abaAtiva]?.tributos.map((tributo) => (
                      <div key={tributo.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 overflow-x-hidden">
                        <div className="flex justify-end items-start mb-3">
                          <button
                            onClick={() => removeTributo('estadual', tributo.id)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tributo</label>
                            <input
                              type="text"
                              value={tributo.tipo}
                              onChange={(e) => updateTributo('estadual', tributo.id, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                              placeholder="Ex: ICMS"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota/Incentivo (%)</label>
                              <input
                                type="text"
                                value={formatPercentDisplay(tributo.aliquota)}
                                onChange={(e) => updateTributo('estadual', tributo.id, 'aliquota', parsePercentInput(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none placeholder-[#91929E]"
                                placeholder="0%"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Diferido</label>
                              <div className="flex min-w-0">
                                <button
                                  onClick={() => updateTributo('estadual', tributo.id, 'valorDiferido', {
                                    ...tributo.valorDiferido,
                                    tipo: tributo.valorDiferido.tipo === 'R$' ? '%' : 'R$'
                                  })}
                                  className="w-12 px-3 py-2 bg-gray-200 border border-gray-300 rounded-l-lg hover:bg-gray-300 transition-colors text-sm font-medium text-center"
                                >
                                  {tributo.valorDiferido.tipo}
                                </button>
                                <input
                                  type="text"
                                  value={tributo.valorDiferido.tipo === 'R$' ? formatCurrencyBR(tributo.valorDiferido.valor) : formatPercentDisplay(tributo.valorDiferido.valor)}
                                  onChange={(e) => updateTributo('estadual', tributo.id, 'valorDiferido', {
                                    ...tributo.valorDiferido,
                                    valor: tributo.valorDiferido.tipo === 'R$' ? parseCurrencyBR(e.target.value) : parsePercentInput(e.target.value)
                                  })}
                                  className="flex-1 min-w-0 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none placeholder-[#91929E]"
                                  placeholder={tributo.valorDiferido.tipo === 'R$' ? '0,00' : '0%'}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Lei</label>
                              <input
                                type="text"
                                value={tributo.lei}
                                onChange={(e) => updateTributo('estadual', tributo.id, 'lei', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                                placeholder="Ex: Lei 12345/2023"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Artigo</label>
                              <input
                                type="text"
                                value={tributo.artigo}
                                onChange={(e) => updateTributo('estadual', tributo.id, 'artigo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                                placeholder="Ex: Art. 5º"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

              {/* Coluna Direita - Federais */}
              <div className="w-1/2 flex flex-col">
                {/* Header da Coluna Federais */}
                <div className="px-[15px] pt-[20px] pb-[16px] bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Federais</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => addTributo('federal')}
                        className="px-3 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] transition-colors text-sm"
                      >
                        + Tributo
                      </button>
                      <button
                        className="p-2 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={incentivosFederais.tributos.length === 0}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divisória */}
                <div className="border-b border-gray-200"></div>

                {/* Conteúdo Rolável - Federais */}
                <div className="flex-1 overflow-y-auto p-4">
                  {incentivosFederais.tributos.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Nenhum tributo adicionado</p>
                      <p className="text-sm mt-2">Clique no botão azul "+ Tributo" para adicionar um tributo</p>
                    </div>
                  ) : (
                    incentivosFederais.tributos.map((tributo) => (
                      <div key={tributo.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 overflow-x-hidden">
                        <div className="flex justify-end items-start mb-3">
                          <button
                            onClick={() => removeTributo('federal', tributo.id)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tributo</label>
                            <input
                              type="text"
                              value={tributo.tipo}
                              onChange={(e) => updateTributo('federal', tributo.id, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                              placeholder="Ex: PIS, COFINS"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota/Incentivo (%)</label>
                              <input
                                type="text"
                                value={formatPercentDisplay(tributo.aliquota)}
                                onChange={(e) => updateTributo('federal', tributo.id, 'aliquota', parsePercentInput(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none placeholder-[#91929E]"
                                placeholder="0%"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Diferido</label>
                              <div className="flex min-w-0">
                                <button
                                  onClick={() => updateTributo('federal', tributo.id, 'valorDiferido', {
                                    ...tributo.valorDiferido,
                                    tipo: tributo.valorDiferido.tipo === 'R$' ? '%' : 'R$'
                                  })}
                                  className="w-12 px-3 py-2 bg-gray-200 border border-gray-300 rounded-l-lg hover:bg-gray-300 transition-colors text-sm font-medium text-center"
                                >
                                  {tributo.valorDiferido.tipo}
                                </button>
                                <input
                                  type="text"
                                  value={tributo.valorDiferido.tipo === 'R$' ? formatCurrencyBR(tributo.valorDiferido.valor) : formatPercentDisplay(tributo.valorDiferido.valor)}
                                  onChange={(e) => updateTributo('federal', tributo.id, 'valorDiferido', {
                                    ...tributo.valorDiferido,
                                    valor: tributo.valorDiferido.tipo === 'R$' ? parseCurrencyBR(e.target.value) : parsePercentInput(e.target.value)
                                  })}
                                  className="flex-1 min-w-0 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none placeholder-[#91929E]"
                                  placeholder={tributo.valorDiferido.tipo === 'R$' ? '0,00' : '0%'}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Lei</label>
                              <input
                                type="text"
                                value={tributo.lei}
                                onChange={(e) => updateTributo('federal', tributo.id, 'lei', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                                placeholder="Ex: Lei 12345/2023"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Artigo</label>
                              <input
                                type="text"
                                value={tributo.artigo}
                                onChange={(e) => updateTributo('federal', tributo.id, 'artigo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-[#1777CF] focus:outline-none"
                                placeholder="Ex: Art. 5º"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Estado */}
      {showDeleteEstadoConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este estado e todos os tributos associados? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteEstadoConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={removeEstadoAtivo}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação ao Fechar */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Alterações não salvas</h3>
            <p className="text-gray-600 mb-6">
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCloseModal}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}