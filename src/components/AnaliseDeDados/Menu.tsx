import React, { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Menu as MenuIcon, Settings } from 'lucide-react';
import GerenciarDocumentos, { MenuItem } from "./1.GerenciarDocumentos";
import { PastaCustomIcon } from './Modal-CriarCategoria';

// Ícone customizado de editar
const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <g>
      <path d="M11 3.25H4c-.729 0-1.429.29-1.945.805A2.755 2.755 0 0 0 1.25 6v14c0 .729.29 1.429.805 1.945A2.755 2.755 0 0 0 4 22.75h14c.729 0 1.429-.29 1.945-.805A2.755 2.755 0 0 0 20.75 20v-8a.75.75 0 0 0-1.5 0v8A1.252 1.252 0 0 1 18 21.25H4A1.252 1.252 0 0 1 2.75 20V6A1.252 1.252 0 0 1 4 4.75h7a.75.75 0 0 0 0-1.5z" />
      <path d="M22.237 5.652a1.75 1.75 0 0 0 0-2.475l-1.414-1.414a1.75 1.75 0 0 0-2.475 0L8.095 12.016a.752.752 0 0 0-.215.447l-.353 3.182a.75.75 0 0 0 .828.828l3.182-.353a.752.752 0 0 0 .447-.215L22.237 5.652zm-1.06-1.061L11.11 14.658l-1.989.221.221-1.989L19.409 2.823a.252.252 0 0 1 .354 0l1.414 1.414a.252.252 0 0 1 0 .354z" />
      <path d="m16.227 4.945 2.828 2.828a.75.75 0 1 0 1.061-1.061l-2.828-2.828a.75.75 0 1 0-1.061 1.061z" />
    </g>
  </svg>
);

interface MenuProps {
  activeTab: 'fisica' | 'juridica';
  activeSection: string;
  sidebarCollapsed: boolean;
  expandedSections: Record<string, boolean>;
  mockData: {
    empresas: Array<{ id: string; nome: string; [key: string]: any }>;
    formularios: Array<{ nome: string; [key: string]: any }>;
  };
  onTabChange: (tab: 'fisica' | 'juridica') => void;
  onSectionChange: (section: string, item?: any) => void;
  onSidebarToggle: () => void;
  onToggleSection: (section: string) => void;
}

// Função utilitária para truncar nomes de arquivos mantendo a extensão
const truncateFileName = (fileName: string, maxLength: number = 33): string => {
  if (!fileName || fileName.length <= maxLength) return fileName;
  
  // Extrair extensão
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // Sem extensão, truncar normalmente
    return fileName.substring(0, maxLength - 3) + '...';
  }
  
  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);
  
  // Se a extensão é muito longa, truncar o arquivo todo
  if (extension.length > 8) {
    return fileName.substring(0, maxLength - 3) + '...';
  }
  
  // Calcular espaço disponível para o nome (reservando espaço para ... e extensão)
  const availableSpace = maxLength - 3 - extension.length;
  
  if (availableSpace <= 0) {
    return '...' + extension;
  }
  
  return name.substring(0, availableSpace) + '...' + extension;
};

const Menu: React.FC<MenuProps> = ({
  activeTab,
  activeSection,
  sidebarCollapsed,
  expandedSections,
  mockData,
  onTabChange,
  onSectionChange,
  onSidebarToggle,
  onToggleSection,
}) => {
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [empresasData, setEmpresasData] = useState<MenuItem[]>(() => {
    // Inicializar vazio - será carregado do localStorage
    return [];
  });

  const [fisicaData, setFisicaData] = useState<MenuItem[]>(() => {
    // Inicializar vazio - será carregado do localStorage
    return [];
  });

  // Carregar dados salvos do localStorage se existirem
  React.useEffect(() => {
     
	 // Carregar dados da aba Jurídica
    const savedJuridica = localStorage.getItem('gerenciarDocumentos_juridica_data');
    
    if (savedJuridica) {
      try {
        const parsed = JSON.parse(savedJuridica);
        if (parsed.data) {
          setEmpresasData(parsed.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados jurídica:', error);
      }
    } else {
      // Manter vazio para forçar o usuário a adicionar documentos reais
      setEmpresasData([]);
     }
    
    // Carregar dados da aba Física
    const savedFisica = localStorage.getItem('gerenciarDocumentos_fisica_data');
    
    if (savedFisica) {
      try {
        const parsed = JSON.parse(savedFisica);
        if (parsed.data) {
          setFisicaData(parsed.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados física:', error);
      }
    } else {
      // Manter vazio para forçar o usuário a adicionar documentos reais
      setFisicaData([]);
     }
  }, []);

  const getAbbreviation = (text: string) => {
    const words = text.split(' ');
    if (words.length >= 2) {
      return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const getColorsByLevel = (level: number, isActive: boolean, itemType?: string, isPasta?: boolean) => {
    // Para categorias (empresas, formulários, etc.) - mantém borda cinza
    if ((itemType === 'empresa' || itemType === 'categoria') && !isPasta) {
      return {
        border: 'border-[#E5E7EB]',
        text: 'text-[#1777CF]',
        bg: isActive ? 'bg-white shadow-sm' : 'hover:bg-[#F8FAFC]',
        weight: 'font-normal',
        chevron: 'text-[#1777CF]'
      };
    }
    
    // Para pastas - remove borda cinza
    if (isPasta) {
      return {
        border: 'border-transparent',
        text: 'text-[#1777CF]',
        bg: isActive ? 'bg-white shadow-sm' : 'hover:bg-[#F8FAFC]',
        weight: 'font-normal',
        chevron: 'text-[#1777CF]'
      };
    }
    
    // Para documentos selecionados
    if (isActive) {
      return {
        border: 'border-l-2 border-[#1777CF] border-t-transparent border-r-transparent border-b-transparent',
        text: 'text-[#1777CF]',
        bg: 'bg-[#F0F7FF]',
        weight: 'font-normal',
        chevron: 'text-[#1777CF]'
      };
    }
    
    // Para outros documentos (não selecionados)
    return {
      border: 'border-l-2 border-transparent',
      text: 'text-[#6B7280]',
      bg: 'hover:bg-[#F8FAFC]',
      weight: 'font-normal',
      chevron: 'text-gray-400'
    };
  };

  const renderMenuItem = (item: MenuItem, level = 0, parentId: string | null = null, isLastInGroup = false): JSX.Element => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    const isActive = activeSection === item.id;
    
    // Detectar tipos
    const isEmpresa = item.type === 'empresa';
    const isCategoria = item.type === 'categoria';
    const isSubcategoria = item.type === 'subcategoria';
    const isPasta = item.type === 'pasta';
    const isArquivo = item.type === 'arquivo';
    
    // Determinar o tipo para a função de cores
    let itemType = '';
    if (isEmpresa || isCategoria || isSubcategoria || isPasta) {
      itemType = hasChildren ? 'categoria' : 'empresa';
    }
    
    const colors = getColorsByLevel(level, isActive, itemType, isPasta);
    
    // Extrair número e nome
    let displayName = item.label;
    let itemNumber = '';
    if ((item.showNumber || isEmpresa) && item.label.match(/^\d{2}\s/)) {
      itemNumber = item.label.substring(0, 2);
      displayName = item.label.substring(3);
    }

    return (
      <div key={item.id}>
        <div
          onClick={() => {
            if (hasChildren) {
              onToggleSection(item.id);
            } else {
              onSectionChange(item.id, item);
            }
          }}
          className={`flex items-center cursor-pointer transition-all duration-200 mb-1 px-4 py-2 rounded-xl border ${colors.border} ${colors.bg} ${colors.text} ${colors.weight}`}
          style={{ marginLeft: '10px', marginRight: '10px' }}
        >
          {/* Replicar exatamente o visual do modal de gerenciamento */}
          {item.folderColor && item.folderType && (
            <PastaCustomIcon 
              fillColor={item.folderColor} 
              strokeColor={item.folderColor} 
              solid={item.folderType === 'colorida'}
              className="w-[20px] h-[20px] flex-shrink-0 mr-2"
            />
          )}
          
          {item.showNumber && item.numberBgColor && itemNumber && (
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mr-2"
              style={{
                backgroundColor: item.numberBgColor,
                color: item.numberTextColor || '#FFFFFF'
              }}
            >
              {itemNumber}
            </div>
          )}
          
          <span className={`text-sm ${colors.weight} truncate flex-1 min-w-0 pr-1`} title={item.showNumber && itemNumber ? item.label.substring(3) : item.label}>
          {truncateFileName(item.showNumber && itemNumber ? item.label.substring(3) : item.label)}
          </span>
          {hasChildren && (
            <div className="flex items-center justify-center w-4 h-4 flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${colors.chevron}`} />
              ) : (
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${colors.chevron}`} />
              )}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && item.children && (
          <div className="ml-0">
            {item.children.map((child, index) => 
              renderMenuItem(child, level + 1, item.id, index === item.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCollapsedMenuItem = (item: MenuItem, level = 0, parentId: string | null = null): JSX.Element => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    const isActive = activeSection === item.id;
    
    // Detectar tipos de item
    const isEmpresa = item.type === 'empresa';
    const isFormulario = item.type === 'formulario' || (item.label && item.label.toLowerCase().includes('formulário'));

    const isCategoria = item.type === 'categoria';
    const isSubcategoria = item.type === 'subcategoria';
    const isEmpresaChild = level === 2 && activeTab === 'juridica';
    const isFormularioChild = level === 1 && activeTab === 'juridica';

    let displayText = '';
    let bgColor = '';
    let textColor = 'text-gray-700';
    let borderColor = '';
    let customBgColor = '';
    let customTextColor = '';
    
    // Determinar cores baseadas na hierarquia
    if (isEmpresa || isFormulario || isCategoria || isSubcategoria) {
		
      // Subcategorias (empresas/formulários numerados) - usar cores personalizadas se disponíveis
      if (item.showNumber && item.numberBgColor) {
        customBgColor = item.numberBgColor;
        customTextColor = item.numberTextColor || '#374151';
      } else {
        bgColor = isActive ? '' : 'bg-blue-50 hover:bg-blue-100';
        textColor = isActive ? 'text-white' : 'text-gray-700';
      }
    } else if (isEmpresaChild || isFormularioChild) {
      // Sub-subcategorias - fundo branco com borda cinza claro
      bgColor = isActive ? 'bg-white' : 'bg-white hover:bg-gray-50';
      borderColor = 'border border-gray-300';
    } else {
      // Padrão
      bgColor = isActive ? 'bg-blue-100' : 'hover:bg-gray-100';
    }

    // Determinar o texto a ser exibido
    if ((isEmpresa || isFormulario || item.showNumber) && item.label.match(/^\d{2}\s/)) {
      displayText = item.label.substring(0, 2);
    } else {
      displayText = getAbbreviation(item.label);
    }

    return (
      <Fragment key={item.id}>
        <div
          className={`flex items-center justify-center w-12 h-[25px] mx-2 rounded-md cursor-pointer transition-all duration-200 ${bgColor} ${borderColor}`}
          style={{
            backgroundColor: customBgColor || (((item.id === 'empresas' || item.id === 'formularios-juridica' || isEmpresa || isFormulario) && isActive) ? '#1777CF' : undefined),
            color: customTextColor || (isActive && (item.id === 'empresas' || item.id === 'formularios-juridica' || isEmpresa || isFormulario) ? '#FFFFFF' : undefined)
          }}
          onClick={() => {
            if (hasChildren) {
              onToggleSection(item.id);
            } else {
              onSectionChange(item.id, item);
            }
          }}
        >
          <span className={`text-xs font-bold ${!customTextColor ? textColor : ''}`}>{displayText}</span>
        </div>
        
        {hasChildren && isExpanded && item.children && (
          <div className="space-y-0.5 mt-0">
            {item.children.map(child => renderCollapsedMenuItem(child, level + 1, item.id))}
          </div>
        )}
      </Fragment>
    );
  };

  const getMenuItemsByTab = (): MenuItem[] => {
    return activeTab === 'fisica' ? fisicaData : empresasData;
  };

  // Funções do Modal de Gerenciamento
  const handleSaveEmpresas = (updatedData: MenuItem[]) => {
    
    // Salvar os dados na aba correta
    if (activeTab === 'juridica') {
      setEmpresasData(updatedData);
    } else {
      setFisicaData(updatedData);
    }

  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-2xl transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } flex flex-col overflow-hidden`}>
        
        {/* Toggle button e Settings */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'px-4 py-3'} border-b border-gray-200`}>
          <div className="flex items-center gap-2">
            <button
              onClick={onSidebarToggle}
              className="flex-1 flex items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200"
            >
              {sidebarCollapsed ? (
                <MenuIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                  <span className="ml-3 text-sm font-semibold text-gray-700">Reduzir</span>
                </>
              )}
            </button>
            {!sidebarCollapsed && (
              <button
                onClick={() => setShowManagementModal(true)}
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                title="Gerenciar documentos"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Abas Física/Jurídica */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gray-100 rounded-xl p-1 flex">
              <button
                onClick={() => {
                  onTabChange('fisica');
                  onSectionChange('dados-pessoais');
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'fisica'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Física
              </button>
              <button
                onClick={() => {
                  onTabChange('juridica');
                  onSectionChange('empresas');
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'juridica'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jurídica
              </button>
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className= "py-[0px] my-[10px] mr-[5px] flex-1 overflow-y-auto">
          {/* Wrapper 02 - Outer wrapper with py-[10px] and mr-[10px] */}
          <div className="py-[0px] mr-[0px]">
            {/* Wrapper 01 - Inner wrapper */}
            <div>
              {!sidebarCollapsed ? (
                getMenuItemsByTab().length > 0 ? (
                  <div className="px-0 py-0">
                    {getMenuItemsByTab().map((item, index, array) => (
                      <Fragment key={item.id}>
                        {renderMenuItem(item, 0, null, false)}
                        {index < array.length - 1 && (
                          <div className="mx-[15px] my-2 border-t border-gray-200"></div>
                        )}
                      </Fragment>
                    ))}
                  </div>

                ) : (
                  <div className="p-0 text-center text-gray-400 text-sm">
                    {activeTab === 'juridica' ? 
                      'Nenhuma categoria ou empresa cadastrada' : 
                      'Nenhum item cadastrado'
                    }
                  </div>
                )

              ) : (
                <div className="py-0.5">
                  {/* Divisória */}
                  <div className="mx-[10px] px-[10px] mb-[10px] pb-[10px] border-t border-gray-200"></div>
                  
                  {/* Botão PF/PJ */}
                  <div className="mx-2 mb-1">
                    <div
                      className={`flex items-center justify-center w-12 h-[25px] rounded-md cursor-pointer transition-all duration-200 text-white`}
                      style={{
                        backgroundColor: '#1777CF'
                      }}
                      onClick={() => {
                        if (activeTab === 'fisica') {
                          onTabChange('juridica');
                          onSectionChange('empresas');
                        } else {
                          onTabChange('fisica');
                          onSectionChange('dados-pessoais');
                        }
                      }}
                    >
                      <span className="text-xs font-bold">
                        {activeTab === 'fisica' ? 'PF' : 'PJ'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Divisória */}
                  <div className="mx-[10px] px-[10px] mb-[10px] pb-[10px] border-t border-gray-200"></div>
                  
                  {/* Menu items */}
                  <div className="space-y-0.5">
                    {getMenuItemsByTab().map(item => renderCollapsedMenuItem(item, 0, null))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Gerenciamento */}
      <GerenciarDocumentos
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        empresasData={activeTab === 'juridica' ? empresasData : fisicaData}
        onSave={handleSaveEmpresas}
      />
    </>
  );
};

export default Menu;