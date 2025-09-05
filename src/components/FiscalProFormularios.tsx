import React, { useState, useRef, useCallback } from 'react'

/*
--------------------------------------------------------
  Componente: FiscalProFormularios - Gerenciador de Formulários
--------------------------------------------------------
- Modal centralizado para gerenciar formulários do cliente
- Upload com drag and drop para arquivos .docx e .xlsx
- Lista de formulários com status ATIVO/INATIVO
- Seleção múltipla e ações em lote
- Design iPhone clean consistente com o projeto
- Integração automática com dados dos formulários ativos
*/

interface FiscalProFormulariosProps {
  isOpen: boolean
  onClose: () => void
  cliente: {
    id: number
    name: string
  }
  onFormulariosAtivosChange?: (formulariosAtivos: any[]) => void
}

interface Formulario {
  id: string
  nome: string
  arquivo: File
  status: 'ATIVO' | 'INATIVO'
  dataUpload: string
  tipo: 'docx' | 'xlsx'
}

// Ícones SVG
const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const UploadIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const FileTextIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
)

const TableIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
  </svg>
)

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
)

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)

const EyeOffIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export const FiscalProFormularios: React.FC<FiscalProFormulariosProps> = ({
  isOpen,
  onClose,
  cliente,
  onFormulariosAtivosChange
}) => {
  // Estados
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [selectedFormularios, setSelectedFormularios] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para gerar ID único
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Função para validar tipo de arquivo
  const isValidFileType = (file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/msword', // .doc (legado)
      'application/vnd.ms-excel' // .xls (legado)
    ]
    return allowedTypes.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.xlsx')
  }

  // Função para determinar tipo do arquivo
  const getFileType = (file: File): 'docx' | 'xlsx' => {
    if (file.name.endsWith('.xlsx') || file.type.includes('spreadsheetml')) {
      return 'xlsx'
    }
    return 'docx'
  }

  // Função para processar arquivos selecionados
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsUploading(true)
    
    const validFiles = Array.from(files).filter(isValidFileType)
    
    if (validFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos .docx ou .xlsx')
      setIsUploading(false)
      return
    }

    const novosFormularios: Formulario[] = validFiles.map(file => ({
      id: generateId(),
      nome: file.name,
      arquivo: file,
      status: 'ATIVO' as const,
      dataUpload: new Date().toLocaleDateString('pt-BR'),
      tipo: getFileType(file)
    }))

    // Simular delay de upload
    await new Promise(resolve => setTimeout(resolve, 1000))

    setFormularios(prev => [...prev, ...novosFormularios])
    setIsUploading(false)

    // Notificar mudança nos formulários ativos
    const todosAtivos = [...formularios.filter(f => f.status === 'ATIVO'), ...novosFormularios]
    onFormulariosAtivosChange?.(todosAtivos)

    console.log(`${validFiles.length} formulário(s) enviado(s) com sucesso!`)
  }, [formularios, onFormulariosAtivosChange])

  // Handlers de drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  // Handler para seleção de arquivo via input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Limpar input para permitir re-upload do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processFiles])

  // Função para alternar status de um formulário
  const toggleStatus = (id: string) => {
    setFormularios(prev => {
      const updated = prev.map(form =>
        form.id === id 
          ? { ...form, status: form.status === 'ATIVO' ? 'INATIVO' as const : 'ATIVO' as const }
          : form
      )
      
      // Notificar mudança nos formulários ativos
      const ativos = updated.filter(f => f.status === 'ATIVO')
      onFormulariosAtivosChange?.(ativos)
      
      return updated
    })
  }

  // Função para excluir formulário
  const excluirFormulario = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este formulário?')) {
      setFormularios(prev => {
        const updated = prev.filter(form => form.id !== id)
        
        // Notificar mudança nos formulários ativos
        const ativos = updated.filter(f => f.status === 'ATIVO')
        onFormulariosAtivosChange?.(ativos)
        
        return updated
      })
      
      // Remover da seleção se estiver selecionado
      setSelectedFormularios(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Função para selecionar/deselecionar formulário
  const toggleSelection = (id: string) => {
    setSelectedFormularios(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Função para selecionar todos
  const toggleSelectAll = () => {
    if (selectedFormularios.size === formularios.length) {
      setSelectedFormularios(new Set())
    } else {
      setSelectedFormularios(new Set(formularios.map(f => f.id)))
    }
  }

  // Função para ativar selecionados
  const ativarSelecionados = () => {
    if (selectedFormularios.size === 0) return
    
    setFormularios(prev => {
      const updated = prev.map(form =>
        selectedFormularios.has(form.id)
          ? { ...form, status: 'ATIVO' as const }
          : form
      )
      
      // Notificar mudança nos formulários ativos
      const ativos = updated.filter(f => f.status === 'ATIVO')
      onFormulariosAtivosChange?.(ativos)
      
      return updated
    })
    
    setSelectedFormularios(new Set())
  }

  // Função para desativar selecionados
  const desativarSelecionados = () => {
    if (selectedFormularios.size === 0) return
    
    setFormularios(prev => {
      const updated = prev.map(form =>
        selectedFormularios.has(form.id)
          ? { ...form, status: 'INATIVO' as const }
          : form
      )
      
      // Notificar mudança nos formulários ativos
      const ativos = updated.filter(f => f.status === 'ATIVO')
      onFormulariosAtivosChange?.(ativos)
      
      return updated
    })
    
    setSelectedFormularios(new Set())
  }

  // Função para excluir selecionados
  const excluirSelecionados = () => {
    if (selectedFormularios.size === 0) return
    
    if (confirm(`Tem certeza que deseja excluir ${selectedFormularios.size} formulário(s) selecionado(s)?`)) {
      setFormularios(prev => {
        const updated = prev.filter(form => !selectedFormularios.has(form.id))
        
        // Notificar mudança nos formulários ativos
        const ativos = updated.filter(f => f.status === 'ATIVO')
        onFormulariosAtivosChange?.(ativos)
        
        return updated
      })
      
      setSelectedFormularios(new Set())
    }
  }

  if (!isOpen) return null

  const formulariosAtivos = formularios.filter(f => f.status === 'ATIVO').length
  const formulariosInativos = formularios.filter(f => f.status === 'INATIVO').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <style>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #E5E7EB transparent;
        }
        .modern-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 2px;
          border: none;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #D1D5DB;
        }

        .upload-area {
          transition: all 0.3s ease;
        }

        .upload-area.drag-over {
          border-color: #1777CF;
          background-color: #F0F9FF;
          transform: scale(1.02);
        }

        .file-item {
          transition: all 0.2s ease;
        }

        .file-item:hover {
          background-color: #F9FAFB;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Container Principal */}
      <div className="w-[90vw] max-w-[900px] h-[80vh] bg-white rounded-[20px] shadow-xl border border-[#F0F0F0] flex flex-col font-inter">
        
        {/* Header */}
        <div className="p-[24px] border-b border-[#F0F0F0] bg-[#FBFBFD] rounded-t-[20px] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[24px] font-medium text-[#1D1D1F] font-inter tracking-tight">
                Gerenciar Formulários
              </h2>
              <p className="text-[14px] text-[#86868B] font-inter mt-[4px]">
                Cliente: {cliente.name}
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#F6F6F6] hover:bg-[#EBEBEB] transition-all duration-200 text-[#86868B] hover:text-[#1D1D1F]"
            >
              <XIcon size={22} />
            </button>
          </div>

          {/* Estatísticas */}
          <div className="flex gap-[16px] mt-[16px]">
            <div className="flex items-center gap-[8px] px-[12px] py-[6px] bg-[#34C759] bg-opacity-10 rounded-[8px]">
              <div className="w-[8px] h-[8px] bg-[#34C759] rounded-full"></div>
              <span className="text-[13px] font-medium text-[#34C759]">
                {formulariosAtivos} Ativos
              </span>
            </div>
            <div className="flex items-center gap-[8px] px-[12px] py-[6px] bg-[#FF9500] bg-opacity-10 rounded-[8px]">
              <div className="w-[8px] h-[8px] bg-[#FF9500] rounded-full"></div>
              <span className="text-[13px] font-medium text-[#FF9500]">
                {formulariosInativos} Inativos
              </span>
            </div>
          </div>
        </div>

        {/* Área de Upload */}
        <div className="p-[24px] border-b border-[#F0F0F0] flex-shrink-0">
          <div
            className={`upload-area border-2 border-dashed rounded-[16px] p-[32px] text-center cursor-pointer ${
              isDragOver 
                ? 'border-[#1777CF] bg-[#F0F9FF]' 
                : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#1777CF] hover:bg-[#F0F9FF]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-[16px]">
                <div className="w-[48px] h-[48px] border-4 border-[#1777CF] border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-[16px] font-medium text-[#1D1D1F] mb-[4px]">
                    Enviando formulários...
                  </p>
                  <p className="text-[14px] text-[#86868B]">
                    Aguarde enquanto processamos seus arquivos
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-[16px]">
                <div className="w-[48px] h-[48px] rounded-full bg-[#1777CF] flex items-center justify-center">
                  <UploadIcon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-[#1D1D1F] mb-[4px]">
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <p className="text-[14px] text-[#86868B]">
                    Suporte a múltiplos arquivos .docx e .xlsx
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".docx,.xlsx,.doc,.xls,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Lista de Formulários */}
        <div className="flex-1 min-h-0 flex flex-col">
          
          {/* Barra de Ações */}
          {formularios.length > 0 && (
            <div className="p-[16px] border-b border-[#F0F0F0] bg-[#FBFBFD] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-[12px]">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFormularios.size === formularios.length && formularios.length > 0}
                    onChange={toggleSelectAll}
                    className="w-[16px] h-[16px] rounded-[4px] border border-[#D1D5DB] text-[#1777CF] focus:ring-[#1777CF] focus:ring-2"
                  />
                  <span className="text-[14px] text-[#374151] font-medium">
                    Selecionar todos ({selectedFormularios.size}/{formularios.length})
                  </span>
                </label>
              </div>

              {selectedFormularios.size > 0 && (
                <div className="flex items-center gap-[8px]">
                  <button
                    onClick={ativarSelecionados}
                    className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[#34C759] text-white rounded-[8px] hover:bg-[#30B855] transition-colors text-[13px] font-medium"
                  >
                    <CheckIcon size={14} />
                    Ativar
                  </button>
                  <button
                    onClick={desativarSelecionados}
                    className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[#FF9500] text-white rounded-[8px] hover:bg-[#E6850E] transition-colors text-[13px] font-medium"
                  >
                    <EyeOffIcon size={14} />
                    Desativar
                  </button>
                  <button
                    onClick={excluirSelecionados}
                    className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[#FF3B30] text-white rounded-[8px] hover:bg-[#E6342A] transition-colors text-[13px] font-medium"
                  >
                    <TrashIcon size={14} />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista */}
          <div className="flex-1 overflow-y-auto modern-scrollbar">
            {formularios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-[48px] text-center">
                <div className="w-[64px] h-[64px] rounded-full bg-[#F6F6F6] flex items-center justify-center mb-[16px]">
                  <FileTextIcon size={28} className="text-[#86868B]" />
                </div>
                <p className="text-[16px] font-medium text-[#86868B] mb-[4px]">
                  Nenhum formulário enviado
                </p>
                <p className="text-[14px] text-[#C7C7CC]">
                  Faça upload de arquivos .docx ou .xlsx para começar
                </p>
              </div>
            ) : (
              <div className="p-[16px] space-y-[2px]">
                {formularios.map((formulario, index) => (
                  <div
                    key={formulario.id}
                    className={`file-item p-[16px] bg-white rounded-[12px] border border-[#E5E7EB] ${
                      selectedFormularios.has(formulario.id) ? 'border-[#1777CF] bg-[#F0F9FF]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-[16px]">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedFormularios.has(formulario.id)}
                        onChange={() => toggleSelection(formulario.id)}
                        className="w-[16px] h-[16px] rounded-[4px] border border-[#D1D5DB] text-[#1777CF] focus:ring-[#1777CF] focus:ring-2"
                      />

                      {/* Ícone do arquivo */}
                      <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center ${
                        formulario.tipo === 'xlsx' 
                          ? 'bg-[#34C759] bg-opacity-10' 
                          : 'bg-[#1777CF] bg-opacity-10'
                      }`}>
                        {formulario.tipo === 'xlsx' ? (
                          <TableIcon size={16} className="text-[#34C759]" />
                        ) : (
                          <FileTextIcon size={16} className="text-[#1777CF]" />
                        )}
                      </div>

                      {/* Informações do arquivo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[8px] mb-[2px]">
                          <h4 className="text-[15px] font-medium text-[#1D1D1F] truncate">
                            {formulario.nome}
                          </h4>
                          <span className={`px-[8px] py-[2px] rounded-[6px] text-[11px] font-medium uppercase tracking-wide ${
                            formulario.status === 'ATIVO'
                              ? 'bg-[#34C759] bg-opacity-10 text-[#34C759]'
                              : 'bg-[#FF9500] bg-opacity-10 text-[#FF9500]'
                          }`}>
                            {formulario.status}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#86868B]">
                          Enviado em {formulario.dataUpload}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-[8px]">
                        <button
                          onClick={() => toggleStatus(formulario.id)}
                          className={`flex items-center gap-[6px] px-[12px] py-[6px] rounded-[8px] transition-colors text-[13px] font-medium ${
                            formulario.status === 'ATIVO'
                              ? 'bg-[#FF9500] bg-opacity-10 text-[#FF9500] hover:bg-[#FF9500] hover:text-white'
                              : 'bg-[#34C759] bg-opacity-10 text-[#34C759] hover:bg-[#34C759] hover:text-white'
                          }`}
                          title={formulario.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                        >
                          {formulario.status === 'ATIVO' ? (
                            <>
                              <EyeOffIcon size={14} />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckIcon size={14} />
                              Ativar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => excluirFormulario(formulario.id)}
                          className="flex items-center justify-center w-[32px] h-[32px] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white rounded-[8px] transition-all duration-200"
                          title="Excluir formulário"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}