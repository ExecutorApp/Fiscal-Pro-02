import React, { useState, useEffect } from 'react'
import { BDSegmentoTributacao } from './BD-SegmentoTributacao'
import { BDTributacaoFolha } from './BD-TributacaoFolha'
import { BDEstadosICMS } from './BD-EstadosICMS'
import { BDCNAES } from './BD-CNAES'
import { BDAnexosSimples } from './BD-AnexosSimples'
import BDSegmentos from './BDSegmentos'
import { BDSimplesNacionalSegmentos } from './BD-SimplesNacionalSegmentos'
import { BDFFunrural } from './BD-F-Funrural' 
import { BDFPresuncao } from './BD-F-Presunção'
import { BDFTabelaIR } from './BD-F-TabelaIR'
import { BDFEstadoICMS } from './BD-F-EstadoICMS' 
import { BDJFunrural } from './BD-J-Funrural' 
import { BDJPresuncao } from './BD-J-Presunção'
import { BDLucroReal } from './BD-LucroReal'
import { BDJEstadoICMS } from './BD-J-EstadoICMS'
import { ImpostoRendaProvider } from './ImpostoRendaContext'

/*
--------------------------------------------------------
  Componente: Banco de Dados - Layout Modularizado
--------------------------------------------------------
- Componente principal orquestrador
- Layout horizontal: Sidebar (esquerda) + Conteúdo (direita)
- Sidebar sempre visível com dois modos: expandido/reduzido
- Sistema de abas: "Empresas" e "Produtor Rural"
- Componentes filhos especializados para cada seção
- Design moderno com transições suaves
*/

interface BancoDeDadosProps {
  isOpen: boolean
  onClose: () => void
}

// Ícone X para fechar
const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

// Ícone Menu Hamburger
const MenuIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

// Ícone Menu Recolhido (setas para a direita)
const MenuCollapsedIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
)

// Ícone para item expansível (chevron down)
const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
)

// Ícone para item expansível (chevron right)  
const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
)

import { EstadosICMSProvider } from './EstadosICMSContext'
import { SegmentosProvider } from '../contexts/SegmentosContext'
export const BancoDeDados: React.FC<BancoDeDadosProps> = ({ isOpen, onClose }) => {

  // Estado para controlar seção ativa e aba ativa
   const [activeSection, setActiveSection] = useState('empresas-simples-anexos')
 const [activeTab, setActiveTab] = useState('empresas') // 'empresas' ou 'produtor-rural'
 
 // Estados para lembrar onde o usuário parou em cada categoria
 const [lastEmpresasSection, setLastEmpresasSection] = useState('empresas-simples-anexos')
 const [lastProdutorRuralSection, setLastProdutorRuralSection] = useState('fisica-funrual')
  
  // Estado para controlar se a sidebar está expandida (true) ou reduzida (false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  
  // Estado para controlar expansão do menu Segmento/Tributação
  const [isSegmentoExpanded, setIsSegmentoExpanded] = useState(true)
  
  // Estado para controlar expansão do menu Simples Nacional
  const [isSimplesNacionalExpanded, setIsSimplesNacionalExpanded] = useState(false)

  // Estado para controlar expansão do menu Segmento/Tributação no modo compacto
  const [isSegmentoExpandedCompact, setIsSegmentoExpandedCompact] = useState(false)
  
  // Estado para controlar expansão do menu Simples Nacional no modo compacto
  const [isSimplesNacionalExpandedCompact, setIsSimplesNacionalExpandedCompact] = useState(false)
  
   // Estado para controlar quando o usuário explicitamente fecha o menu (override da lógica automática)
 const [userManuallyCollapsed, setUserManuallyCollapsed] = useState(false)

  
   // Verifica se alguma subopção do ST está ativa para manter o menu aberto
 const isSTSubOptionActive = ['empresas-lucro-presumido', 'empresas-lucro-real'].includes(activeSection)
 
 // Verifica se alguma subopção do Simples Nacional está ativa para manter o menu aberto
 const isSimplesNacionalSubOptionActive = ['empresas-simples-anexos', 'empresas-simples-segmentos'].includes(activeSection)
 
 // useEffect: abrir automaticamente apenas se usuário não fechou manualmente
 useEffect(() => {
   if (isSTSubOptionActive && !userManuallyCollapsed) {
     setIsSegmentoExpandedCompact(true)
   }
   // Reset do fechamento manual quando sair das subopções
   if (!isSTSubOptionActive) {
     setUserManuallyCollapsed(false)
   }
 }, [isSTSubOptionActive, userManuallyCollapsed])
 
 // useEffect: abrir automaticamente o menu Simples Nacional no modo compacto
 useEffect(() => {
   if (isSimplesNacionalSubOptionActive && !userManuallyCollapsed) {
     setIsSimplesNacionalExpandedCompact(true)
   }
   // Reset do fechamento manual quando sair das subopções do Simples Nacional
   if (!isSimplesNacionalSubOptionActive) {
     setUserManuallyCollapsed(false)
   }
 }, [isSimplesNacionalSubOptionActive, userManuallyCollapsed])
 
  // useEffect para resetar estados apenas quando o modal é fechado
 useEffect(() => {
   if (!isOpen) {
     // Resetar estados para os valores padrão apenas quando o modal é fechado
     setActiveTab('empresas')
     setActiveSection('empresas-simples-anexos')
     setLastEmpresasSection('empresas-simples-anexos')
     setLastProdutorRuralSection('fisica-funrual')
     setIsSegmentoExpanded(true)
     setIsSegmentoExpandedCompact(false)
     setIsSimplesNacionalExpandedCompact(false)
     setUserManuallyCollapsed(false)
   }
 }, [isOpen])


  // Estados para controle de edição global
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false)

  // Função para lidar com mudanças de dados dos componentes filhos
  const handleDataChange = (section: string, data: any) => {
    console.log(`📊 [DEBUG] BancoDeDados - Dados alterados na seção ${section}:`, data)
    console.log(`📊 [DEBUG] BancoDeDados - Estado isDirty atual:`, isDirty)
       // Só marcar como dirty se realmente há alterações
   if (data.hasChanges) {
     console.log(`📊 [DEBUG] BancoDeDados - Definindo isDirty como TRUE`)
     setIsDirty(true)
   } else {
     console.log(`📊 [DEBUG] BancoDeDados - Definindo isDirty como FALSE`)
     setIsDirty(false)
   }
  }
  
  // Função para lidar com salvamento completo nos componentes filhos
const handleSaveComplete = () => {
  console.log('💾 [DEBUG] BancoDeDados - handleSaveComplete chamado - resetando estado global de alterações')
  console.log('💾 [DEBUG] BancoDeDados - Estado isDirty antes do reset:', isDirty)
  setIsDirty(false)
  console.log('💾 [DEBUG] BancoDeDados - Estado isDirty após reset: false')
}

  // Função para lidar com o fechamento do modal
  const handleCloseModal = () => {
    console.log('🚪 [DEBUG] BancoDeDados - handleCloseModal chamado')
    console.log('🚪 [DEBUG] BancoDeDados - Estado isDirty:', isDirty)
    if (isDirty) {
      console.log('🚨 [DEBUG] BancoDeDados - Exibindo modal de alterações não salvas')
      setShowUnsavedChangesModal(true)
    } else {
      console.log('✅ [DEBUG] BancoDeDados - Fechando modal sem alterações')
      onClose()
    }
  }

  // Função para confirmar saída sem salvar
  const handleConfirmExit = () => {
    console.log('🚪 [DEBUG] BancoDeDados - handleConfirmExit chamado')
    setIsDirty(false)
    setShowUnsavedChangesModal(false)
    onClose()
  }

  // Função para alternar estado da sidebar
  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  if (!isOpen) return null

    return (
    <SegmentosProvider>
	<ImpostoRendaProvider>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <style>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
          border: none;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }

        /* Transições suaves para a sidebar */
        .sidebar-transition {
          transition: width 0.3s ease-in-out;
        }
        
        .content-transition {
          transition: margin-left 0.3s ease-in-out;
        }

        /* Estilos para botões compactos */
        .compact-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 32px;
          padding: 6px 6px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        /* Animação de expansão lateral dos botões no modo reduzido */
        .expandable-button {
          width: 42px;
          transition: width 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
          position: relative;
          z-index: 10;
        }

        .expandable-button:hover {
          width: 160px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
        }

        .expandable-button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          overflow: hidden;
          width: 100%;
        }

        .expandable-button-abbr {
          transition: opacity 0.25s ease-in-out;
          font-size: 11px;
          font-weight: 600;
        }

        .expandable-button-full {
          position: absolute;
          opacity: 0;
          transition: opacity 0.25s ease-in-out 0.1s;
          font-size: 12px;
          font-weight: 500;
          left: 50%;
          transform: translateX(-50%);
        }

        .expandable-button:hover .expandable-button-abbr {
          opacity: 0;
        }

        .expandable-button:hover .expandable-button-full {
          opacity: 1;
        }

        /* Botão de alternância expandível */
        .toggle-expandable-button {
          width: 42px;
          transition: width 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
          position: relative;
          z-index: 10;
        }

        .toggle-expandable-button:hover {
          width: 140px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
        }

        .toggle-expandable-button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          overflow: hidden;
          width: 100%;
        }

        .toggle-expandable-button-abbr {
          transition: opacity 0.25s ease-in-out;
          font-size: 11px;
          font-weight: 600;
        }

        .toggle-expandable-button-full {
          position: absolute;
          opacity: 0;
          transition: opacity 0.25s ease-in-out 0.1s;
          font-size: 12px;
          font-weight: 500;
          left: 50%;
          transform: translateX(-50%);
        }

        .toggle-expandable-button:hover .toggle-expandable-button-abbr {
          opacity: 0;
        }

        .toggle-expandable-button:hover .toggle-expandable-button-full {
          opacity: 1;
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white rounded-[16px] shadow-2xl relative m-[10px] h-[calc(100vh-20px)] w-[calc(100vw-20px)] flex flex-col">
        
        {/* Botão Toggle Sidebar - Posicionado no canto superior esquerdo */}
        <button 
          onClick={toggleSidebar}
          className="absolute top-[24px] left-[16px] z-[60] flex items-center justify-center w-[40px] h-[40px] rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors shadow-sm"
          title={isSidebarExpanded ? "Recolher menu" : "Expandir menu"}
        >
          {isSidebarExpanded ? <MenuIcon size={20} /> : <MenuCollapsedIcon size={20} />}
        </button>

        {/* Header do Modal - Título Centralizado */}
        <div className="relative flex items-center justify-center p-[24px] border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="text-[28px] font-bold text-[#1F2937] font-inter">
            Banco de Dados
          </h2>
          
          <button 
            onClick={handleCloseModal}
            className="absolute right-[24px] flex items-center justify-center w-[40px] h-[40px] rounded-[8px] border-0 bg-white hover:bg-[#F9FAFB] transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Modal de Confirmação de Alterações Não Salvas */}
        {showUnsavedChangesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="bg-white rounded-[20px] shadow-2xl p-[32px] w-[480px] max-w-[90vw]">
              
              {/* Ícone de Aviso */}
              <div className="flex justify-center mb-[24px]">
                <div className="w-[64px] h-[64px] bg-[#FEF3C7] rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              </div>

              {/* Título */}
              <h3 className="text-[24px] font-bold text-[#1F2937] text-center mb-[16px] font-inter">
                Alterações Não Salvas
              </h3>

              {/* Mensagem */}
              <p className="text-[16px] text-[#6B7280] text-center mb-[32px] leading-[24px] font-inter">
                Você fez alterações que ainda não foram salvas. Deseja sair sem salvar?
              </p>

              {/* Botões */}
              <div className="flex gap-[16px] justify-center">
                <button
                  onClick={() => setShowUnsavedChangesModal(false)}
                  className="px-[24px] py-[12px] bg-[#6B7280] hover:bg-[#6B7280]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="px-[24px] py-[12px] bg-[#F59E0B] hover:bg-[#F59E0B]/90 rounded-[12px] text-white font-semibold transition-colors text-[16px] font-inter"
                >
                  Sair sem salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Layout Principal */}
        <div className="flex flex-1 min-h-0 gap-[10px] p-[10px]">
          
          {/* Sidebar com Sistema de Abas - Sempre Visível com Dois Modos */}
          <div  
            className={`${
              isSidebarExpanded ? 'w-[280px]' : 'w-[50px]'
            } sidebar-transition border border-[#E5E7EB] bg-white flex-shrink-0 rounded-[8px] flex flex-col overflow-visible shadow-sm`}
          >
            
            {/* ABAS NO TOPO - Responsivas ao Modo */}
            <div className={`${isSidebarExpanded ? 'px-[8px] py-[0px] pt-[10px] mx-[5px]' : 'px-[3px] py-[8px]'}`}> 
              {isSidebarExpanded ? (
                // Modo Expandido - Abas Completas
                <div className="flex bg-[#F8FAFC] rounded-[8px] p-[4px] gap-[4px]"> 
                  <button
                    onClick={() => {
                     setActiveTab('empresas')
                     setActiveSection(lastEmpresasSection)
                    }}
                    className={`flex-1 flex items-center justify-center py-[14px] px-[20px] rounded-[6px] font-inter text-[14px] font-medium ${
                      activeTab === 'empresas'
                        ? 'bg-white text-[#1777CF] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#374151] hover:bg-white/60'
                    }`}
                  >
                    Empresas
                  </button>

                  <button
                    onClick={() => {
                     setActiveTab('produtor-rural')
                     setActiveSection(lastProdutorRuralSection)
                    }}
                    className={`flex-1 flex items-center justify-center py-[14px] px-[20px] rounded-[6px] font-inter text-[14px] font-medium ${
                      activeTab === 'produtor-rural'
                        ? 'bg-white text-[#1777CF] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#374151] hover:bg-white/60'
                    }`}
                  >
                    Prod. Rural
                  </button>
                </div>
              ) : (
                // Modo Compacto - Botão Único de Alternância com Expansão
                <div className="flex flex-col gap-[4px]">
                  <button
                    onClick={() => {
                      if (activeTab === 'empresas') {
                       setActiveTab('produtor-rural')
                       setActiveSection(lastProdutorRuralSection)
                      } else {
                       setActiveTab('empresas')
                       setActiveSection(lastEmpresasSection)
                      }
                    }}
                    className={`toggle-expandable-button compact-button bg-[#1777CF] text-white shadow-sm border border-[#1777CF]`}
                  >
                    <div className="toggle-expandable-button-content">
                      <span className="toggle-expandable-button-abbr">
                        {activeTab === 'empresas' ? 'EM' : 'PR'}
                      </span>
                      <span className="toggle-expandable-button-full">
                        {activeTab === 'empresas' ? 'Empresas' : 'Produtor Rural'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* CONTEÚDO DAS ABAS - Responsivo ao Modo */}
            <div className={`${isSidebarExpanded ? 'px-[16px] py-[12px] overflow-y-auto modern-scrollbar' : 'px-[3px] py-[8px] overflow-visible'} flex-1`}>
              
              {/* Divisória no modo compacto */}
              {!isSidebarExpanded && (
               <div className="h-[1px] bg-[#E5E5EA] mx-[4px] mb-[8px]"></div>
              )}
              
              {/* Conteúdo da Aba Empresas */}
              {activeTab === 'empresas' && (
                <div className={`${isSidebarExpanded ? 'space-y-[4px]' : ''}`}>
                  {isSidebarExpanded ? (
                    // Modo Expandido - Botões Completos 
                    <>
                      {/* Item expansível - Segmento / Tributação */}
                      <div>
                        <button
                          onClick={() => setIsSegmentoExpanded(!isSegmentoExpanded)}
                          className="w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] mb-[8px] font-inter flex items-center justify-between text-[#374151] hover:bg-[#F8FAFC] border border-[#E5E7EB]"
                        >
                          <span>Segmento / Tributação</span> 
                          {isSegmentoExpanded ? 
                            <ChevronDownIcon size={16} /> : 
                            <ChevronRightIcon size={16} />
                          }  
                        </button>
                        
                        {/* Subitens - visíveis apenas quando expandido */}
                        {isSegmentoExpanded && (
                          <div className="ml-0 mt-[0px] space-y-[0px] ">
                            {/* Simples Nacional - Item expansível */}
                            <div>
                              <button
                                onClick={() => setIsSimplesNacionalExpanded(!isSimplesNacionalExpanded)}
                                className={`w-full text-left px-[12px] py-[6px] text-[14px] rounded-[6px] font-inter flex items-center justify-between ${
                                  ['empresas-simples-anexos', 'empresas-simples-segmentos'].includes(activeSection)
                                    ? 'bg-[#F0F7FF] text-[#1777CF]'
                                    : 'text-[#6B7280] hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <span>Simples Nacional</span>
                                {isSimplesNacionalExpanded ? 
                                  <ChevronDownIcon size={14} /> : 
                                  <ChevronRightIcon size={14} />
                                }
                              </button>
                              
                              {/* Subitens do Simples Nacional */}
                              {isSimplesNacionalExpanded && (
                                <div className="ml-0 mt-[2px] space-y-[0px]">
                                  <button
                                    onClick={() => {
                                      setActiveSection('empresas-simples-anexos')
                                      if (activeTab === 'empresas') {
                                        setLastEmpresasSection('empresas-simples-anexos')
                                      }
                                    }}
                                    className={`w-full text-left px-[12px] py-[4px] text-[13px] rounded-[4px] font-inter flex items-center ${
                                      activeSection === 'empresas-simples-anexos'
                                        ? 'bg-[#E8F4FD] text-[#1777CF] border-l-2 border-[#1777CF]'
                                        : 'text-[#6B7280] hover:bg-[#F8FAFC] border-l-2 border-transparent'
                                    }`}
                                  >
                                    Anexos
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveSection('empresas-simples-segmentos')
                                      if (activeTab === 'empresas') {
                                        setLastEmpresasSection('empresas-simples-segmentos')
                                      }
                                    }}
                                    className={`w-full text-left px-[12px] py-[4px] text-[13px] rounded-[4px] font-inter flex items-center ${
                                      activeSection === 'empresas-simples-segmentos'
                                        ? 'bg-[#E8F4FD] text-[#1777CF] border-l-2 border-[#1777CF]'
                                        : 'text-[#6B7280] hover:bg-[#F8FAFC] border-l-2 border-transparent'
                                    }`}
                                  >
                                    Segmentos
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => {
                                setActiveSection('empresas-lucro-presumido')
                                if (activeTab === 'empresas') {
                                  setLastEmpresasSection('empresas-lucro-presumido')
                                }
                              }}
                              className={`w-full text-left px-[12px] py-[6px] text-[14px] rounded-[6px] font-inter flex items-center ${
                                activeSection === 'empresas-lucro-presumido'
                                  ? 'bg-[#F0F7FF] text-[#1777CF] border-l-2 border-[#1777CF]'
                                  : 'text-[#6B7280] hover:bg-[#F8FAFC] border-l-2 border-transparent'
                              }`}
                            >
                              Lucro Presumido
                            </button>
                            <button
                              onClick={() => {
                                setActiveSection('empresas-lucro-real')
                                if (activeTab === 'empresas') {
                                  setLastEmpresasSection('empresas-lucro-real')
                                }
                              }}
                              className={`w-full text-left px-[12px] py-[6px] text-[14px] rounded-[6px] font-inter flex items-center ${
                                activeSection === 'empresas-lucro-real'
                                  ? 'bg-[#F0F7FF] text-[#1777CF] border-l-2 border-[#1777CF]'
                                  : 'text-[#6B7280] hover:bg-[#F8FAFC] border-l-2 border-transparent'
                              }`}
                            >
                              Lucro Real
                            </button>
                          </div>
                        )}
                      </div>
					  
					  {/* Divisória após Lucro Real */}
                      <div className="h-[1px] bg-[#E5E7EB] mx-[12px] my-[12px] pb-[1px]"></div> 

                      <button
                                               onClick={() => {
                         setActiveSection('empresas-folha')
                         if (activeTab === 'empresas') {
                           setLastEmpresasSection('empresas-folha')
                         }
                       }}

                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'empresas-folha'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Tributação sobre folha
                      </button>
                      <button
                       onClick={() => {
                         setActiveSection('empresas-icms')
                         if (activeTab === 'empresas') {
                           setLastEmpresasSection('empresas-icms')
                         }
                       }}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'empresas-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Estados e ICMS
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveSection('empresas-cnaes')
                          if (activeTab === 'empresas') {
                            setLastEmpresasSection('empresas-cnaes')
                          }
                        }}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'empresas-cnaes'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        CNAES
                      </button>
                    </>
                  ) : (
                    // Modo Compacto - Botões Expandíveis com Hover
                    <>
                      <button
                        onClick={() => {
                         if (isSegmentoExpandedCompact) {
                           // Se está aberto, fechar e marcar como fechamento manual
                           setIsSegmentoExpandedCompact(false)
                           if (isSTSubOptionActive) {
                             setUserManuallyCollapsed(true)
                           }
                         } else {
                           // Se está fechado, abrir e limpar fechamento manual
                           setIsSegmentoExpandedCompact(true)
                           setUserManuallyCollapsed(false)
                         }

                        }} 
className="expandable-button compact-button mt-[12px] mb-[2px] bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm"
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">ST</span>
                          <span className="expandable-button-full">Segmento / Tributação</span>
                        </div>
                      </button>

                      {/* Subitens expandidos no modo compacto - APENAS AS OPÇÕES DE ST */}
                      {isSegmentoExpandedCompact && (
                        <div className="ml-0 mt-[10px] space-y-[0px]">
                          {/* Simples Nacional - Botão expansível */}
                          <button
                            onClick={() => {
                              setIsSimplesNacionalExpandedCompact(!isSimplesNacionalExpandedCompact)
                            }}
                            className={`expandable-button compact-button ${
                              ['empresas-simples-anexos', 'empresas-simples-segmentos'].includes(activeSection)
                                ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                                : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                            }`}
                          >
                            <div className="expandable-button-content">
                              <span className="expandable-button-abbr">SN</span>
                              <span className="expandable-button-full">Simples Nacional</span>
                            </div>
                          </button>
                          
                          {/* Subitens do Simples Nacional no modo compacto */}
                          {isSimplesNacionalExpandedCompact && (
                            <div className="ml-2 mt-[4px] space-y-[2px]">
                              <button
                                onClick={() => {
                                  setActiveSection('empresas-simples-anexos')
                                }}
                                className={`expandable-button compact-button ${
                                  activeSection === 'empresas-simples-anexos'
                                    ? 'bg-[#E8F4FD] text-[#1777CF] border border-[#1777CF]'
                                    : 'text-[#6B7280] hover:bg-[#F8FAFC] border border-transparent'
                                }`}
                                style={{fontSize: '10px'}}
                              >
                                <div className="expandable-button-content">
                                  <span className="expandable-button-abbr">AN</span>
                                  <span className="expandable-button-full">Anexos</span>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSection('empresas-simples-segmentos')
                                }}
                                className={`expandable-button compact-button ${
                                  activeSection === 'empresas-simples-segmentos'
                                    ? 'bg-[#E8F4FD] text-[#1777CF] border border-[#1777CF]'
                                    : 'text-[#6B7280] hover:bg-[#F8FAFC] border border-transparent'
                                }`}
                                style={{fontSize: '10px'}}
                              >
                                <div className="expandable-button-content">
                                  <span className="expandable-button-abbr">SG</span>
                                  <span className="expandable-button-full">Segmentos</span>
                                </div>
                              </button>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setActiveSection('empresas-lucro-presumido')
                            }}
                            className={`expandable-button compact-button ${
                              activeSection === 'empresas-lucro-presumido'
                                ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                                : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                            }`}
                          >
                            <div className="expandable-button-content">
                              <span className="expandable-button-abbr">LP</span>
                              <span className="expandable-button-full">Lucro Presumido</span>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setActiveSection('empresas-lucro-real')
                            }}
                            className={`expandable-button compact-button ${
                              activeSection === 'empresas-lucro-real'
                                ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                                : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                            }`}
                          >
                            <div className="expandable-button-content">
                              <span className="expandable-button-abbr">LR</span>
                              <span className="expandable-button-full">Lucro Real</span>
                            </div>
                          </button>
                        </div>
                      )}
					  
                      {/* Divisória entre LR e TF */}
                     <div className="h-[1px] bg-[#E5E5EA] mx-[6px] mt-[8px] mb-[8px]"></div>
                      {/* Botões TF e IC - SEMPRE VISÍVEIS, FORA da expansão do ST */}
                      <button
                        onClick={() => setActiveSection('empresas-folha')}
                        className={`expandable-button compact-button ${
                          activeSection === 'empresas-folha'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">TF</span>
                          <span className="expandable-button-full">Tributação sobre Folha</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('empresas-icms')}
                        className={`expandable-button compact-button my-[5px] ${
                          activeSection === 'empresas-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">IC</span>
                          <span className="expandable-button-full">Estados e ICMS</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveSection('empresas-cnaes')}
                        className={`expandable-button compact-button my-[5px] ${
                          activeSection === 'empresas-cnaes'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">CN</span>
                          <span className="expandable-button-full">CNAES</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
 
              {/* Conteúdo da Aba Produtor Rural */}
              {activeTab === 'produtor-rural' && (
                <div className={`${isSidebarExpanded ? 'space-y-[4px]' : ''}`}>
                  
                  {isSidebarExpanded ? (
                    // Modo Expandido - Layout Completo
                    <>
                      <div className="h-[1px] bg-[#E5E7EB] mx-[10px] mb-[15px]"></div>
                      
                      <div className="text-[11px] font-light text-[#8B8B8B] uppercase tracking-[0.5px] mb-[0px] pl-[12px] font-inter">
                        Pessoa Física
                      </div>
                      
                      <button 
                                               onClick={() => {
                         setActiveSection('fisica-funrual')
                         if (activeTab === 'produtor-rural') {
                           setLastProdutorRuralSection('fisica-funrual')
                         }
                       }}

                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'fisica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Funrual
                      </button>
                      <button
                       onClick={() => {
                         setActiveSection('fisica-presuncao')
                         if (activeTab === 'produtor-rural') {
                           setLastProdutorRuralSection('fisica-presuncao')
                         }
                       }}

                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'fisica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Presunção
                      </button>
                      <button
                        onClick={() => setActiveSection('fisica-tabela-ir')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'fisica-tabela-ir'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Tabela Imposto de renda
                      </button>
                      <button
                        onClick={() => setActiveSection('fisica-icms')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'fisica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Estado e ICMS
                      </button>

                      <div className="h-[1px] bg-[#E5E7EB] mx-[10px] my-[15px]"></div>
                      
                      <div className="text-[11px] font-light text-[#8B8B8B] uppercase tracking-[0.5px] pt-[10px] pb-[0px] pl-[12px] font-inter">
                        Pessoa Jurídica
                      </div>
                      
                      <button
                        onClick={() => setActiveSection('juridica-funrual')}
                        className={`w-full text-left mt-[12px] px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Funrual
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-presuncao')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Presunção
                      </button>
                      <button 
                        onClick={() => setActiveSection('juridica-icms')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Estado e ICMS
                      </button>
                    </>
                  ) : (
                    // Modo Compacto - Botões Expandíveis com Hover
                    <>
                      <div className="text-[8px] font-light text-[#8B8B8B] text-center mb-[4px]">PF</div>
                      
                      <button
                        onClick={() => setActiveSection('fisica-funrual')}
                        className={`expandable-button compact-button ${
                          activeSection === 'fisica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">FU</span>
                          <span className="expandable-button-full">Funrual</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('fisica-presuncao')}
                        className={`expandable-button compact-button ${
                          activeSection === 'fisica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">PR</span>
                          <span className="expandable-button-full">Presunção</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('fisica-tabela-ir')}
                        className={`expandable-button compact-button ${
                          activeSection === 'fisica-tabela-ir'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">TA</span>
                          <span className="expandable-button-full">Tabela Imposto de renda</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('fisica-icms')}
                        className={`expandable-button compact-button ${
                          activeSection === 'fisica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">IC</span>
                          <span className="expandable-button-full">Estado e ICMS</span>
                        </div>
                      </button>

                      <div className="h-[1px] bg-[#E5E7EB] my-[6px]"></div>
                      <div className="text-[8px] font-light text-[#8B8B8B] text-center mb-[4px] pt-[10px] mt-[10px]">PJ</div>
                      
                      <button
                        onClick={() => setActiveSection('juridica-funrual')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">FU</span>
                          <span className="expandable-button-full">Funrual</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-presuncao')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">PR</span>
                          <span className="expandable-button-full">Presunção</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-icms')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">IC</span>
                          <span className="expandable-button-full">Estado e ICMS</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Conteúdo da Aba Pessoa Jurídica */}
              {activeTab === 'pessoa-juridica' && (
                <div className={`${isSidebarExpanded ? 'space-y-[4px]' : ''}`}>
                  {isSidebarExpanded ? (
                    // Modo Expandido - Botões Completos
                    <>
                      <button
                        onClick={() => setActiveSection('juridica-funrual')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Funrural
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-presuncao')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Presunção
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-icms')}
                        className={`w-full text-left px-[12px] py-[8px] text-[14px] rounded-[8px] font-inter ${
                          activeSection === 'juridica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Estado e ICMS
                      </button>
                    </>
                  ) : (
                    // Modo Compacto - Botões Expandíveis com Hover
                    <>
                      <button
                        onClick={() => setActiveSection('juridica-funrual')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-funrual'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">FU</span>
                          <span className="expandable-button-full">Funrural</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-presuncao')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-presuncao'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">PR</span>
                          <span className="expandable-button-full">Presunção</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveSection('juridica-icms')}
                        className={`expandable-button compact-button ${
                          activeSection === 'juridica-icms'
                            ? 'bg-white text-[#1777CF] border border-[#E5E7EB] shadow-sm'
                            : 'text-[#374151] hover:bg-[#F8FAFC] border border-transparent'
                        }`}
                      >
                        <div className="expandable-button-content">
                          <span className="expandable-button-abbr">IC</span>
                          <span className="expandable-button-full">Estado e ICMS</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Container 2: Área de Conteúdo Principal - Renderização dos Componentes Filhos */}
          <div className="flex-1 border border-[#E5E7EB] bg-white rounded-[8px] flex flex-col min-h-0 overflow-visible content-transition shadow-sm w-full">
            
            {/* Renderização Condicional dos Componentes */}
           {/* Empresas - Segmento / Tributação */}
           {activeSection === 'empresas-segmento' && (
             <BDSegmentoTributacao 
               onDataChange={(data) => handleDataChange('empresas-segmento', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

           {/* Empresas - Lucro Presumido */}
           {activeSection === 'empresas-lucro-presumido' && (
             <BDSegmentoTributacao 
               onDataChange={(data) => handleDataChange('empresas-lucro-presumido', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

           {/* Empresas - Lucro Real */}
           {activeSection === 'empresas-lucro-real' && (
             <BDLucroReal 
               onDataChange={(data) => handleDataChange('empresas-lucro-real', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

           {/* Empresas - Tributação sobre folha */}
           {activeSection === 'empresas-folha' && (
             <BDTributacaoFolha 
               onDataChange={(data) => handleDataChange('empresas-folha', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

           {/* Empresas - Estados e ICMS */}
           {activeSection === 'empresas-icms' && (
             <BDEstadosICMS 
               onDataChange={(data) => handleDataChange('empresas-icms', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

           {/* Empresas - CNAES */}
           {activeSection === 'empresas-cnaes' && (
             <BDCNAES 
               onDataChange={(data) => handleDataChange('empresas-cnaes', data)}
               onSaveComplete={handleSaveComplete}
             />
           )}

            {/* Empresas - Anexos Simples Nacional */}
            {activeSection === 'empresas-simples-anexos' && (
              <BDAnexosSimples 
              onDataChange={(data) => handleDataChange('empresas-simples-anexos', data)}
              onSaveComplete={handleSaveComplete} 
            />
            )}

            {/* Empresas - Segmentos Simples Nacional */}
            {activeSection === 'empresas-simples-segmentos' && (
              <BDSegmentos 
                onDataChange={(data) => handleDataChange('empresas-simples-segmentos', data)}
                onSaveComplete={handleSaveComplete} 
              />
            )} 

            {/* Pessoa Física - Funrural */}
            {activeSection === 'fisica-funrual' && (
              <BDFFunrural 
                onDataChange={(data) => handleDataChange('fisica-funrual', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}

            {/* Pessoa Física - Presunção */}
            {activeSection === 'fisica-presuncao' && (
              <BDFPresuncao 
                onDataChange={(data) => handleDataChange('fisica-presuncao', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}

            {/* Pessoa Física - Tabela IR */}
            {activeSection === 'fisica-tabela-ir' && (
              <BDFTabelaIR 
                onDataChange={(data) => handleDataChange('fisica-tabela-ir', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}

            {/* Pessoa Física - Estado ICMS */}
            {activeSection === 'fisica-icms' && (
              <BDFEstadoICMS 
                onDataChange={(data) => handleDataChange('fisica-icms', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}

            {/* Pessoa Jurídica - Funrural */}
            {activeSection === 'juridica-funrual' && ( 
              <BDJFunrural 
                onDataChange={(data) => handleDataChange('juridica-funrual', data)}
                onSaveComplete={handleSaveComplete} 
              />
            )}

            {/* Pessoa Jurídica - Presunção */}
            {activeSection === 'juridica-presuncao' && (
              <BDJPresuncao 
                onDataChange={(data) => handleDataChange('juridica-presuncao', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}

             {/* Pessoa Jurídica - Estado ICMS */}
            {activeSection === 'juridica-icms' && (
              <BDJEstadoICMS 
                onDataChange={(data) => handleDataChange('juridica-icms', data)}
                onSaveComplete={handleSaveComplete}
              />
            )}
 
          </div>
        </div>        
      </div>
    </div>
  </ImpostoRendaProvider>
  </SegmentosProvider>
  ) 
}