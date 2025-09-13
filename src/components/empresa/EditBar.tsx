import React from "react";
import { Pencil, Share2, Link, Download, Trash2, CheckSquare, Square } from 'lucide-react';

interface EditBarProps {
  onRename: () => void;
  onShare: () => void;
  onLink: () => void;
  onDownload: () => void;
  onDelete: () => void;
  disabled?: boolean;
  // Props para seleção múltipla
  isMultiSelectMode?: boolean;
  onToggleMultiSelect?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  hasSelectedItems?: boolean;
}

// Componente do SVG customizado (ícone de grade 2x2)
const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    version="1.1" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className={className}
  >
    <path 
      fill="currentColor" 
      fillRule="evenodd" 
      d="M2.622 4.054c-.11.506-.155 1.177-.155 2.08 0 .901.046 1.572.155 2.08.108.498.266.787.455.976.19.189.478.347.977.455.506.109 1.177.155 2.08.155.901 0 1.572-.046 2.08-.155.498-.108.787-.266.976-.455.189-.19.347-.478.455-.977.109-.507.155-1.178.155-2.08 0-.902-.046-1.573-.155-2.08-.108-.498-.266-.787-.455-.976-.19-.19-.478-.347-.977-.455-.507-.11-1.178-.155-2.08-.155-.902 0-1.573.046-2.08.155-.498.108-.787.266-.976.455-.19.19-.347.478-.455.977Zm1.122-2.866C4.406 1.046 5.202 1 6.134 1c.93 0 1.726.046 2.388.188.67.145 1.252.4 1.705.852.452.452.707 1.034.851 1.704.143.662.189 1.458.189 2.39 0 .93-.046 1.726-.189 2.388-.144.67-.399 1.252-.851 1.705-.453.452-1.034.707-1.705.851-.662.143-1.457.189-2.389.189-.93 0-1.727-.046-2.389-.189-.67-.144-1.252-.399-1.704-.851-.453-.453-.707-1.034-.852-1.705C1.046 7.86 1 7.065 1 6.133c0-.93.046-1.727.188-2.389.145-.67.4-1.252.852-1.704.452-.453 1.034-.707 1.704-.852Zm10.611 2.866c-.109.506-.155 1.177-.155 2.08 0 .901.046 1.572.155 2.08.108.498.266.787.455.976.19.189.478.347.977.455.507.109 1.178.155 2.08.155.902 0 1.573-.046 2.08-.155.498-.108.787-.266.976-.455.19-.19.347-.478.455-.977.11-.507.155-1.178.155-2.08 0-.902-.046-1.573-.155-2.08-.108-.498-.266-.787-.455-.976-.19-.19-.478-.347-.977-.455-.506-.11-1.177-.155-2.08-.155-.901 0-1.572.046-2.08.155-.498.108-.787.266-.976.455-.189.19-.347.478-.455.977Zm1.123-2.866C16.14 1.046 16.936 1 17.867 1c.93 0 1.727.046 2.389.188.67.145 1.252.4 1.704.852.453.452.707 1.034.852 1.704.142.662.188 1.458.188 2.39 0 .93-.046 1.726-.188 2.388-.145.67-.4 1.252-.852 1.705-.452.452-1.034.707-1.704.851-.662.143-1.458.189-2.39.189-.93 0-1.726-.046-2.388-.189-.67-.144-1.252-.399-1.705-.851-.452-.453-.707-1.034-.851-1.705-.143-.662-.189-1.457-.189-2.389 0-.93.046-1.727.189-2.389.144-.67.399-1.252.851-1.704.453-.453 1.034-.707 1.705-.852ZM2.622 15.787c-.11.507-.155 1.178-.155 2.08 0 .902.046 1.573.155 2.08.108.498.266.787.455.976.19.19.478.347.977.455.506.11 1.177.155 2.08.155.901 0 1.572-.046 2.08-.155.498-.108.787-.266.976-.455.189-.19.347-.478.455-.977.109-.506.155-1.177.155-2.08 0-.901-.046-1.572-.155-2.08-.108-.498-.266-.787-.455-.976-.19-.189-.478-.347-.977-.455-.507-.109-1.178-.155-2.08-.155-.902 0-1.573.046-2.08.155-.498.108-.787.266-.976.455-.19.19-.347.478-.455.977Zm1.122-2.865c.662-.143 1.458-.189 2.39-.189.93 0 1.726.046 2.388.189.67.144 1.252.399 1.705.851.452.453.707 1.034.851 1.705.143.662.189 1.458.189 2.389 0 .93-.046 1.727-.189 2.389-.144.67-.399 1.252-.851 1.704-.453.453-1.034.707-1.705.852-.662.142-1.457.188-2.389.188-.93 0-1.727-.046-2.389-.188-.67-.145-1.252-.4-1.704-.852-.453-.452-.707-1.034-.852-1.704-.142-.662-.188-1.458-.188-2.39 0-.93.046-1.726.188-2.388.145-.67.4-1.252.852-1.705.452-.452 1.034-.707 1.704-.851Zm10.611 2.865c-.109.507-.155 1.178-.155 2.08 0 .902.046 1.573.155 2.08.108.498.266.787.455.976.19.19.478.347.977.455.507.11 1.178.155 2.08.155.902 0 1.573-.046 2.08-.155.498-.108.787-.266.976-.455.19-.19.347-.478.455-.977.11-.506.155-1.177.155-2.08 0-.901-.046-1.572-.155-2.08-.108-.498-.266-.787-.455-.976-.19-.189-.478-.347-.977-.455-.506-.109-1.177-.155-2.08-.155-.901 0-1.572.046-2.08.155-.498.108-.787.266-.976.455-.189.19-.347.478-.455.977Zm1.123-2.865c.662-.143 1.458-.189 2.389-.189.93 0 1.727.046 2.389.189.67.144 1.252.399 1.704.851.453.453.707 1.034.852 1.705.142.662.188 1.458.188 2.389 0 .93-.046 1.727-.188 2.389-.145.67-.4 1.252-.852 1.704-.452.453-1.034.707-1.704.852-.662.142-1.458.188-2.39.188-.93 0-1.726-.046-2.388-.188-.67-.145-1.252-.4-1.705-.852-.452-.452-.707-1.034-.851-1.704-.143-.662-.189-1.458-.189-2.39 0-.93.046-1.726.189-2.388.144-.67.399-1.252.851-1.705.453-.452 1.034-.707 1.705-.851Z" 
      clipRule="evenodd"
    />
  </svg>
);

const IconButton: React.FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] border transition-all mb-2 ${
      disabled
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const EditBar: React.FC<EditBarProps> = ({ 
  onRename, 
  onShare, 
  onLink, 
  onDownload, 
  onDelete, 
  disabled = false,
  isMultiSelectMode = false,
  onToggleMultiSelect,
  onSelectAll,
  onDeselectAll,
  hasSelectedItems = false
}) => {
  // Função para alternar o modo de seleção múltipla
  const handleGridButtonClick = () => {
    if (onToggleMultiSelect) {
      onToggleMultiSelect();
    }
  };

  // Componente de botão customizado para o primeiro botão (grid)
  const GridButton: React.FC<{
    title: string;
    onClick: () => void;
    isActive: boolean;
  }> = ({ title, onClick, isActive }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] border transition-all mb-2 ${
        isActive
          ? "bg-[#1777CF] text-white border-[#1777CF]"
          : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50"
      }`}
    >
      <GridIcon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col p-2 bg-white border border-[#E5E7EB] rounded-[10px] shadow-sm">
      {/* 1. Primeiro botão: SVG customizado (ícone de grade 2x2) */}
      <GridButton 
        title="Seleção múltipla" 
        onClick={handleGridButtonClick} 
        isActive={isMultiSelectMode}
      />
      
      {/* 2. Segundo botão: Checkbox marcado (selecionar todos) */}
      <IconButton 
        title="Selecionar todos" 
        onClick={onSelectAll} 
        disabled={!isMultiSelectMode}
      >
        <CheckSquare className="w-4 h-4" />
      </IconButton>
      
      {/* 3. Terceiro botão: Checkbox desmarcado (desmarcar todos) */}
      <IconButton 
        title="Desmarcar todos" 
        onClick={onDeselectAll} 
        disabled={!isMultiSelectMode || !hasSelectedItems}
      >
        <Square className="w-4 h-4" />
      </IconButton>
      
      {/* 4. Divisória horizontal */}
      <div className="w-[25px] h-px bg-gray-200 ml-[5px] mt-[5px] mb-[10px]" />
      
      {/* Botões de ação padrão */}
      <IconButton title="Renomear" onClick={onRename} disabled={disabled}>
        <Pencil className="w-4 h-4" />
      </IconButton>
      <IconButton title="Compartilhar" onClick={onShare} disabled={disabled}>
        <Share2 className="w-4 h-4" />
      </IconButton>
      <IconButton title="Vincular" onClick={onLink} disabled={disabled}>
        <Link className="w-4 h-4" />
      </IconButton>
      <IconButton title="Download" onClick={onDownload} disabled={disabled}>
        <Download className="w-4 h-4" />
      </IconButton>
      <IconButton title="Excluir" onClick={onDelete} disabled={disabled}>
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  );
};

export default EditBar;