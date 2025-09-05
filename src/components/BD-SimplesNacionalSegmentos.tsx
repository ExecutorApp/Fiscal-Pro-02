import React, { useState, useEffect, useRef } from 'react'
import { ModalAdicionarSegmento } from './ModalAdicionarSegmento'
import { ModalConfirmarExclusao } from './ModalConfirmarExclusao'
import { useSegmentos } from '../contexts/SegmentosContext'

// Ícone de Lixeira
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

// Ícone de Check (Sucesso)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)

interface BDSimplesNacionalSegmentosProps {
  onDataChange?: (data: any) => void
  onSaveComplete?: () => void
}

export const BDSimplesNacionalSegmentos: React.FC<BDSimplesNacionalSegmentosProps> = ({ onDataChange, onSaveComplete }) => {
  // Hook do contexto de segmentos
  const { segmentosSimplesNacional: segmentos, editarSegmento, removerSegmento } = useSegmentos()
  
  // Refs para sincronização de rolagem
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  // Estados para modais
  const [showModalAdicionarSegmento, setShowModalAdicionarSegmento] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [segmentoToDelete, setSegmentoToDelete] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [nextSegmentoId, setNextSegmentoId] = useState(6)
  
  // Estado para armazenar dados originais para comparação
  const [originalSegmentos, setOriginalSegmentos] = useState<any[]>([])

   // Detectar mudanças nos segmentos
 useEffect(() => {
   if (originalSegmentos.length > 0) {
     const hasChanges = JSON.stringify(segmentos) !== JSON.stringify(originalSegmentos);
     setIsDirty(hasChanges);
   }
 }, [segmentos, originalSegmentos]);
 
 // Inicializar segmentos originais
 useEffect(() => {
   if (segmentos.length > 0 && originalSegmentos.length === 0) {
     setOriginalSegmentos(JSON.parse(JSON.stringify(segmentos)));
   }
 }, [segmentos]);

  // Função para atualizar segmento
  const handleUpdateSegmento = (id: string, field: 'padrao' | 'alternativa', value: string) => {
    // Buscar o segmento atual para preservar os outros campos
    const segmentoAtual = segmentos.find(s => s.id === id);
    
    if (!segmentoAtual) {
      console.error('Segmento não encontrado:', id);
      return;
    }
    
    // Criar estrutura correta para editarSegmento (sem incluir nome)
    const dadosAtualizados = {
      simplesNacional: {
        padrao: field === 'padrao' ? value : segmentoAtual.padrao,
        alternativa: field === 'alternativa' ? value : (segmentoAtual.alternativa || '')
      }
    }
    editarSegmento(id.toString(), dadosAtualizados)
	setIsDirty(true);
  }

 // Função para salvar dados
 const handleSave = () => {
   setShowSuccessMessage(true);
   setIsDirty(false);
   
   // Esconder mensagem de sucesso após 3 segundos
   setTimeout(() => {
     setShowSuccessMessage(false);
   }, 3000);
   
   if (onSaveComplete) {
     onSaveComplete();
   }
 };
 
 // Função para remover segmento
 const handleRemoveSegmento = (segmento: any) => {
   setSegmentoToDelete(segmento);
   setShowDeleteModal(true);
 };
 
 // Sincronização de scroll
 const handleHeaderScroll = () => {
   if (bodyScrollRef.current && headerScrollRef.current) {
     bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
   }
 };
 
 const handleBodyScroll = () => {
   if (headerScrollRef.current && bodyScrollRef.current) {
     headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
   }
 };


  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="relative flex items-center justify-center p-[24px] border-b border-[#E5E7EB] flex-shrink-0">
        <h2 className="text-[28px] font-bold text-[#1F2937] font-inter">Empresas / Simples Nacional / Segmentos</h2>
        
        {/* Botões do Header */}
        <div className="absolute right-[24px] flex items-center gap-[12px]">
          <button
            onClick={() => setShowModalAdicionarSegmento(true)}
            className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#1777CF] text-white rounded-[6px] font-inter text-[14px] font-medium hover:bg-[#1565C0] transition-colors"
          >
            <span className="text-[16px] font-bold">+</span>
            Adicionar Segmento
          </button>
          
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-[16px] py-[8px] rounded-[6px] font-inter text-[14px] font-medium transition-colors ${
              isDirty
                ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {showSuccessMessage && (
        <div className="bg-[#10B981] text-white px-[24px] py-[12px] flex items-center gap-[8px] font-inter text-[14px]">
          <CheckIcon size={16} />
          Dados salvos com sucesso!
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Cabeçalho da Tabela */}
        <div 
          ref={headerScrollRef}
          onScroll={handleHeaderScroll}
          className="overflow-x-auto overflow-y-hidden border-b border-[#E5E7EB] bg-[#F8FAFC] flex-shrink-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-[800px] grid grid-cols-[1fr_150px_150px_60px] gap-0">
            <div className="px-[24px] py-[16px] text-[14px] font-semibold text-[#374151] font-inter border-r border-[#E5E7EB]">
              Segmentos
            </div>
            <div className="px-[24px] py-[16px] text-[14px] font-semibold text-[#374151] font-inter text-center border-r border-[#E5E7EB]">
              Padrão
            </div>
            <div className="px-[24px] py-[16px] text-[14px] font-semibold text-[#374151] font-inter text-center border-r border-[#E5E7EB]">
              Alternativa
            </div>
            <div className="px-[12px] py-[16px] text-[14px] font-semibold text-[#374151] font-inter text-center">
              Ações
            </div>
          </div>
        </div>

        {/* Corpo da Tabela */}
        <div 
          ref={bodyScrollRef}
          onScroll={handleBodyScroll}
          className="flex-1 overflow-auto"
        >
          <div className="min-w-[800px]">
            {segmentos.map((segmento, index) => (
              <div key={segmento.id} className={`grid grid-cols-[1fr_150px_150px_60px] gap-0 border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                <div className="px-[24px] py-[16px] border-r border-[#E5E7EB] flex items-center">
                  <input
                    type="text"
                    value={segmento.nome}
                    onChange={(e) => {
                      console.log('🔍 NOME onChange - Valor atual:', segmento.nome, 'Novo valor:', e.target.value);
                      console.log('🔍 NOME onChange - Event target:', e.target);
                      console.log('🔍 NOME onChange - Input readOnly:', e.target.readOnly);
                      console.log('🔍 NOME onChange - Input disabled:', e.target.disabled);
                      
                      const dadosAtualizados = {
                        nome: e.target.value
                      }
                      console.log('🔍 NOME onChange - Dados a serem atualizados:', dadosAtualizados);
                      editarSegmento(segmento.id.toString(), dadosAtualizados)
                    }}
                    onFocus={(e) => {
                      console.log('🔍 NOME onFocus - Valor:', e.target.value);
                      console.log('🔍 NOME onFocus - readOnly:', e.target.readOnly);
                      console.log('🔍 NOME onFocus - disabled:', e.target.disabled);
                    }}
                    onKeyDown={(e) => {
                      console.log('🔍 NOME onKeyDown - Tecla:', e.key, 'Valor atual:', e.target.value);
                      console.log('🔍 NOME onKeyDown - readOnly:', e.target.readOnly);
                      console.log('🔍 NOME onKeyDown - disabled:', e.target.disabled);
                    }}
                    className="w-full bg-transparent text-[14px] text-[#374151] font-inter focus:outline-none focus:ring-2 focus:ring-[#1777CF] focus:ring-opacity-20 rounded-[4px] px-[8px] py-[4px]"
                  />
                </div>
                <div className="px-[24px] py-[16px] border-r border-[#E5E7EB] flex items-center justify-center">
                  <input
                    type="text"
					placeholder="-"
                    value={segmento.padrao ?? ''}
                    onChange={(e) => {
                      console.log('🔍 PADRAO onChange - Valor atual:', segmento.padrao, 'Novo valor:', e.target.value);
                      console.log('🔍 PADRAO onChange - Event target:', e.target);
                      console.log('🔍 PADRAO onChange - Input readOnly:', e.target.readOnly);
                      console.log('🔍 PADRAO onChange - Input disabled:', e.target.disabled);
                      
                      const inputValue = e.target.value;
                      console.log('🔍 PADRAO onChange - Input value:', inputValue);
                      
                      // Forçar atualização imediata
                      const dadosAtualizados = {
                        simplesNacional: {
                          padrao: inputValue,
                          alternativa: segmento.alternativa ?? ''
                        }
                      };
                      console.log('🔍 PADRAO onChange - Atualizando com valor:', dadosAtualizados);
                      editarSegmento(segmento.id.toString(), dadosAtualizados);
                    }}
                    onFocus={(e) => {
                      console.log('🔍 PADRAO onFocus - Valor:', e.target.value);
                      console.log('🔍 PADRAO onFocus - readOnly:', e.target.readOnly);
                      console.log('🔍 PADRAO onFocus - disabled:', e.target.disabled);
                    }}
                    onKeyDown={(e) => {
                      console.log('🔍 PADRAO onKeyDown - Tecla:', e.key, 'Valor atual:', e.target.value);
                      console.log('🔍 PADRAO onKeyDown - readOnly:', e.target.readOnly);
                      console.log('🔍 PADRAO onKeyDown - disabled:', e.target.disabled);
                    }}
                    className="w-24 h-8 text-center rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1777CF] focus:ring-opacity-20"
                  />
                </div>
                <div className="px-[24px] py-[16px] border-r border-[#E5E7EB] flex items-center justify-center">
                  <input
                    type="text"
					placeholder="-"
                    value={segmento.alternativa ?? ''}
                    onChange={(e) => {
                      console.log('🔍 ALTERNATIVA onChange - Valor atual:', segmento.alternativa, 'Novo valor:', e.target.value);
                      console.log('🔍 ALTERNATIVA onChange - Event target:', e.target);
                      console.log('🔍 ALTERNATIVA onChange - Input readOnly:', e.target.readOnly);
                      console.log('🔍 ALTERNATIVA onChange - Input disabled:', e.target.disabled);
                      
                      const inputValue = e.target.value;
                      console.log('🔍 ALTERNATIVA onChange - Input value:', inputValue);
                      
                      // Forçar atualização imediata
                      const dadosAtualizados = {
                        simplesNacional: {
                          padrao: segmento.padrao ?? '',
                          alternativa: inputValue
                        }
                      };
                      console.log('🔍 ALTERNATIVA onChange - Atualizando com valor:', dadosAtualizados);
                      editarSegmento(segmento.id.toString(), dadosAtualizados);
                    }}
                    onFocus={(e) => {
                      console.log('🔍 ALTERNATIVA onFocus - Valor:', e.target.value);
                      console.log('🔍 ALTERNATIVA onFocus - readOnly:', e.target.readOnly);
                      console.log('🔍 ALTERNATIVA onFocus - disabled:', e.target.disabled);
                    }}
                    onKeyDown={(e) => {
                      console.log('🔍 ALTERNATIVA onKeyDown - Tecla:', e.key, 'Valor atual:', e.target.value);
                      console.log('🔍 ALTERNATIVA onKeyDown - readOnly:', e.target.readOnly);
                      console.log('🔍 ALTERNATIVA onKeyDown - disabled:', e.target.disabled);
                    }}
                    className="w-24 h-8 text-center rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1777CF] focus:ring-opacity-20"
                  />
                </div>
                <div className="px-[12px] py-[16px] flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveSegmento(segmento)}
                    className="p-[6px] text-[#DC2626] hover:bg-[#FEE2E2] rounded-[4px] transition-colors"
                    title="Remover segmento"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>





      {/* Modal Unificado para Adicionar Segmento */}
      {showModalAdicionarSegmento && (
        <ModalAdicionarSegmento
          isOpen={showModalAdicionarSegmento}
          onClose={() => setShowModalAdicionarSegmento(false)}
        />
      )}
      
      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmarExclusao
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSegmentoToDelete(null)
        }}
        onConfirm={() => {
          if (segmentoToDelete) {
            removerSegmento(segmentoToDelete.id)
            setIsDirty(true)
          }
          setShowDeleteModal(false)
          setSegmentoToDelete(null)
        }}
        nomeSegmento={segmentoToDelete?.segmento || ''}
      />
    </div>
  )
}

// Função para converter número para algarismo romano
const toRoman = (num: number) => {
  if (num < 1 || num > 10) return ''
  const romanMap: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
  }
  return romanMap[num]
}

// Função para converter algarismo romano para número
const fromRoman = (roman: string | undefined) => {
  if (!roman || roman === '-') return null
  const romanMap: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
  }
  return romanMap[roman] || null
}