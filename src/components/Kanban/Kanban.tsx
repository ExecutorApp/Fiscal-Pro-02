import React, { useState, useRef, useEffect } from 'react'
import ModalComentarios from './Modal-Comentarios';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent, 
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  rectIntersection,
  closestCenter,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { ModalEditar } from './Modal-Editar';
import ModalMenuTitulos from './Modal-MenuTitulos';
import { ClientCard } from './Card';
import CadastrarLeads from '../CadastrarLeads';
import { CruzamentoDeDados } from '../CruzamentoDeDados';
import { ModalHistoricoCliente } from './Modal-HistoricoCliente';

// Função utilitária para classes CSS
function cn(...inputs: any[]): string {
  const clsx = (...inputs: any[]) => {
    const classes = [];
    for (const input of inputs) {
      if (typeof input === 'string') {
        classes.push(input);
      } else if (Array.isArray(input)) {
        classes.push(...input);
      } else if (typeof input === 'object' && input !== null) {
        for (const key in input) {
          if (input[key]) {
            classes.push(key);
          }
        }
      }
    }
    return classes.join(' ');
  };
  
  return clsx(...inputs);
}

// Tipos e Interfaces
type Status = {
  id: string;
  name: string;
  color: string;
};

type Lead = {
  id: string;
  name: string;
  assignedTo: string;
  whatsapp: string;
  avatarSrc: string;
  avatarBorderSrc: string;
  status: Status;
  columnEntryDate: Date;
};

type ActiveData = {
  type: 'card' | 'column';
  data: Lead | Status;
} | null;

// Componente Header da Coluna
const KanbanHeader: React.FC<{
  status: Status;
  columnIndex: number;
  cardCount: number;
  className?: string;
  onMenuClick: (columnId: string) => void;
  dragHandleProps?: any;
  isDraggingColumn?: boolean;
}> = ({ status, columnIndex, cardCount, className, onMenuClick, dragHandleProps, isDraggingColumn }) => {
  const columnNumber = (columnIndex + 1).toString().padStart(2, '0');
   
  return (
    <div 
      className={cn(
        'flex shrink-0 items-center justify-between px-[16px] py-[12px] bg-white rounded-t-[16px] shadow-[0px_2px_8px_rgba(0,0,0,0.08)] border-b border-[#E5E7EB]',
        dragHandleProps && 'cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors duration-200',
        isDraggingColumn && 'cursor-grabbing',
        className
      )}
      {...dragHandleProps}
      title={dragHandleProps ? "Arraste para reordenar colunas" : undefined}
    >
      <div className="flex items-center gap-[12px] min-w-0 flex-1 mr-[10px]">
        <div className="flex items-center gap-[8px] min-w-0 flex-1">
          <span className="font-bold text-[14px] text-[#000000] flex-shrink-0">{columnNumber}</span>
          <div className="w-[2px] h-[14px] bg-[#6B7280] flex-shrink-0"></div> 
          <div className="flex items-center gap-[2px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] flex-shrink-0">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[14px] text-[#6B7280] flex-shrink-0">{cardCount.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-[#6B7280] flex-shrink-0">-</span>
          <span 
            className="text-[14px] font-medium text-[#000000] leading-[16px] tracking-[-0.01em] truncate min-w-0"
            title={status.name}
          >
            {status.name}
          </span>
        </div>
      </div>

      <button 
        onClick={() => onMenuClick(status.id)}
        className="p-[6px] hover:bg-[#F3F4F6] rounded-[6px] transition-all duration-200 hover:scale-[1.1] active:scale-[0.95] flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="8" r="1.5" fill="#6B7280"/>
          <circle cx="8" cy="8" r="1.5" fill="#6B7280"/>
          <circle cx="13" cy="8" r="1.5" fill="#6B7280"/>
        </svg>
      </button>
    </div>
  );
};

// Componente Card Sortable com Indicadores Centralizados
const SortableClientCard: React.FC<{
  id: string;
  name: string;
  assignedTo: string;
  whatsapp: string;
  columnEntryDate: Date;
  avatarSrc: string;
  avatarBorderSrc: string;
  index: number;
  parent: string;
  onMenuClick: (buttonRef: React.RefObject<HTMLButtonElement>) => void;
  dragData: any;
  activeId?: string | null;
  isLast?: boolean;
  insertionIndicator?: {
    columnId: string;
    index: number;
    position: 'before' | 'after';
    type?: 'same-column' | 'cross-column';
  } | null;
}> = ({
  id,
  name,
  whatsapp,
  columnEntryDate,
  index,
  parent,
  onMenuClick,
  dragData,
  insertionIndicator
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: dragData || { type: 'card', index, parent, name, whatsapp },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Verificar se deve mostrar indicador antes ou depois deste card
  const shouldShowBeforeIndicator = insertionIndicator && 
    insertionIndicator.columnId === parent && 
    insertionIndicator.index === index && 
    insertionIndicator.position === 'before';
    
  const shouldShowAfterIndicator = insertionIndicator && 
    insertionIndicator.columnId === parent && 
    insertionIndicator.index === index && 
    insertionIndicator.position === 'after';
  
  return (
    <div className="relative">
      {/* INDICADOR DE INSERÇÃO ANTES DO CARD - CENTRALIZADO */}
      {shouldShowBeforeIndicator && (
        <div 
          className="absolute left-0 right-0 z-30 pointer-events-none"
          style={{  
            top: '-6px',
            transform: insertionIndicator?.type === 'cross-column' ? 'translateY(0px)' : 'translateY(40px)' // Diferente para troca de coluna
          }}
        >
          <div className="mx-[4px] relative"> 
            {/* Barra principal - 3px altura, azul moderno */}
            <div 
              className="bg-[#2563eb] rounded-[2px] shadow-[0px_8px_25px_rgba(37,99,235,0.6)]" 
              style={{ height: '3px' }}
            />
            {/* Ponto central com destaque */}
            <div className="absolute -top-[6px] left-[50%] transform -translate-x-1/2 w-[15px] h-[15px] bg-[#2563eb] rounded-full shadow-[0px_8px_25px_rgba(37,99,235,0.6)] border-3 border-white" />
            {/* Indicadores laterais */}
            <div className="absolute -top-[4px] left-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
            <div className="absolute -top-[4px] right-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
          </div>
        </div>
      )}
      
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        data-card-id={id}
        data-card-index={index}
        data-column-id={parent}
        className="kanban-card"
      >
        <ClientCard
          id={id}
          name={name}
          whatsapp={whatsapp}
          columnEntryDate={columnEntryDate}
          parent={parent}
          onMenuClick={onMenuClick}
          className={isDragging ? 
            'opacity-[0.1] scale-[1.02] shadow-[0px_12px_32px_rgba(23,119,207,0.25)] z-50 border-blue-300 cursor-grabbing' : 
            'cursor-grab'}
        />
      </div>

      {/* INDICADOR DE INSERÇÃO DEPOIS DO CARD - CENTRALIZADO */}
      {shouldShowAfterIndicator && (
        <div 
          className="absolute left-0 right-0 z-30 pointer-events-none"
          style={{ 
            bottom: '-6px',
            transform: insertionIndicator?.type === 'cross-column' ? 'translateY(0px)' : 'translateY(-40px)' // Específico para troca de coluna
          }}
        >
          <div className="mx-[4px] relative">
            {/* Barra principal - 3px altura, azul moderno */}
            <div 
              className="bg-[#2563eb] rounded-[2px] shadow-[0px_8px_25px_rgba(37,99,235,0.6)]" 
              style={{ height: '3px' }}
            />
            {/* Ponto central com destaque */}
            <div className="absolute -top-[6px] left-[50%] transform -translate-x-1/2 w-[15px] h-[15px] bg-[#2563eb] rounded-full shadow-[0px_8px_25px_rgba(37,99,235,0.6)] border-3 border-white" />
            {/* Indicadores laterais */}
            <div className="absolute -top-[4px] left-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
            <div className="absolute -top-[4px] right-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Container dos Cards com Sortable
const KanbanCards: React.FC<{
  children: React.ReactNode;
  className?: string;
  columnId?: string;
  activeType?: 'card' | 'column' | null;
  activeId?: string | null;
  leads?: Lead[];
  insertionIndicator?: {
    columnId: string;
    index: number;
    position: 'before' | 'after';
    type?: 'same-column' | 'cross-column';
  } | null;
}> = ({ children, className, columnId, activeType, leads = [], insertionIndicator }) => {
  const childrenArray = React.Children.toArray(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightPadding, setRightPadding] = useState('10px');

  // Criar array de IDs dos leads para o SortableContext
  const leadIds = leads.map(lead => lead.id);

  // Detectar presença de barra de rolagem vertical
  useEffect(() => {
    const checkScrollbar = () => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        const hasScrollbar = scrollHeight > clientHeight;
        setRightPadding(hasScrollbar ? '6px' : '10px');
      }
    };

    checkScrollbar();
    
    const resizeObserver = new ResizeObserver(checkScrollbar);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children]);

  // Verificar se deve mostrar indicador em coluna vazia
  const shouldShowEmptyIndicator = childrenArray.length === 0 && 
    insertionIndicator && 
    insertionIndicator.columnId === columnId && 
    activeType === 'card';

  return (
    <div 
      ref={containerRef}
      className={cn( 
        'overflow-y-auto modern-scrollbar rounded-b-[16px] py-[0px] pl-[10px] my-[10px] pt-[1px] flex-1 min-h-0',
        className
      )}
      style={{ 
        paddingRight: rightPadding,
        scrollbarWidth: 'thin', 
        scrollbarColor: '#CBD5E1 transparent'
      }}
    >
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
      
      {childrenArray.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-gray-400 text-[14px] relative">
          {/* Indicador para coluna vazia */}
          {shouldShowEmptyIndicator && (
            <div className="absolute top-[12px] left-[4px] right-[4px] z-30 pointer-events-none">
              <div className="relative">
                {/* Barra principal - usa transformação específica para cross-column */}
                <div 
                  className="h-[3px] bg-[#2563eb] rounded-[2px] shadow-[0px_8px_25px_rgba(37,99,235,0.6)]"
                  style={{ 
                    transform: insertionIndicator?.type === 'cross-column' ? 'translateY(0px)' : 'none'
                  }}
                />
                {/* Ponto central com destaque */}
                <div className="absolute -top-[4px] left-[50%] transform -translate-x-1/2 w-[15px] h-[15px] bg-[#1777CF] rounded-full shadow-[0px_8px_25px_rgba(37,99,235,0.6)] border-3 border-white" />
                {/* Indicadores laterais */}
                <div className="absolute -top-[4px] left-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
                <div className="absolute -top-[4px] right-0 w-[5px] h-[11px] bg-[#2563eb] rounded-[2px]" />
              </div>
            </div>
          )}
          Nenhum card nesta coluna
        </div>
      ) : (
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-[10px]">
            {childrenArray}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

// Componente Board da Coluna (volta ao original com drag simples)
const KanbanBoard: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
  status: Status;
  isDragging?: boolean;
  activeType?: 'card' | 'column' | null;
  activeId?: string | null;
  leads?: Lead[];
  insertionIndicator?: {
    columnId: string;
    index: number;
    position: 'before' | 'after';
    type?: 'same-column' | 'cross-column';
  } | null;
}> = ({ id, children, className, status, isDragging, activeType, activeId, leads = [], insertionIndicator }) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id,
    data: { type: 'column', status }
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-${id}`,
    data: { type: 'column', accepts: ['card'] }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Combinar as refs
  const setRefs = (element: HTMLDivElement | null) => {
    setSortableRef(element);
    setDroppableRef(element);
  };

  return (
    <div
      ref={setRefs}
      style={{ 
        height: '100%',
        ...style
      }}
      className={cn(
        'flex flex-col w-[320px] flex-shrink-0 bg-white rounded-[16px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-200',
        isOver && activeType === 'card' && activeId && 'shadow-[0px_16px_64px_rgba(23,119,207,0.2)] border-blue-300 scale-[1.03]',
        isSortableDragging && 'opacity-50 scale-[1.02] shadow-[0px_20px_50px_rgba(23,119,207,0.3)] z-50',
        isDragging && 'opacity-10',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === KanbanHeader) {
            return React.cloneElement(child, {
              ...child.props,
              dragHandleProps: { ...attributes, ...listeners },
              isDraggingColumn: isSortableDragging
            });
          }
          if (React.isValidElement(child) && child.type === KanbanCards) {
            return React.cloneElement(child as any, {
              ...(child.props || {}),
              columnId: id,
              activeType,
              activeId,
              leads: leads,
              insertionIndicator: insertionIndicator
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

// Componente Principal Kanban CORRIGIDO
export const Kanban: React.FC<{
  shouldAddNewColumn?: boolean;
  onColumnAdded?: () => void;
}> = ({ shouldAddNewColumn, onColumnAdded }) => {

  const [statuses, setStatuses] = useState<Status[]>(() => {
    // Carregar colunas salvas do localStorage ou usar padrão
    try {
      const savedColumns = localStorage.getItem('kanban_columns_data');
      if (savedColumns) {
        const parsedData = JSON.parse(savedColumns);
        console.log('✅ Colunas do Kanban carregadas do localStorage:', parsedData.columns);
        return parsedData.columns;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar colunas do localStorage:', error);
    }
    
    // Dados padrão se não houver no localStorage
    const defaultColumns = [
      { id: "column1", name: "01 | Keyman Open", color: "#1777CF" },
      { id: "column2", name: "02 | Keyman Open", color: "#1777CF" },
      { id: "column3", name: "03 | Keyman Open", color: "#1777CF" },
      { id: "column4", name: "04 | Fase teste Open", color: "#1777CF" },
    ];
    console.log('🔄 Usando colunas padrão do Kanban');
    return defaultColumns;
  });

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "lead1",
      name: "Kristin Watson",
      assignedTo: "João Silva",
      whatsapp: "(11) 99876-5432",
      avatarSrc: "/46-1.png",
      avatarBorderSrc: "/borda-1.svg",
      status: statuses[0],
      columnEntryDate: new Date(2025, 6, 10, 9, 15), // 10/07/25 às 09:15
    },
    {
      id: "lead2",
      name: "Brooklyn Simmons",
      assignedTo: "Maria Santos",
      whatsapp: "(11) 95432-1098",
      avatarSrc: "/46-2.png",
      avatarBorderSrc: "/borda-2.svg",
      status: statuses[0],
      columnEntryDate: new Date(2025, 6, 12, 14, 30), // 12/07/25 às 14:30
    },
    {
      id: "lead3",
      name: "Wade Warren",
      assignedTo: "Pedro Costa",
      whatsapp: "(11) 94321-0987",
      avatarSrc: "/46-3.png",
      avatarBorderSrc: "/borda-3.svg",
      status: statuses[0],
      columnEntryDate: new Date(2025, 6, 8, 11, 45), // 08/07/25 às 11:45
    },
    {
      id: "lead4",
      name: "Jane Cooper",
      assignedTo: "Ana Lima",
      whatsapp: "(11) 93210-9876",
      avatarSrc: "/46-4.png",
      avatarBorderSrc: "/borda-4.svg",
      status: statuses[0],
      columnEntryDate: new Date(2025, 6, 8, 12, 0), // 08/07/25 às 12:00
    },
    {
      id: "lead5",
      name: "Albert Flores",
      assignedTo: "Carlos Silva",
      whatsapp: "(11) 91098-7654",
      avatarSrc: "/46-5.png",
      avatarBorderSrc: "/borda-5.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 14, 16, 20), // 14/07/25 às 16:20
    },
    {
      id: "lead6",
      name: "Kathryn Murphy",
      assignedTo: "João Silva",
      whatsapp: "(11) 91098-7654",
      avatarSrc: "/46-6.png",
      avatarBorderSrc: "/borda-6.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 13, 8, 45), // 13/07/25 às 08:45
    },
    {
      id: "lead7",
      name: "Bessie Cooper",
      assignedTo: "Ana Lima",
      whatsapp: "(11) 95432-1098",
      avatarSrc: "/46-7.png",
      avatarBorderSrc: "/borda-7.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 11, 10, 30), // 11/07/25 às 10:30
    },
    {
      id: "lead8",
      name: "Courtney Henry",
      assignedTo: "Maria Santos",
      whatsapp: "(11) 90987-6543",
      avatarSrc: "/46-8.png",
      avatarBorderSrc: "/borda-8.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 15, 14, 15), // 15/07/25 às 14:15
    },
    {
      id: "lead9",
      name: "Leslie Alexander",
      assignedTo: "Pedro Costa",
      whatsapp: "(11) 99876-5432",
      avatarSrc: "/46-9.png",
      avatarBorderSrc: "/borda-9.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 9, 13, 20), // 09/07/25 às 13:20
    },
    {
      id: "lead10",
      name: "Jane Cooper",
      assignedTo: "Carlos Silva",
      whatsapp: "(11) 94321-0987",
      avatarSrc: "/46-10.png",
      avatarBorderSrc: "/borda-10.svg",
      status: statuses[1],
      columnEntryDate: new Date(2025, 6, 16, 11, 50), // 16/07/25 às 11:50
    }
  ]);

  // useEffect para persistir colunas automaticamente no localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        columns: statuses
      };
      localStorage.setItem('kanban_columns_data', JSON.stringify(dataToSave));
      console.log('💾 Colunas do Kanban salvas automaticamente no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar colunas no localStorage:', error);
    }
  }, [statuses]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeData, setActiveData] = useState<ActiveData>(null);
  
  // Estado para controlar o indicador de inserção
  const [insertionIndicator, setInsertionIndicator] = useState<{
    columnId: string;
    index: number;
    position: 'before' | 'after';
    type?: 'same-column' | 'cross-column'; // Novo: distinguir tipos
  } | null>(null);
  
  // Estados para o Modal de Menu de Títulos
  const [isMenuTitulosOpen, setIsMenuTitulosOpen] = useState(false);
  const [selectedColumnForMenu, setSelectedColumnForMenu] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Lead | null>(null);
  
  // Estados para controlar o Modal de Cruzamento de Dados
  const [isCruzamentoModalOpen, setIsCruzamentoModalOpen] = useState(false);
  const [clienteForCruzamento, setClienteForCruzamento] = useState<Lead | null>(null);
  
 // Estados para controlar o Modal de Histórico
 const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
 const [clienteForHistorico, setClienteForHistorico] = useState<Lead | null>(null);
  
   
  // Estados para controlar a Modal de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null);
  const [modalButtonRef, setModalButtonRef] = useState<React.RefObject<HTMLButtonElement> | null>(null);
  
   // Estados para controlar o Modal de Comentários
 const [showModalComentarios, setShowModalComentarios] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const getLeadsByStatus = (statusId: string) => {
    return leads.filter(lead => lead.status.id === statusId);
  };

  // Sistema de detecção de colisão simplificado e robusto
  const customCollisionDetection: CollisionDetection = (args) => {
    // Usar closestCenter para tudo - é mais confiável
    const closestCenterCollisions = closestCenter(args);
    
    // Para colunas, se não há colisão com closestCenter, tentar rectIntersection
    if (args.active.data.current?.type === 'column' && closestCenterCollisions.length === 0) {
      return rectIntersection(args);
    }
    
    return closestCenterCollisions;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setInsertionIndicator(null);

    // Verificar se é um card ou uma coluna
    if (active.data.current?.type === 'card') {
      const draggedLead = leads.find(lead => lead.id === active.id);
      if (draggedLead) {
        setActiveData({ type: 'card', data: draggedLead });
      }
    } else if (active.data.current?.type === 'column') {
      const draggedColumn = statuses.find(status => status.id === active.id);
      if (draggedColumn) {
        setActiveData({ type: 'column', data: draggedColumn });
        console.log('🏗️ Iniciando drag da coluna:', draggedColumn.name);
      }
    }
  };

  // Sistema de handleDragOver SIMPLIFICADO - mais robusto
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setInsertionIndicator(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'card';
    const isOverACard = over.data.current?.type === 'card';
    const isOverAColumn = over.data.current?.type === 'column' || over.id.toString().startsWith('droppable-');

    // Só processar drag de cards - colunas não precisam de indicador complexo
    if (!isActiveACard) return;

    const draggedLead = leads.find(lead => lead.id === activeId);
    if (!draggedLead) return;

    // SEMPRE mostrar indicador quando arrasta sobre card
    if (isOverACard) {
      const overLead = leads.find(lead => lead.id === overId);
      if (overLead) {
        const columnLeads = getLeadsByStatus(overLead.status.id);
        const overIndex = columnLeads.findIndex(lead => lead.id === overId);
        
        const isSameColumn = draggedLead.status.id === overLead.status.id;
        
        const activatorEvent = event.activatorEvent;
        
        if (activatorEvent && 'clientY' in activatorEvent) {
          const mouseY = (activatorEvent.clientY as number) + (event.delta?.y || 0);
          
          const overElement = document.querySelector(`[data-card-id="${overId}"]`);
          if (overElement) {
            const overRect = overElement.getBoundingClientRect();
            const cardMiddle = overRect.top + (overRect.height / 2);
            
            if (mouseY < cardMiddle) {
              setInsertionIndicator({
                columnId: overLead.status.id,
                index: overIndex,
                position: 'before',
                type: isSameColumn ? 'same-column' : 'cross-column'
              });
            } else {
              setInsertionIndicator({
                columnId: overLead.status.id,
                index: overIndex,
                position: 'after',
                type: isSameColumn ? 'same-column' : 'cross-column'
              });
            }
          }
        }
      }
    } 
    // Mostrar indicador quando arrasta sobre coluna diferente
    else if (isOverAColumn) {
      let targetColumnId = overId.toString();
      if (targetColumnId.startsWith('droppable-')) {
        targetColumnId = targetColumnId.replace('droppable-', '');
      }
      
      const columnLeads = getLeadsByStatus(targetColumnId);
      
      if (draggedLead.status.id !== targetColumnId) {
        if (columnLeads.length === 0) {
          setInsertionIndicator({
            columnId: targetColumnId,
            index: 0,
            position: 'before',
            type: 'cross-column'
          });
        } else {
          setInsertionIndicator({
            columnId: targetColumnId,
            index: columnLeads.length - 1,
            position: 'after',
            type: 'cross-column'
          });
        }
      } else {
        setInsertionIndicator(null);
      }
    }
  };

  // Sistema de handleDragEnd CORRIGIDO - foco nas colunas
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🎯 DRAG END:', {
      activeId: active.id,
      overId: over?.id,
      activeType: active.data.current?.type,
      overType: over?.data?.current?.type
    });
    
    setActiveId(null);
    setActiveData(null);
    
    if (!over) {
      setInsertionIndicator(null);
      return;
    }

    // REORDENAÇÃO DE COLUNAS - CORRIGIDA
    if (active.data.current?.type === 'column') {
      const activeIndex = statuses.findIndex(status => status.id === active.id);
      let overIndex = -1;
      
      // Identificar corretamente o índice da coluna de destino
      if (over.data.current?.type === 'column') {
        // Drag direto sobre outra coluna
        overIndex = statuses.findIndex(status => status.id === over.id);
      } else {
        // Drag sobre droppable area - buscar pela coluna correspondente
        const overId = over.id.toString();
        if (overId.startsWith('droppable-')) {
          const columnId = overId.replace('droppable-', '');
          overIndex = statuses.findIndex(status => status.id === columnId);
        } else {
          // Pode ser um card - buscar a coluna do card
          const overLead = leads.find(lead => lead.id === overId);
          if (overLead) {
            overIndex = statuses.findIndex(status => status.id === overLead.status.id);
          }
        }
      }
      
      console.log('📋 Reordenação colunas:', { 
        activeIndex, 
        overIndex, 
        activeColumn: statuses[activeIndex]?.name,
        overColumn: statuses[overIndex]?.name
      });
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setStatuses(statuses => arrayMove(statuses, activeIndex, overIndex));
        console.log('📋 ✅ Colunas reordenadas com sucesso');
      }
      setInsertionIndicator(null);
      return;
    }

    // DRAG DE CARDS (lógica original mantida)
    const draggedLead = leads.find(lead => lead.id === active.id);
    if (!draggedLead) {
      setInsertionIndicator(null);
      return;
    }

    const overId = over.id.toString();

    // CASO 1: Reordenação dentro da mesma coluna (arrasta sobre outro card)
    if (!overId.startsWith('droppable-')) {
      const overLead = leads.find(lead => lead.id === overId);
      if (overLead && draggedLead.status.id === overLead.status.id) {
        const activeIndex = leads.findIndex(lead => lead.id === active.id);
        const overIndex = leads.findIndex(lead => lead.id === over.id);
        
        if (activeIndex !== overIndex) {
          setLeads(leads => arrayMove(leads, activeIndex, overIndex));
        }
        setInsertionIndicator(null);
        return;
      }
    }

    // CASO 2: Usar indicador de inserção se disponível
    if (insertionIndicator) {
      const { columnId, index, position } = insertionIndicator;
      const targetStatus = statuses.find(status => status.id === columnId);
      
      if (targetStatus) {
        let newIndex = index;
        
        if (position === 'after') {
          newIndex = index + 1;
        }
        
        const leadsWithoutActive = leads.filter(lead => lead.id !== draggedLead.id);
        const targetColumnLeads = leadsWithoutActive.filter(lead => lead.status.id === columnId);
        const updatedTargetColumnLeads = [...targetColumnLeads];
        
        updatedTargetColumnLeads.splice(Math.min(newIndex, targetColumnLeads.length), 0, {
          ...draggedLead,
          status: targetStatus,
          columnEntryDate: new Date()
        });
        
        const otherColumnLeads = leadsWithoutActive.filter(lead => lead.status.id !== columnId);
        setLeads([...otherColumnLeads, ...updatedTargetColumnLeads]);
        setInsertionIndicator(null);
        return;
      }
    }

    // CASO 3: Movimento entre colunas (fallback)
    if (overId.startsWith('droppable-')) {
      const targetColumnId = overId.replace('droppable-', '');
      const targetColumn = statuses.find(status => status.id === targetColumnId);
      
      if (targetColumn && draggedLead.status.id !== targetColumn.id) {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === draggedLead.id
              ? { ...lead, status: targetColumn, columnEntryDate: new Date() }
              : lead
          )
        );
        console.log(`🎯 Card movido para coluna: ${targetColumn.name}`);
      }
    } else {
      // Movimento sobre outro card de coluna diferente
      const overLead = leads.find(lead => lead.id === overId);
      if (overLead && draggedLead.status.id !== overLead.status.id) {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === draggedLead.id
              ? { ...lead, status: overLead.status, columnEntryDate: new Date() }
              : lead
          )
        );
      }
    }
    
    setInsertionIndicator(null);
  };



  const handleMoveToColumn = (leadId: string, columnId: string) => {
    const targetColumn = statuses.find(status => status.id === columnId);
    if (!targetColumn) return;

    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId
          ? { 
              ...lead, 
              status: statuses.find(s => s.id === targetColumn.id) || lead.status,
              columnEntryDate: new Date() // Atualiza para data/hora atual
            }
          : lead
      )
    ); 
  };

  // Funções para controlar a Modal de Edição
  const handleOpenModal = (client: Lead, buttonRef: React.RefObject<HTMLButtonElement>) => {
    setSelectedClient(client);
    setModalButtonRef(buttonRef);
    setIsModalOpen(true);
	console.log('🎯 Modal aberto para cliente:', client);
  };
 
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setModalButtonRef(null);

  };
 
  const handleEditClient = () => {
   console.log('?? handleEditClient chamada');
   console.log('?? selectedClient:', selectedClient);

	  
   if (selectedClient) {
	   console.log('✅ Cliente selecionado encontrado, iniciando edição...');
     // Salva o cliente atual antes de fechar o modal
     const clientToEdit = selectedClient;
     
     // Define o cliente para edição e abre o modal IMEDIATAMENTE
     setEditingClient(clientToEdit);
     setIsEditModalOpen(true);
	 console.log('🚀 Modal de edição aberto para cliente:', clientToEdit.name);
     
     // Fecha o modal de contexto após definir a edição
     handleCloseModal();
	    } else {
     console.error('? Nenhum cliente selecionado!');
   }
  };
  
    const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleLeadSaved = (savedLead: any, action: 'create' | 'edit') => {
    if (action === 'edit' && editingClient) {
      // Atualizar o lead na lista
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === editingClient.id
            ? {
                ...lead,
                name: savedLead.name,
                whatsapp: savedLead.whatsapp,
                // Manter outras propriedades do lead original
              }
            : lead
        )
      );
      console.log('? Cliente editado no Kanban');
    }
    };
 
  /*
 --------------------------------------------------------
   Funções: Modal de Cruzamento de Dados (Análise)
 --------------------------------------------------------
 - handleAnalyticsClient: Abre modal de análise com dados do cliente
 - handleCloseCruzamentoModal: Fecha o modal de cruzamento
 */
 const handleAnalyticsClient = () => {
   console.log('?? Abrindo análise de dados para cliente:', selectedClient?.name);
   
   if (selectedClient) {
     // Converter Lead para formato esperado pelo CruzamentoDeDados
     const clienteFormatado = {
       id: parseInt(selectedClient.id),
       name: selectedClient.name,
       photo: selectedClient.avatarSrc,
       whatsapp: selectedClient.whatsapp,
       estado: selectedClient.assignedTo || 'N/A',
       email: '', // Valor padrão se não disponível
       city: '', // Valor padrão se não disponível
       cpfCnpj: '' // Valor padrão se não disponível
     };
     
     setClienteForCruzamento(selectedClient);
     setIsCruzamentoModalOpen(true);
     console.log('?? Modal de cruzamento aberto para:', clienteFormatado.name);
   }
 };
 
 const handleCloseCruzamentoModal = () => {
   setIsCruzamentoModalOpen(false);
   setClienteForCruzamento(null);
   console.log('?? Modal de cruzamento fechado');
 };

 /*
 --------------------------------------------------------
   Funções: Lógica da Próxima Etapa
 --------------------------------------------------------
 - isLastColumnOfCurrentStage: Verifica se é a última coluna da etapa atual
 - getNextStageName: Retorna o nome da próxima etapa
 - handleMoveToNextStage: Move o cliente para a próxima etapa
 */
 const isLastColumnOfCurrentStage = (columnId: string): boolean => {
   // Lógica para determinar se é a última coluna da etapa atual
   // Por enquanto, consideramos que a última coluna é sempre a última do array
   const columnIndex = statuses.findIndex(status => status.id === columnId);
   return columnIndex === statuses.length - 1;
 };
 
 const getNextStageName = (currentColumnId: string): string => {
   // Encontra o índice da coluna atual
   const currentIndex = statuses.findIndex(status => status.id === currentColumnId);
   
   // Se não encontrou ou é a última coluna, retorna um valor padrão
   if (currentIndex === -1 || currentIndex === statuses.length - 1) {
     return '01 | Proposta enviada';
   }
   
   // Retorna o nome da próxima coluna
   return statuses[currentIndex + 1].name;
 };

 const handleMoveToNextStage = () => {
   console.log('?? Movendo cliente para próxima etapa:', selectedClient?.name);
   
   if (selectedClient) {
     // Por enquanto, apenas log - implementar lógica de movimentação depois
     console.log('?? Cliente movido para próxima etapa!');
     alert(`Cliente "${selectedClient.name}" movido para próxima etapa: ${getNextStageName(selectedClient.status.id)}`);
   }
 };

 /*
 --------------------------------------------------------
   Funções: Modal de Histórico do Cliente
 --------------------------------------------------------
 - handleHistoryClient: Abre modal de histórico com dados do cliente
 - handleCloseHistoricoModal: Fecha o modal de histórico
 */
 const handleHistoryClient = () => {
   console.log('?? Abrindo histórico para cliente:', selectedClient?.name);
   
   if (selectedClient) {
     setClienteForHistorico(selectedClient);
     setIsHistoricoModalOpen(true);
     console.log('?? Modal de histórico aberto para:', selectedClient.name);
   }
 };
 
 const handleCloseHistoricoModal = () => {
   setIsHistoricoModalOpen(false);
   setClienteForHistorico(null);
   console.log('?? Modal de histórico fechado');
 };

 // Funções para controlar o Modal de Comentários
 const handleOpenComments = () => {
   setShowModalComentarios(true);
 };
 
 const handleCloseModalComentarios = () => {
   setShowModalComentarios(false);
 };

  const handleDeleteClient = () => {
    if (selectedClient) {
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== selectedClient.id));
    }
    handleCloseModal();
  };
 
  const handleMoveClientToColumn = (columnId: string) => {
    if (selectedClient) {
      handleMoveToColumn(selectedClient.id, columnId);
    }
    handleCloseModal();
  };

  // Função para adicionar nova coluna/etapa
  const addNewColumn = () => {
    // Gerar ID único baseado no timestamp para evitar conflitos
    const timestamp = Date.now();
    const newColumn = {
      id: `column_${timestamp}`,
      name: `Nova Etapa`,
      color: "#1777CF"
    };
   
    setStatuses(prevStatuses => [...prevStatuses, newColumn]);
    console.log('🆕 Nova etapa adicionada e persistida:', newColumn);
   
    // Notificar o componente pai que a coluna foi adicionada
    if (onColumnAdded) {
      onColumnAdded();
    }
  };
 
  // Detectar quando deve adicionar nova coluna
  useEffect(() => {
    if (shouldAddNewColumn) {
      addNewColumn();
    }
  }, [shouldAddNewColumn]);

  // Funções para o Modal de Menu de Títulos
  const handleMenuTitulosOpen = (columnId: string) => {
    setSelectedColumnForMenu(columnId);
    setIsMenuTitulosOpen(true);
  };
   
  const handleMenuTitulosClose = () => {
    setIsMenuTitulosOpen(false);
    setSelectedColumnForMenu(null);
  };
   
  const handleRenameColumn = (columnId: string, newName: string) => {
    setStatuses(prevStatuses => 
      prevStatuses.map(status => 
        status.id === columnId ? { ...status, name: newName } : status
      )
    );
    console.log(`📝 Coluna ${columnId} renomeada para: ${newName}`);
  };
   
  const handleDeleteColumn = (columnId: string) => {
    // Remover a coluna
    setStatuses(prevStatuses => prevStatuses.filter(status => status.id !== columnId));
    // Remover todos os leads dessa coluna
    setLeads(prevLeads => prevLeads.filter(lead => lead.status.id !== columnId));
    console.log(`🗑️ Coluna ${columnId} removida e dados persistidos`);
  };
   
  const handleMoveColumn = (columnId: string, direction: 'up' | 'down') => {
    setStatuses(prevStatuses => {
      const currentIndex = prevStatuses.findIndex(status => status.id === columnId);
      if (currentIndex === -1) return prevStatuses;
      
      const newIndex = direction === 'up' ?
        Math.max(0, currentIndex - 1) : 
        Math.min(prevStatuses.length - 1, currentIndex + 1);
      
      if (currentIndex === newIndex) return prevStatuses;
      
      const newStatuses = [...prevStatuses];
      const [movedColumn] = newStatuses.splice(currentIndex, 1);
      newStatuses.splice(newIndex, 0, movedColumn);
      
      console.log(`↕️ Coluna ${columnId} movida ${direction} e persistida`);
      return newStatuses;
    });
  };
   
  const handleSortCards = (columnId: string, sortType: 'recent' | 'oldest') => {
    setLeads(prevLeads => {
      const columnLeads = prevLeads.filter(lead => lead.status.id === columnId);
      const otherLeads = prevLeads.filter(lead => lead.status.id !== columnId);
      
      const sortedColumnLeads = [...columnLeads].sort((a, b) => {
        const dateA = new Date(a.columnEntryDate).getTime();
        const dateB = new Date(b.columnEntryDate).getTime();
        return sortType === 'recent' ? dateB - dateA : dateA - dateB;
      });
      
      return [...otherLeads, ...sortedColumnLeads];
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Estilos CSS para indicadores funcionais */}
      <style>{`
        .kanban-card {
          position: relative;
        }
        
        .kanban-card:hover {
          transform: translateY(-1px);
        }
        
        .kanban-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      
      <div className="flex-1 min-h-0 pb-[10px]">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={statuses.map(s => s.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-[10px] overflow-x-auto pb-[5px] h-full">
              {statuses.map((status) => {
                const columnLeads = getLeadsByStatus(status.id);
                return (
                  <KanbanBoard
                    key={status.id}
                    id={status.id}
                    status={status}
                    className="flex-shrink-0"
                    activeType={activeData?.type || null}
                    activeId={activeId ? String(activeId) : null}
                    leads={columnLeads}
                    insertionIndicator={insertionIndicator}
                  >
                    <KanbanHeader 
                      status={status} 
                      columnIndex={statuses.findIndex(s => s.id === status.id)}
                      cardCount={columnLeads.length}
                      onMenuClick={handleMenuTitulosOpen} 
                    />
                    <KanbanCards>
                      {columnLeads.map((lead, index) => (
                        <SortableClientCard
                          key={lead.id}
                          id={lead.id}
                          name={lead.name}
                          assignedTo={lead.assignedTo}
                          whatsapp={lead.whatsapp}
                          columnEntryDate={lead.columnEntryDate}
                          avatarSrc={lead.avatarSrc}
                          avatarBorderSrc={lead.avatarBorderSrc}
                          index={index}
                          parent={status.id}
                          onMenuClick={(buttonRef) => handleOpenModal(lead, buttonRef)}
                          dragData={{ type: 'card', lead: lead }}
                          activeId={activeId?.toString() || null}
                          isLast={index === columnLeads.length - 1}
                          insertionIndicator={insertionIndicator}
                        />
                      ))}
                    </KanbanCards>
                  </KanbanBoard>
                );
              })}
            </div>
          </SortableContext>

          {/* Overlay para arrastar com animação suave */}
          <DragOverlay dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeData?.type === 'card' && activeData.data && (
              <div 
                className="rotate-[2deg] scale-[1.05] shadow-[0px_20px_50px_rgba(23,119,207,0.3)]"
                style={{ opacity: 0.9 }}
              >
                <ClientCard
                  id={(activeData.data as Lead).id}
                  name={(activeData.data as Lead).name}
                  assignedTo={(activeData.data as Lead).assignedTo}
                  whatsapp={(activeData.data as Lead).whatsapp}
                  columnEntryDate={(activeData.data as Lead).columnEntryDate}
                  avatarSrc={(activeData.data as Lead).avatarSrc}
                  avatarBorderSrc={(activeData.data as Lead).avatarBorderSrc}
                  parent={(activeData.data as Lead).status.id}
                  onMenuClick={() => {}}
                  className="cursor-grabbing shadow-[0px_20px_50px_rgba(23,119,207,0.4)] border-blue-300"
                />
              </div>
            )}
            {activeData?.type === 'column' && activeData.data && (
              <div 
                className="rotate-[1deg] scale-[1.02] shadow-[0px_25px_60px_rgba(23,119,207,0.4)] opacity-95"
              >
                <div className="w-[320px] bg-white rounded-[16px] border-2 border-blue-300 shadow-[0px_20px_50px_rgba(23,119,207,0.3)]">
                  <KanbanHeader 
                    status={activeData.data as Status} 
                    columnIndex={statuses.findIndex(s => s.id === (activeData.data as Status).id)}
                    cardCount={getLeadsByStatus((activeData.data as Status).id).length}
                    onMenuClick={() => {}} 
                  />
                  <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                    Movendo coluna...
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal de Editar Cliente */}
      {isModalOpen && selectedClient && modalButtonRef && (
   <ModalEditar
     isOpen={isModalOpen}
     onClose={handleCloseModal}
     onEdit={handleEditClient}
	 onAnalytics={handleAnalyticsClient}
	 onHistory={handleHistoryClient}
     onDelete={handleDeleteClient}
     onMoveToColumn={handleMoveClientToColumn}
     availableColumns={statuses}
     currentColumnId={selectedClient.status.id}
     buttonRef={modalButtonRef}
	 isLastColumnOfStage={selectedClient ? isLastColumnOfCurrentStage(selectedClient.status.id) : false}
     nextStageName={selectedClient ? getNextStageName(selectedClient.status.id) : '01 | Proposta enviada'}
     onMoveToNextStage={handleMoveToNextStage}
     onOpenComments={handleOpenComments}
   />
      )}

      {/* Modal de Menu de Títulos */}
      {isMenuTitulosOpen && selectedColumnForMenu && ( 
        <ModalMenuTitulos
          isOpen={isMenuTitulosOpen}
          onClose={handleMenuTitulosClose}
          columnId={selectedColumnForMenu}
          columnTitle={statuses.find(s => s.id === selectedColumnForMenu)?.name || ''}
          columnIndex={statuses.findIndex(s => s.id === selectedColumnForMenu)}
          totalColumns={statuses.length}
          columns={statuses.map((status, index) => ({
            id: status.id,
            name: status.name,
            index
          }))}
          onRenameColumn={handleRenameColumn}
          onDeleteColumn={handleDeleteColumn}
          onMoveColumn={handleMoveColumn}
          onSortCards={handleSortCards}
        />
      )}
	  
	        {/* Modal de Editar Cliente */}
        {isEditModalOpen && editingClient && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
           <div className="relative w-full h-full">
             <CadastrarLeads
               onClose={handleCloseEditModal}
               onLeadSaved={handleLeadSaved}
               editingClient={{
                 id: editingClient.id,
                 name: editingClient.name,
                 whatsapp: editingClient.whatsapp,
                 estado: editingClient.assignedTo || 'N/A',
                 // Adicionar outros campos se necessário
                 email: '',
                 city: '',
                 cep: '',
                 bairro: '',
                 street: '',
                 number: '',
                 cpfCnpj: '',
                 photo: editingClient.avatarSrc
               }}
             />
           </div>
         </div>
        )}
		
	  {/* Modal de Cruzamento de Dados (Análise) */}
      {isCruzamentoModalOpen && clienteForCruzamento && (
        <CruzamentoDeDados
          isOpen={isCruzamentoModalOpen}
          onClose={handleCloseCruzamentoModal}
          cliente={{
            id: parseInt(clienteForCruzamento.id),
            name: clienteForCruzamento.name,
            photo: clienteForCruzamento.avatarSrc,
            whatsapp: clienteForCruzamento.whatsapp,
            estado: clienteForCruzamento.assignedTo || 'N/A',
            email: '', // Valor padrão
            city: '', // Valor padrão
            cpfCnpj: '' // Valor padrão
          }}
        />
      )}
	  
	      {/* Modal de Histórico do Cliente */}
     {isHistoricoModalOpen && clienteForHistorico && (
       <ModalHistoricoCliente
         isOpen={isHistoricoModalOpen}
         onClose={handleCloseHistoricoModal}
         cliente={{
           id: clienteForHistorico.id,
           nome: clienteForHistorico.name,
           foto: clienteForHistorico.avatarSrc,
           whatsapp: clienteForHistorico.whatsapp,
           email: `${clienteForHistorico.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
           dataEntrada: new Date().toISOString().split('T')[0] // Data atual como padrão
         }}
         movimentacoes={[
           {
             id: '1',
             tipo: 'entrada',
             timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
             colunaAtual: 'Leads',
             detalhes: 'Cliente entrou no funil via formulário de contato'
           },
           {
             id: '2',
             tipo: 'mudanca_coluna',
             timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
             colunaAnterior: 'Leads',
             colunaAtual: 'Qualificação',
             duracao: '2 dias',
             detalhes: 'Cliente qualificado após primeira ligação'
           },
           {
             id: '3',
             tipo: 'comentario',
             timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
             colunaAtual: 'Qualificação',
             comentario: 'Cliente demonstrou interesse no produto premium. Agendar reunião para apresentação.',
             usuario: 'Vendedor Responsável'
           },
           {
             id: '4',
             tipo: 'mudanca_coluna',
             timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
             colunaAnterior: 'Qualificação',
             colunaAtual: clienteForHistorico.status.name,
             duracao: '1 dia',
             detalhes: `Cliente movido para ${clienteForHistorico.status.name}`
           },
           {
             id: '5',
             tipo: 'acao',
             timestamp: new Date().toISOString(), // Agora
             colunaAtual: clienteForHistorico.status.name,
             comentario: 'Histórico visualizado via sistema CRM',
             usuario: 'Sistema'
           }
         ]}
       />
     )}
 
          {/* Modal de Comentários */}
         <ModalComentarios 
           isOpen={showModalComentarios}
           onClose={handleCloseModalComentarios}
         />

    </div>
  );
};
 