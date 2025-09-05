import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para exibir data de entrada e tempo decorrido
const ColumnTimeTracker: React.FC<{ entryDate: Date }> = ({ entryDate }) => {
  const [timeElapsed, setTimeElapsed] = useState('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const calculateTimeElapsed = (entryDate: Date) => {
    const now = new Date();
    const diff = now.getTime() - entryDate.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}D ${hours}h${minutes.toString().padStart(2, '0')}`;
    } else if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}min`;
    }
  };

  useEffect(() => {
    const updateTimer = () => {
      setTimeElapsed(calculateTimeElapsed(entryDate));
    };

    updateTimer(); // Primeira execução
    const interval = setInterval(updateTimer, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(interval);
  }, [entryDate]);

  return (
    <span className="text-[10px] text-gray-400">
      {formatDate(entryDate)} - {timeElapsed}
    </span>
  );
};

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

// Tipos
type Status = {
  id: string;
  name: string;
  color: string;
};

// Funções auxiliares para avatares
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getInitials = (name: string): string => {
  const words = name.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    // Se houver nome + sobrenome: usar a primeira letra de cada
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    // Se houver apenas um nome: usar a primeira e segunda letra do nome
    const word = words[0];
    return (word[0] + (word[1] || '')).toUpperCase();
  }
  
  return 'U'; // Fallback
};

// Função para determinar se deve mostrar foto ou iniciais
const shouldShowPhoto = (leadId: string): boolean => {
  // Sempre usar iniciais para evitar dependências externas
  return false;
};

// Função para gerar avatar SVG com iniciais e cor sóbria
const generateInitialsAvatar = (name: string, size: number = 42): string => {
  const initials = getInitials(name);
  
  // Cor única e sóbria estilo Apple
  const soberColor = {
    bgColor: '#8e8e93', // Cinza moderno sóbrio
    textColor: '#ffffff'  // Texto branco para contraste
  };
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" rx="6" ry="6" fill="${soberColor.bgColor}" />
      <text x="${size/2}" y="${size/2}" font-family="Inter, sans-serif" font-size="${size * 0.35}" font-weight="600" fill="${soberColor.textColor}" text-anchor="middle" dominant-baseline="central">
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Componente FakeAvatar Atualizado - Formato Quadrado com Cantos Arredondados
const FakeAvatar: React.FC<{
  leadId: string;
  name: string;
  size?: number;
  className?: string;
}> = ({
  leadId,
  name,
  size = 40,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  
  // Determina se deve mostrar foto ou iniciais
  const showPhoto = shouldShowPhoto(leadId);
  
  const handleImageError = () => {
    setHasError(true);
  };

  // Define a fonte da imagem baseada na nova lógica
  const getImageSrc = () => {
    // Sempre usar iniciais com cor sóbria (sem dependências externas)
    return generateInitialsAvatar(name, size);
  };

  return (
    <div
      className={cn('flex-shrink-0 overflow-hidden', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
      }}
    >
      <img
        src={getImageSrc()}
        alt={name}
        className="w-full h-full object-cover"
        style={{ borderRadius: '6px' }}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

// Componente Principal ClientCard Compacto
export const ClientCard: React.FC<{
  id: string;
  name: string;
  assignedTo?: string;
  whatsapp: string;
  columnEntryDate?: Date;
  avatarSrc?: string;
  avatarBorderSrc?: string;
  index?: number;
  parent?: string;
  onMenuClick?: (buttonRef: React.RefObject<HTMLButtonElement>) => void;
  className?: string;
  isDraggable?: boolean;
  dragData?: any;
}> = ({
  id,
  name,
  whatsapp,
  columnEntryDate,
  index = 0,
  parent,
  onMenuClick,
  className,
  isDraggable = false,
  dragData,
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Hook de sortable para reordenação dentro da coluna
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id,
    data: dragData || { type: 'card', index, parent, name, whatsapp },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const baseClassName = cn(
    'group relative flex items-center bg-white border border-gray-200 rounded-[8px] transition-all duration-200 ease-out hover:shadow-[0px_2px_8px_rgba(0,0,0,0.08)] hover:border-gray-300',
    isDraggable && 'cursor-grab active:cursor-grabbing',
    isDragging && 'opacity-[0.15] scale-[1.02] shadow-[0px_12px_32px_rgba(23,119,207,0.25)] z-50 border-blue-300',
    isOver && !isDragging && 'border-blue-300 shadow-[0px_4px_12px_rgba(23,119,207,0.1)]',
    className
  );

  return (
    <div className="relative">
      {/* Placeholder azul elegante no topo - aparece quando algo está sendo arrastado sobre este card */}
      {isOver && ( 
        <div className="absolute -top-[8px] left-[16px] right-[16px] h-[3px] transition-all duration-300 ease-out">
          <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 blur-[2px]" />
          <div className="relative h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse" />
          </div> 
        </div>
      )}

      <div
        ref={setNodeRef}
        style={style}
        className={baseClassName}
        {...sortableAttributes}
        {...sortableListeners}
      >
        <div className="flex items-center gap-[12px] flex-1 px-[16px] py-[12px] min-w-0 relative">
          {/* Avatar */}
          <div className="flex-shrink-0 mt-[2px]">
            <FakeAvatar
              leadId={id}
              name={name}
              size={42}
            />
          </div>

          {/* Informações do cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-[2px]">
              <div className="text-[14px] font-semibold text-gray-900 truncate pr-[8px]">
                {name}
              </div>
              {/* Menu de ações - Sempre visível e alinhado com o nome */}
              {onMenuClick && (
                <button 
                  ref={menuButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick(menuButtonRef);
                  }}
                  className="p-[6px] hover:bg-gray-100 rounded-[6px] transition-all duration-200 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                    <circle cx="13" cy="8" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[12px] text-gray-500 min-w-0">
              <span className="truncate">{whatsapp}</span>
              {/* Data/hora alinhada verticalmente com o menu */}
              {columnEntryDate && (
                <span className="flex-shrink-0 ml-[8px]">
                  <ColumnTimeTracker entryDate={columnEntryDate} />
                </span>
              )}
            </div>
          </div>
        </div> 
      </div>
    </div>
  );
};