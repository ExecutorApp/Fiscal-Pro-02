import React, { useState, useRef, useEffect } from 'react';

/*
--------------------------------------------------------
  Componente: Modal-CriarKanban - Gerenciamento de Kanban
--------------------------------------------------------
- Layout com menu lateral vertical + área principal
- Menu lateral tipo carrossel com cards visuais
- Estrutura hierárquica: Produto > Etapa > Fase
- Cards estilo tags com drag and drop para reordenação
- Layout conforme wireframe atualizado
*/

interface ModalCriarKanbanProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KanbanItem {
  id: string;
  nome: string;
  ordem: number;
  isActive: boolean;
  parentId?: string;
  icon?: string;
}

interface KanbanData {
  produtos: KanbanItem[];
  etapas: KanbanItem[];
  fases: KanbanItem[];
}

// Ícones SVG do sistema
const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const GripVerticalIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1"/>
    <circle cx="9" cy="5" r="1"/>
    <circle cx="9" cy="19" r="1"/>
    <circle cx="15" cy="12" r="1"/>
    <circle cx="15" cy="5" r="1"/>
    <circle cx="15" cy="19" r="1"/>
  </svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="m18.5 2.5 a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

// Ícone Produto (Novo - Pasta/Documento)
const ProductIcon = ({ size = 18 }) => (
  <svg width={size} height={size * 15/18} viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355ZM1.17986 13.3565V3.79869C1.17986 3.54157 1.39062 3.3318 1.64897 3.3318L4.60638 3.33519V8.75863V13.8233L1.64897 13.82C1.39062 13.8233 1.17986 13.6136 1.17986 13.3565ZM4.60638 13.8233V8.75863V3.33519H4.26645V13.8233H4.60638ZM13.7302 13.8233V3.33519H13.3902V13.8233H13.7302ZM16.8167 13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902V3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565Z" fill="currentColor"/>
    <path d="M4.60638 3.33519L1.64897 3.3318C1.39062 3.3318 1.17986 3.54157 1.17986 3.79869V13.3565C1.17986 13.6136 1.39062 13.8233 1.64897 13.82L4.60638 13.8233M4.60638 3.33519H4.26645V13.8233H4.60638M4.60638 3.33519V8.75863V13.8233M13.3902 3.33519H13.7302V13.8233H13.3902M13.3902 3.33519V13.8233M13.3902 3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355Z" stroke="currentColor" strokeWidth="0.2"/>
  </svg>
);

// Ícone Etapas (Novo - Degraus/Escada)
const StepsIcon = ({ size = 18 }) => (
  <svg width={size} height={size * 15/18} viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.7333 0.5H14.4219H8.16719C8.01992 0.5 7.90052 0.616341 7.90052 0.759833V3.34839H6.36563C6.21836 3.34839 6.09896 3.46473 6.09896 3.60822V5.7663H4.56393C4.41667 5.7663 4.29727 5.88264 4.29727 6.02614V8.71403H3.17031C3.02305 8.71403 2.90365 8.83037 2.90365 8.97386V11.3969H1.26667C1.1194 11.3969 1 11.5132 1 11.6567V14.2402C1 14.3837 1.1194 14.5 1.26667 14.5H16.7333C16.8806 14.5 17 14.3837 17 14.2402V0.759833C17 0.616341 16.8806 0.5 16.7333 0.5ZM14.1552 1.01967V3.34839H12.6202H8.43385V1.01967H14.1552ZM8.16719 3.86805H12.3535V5.7663H10.8186H6.63229V3.86805H8.16719ZM6.36563 6.28597H10.552V8.71403H9.42487H4.8306V6.28597H6.36563ZM4.56393 9.2337H9.1582V11.3969H7.52135H3.43698V9.2337H4.56393ZM1.53333 11.9165H3.17031H7.25469V13.9803H1.53333V11.9165ZM16.4667 13.9803H7.78802V11.9165H9.42487C9.57214 11.9165 9.69154 11.8002 9.69154 11.6567V9.2337H10.8186C10.9659 9.2337 11.0853 9.11736 11.0853 8.97386V6.28597H12.6202C12.7674 6.28597 12.8868 6.16963 12.8868 6.02614V3.86805H14.4219C14.5691 3.86805 14.6885 3.75171 14.6885 3.60822V1.01967H16.4667V13.9803Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"/>
  </svg>
);

// Ícone Fases (Novo - Colunas/Barras)
const PhasesIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.27 22.75H4.23c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v15.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-20c-1.27 0-1.48.34-1.48 1.35v15.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35zM19.77 15.75h-4.04c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v8.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-13c-1.27 0-1.48.34-1.48 1.35v8.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35z" fill="currentColor"/>
  </svg>
);

export const ModalCriarKanban: React.FC<ModalCriarKanbanProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'produtos' | 'etapas' | 'fases'>('produtos');
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Estados dos dados com estrutura hierárquica
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    produtos: [
      { id: 'prod-1', nome: 'Holding Patrimonial', ordem: 1, isActive: true },
      { id: 'prod-2', nome: 'Ativos Fundiários', ordem: 2, isActive: true },
      { id: 'prod-3', nome: 'Planejamento Tributário', ordem: 3, isActive: true }
    ],
    etapas: [
      { id: 'etapa-1', nome: 'Primeiro Contato', ordem: 1, isActive: true, parentId: 'prod-1' },
      { id: 'etapa-2', nome: 'Proposta Enviada', ordem: 2, isActive: true, parentId: 'prod-1' },
      { id: 'etapa-3', nome: 'Negociação', ordem: 1, isActive: true, parentId: 'prod-2' },
      { id: 'etapa-4', nome: 'Fechamento', ordem: 2, isActive: true, parentId: 'prod-2' }
    ],
    fases: [
      { id: 'fase-1', nome: 'Análise Inicial', ordem: 1, isActive: true, parentId: 'etapa-1' },
      { id: 'fase-2', nome: 'Desenvolvimento', ordem: 2, isActive: true, parentId: 'etapa-1' },
      { id: 'fase-3', nome: 'Implementação', ordem: 1, isActive: true, parentId: 'etapa-2' },
      { id: 'fase-4', nome: 'Entrega', ordem: 2, isActive: true, parentId: 'etapa-2' }
    ]
  });

  // Estados para seleções hierárquicas
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedEtapa, setSelectedEtapa] = useState<string>('');
   const [selectedProductForFases, setSelectedProductForFases] = useState<string>('');
 const [selectedEtapaForFases, setSelectedEtapaForFases] = useState<string>('');

 // Estados para dropdown avançado de produtos (inspirado no FiltrosAvancado)
 const [showProdutoDropdown, setShowProdutoDropdown] = useState(false);
 const [searchProduto, setSearchProduto] = useState('');
 const produtoDropdownRef = useRef<HTMLDivElement>(null);
 const searchProdutoRef = useRef<HTMLInputElement>(null);
 
  // Estados para dropdown avançado de produtos na aba Fases
 const [showProdutoDropdownFases, setShowProdutoDropdownFases] = useState(false);
 const [searchProdutoFases, setSearchProdutoFases] = useState('');
 const produtoDropdownFasesRef = useRef<HTMLDivElement>(null);
 const searchProdutoFasesRef = useRef<HTMLInputElement>(null);
  
 // Estados para dropdown avançado de etapas na aba Fases
 const [showEtapaDropdownFases, setShowEtapaDropdownFases] = useState(false);
 const [searchEtapaFases, setSearchEtapaFases] = useState('');
 const etapaDropdownFasesRef = useRef<HTMLDivElement>(null);
 const searchEtapaFasesRef = useRef<HTMLInputElement>(null);

  // Estados para drag and drop
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Estados para modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Estados para confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KanbanItem | null>(null);
  
   // Lista de produtos para dropdown avançado
 const produtosDisponiveis = [
   { value: 'prod-1', label: 'Holding Patrimonial' },
   { value: 'prod-2', label: 'Ativos Fundiários' },
   { value: 'prod-3', label: 'Planejamento Tributário' },
   { value: 'contabilidade', label: 'Contabilidade Empresarial' },
   { value: 'consultoria', label: 'Consultoria Fiscal e Tributária' },
   { value: 'auditoria', label: 'Auditoria Contábil' },
   { value: 'planejamento-tributario', label: 'Planejamento Tributário Estratégico' },
   { value: 'folha-pagamento', label: 'Gestão de Folha de Pagamento' }
 ];

 // Filtrar produtos baseado na busca
 const produtosFiltrados = produtosDisponiveis.filter(produto =>
   produto.label.toLowerCase().includes(searchProduto.toLowerCase())
 );

 // Função para obter label do produto selecionado
 const getSelectedProdutoLabel = (value: string) => {
   if (!value) return 'Selecione um produto';
   const produto = produtosDisponiveis.find(p => p.value === value);
   return produto ? produto.label : 'Selecione um produto';
 };
 
  // Função para obter índice do produto selecionado
 const getSelectedProdutoIndex = (value: string) => {
   if (!value) return 0;
   const index = produtosDisponiveis.findIndex(p => p.value === value);
   return index !== -1 ? index + 1 : 0;
 };

 // Função para obter label do produto com numeração
 const getSelectedProdutoLabelWithNumber = (value: string) => {
   if (!value) return 'Selecione um produto';
   const produto = produtosDisponiveis.find(p => p.value === value);
   if (!produto) return 'Selecione um produto';
   const index = getSelectedProdutoIndex(value);
     return (
    <span>
      {index.toString().padStart(2, '0')}
      <span className="text-[12px] font-light text-[#D1D5DB] mx-[4px]">|</span>
      {produto.label}
    </span>
  );
 };


 // Função para contar itens do produto (simulada)
 const getClientCountByProduct = (productValue: string) => {
   if (!productValue) return 0;
   return Math.floor(Math.random() * 15) + 1;
 };

 // Função específica para obter quantidade de clientes por produto no kanban
 const getClientCountForProduct = (produto: KanbanItem) => {
   // Simular quantidade baseada no produto
   const counts: { [key: string]: number } = {
     'prod-1': 45,
     'prod-2': 32,
     'prod-3': 18
   };
   return counts[produto.id] || Math.floor(Math.random() * 50) + 10;
 };
 
  // Funções auxiliares para dropdown da aba Fases
 const getSelectedProdutoLabelForFases = (value: string) => {
   if (!value) return 'Selecione um produto';
   const produto = produtosDisponiveis.find(p => p.value === value);
   return produto ? produto.label : 'Selecione um produto';
 };
 
 const getSelectedProdutoLabelWithNumberForFases = (value: string) => {
   if (!value) return 'Selecione um produto';
   const produto = produtosDisponiveis.find(p => p.value === value);
   if (!produto) return 'Selecione um produto';
   const index = getSelectedProdutoIndex(value);
   return (
     <span>
       {index.toString().padStart(2, '0')}
       <span className="text-[12px] font-light text-[#D1D5DB] mx-[4px]">|</span>
       {produto.label}
     </span>
   );
 };
 
 // Filtrar produtos baseado na busca para Fases
 const produtosFiltradosForFases = produtosDisponiveis.filter(produto =>
   produto.label.toLowerCase().includes(searchProdutoFases.toLowerCase())
 );

 // Funções auxiliares para dropdown de etapas da aba Fases
 const getSelectedEtapaLabelWithNumberForFases = (value: string) => {
   if (!value) return 'Selecione uma etapa';
   const etapa = kanbanData.etapas
     .filter(etapa => etapa.parentId === selectedProductForFases)
     .find(e => e.id === value);
   if (!etapa) return 'Selecione uma etapa';
   const index = kanbanData.etapas
     .filter(e => e.parentId === selectedProductForFases)
     .findIndex(e => e.id === value);
   return (
     <span>
       {(index + 1).toString().padStart(2, '0')}
       <span className="text-[12px] font-light text-[#D1D5DB] mx-[4px]">|</span>
       {etapa.nome}
     </span>
   );
 };
 
 // Filtrar etapas baseado na busca para Fases
 const etapasFiltradosForFases = kanbanData.etapas
   .filter(etapa => etapa.parentId === selectedProductForFases)
   .filter(etapa => etapa.nome.toLowerCase().includes(searchEtapaFases.toLowerCase()));

  // Função específica para obter quantidade de clientes por etapa no kanban
 const getClientCountForEtapa = (etapa: KanbanItem) => {
   // Simular quantidade baseada na etapa
   const counts: { [key: string]: number } = {
     'etapa-1': 28,
     'etapa-2': 17,
     'etapa-3': 23,
     'etapa-4': 12
   };
   return counts[etapa.id] || Math.floor(Math.random() * 30) + 5;
 };

  // Função específica para obter quantidade de clientes por fase no kanban
 const getClientCountForFase = (fase: KanbanItem) => {
   // Simular quantidade baseada na fase
   const counts: { [key: string]: number } = {
     'fase-1': 12,
     'fase-2': 8,
     'fase-3': 15,
     'fase-4': 6
   };
   return counts[fase.id] || Math.floor(Math.random() * 20) + 3;
 };

  // Função para calcular total de clientes de todos os produtos
 const getTotalClientsAllProducts = () => {
   if (activeTab !== 'produtos') return 0;
   const produtos = getActiveTabData();
   return produtos.reduce((total, produto) => total + getClientCountForProduct(produto), 0);
 };

  // Animação de abertura/fechamento
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Carregar dados salvos do localStorage
      const savedData = localStorage.getItem('kanban_data');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setKanbanData(parsedData);
        } catch (error) {
          console.error('Erro ao carregar dados do kanban:', error);
        }
      }
    }
  }, [isOpen]);

  // Reset seleções quando mudar de aba
  useEffect(() => {
    if (activeTab === 'etapas') {
      setSelectedEtapa('');
    }
    if (activeTab === 'fases') {
      if (!selectedProduct) {
        setSelectedEtapa('');
      }
    }
  }, [activeTab, selectedProduct]);

  // Salvar dados automaticamente quando houver mudanças
  useEffect(() => {
    if (isOpen && kanbanData) {
      localStorage.setItem('kanban_data', JSON.stringify(kanbanData));
    }
  }, [kanbanData, isOpen]);
  
   // Fechar dropdown de produtos quando clicar fora
 useEffect(() => {
   const handleClickOutsideDropdown = (event: MouseEvent) => {
     if (
       produtoDropdownRef.current && 
       !produtoDropdownRef.current.contains(event.target as Node)
     ) {
       setShowProdutoDropdown(false);
     }
   };

   document.addEventListener('mousedown', handleClickOutsideDropdown);
   return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
 }, []);

 // Fechar dropdown de produtos da aba Fases quando clicar fora
 useEffect(() => {
   const handleClickOutsideDropdownFases = (event: MouseEvent) => {
     if (
       produtoDropdownFasesRef.current && 
       !produtoDropdownFasesRef.current.contains(event.target as Node)
     ) {
       setShowProdutoDropdownFases(false);
     }
   };

   document.addEventListener('mousedown', handleClickOutsideDropdownFases);
   return () => document.removeEventListener('mousedown', handleClickOutsideDropdownFases);
 }, []);

 // Limpar busca quando dropdown fecha  
 useEffect(() => {
   if (!showProdutoDropdown) {
     setSearchProduto('');
   }
 }, [showProdutoDropdown]);

 // Limpar busca quando dropdown da aba Fases fecha  
 useEffect(() => {
   if (!showProdutoDropdownFases) {
     setSearchProdutoFases('');
   }
 }, [showProdutoDropdownFases]);
 
  // Fechar dropdown de etapas da aba Fases quando clicar fora
 useEffect(() => {
   const handleClickOutsideEtapaDropdownFases = (event: MouseEvent) => {
     if (
       etapaDropdownFasesRef.current && 
       !etapaDropdownFasesRef.current.contains(event.target as Node)
     ) {
       setShowEtapaDropdownFases(false);
     }
   };

   document.addEventListener('mousedown', handleClickOutsideEtapaDropdownFases);
   return () => document.removeEventListener('mousedown', handleClickOutsideEtapaDropdownFases);
 }, []);

 // Limpar busca quando dropdown de etapas da aba Fases fecha  
 useEffect(() => {
   if (!showEtapaDropdownFases) {
     setSearchEtapaFases('');
   }
 }, [showEtapaDropdownFases]);


  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Função para obter dados filtrados da aba ativa
  const getActiveTabData = (): KanbanItem[] => {
    const allData = kanbanData[activeTab] || [];
    
    if (activeTab === 'produtos') {
      return allData;
    }
    
    if (activeTab === 'etapas') {
      return selectedProduct ? allData.filter(item => item.parentId === selectedProduct) : [];
    }
    
    if (activeTab === 'fases') {
	  return selectedEtapaForFases ? allData.filter(item => item.parentId === selectedEtapaForFases) : [];
    }
    
    return allData;
  };

  // Função para atualizar dados da aba ativa e salvar no localStorage
  const updateActiveTabData = (newData: KanbanItem[]) => {
    const updatedKanbanData = {
      ...kanbanData,
      [activeTab]: newData
    };
    setKanbanData(updatedKanbanData);
  };

  // Função para reordenar itens
  const reorderItems = (items: KanbanItem[]): KanbanItem[] => {
    return items.map((item, index) => ({
      ...item,
      ordem: index + 1
    }));
  };

  // Função para verificar se pode adicionar item
  const canAddItem = () => {
    if (activeTab === 'produtos') return true;
    if (activeTab === 'etapas') return !!selectedProduct;
    if (activeTab === 'fases') return !!(selectedProductForFases && selectedEtapaForFases);
    return false;
  };

  // Drag and Drop handlers - copiando EXATAMENTE do Modal-MenuTitulos.tsx
  const handleDragStart = (e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem) return;
    
    const items = getActiveTabData();
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    
    if (draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }
    
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const items = getActiveTabData();
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    
   // Lógica correta: ajustar índice quando arrastamos para baixo
   let insertIndex = targetIndex;
   if (draggedIndex < targetIndex) {
     insertIndex = targetIndex - 1;
   }
   
   insertIndex = insertIndex > newItems.length ? newItems.length : insertIndex;

    newItems.splice(insertIndex, 0, removed);

    // Reordenar e atualizar
    const reorderedItems = reorderItems(newItems);
    updateActiveTabData(reorderedItems);
    
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDropAtEnd = (e: React.DragEvent) => {
    handleDrop(e, getActiveTabData().length);
  };

  // Handlers para edição
  const handleEditItem = (item: KanbanItem) => {
    setEditingItem(item);
    setNewItemName(item.nome);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (item: KanbanItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const items = getActiveTabData();
    const filteredItems = items.filter(item => item.id !== itemToDelete.id);
    const reorderedItems = reorderItems(filteredItems);
    
    updateActiveTabData(reorderedItems);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Handlers para adição/edição de itens
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setNewItemName('');
    setIsAddModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!newItemName.trim()) return;

    const items = getActiveTabData();

    if (isEditMode && editingItem) {
      const updatedItems = items.map(item =>
        item.id === editingItem.id
          ? { ...item, nome: newItemName.trim() }
          : item
      );
      updateActiveTabData(updatedItems);
    } else {
      let parentId = undefined;
      if (activeTab === 'etapas') {
        parentId = selectedProduct;
      } else if (activeTab === 'fases') {
        parentId = selectedEtapaForFases;
      }

      const newItem: KanbanItem = {
        id: `${activeTab}-${Date.now()}`,
        nome: newItemName.trim(),
        ordem: items.length + 1,
        isActive: true,
        parentId
      };
      updateActiveTabData([...items, newItem]);
    }

    setIsAddModalOpen(false);
    setNewItemName('');
    setEditingItem(null);
    setIsEditMode(false);
  };

 // Função para capitalizar primeira letra
 const capitalizeFirstLetter = (text: string): string => {
   if (!text) return text;
   return text.charAt(0).toUpperCase() + text.slice(1);
 };

 // Handler para input com capitalização automática
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const value = e.target.value;
   const capitalizedValue = capitalizeFirstLetter(value);
   setNewItemName(capitalizedValue);
 };

  // Função para salvar alterações
  const handleSaveChanges = () => {
    console.log('Salvando alterações:', kanbanData);
    handleClose();
  };

  // Componente do Card individual - Simplificado
  const ItemCard: React.FC<{ item: KanbanItem; index: number }> = ({ item, index }) => {
    // Calcular número do item baseado na posição atual
    const itemNumber = (index + 1).toString().padStart(2, '0');

    return (
      <div
        className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 hover:shadow-md"
      >
        {/* Ícone de arrastar */}
        <GripVerticalIcon size={18} className="text-[#91929E] transition-colors flex-shrink-0" />
        
        {/* Conteúdo do card */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Número do item */}
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs text-gray-600 bg-[#1777CF] bg-opacity-10 transition-colors">
            {itemNumber}
          </span>
          
          {/* Nome do item */}
          <span 
            className="text-sm font-medium text-gray-900 flex-1 truncate min-w-0"
            title={item.nome}
          >
            {item.nome}
          </span>
        </div>

        {/* Botões de ação - sempre visíveis */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleEditItem(item);
            }}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Editar"
          >
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
             <path d="m18.5 2.5 a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
           </svg>

          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteItem(item);
            }}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Excluir"
          >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <polyline points="3,6 5,6 21,6"/>
             <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
           </svg>

          </button>
        </div>
      </div>
    );
  };

  // Menu Card Component
  const MenuCard = ({ 
    id, 
    icon: IconComponent, 
    title, 
    isActive, 
    onClick 
  }: {
    id: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl transition-all duration-300 p-4 gap-2 h-full w-full ${
        isActive 
          ? 'bg-white border border-[#1777CF] shadow-sm' 
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className={`rounded-lg flex items-center justify-center transition-all duration-300 w-11 h-11 ${
        isActive 
          ? 'bg-[#1777CF] bg-opacity-10' 
          : 'bg-gray-100'
      }`}>
        <IconComponent 
          size={18} 
          className={`transition-all duration-300 ${
            isActive ? 'text-[#1777CF]' : 'text-gray-500'
          }`} 
        />
      </div>
      <span className="text-xs font-medium transition-all duration-300 text-center leading-tight text-gray-600">
        {title}
      </span>
    </button>
  );

  if (!isOpen) return null;

  return (
    <>
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
        .modern-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        
        /* Drag and Drop feedback */
        .dragging {
          opacity: 0.5;
          transform: rotate(2deg);
        }
        
        .drag-over {
          border-color: #1777CF !important;
          border-width: 2px !important;
          background-color: rgba(0, 122, 255, 0.05) !important;
        }
      `}</style>

      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? 'bg-black bg-opacity-40' : 'bg-transparent'
      }`}>
        
        <div
          ref={modalRef}
          className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl mx-4 h-[calc(100vh-20px)] flex flex-col transform transition-all duration-300 ${
            isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Header Principal - Largura Completa */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="w-10"></div>

            {/* Título Centralizado */}
            <h3 className="text-xl font-semibold text-gray-800">
              Gerenciamento do Kanban
            </h3>

            {/* Botão Fechar à Direita */}
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Área Principal: Menu + Conteúdo com Espaçamentos */}
          <div className="flex flex-1 p-[10px] gap-[10px]">
            
            {/* Menu Lateral Esquerdo - Design ajustado com espaçamentos adequados */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl flex flex-col border border-gray-200 shadow-sm h-full" style={{ width: '160px' }}>
              
              {/* Menu Cards - Distribuição com altura automática e espaçamentos uniformes de 10px */}
              <div className="flex flex-col h-full p-[10px] gap-[10px]">
                
                <div className="flex-1">
                  <MenuCard
                    id="produtos"
                    icon={ProductIcon}
                    title="Produtos"
                    isActive={activeTab === 'produtos'}
                    onClick={() => setActiveTab('produtos')}
                  />
                </div>

                <div className="flex-1">
                  <MenuCard
                    id="etapas"
                    icon={StepsIcon}
                    title="Etapas"
                    isActive={activeTab === 'etapas'}
                    onClick={() => setActiveTab('etapas')}
                  />
                </div>

                <div className="flex-1">
                  <MenuCard
                    id="fases"
                    icon={PhasesIcon}
                    title="Fases"
                    isActive={activeTab === 'fases'}
                    onClick={() => setActiveTab('fases')}
                  />
                </div>

              </div>
            </div>

            {/* Área de Conteúdo Principal */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-w-0">
              
              {/* Conteúdo Principal */}
              <div className="flex-1 px-[15px] pt-[15px] pb-[0px] flex flex-col min-h-0">
                <div className="space-y-[0px] flex flex-col h-full min-h-0">
                  

                  {/* Lista dos Cards */}
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Header fixo */}
                   <div className="flex-shrink-0 flex items-center justify-between mb-4">
                     
					 {activeTab === 'etapas' ? (
                      <div className="flex items-center justify-between w-full">
                        {/* Área Esquerda - Título */}
                        <div className="flex-shrink-0">

 <h2 className="text-lg font-semibold text-gray-800">
Etapas {getActiveTabData().length.toString().padStart(2, '0')}
 </h2>
                        </div>

                        {/* Área Central - Dropdown */}
                        <div className="flex items-center">

<div className="relative w-[300px]" ref={produtoDropdownRef}>
                              <button
                                className="h-[36px] px-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0 w-full"
                                onClick={() => setShowProdutoDropdown(!showProdutoDropdown)}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="truncate block text-left">
                                    <span className="inline-block relative mr-[6px]" style={{ verticalAlign: 'middle', marginTop: '-1px' }} title="Produtos">
                                     <svg width="16" height="13" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer">
                                       <path d="M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355ZM1.17986 13.3565V3.79869C1.17986 3.54157 1.39062 3.3318 1.64897 3.3318L4.60638 3.33519V8.75863V13.8233L1.64897 13.82C1.39062 13.8233 1.17986 13.6136 1.17986 13.3565ZM4.60638 13.8233V8.75863V3.33519H4.26645V13.8233H4.60638ZM13.7302 13.8233V3.33519H13.3902V13.8233H13.7302ZM16.8167 13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902V3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565Z" fill="currentColor"/>
                                       <path d="M4.60638 3.33519L1.64897 3.3318C1.39062 3.3318 1.17986 3.54157 1.17986 3.79869V13.3565C1.17986 13.6136 1.39062 13.8233 1.64897 13.82L4.60638 13.8233M4.60638 3.33519H4.26645V13.8233H4.60638M4.60638 3.33519V8.75863V13.8233M13.3902 3.33519H13.7302V13.8233H13.3902M13.3902 3.33519V13.8233M13.3902 3.33519H16.3476C16.606 3.33519 16.8167 3.54495 16.8167 3.80208V13.3565C16.8167 13.6136 16.606 13.8233 16.3476 13.8233H13.3902M16.351 2.65853H14.8349H13.3902H12.4282V1.64355C12.4282 1.01426 11.9149 0.5 11.2792 0.5H6.71736C6.08508 0.5 5.56839 1.01087 5.56839 1.64355V2.65853H4.60638H3.16167H1.64897C1.0133 2.65853 0.5 3.16941 0.5 3.79869V13.3565C0.5 13.9857 1.0133 14.5 1.64897 14.5H3.16507H4.60978H13.3902H14.8349H16.351C16.9833 14.5 17.5 13.9891 17.5 13.3565V3.79869C17.4966 3.16941 16.9833 2.65853 16.351 2.65853ZM5.91172 3.33519H12.0883H13.0503V13.8233H4.94631V3.33519H5.91172ZM6.25165 1.64355C6.25165 1.38642 6.46241 1.17666 6.72076 1.17666H11.2826C11.541 1.17666 11.7517 1.38642 11.7517 1.64355V2.65853H6.25165V1.64355Z" stroke="currentColor" strokeWidth="0.2"/>
                                     </svg>

                                    </span>
                                    {getSelectedProdutoLabelWithNumber(selectedProduct)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-[0px] flex-shrink-0 ml-[10px]">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6,9 12,15 18,9"/>
                                  </svg>
                                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                      <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                  </div>
                                  <span className="text-[12px] text-[#6B7280] font-medium">
                                    {getClientCountByProduct(selectedProduct).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </button>
                              
                              {showProdutoDropdown && (
                                <div className="absolute top-[40px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[280px] overflow-hidden z-50">
                                  <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <div className="relative">
                                      <input
                                        ref={searchProdutoRef}
                                        type="text"
                                        placeholder="Buscar produtos..."
                                        value={searchProduto}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                                          setSearchProduto(capitalizedValue);
                                        }}
                                        className="w-full h-[32px] pl-[32px] pr-[12px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[6px] text-[#374151] text-[14px] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                                      />
                                      <div className="absolute left-[10px] top-1/2 transform -translate-y-1/2 text-[#9CA3AF]">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="11" cy="11" r="8"/>
                                          <path d="m21 21-4.35-4.35"/>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="my-[5px]">
                                  <div className="max-h-[200px] overflow-y-auto">
                                   <div className="max-h-[200px] overflow-y-auto modern-scrollbar">
                                     {produtosFiltrados.length > 0 ? (
                                       produtosFiltrados.map((produto, index) => (
                                         <div key={produto.value}>
                                           <button
                                             onClick={() => {
                                               setSelectedProduct(produto.value);
                                               setShowProdutoDropdown(false);
                                             }}
                                             className="w-full pl-[10px] py-[10px] text-left hover:bg-[#F3F4F6] transition-colors duration-150 flex items-center justify-between group"
                                           >
                                              <div className="flex items-center gap-[2px] flex-1 min-w-0">
                                                {/* Numeração + pipe juntos */}
                                                <span className="text-[14px] font-medium text-[#6B7280] min-w-[32px]">
                                                  {(index + 1).toString().padStart(2, '0')}<span className="text-[12px] font-light text-[#D1D5DB] ml-[6px]">|</span>
                                                </span>

                                               {/* Nome do produto */}
                                               <span className="text-[14px] font-medium text-[#374151] truncate flex-1">
                                                 {produto.label}
                                               </span>
                                             </div>
                                             {/* Avatar + Número de clientes */}
                                             <div className="flex items-center gap-[4px] flex-shrink-0 ml-[0px]  mr-[10px]">
											   <div className="w-[16px] h-[16px] flex items-center justify-center">
                                               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                 <circle cx="12" cy="7" r="4"/>
                                               </svg>
											    </div>
                                               <span className="text-[14px] text-[#6B7280] font-regular">
                                                 {getClientCountByProduct(produto.value).toString().padStart(2, '0')}
                                               </span>
                                             </div>
                                           </button>
                                           {/* Divisória entre linhas */}
                                           {index < produtosFiltrados.length - 1 && (
                                             <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                           )}
                                         </div>
                                       ))
                                     ) : (
                                       <div className="p-[16px] text-center text-[#6B7280] text-[14px] font-inter">
                                         Nenhum produto encontrado
                                       </div>
                                     )}
                                   </div>
 </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            </div>

                        {/* Área Direita - Botão */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={handleOpenAddModal}
                            disabled={!selectedProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#0056CC] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>

                            Criar nova etapa
                          </button>
                        </div>
                        </div>
					 
					    ) : activeTab === 'fases' ? (
                       /* Layout específico para aba Fases - tudo em uma linha */
                        
						<div className="flex items-center justify-between w-full">
                        {/* Área Esquerda - Título */}

                         {/* Título Fases */}
                         <h2 className="text-lg font-semibold text-gray-800 flex-shrink-0">
                           Fases {getActiveTabData().length.toString().padStart(2, '0')}
                         </h2>

                        {/* Área Central - Dropdowns */}
                        <div className="flex items-center gap-4">

                         {/* Dropdown Produto para Fases */}
                         <div className="relative w-[280px]" ref={produtoDropdownFasesRef}>
                           <button
                             className="h-[36px] px-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0 w-full"
                             onClick={() => setShowProdutoDropdownFases(!showProdutoDropdownFases)}
                           >
                             <div className="flex-1 min-w-0">
                               <span className="truncate block text-left">
                                 <span className="inline-block relative mr-[6px]" style={{ verticalAlign: 'middle', marginTop: '-1px' }}>
                                   <ProductIcon size={16} />
                                 </span>
                                 {getSelectedProdutoLabelWithNumberForFases(selectedProductForFases)}
                               </span>
                             </div>
                             <div className="flex items-center gap-[0px] flex-shrink-0 ml-[10px]">
                               <ChevronDownIcon size={14} />
                               <div className="w-[20px] h-[20px] flex items-center justify-center">
                                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                   <circle cx="12" cy="7" r="4"/>
                                 </svg>
                               </div>
                               <span className="text-[12px] text-[#6B7280] font-medium">
                                 {selectedProductForFases ? getClientCountByProduct(selectedProductForFases).toString().padStart(2, '0') : '00'}
                               </span>
                             </div>
                           </button>
                           
                           {showProdutoDropdownFases && (
                             <div className="absolute top-[40px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[280px] overflow-hidden z-50">
                               <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                 <div className="relative">
                                   <input
                                     ref={searchProdutoFasesRef}
                                     type="text"
                                     placeholder="Buscar produtos..."
                                     value={searchProdutoFases}
                                     onChange={(e) => {
                                       const value = e.target.value;
                                       const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                                       setSearchProdutoFases(capitalizedValue);
                                     }}
                                     className="w-full h-[32px] pl-[32px] pr-[12px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[6px] text-[#374151] text-[14px] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                                   />
                                   <div className="absolute left-[10px] top-1/2 transform -translate-y-1/2 text-[#9CA3AF]">
                                     <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <circle cx="11" cy="11" r="8"/>
                                       <path d="m21 21-4.35-4.35"/>
                                     </svg>
                                   </div>
                                 </div>
                               </div>
                               <div className="my-[5px]">
                                 <div className="max-h-[200px] overflow-y-auto modern-scrollbar">
                                   {produtosFiltradosForFases.length > 0 ? (
                                     produtosFiltradosForFases.map((produto, index) => (
                                       <div key={produto.value}>
                                         <button
                                           onClick={() => {
                                             setSelectedProductForFases(produto.value);
                                             setSelectedEtapaForFases('');
                                             setShowProdutoDropdownFases(false);
                                           }}
                                           className="w-full pl-[10px] py-[10px] text-left hover:bg-[#F3F4F6] transition-colors duration-150 flex items-center justify-between group"
                                         >
                                           <div className="flex items-center gap-[2px] flex-1 min-w-0">
                                             <span className="text-[14px] font-medium text-[#6B7280] min-w-[32px]">
                                               {(index + 1).toString().padStart(2, '0')}<span className="text-[12px] font-light text-[#D1D5DB] ml-[6px]">|</span>
                                             </span>
                                             <span className="text-[14px] font-medium text-[#374151] truncate flex-1">
                                               {produto.label}
                                             </span>
                                           </div>
                                           <div className="flex items-center gap-[4px] flex-shrink-0 ml-[0px] mr-[10px]">
                                             <div className="w-[16px] h-[16px] flex items-center justify-center">
                                               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                 <circle cx="12" cy="7" r="4"/>
                                               </svg>
                                             </div>
                                             <span className="text-[14px] text-[#6B7280] font-regular">
                                               {getClientCountByProduct(produto.value).toString().padStart(2, '0')}
                                             </span>
                                           </div>
                                         </button>
                                         {index < produtosFiltradosForFases.length - 1 && (
                                           <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                         )}
                                       </div>
                                     ))
                                   ) : (
                                     <div className="p-[16px] text-center text-[#6B7280] text-[14px] font-inter">
                                       Nenhum produto encontrado
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>

                         {/* Dropdown Etapa para Fases */}
                         <div className="relative w-[280px]">
                          <div className="relative" ref={etapaDropdownFasesRef}>
                            <button
                              className="h-[36px] px-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] text-[#374151] font-medium text-[14px] flex items-center hover:border-[#1777CF] focus:border-[#1777CF] focus:outline-none focus:ring-0 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                              onClick={() => selectedProductForFases && setShowEtapaDropdownFases(!showEtapaDropdownFases)}
                              disabled={!selectedProductForFases}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="truncate block text-left">
                                  <span className="inline-block relative mr-[6px]" style={{ verticalAlign: 'middle', marginTop: '-1px' }}>
                                    <StepsIcon size={16} />
                                  </span>
                                  {getSelectedEtapaLabelWithNumberForFases(selectedEtapaForFases)}
                                </span>
                              </div>
                              <div className="flex items-center gap-[0px] flex-shrink-0 ml-[10px]">
                                <ChevronDownIcon size={14} />
                                <div className="w-[20px] h-[20px] flex items-center justify-center ml-[6px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                </div>
                                <span className="text-[12px] text-[#6B7280] font-medium">
                                  {selectedEtapaForFases ? getClientCountForEtapa(kanbanData.etapas.find(e => e.id === selectedEtapaForFases) || {} as KanbanItem).toString().padStart(2, '0') : '00'}
                                </span>

                              </div>
                            </button>
                            
                            {showEtapaDropdownFases && selectedProductForFases && (
                              <div className="absolute top-[40px] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[280px] overflow-hidden z-50">
                                <div className="p-[12px] border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                  <div className="relative">
                                    <input
                                      ref={searchEtapaFasesRef}
                                      type="text"
                                      placeholder="Buscar etapas..."
                                      value={searchEtapaFases}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                                        setSearchEtapaFases(capitalizedValue);
                                      }}
                                      className="w-full h-[32px] pl-[32px] pr-[12px] bg-[#FFFFFF] border border-[#D1D5DB] rounded-[6px] text-[#374151] text-[14px] placeholder-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#1777CF]"
                                    />
                                    <div className="absolute left-[10px] top-1/2 transform -translate-y-1/2 text-[#9CA3AF]">
                                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="m21 21-4.35-4.35"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="my-[5px]">
                                  <div className="max-h-[200px] overflow-y-auto modern-scrollbar">
                                    {etapasFiltradosForFases.length > 0 ? (
                                      etapasFiltradosForFases.map((etapa, index) => (
                                        <div key={etapa.id}>
                                          <button
                                            onClick={() => {
                                              setSelectedEtapaForFases(etapa.id);
                                              setShowEtapaDropdownFases(false);
                                            }}
                                            className="w-full pl-[10px] py-[10px] text-left hover:bg-[#F3F4F6] transition-colors duration-150 flex items-center justify-between group"
                                          >
                                            <div className="flex items-center gap-[2px] flex-1 min-w-0">
                                              <span className="text-[14px] font-medium text-[#6B7280] min-w-[32px]">
                                                {(index + 1).toString().padStart(2, '0')}<span className="text-[12px] font-light text-[#D1D5DB] ml-[6px]">|</span>
                                              </span>
                                              <span className="text-[14px] font-medium text-[#374151] truncate flex-1">
                                                {etapa.nome}
                                              </span>
                                            </div>
                                           <div className="flex items-center gap-[4px] flex-shrink-0 ml-[0px] mr-[10px]">
                                             <div className="w-[16px] h-[16px] flex items-center justify-center">
                                               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                 <circle cx="12" cy="7" r="4"/>
                                               </svg>
                                             </div>
                                             <span className="text-[14px] text-[#6B7280] font-regular">
                                               {getClientCountForEtapa(etapa).toString().padStart(2, '0')}
                                             </span>
                                           </div>

                                          </button>
                                          {index < etapasFiltradosForFases.length - 1 && (
                                            <div className="h-[1px] bg-[#F3F4F6] my-[4px] mx-[12px]"></div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-[16px] text-center text-[#6B7280] text-[14px] font-inter">
                                        Nenhuma etapa encontrada
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                         </div>
						 
                         </div>
                        {/* Área Direita - Botão */}
                        <div className="flex-shrink-0">

                         {/* Botão Criar Nova Fase */}
                         <button
                           onClick={handleOpenAddModal}
                           disabled={!selectedEtapaForFases}
                           className="flex items-center gap-2 px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#0056CC] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                         >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                           Criar nova fase
                         </button>
						 </div>
                       </div>
                     ) : (

                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {activeTab === 'produtos' 
                            ? `Produtos ${getActiveTabData().length.toString().padStart(2, '0')}`
                            : `Lista dos ${activeTab}`
                          }
                        </h2>
                        {activeTab === 'produtos' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-medium text-gray-500">|</span>
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              <span className="text-lg font-semibold text-gray-800">
                                {getTotalClientsAllProducts()}
                              </span>
                            </div>
                          </div>
                        )}
						                        {activeTab === 'etapas' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-medium text-gray-500">|</span>
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              <span className="text-lg font-semibold text-gray-800">
5
                              </span>
                            </div>
                          </div>
                        )}

                      </div>
                     )}

                      {canAddItem() && activeTab !== 'fases' && activeTab !== 'etapas' && (
                       <button
                         onClick={handleOpenAddModal}
                         className="flex items-center gap-2 px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#0056CC] transition-colors"
                       >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                         Criar nov{activeTab === 'produtos' ? 'o produto' : activeTab === 'etapas' ? 'a etapa' : 'a fase'}
                       </button>
                     )}

                    </div>

                    {/* Container dos Cards com altura controlada e scroll */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-[10px] mb-[0px]" style={{ height: activeTab === 'produtos' ? 'calc(100vh - 284px)' : activeTab === 'etapas' ? 'calc(100vh - 284px)' : 'calc(100vh - 284px)', minHeight: '300px' }}> 
<div className="h-full overflow-y-auto modern-scrollbar pr-[10px]">
                        {(activeTab === 'produtos' || (activeTab === 'etapas' && selectedProduct) || (activeTab === 'fases' && selectedEtapaForFases)) ? (
                         getActiveTabData().length > 0 ? (
                          <div className="space-y-[10px]">
                            {getActiveTabData().map((item, index) => (
                              <React.Fragment key={item.id}>
                                {draggedItem && dragOverIndex === index && (
                                  <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                                )}
                                
                                <div
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, index)}
                                  onDragEnd={handleDragEnd}
                                  className={`group flex items-center gap-3 p-3 bg-white border rounded-lg transition-all duration-200 cursor-move select-none ${
                                    draggedItem?.id === item.id ? 'opacity-40 scale-95 rotate-1' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                  }`}
                                >
                                  {/* Ícone de arrastar */}
                                 <GripVerticalIcon size={18} className="text-[#91929E] transition-colors flex-shrink-0" />
                                  
                                  {/* Conteúdo do card */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Número do item */}
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs text-gray-600 bg-[#1777CF] bg-opacity-5 transition-colors">
                                      {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    
                                    {/* Nome do item */}
                                    <span 
                                      className="text-sm font-medium text-gray-900 flex-1 truncate min-w-0"
                                      title={item.nome}
                                    >
                                      {item.nome}
                                    </span>
                                  </div>

                                  {/* Botões de ação - sempre visíveis */}
                                   <div className="flex items-center gap-3">
                                    {/* Indicador de clientes - para produtos e etapas */}
                                    {(activeTab === 'produtos' || activeTab === 'etapas' || activeTab === 'fases') && (
                                      <div className="flex items-center gap-1">
                                        {/* Avatar ícone */}
                                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                          </svg>
                                        </div>
                                        {/* Número de clientes */}
                                        <span className="text-[14px] text-[#6B7280] font-medium">
                                      {activeTab === 'produtos' ? getClientCountForProduct(item).toString().padStart(2, '0') :
                                          activeTab === 'etapas' ? getClientCountForEtapa(item).toString().padStart(2, '0') :
                                          getClientCountForFase(item).toString().padStart(2, '0')}

                                        </span>
                                      </div>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleEditItem(item);
                                      }}
                                      className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                      title="Editar"
                                    >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                       <path d="m18.5 2.5 a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                     </svg>

                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleDeleteItem(item);
                                      }}
                                      className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                      title="Excluir"
                                    >
                                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <polyline points="3,6 5,6 21,6"/>
                                       <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                     </svg>

                                    </button>
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}
                            
                           {/* Indicador visual para drop no final */}
                           {draggedItem && dragOverIndex === getActiveTabData().length && (
                             <div className="h-1 bg-[#1777CF] rounded-full transition-all duration-200"></div>
                           )}
                           
                           {/* Área de drop no final - invisível mas funcional */}
                           {draggedItem && (
                             <div
                               onDragOver={(e) => {
                                 e.preventDefault();
                                 e.dataTransfer.dropEffect = 'move';
                                 handleDragOver(e, getActiveTabData().length);
                               }}
                               onDrop={handleDropAtEnd}
                               className="h-8 w-full"
                             />
                           )}

                            {/* Área de drop no final */}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-[#1777CF] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                               {activeTab === 'etapas' ? (
                                 <ProductIcon size={24} className="text-gray-400" />
                               ) : activeTab === 'fases' && selectedProductForFases ? (
                                 <PhasesIcon size={24} className="text-gray-400" />
                               ) : (
                                 <ProductIcon size={24} className="text-gray-400" />
                               )}


                              </div>
                              <p className="text-gray-500 text-sm">
                               {activeTab === 'produtos' && 'Nenhum produto cadastrado'}
                               {activeTab === 'etapas' && 'Nenhuma etapa cadastrada'}
                               {activeTab === 'fases' && 'Nenhuma fase cadastrada'}
                             </p>
                             <p className="text-gray-400 text-xs mt-1">
                               Clique em "Criar nov{activeTab === 'produtos' ? 'o produto' : activeTab === 'etapas' ? 'a etapa' : 'a fase'}" para começar
                             </p>
                            </div>
                          </div>
                        )
                       ) : (
                         /* Interface de backdrop quando nenhum produto/etapa selecionado */
                         <div className="h-full flex items-center justify-center">
                           <div className="text-center">
                             <div className="w-16 h-16 bg-[#1777CF] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                              {activeTab === 'etapas' ? (
                                <ProductIcon size={24} className="text-gray-400" />
                              ) : activeTab === 'fases' && selectedProductForFases && !selectedEtapaForFases ? (
                                <StepsIcon size={24} className="text-gray-400" />
                              ) : activeTab === 'fases' && selectedProductForFases && selectedEtapaForFases ? (
                                <PhasesIcon size={24} className="text-gray-400" />
                              ) : (
                                <ProductIcon size={24} className="text-gray-400" />
                              )}

                             </div>
                             <p className="text-gray-500 text-sm">
                               {activeTab === 'etapas' && 'Selecione um produto'}
                               {activeTab === 'fases' && !selectedProductForFases && 'Selecione um produto'}
                               {activeTab === 'fases' && selectedProductForFases && !selectedEtapaForFases && 'Selecione uma etapa'}
                             </p>
                             <p className="text-gray-400 text-xs mt-1">
                               {activeTab === 'etapas' && 'Escolha um produto para gerenciar suas etapas'}
                               {activeTab === 'fases' && !selectedProductForFases && 'Escolha um produto para gerenciar suas fases'}
                               {activeTab === 'fases' && selectedProductForFases && !selectedEtapaForFases && 'Escolha uma etapa para gerenciar suas fases'}
                             </p>
                           </div>
                         </div>
                       )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa Inferior Fixa - Apenas na área de conteúdo */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-6 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#0056CC] transition-all duration-200 shadow-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Adição/Edição */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditMode ? `Editar ${activeTab.slice(0, -1)}` : `Criar nov${activeTab === 'produtos' ? 'o produto' : activeTab === 'etapas' ? 'a etapa' : 'a fase'}`}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome d{activeTab === 'produtos' ? 'o produto' : activeTab === 'etapas' ? 'a etapa' : 'a fase'}
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1777CF] focus:border-transparent"
                placeholder={`Digite o nome d${activeTab === 'produtos' ? 'o produto' : activeTab === 'etapas' ? 'a etapa' : 'a fase'}`}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1777CF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditMode ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir "{itemToDelete.nome}"? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </> 
  ); 
};