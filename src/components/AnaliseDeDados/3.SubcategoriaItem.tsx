import React from 'react';
import { Upload, FolderPlus, ArrowUp, ArrowDown, GripVertical, Trash2 } from 'lucide-react';
import { MenuItem } from './1.GerenciarDocumentos';

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

interface SubcategoriaItemProps {
  item: MenuItem;
  editingItemId: string | null;
  editingText: string;
  uploadingFiles: Set<string>;
  fileInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement }>;
  selectionMode: {
    active: boolean;
    type: 'arquivo' | 'pasta' | 'categoria' | null;
    parentId: string | null;
    items: Set<string>;
  };
  toggleCategoriaExpansion: (categoriaId: string) => void;
  moveItemUp: (itemId: string) => void;
  moveItemDown: (itemId: string) => void;
  handleMoveItem: (itemId: string) => void;
  handleDeleteClick: (itemId: string, itemName: string) => void;
  setSelectionMode: React.Dispatch<React.SetStateAction<{
    active: boolean;
    type: 'arquivo' | 'pasta' | 'categoria' | null;
    parentId: string | null;
    items: Set<string>;
  }>>;
  setCategoriaPaiId: React.Dispatch<React.SetStateAction<string | null>>;
  setTipoModal: React.Dispatch<React.SetStateAction<'categoria' | 'subcategoria'>>;
  setModoEdicao: React.Dispatch<React.SetStateAction<'criar' | 'editar'>>;
  setCategoriaEditando: React.Dispatch<React.SetStateAction<MenuItem | null>>;
  setShowCriarCategoriaModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, parentId: string) => void;
  handleEditarSubcategoria: (subcategoria: MenuItem) => void;
  startEditing: (itemId: string, itemLabel: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  renderSubcategoriaFilhaActions: (items: MenuItem[]) => JSX.Element[];
}

const SubcategoriaItem: React.FC<SubcategoriaItemProps> = ({
  item,
  editingItemId,
  editingText,
  uploadingFiles,
  fileInputRefs,
  selectionMode,
  toggleCategoriaExpansion,
  moveItemUp,
  moveItemDown,
  handleMoveItem,
  handleDeleteClick,
  setSelectionMode,
  setCategoriaPaiId,
  setTipoModal,
  setModoEdicao,
  setCategoriaEditando,
  setShowCriarCategoriaModal,
  handleFileUpload,
  handleEditarSubcategoria,
  startEditing,
  saveEdit,
  cancelEdit,
  renderSubcategoriaFilhaActions
}) => {
  const isEditing = editingItemId === item.id;
  const isPasta = item.type === 'pasta';
  const hasChildren = item.children && item.children.length > 0;

  /* Se é pasta SEM filhos - renderizar botões no lado direito */
  if (isPasta && !hasChildren) {
    return (
      <div 
        className="flex items-center justify-end gap-1 pr-[40px] border-b border-gray-200"
        style={{ minHeight: '48px', width: '296px' }}
      >
        {!isEditing && (
          <>
            <button 
              onClick={() => handleEditarSubcategoria(item)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Editar"
              style={{ width: '32px', height: '32px' }}
            >
              <EditIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => {
                setCategoriaPaiId(item.id);
                setTipoModal('subcategoria');
                setModoEdicao('criar');
                setCategoriaEditando(null);
                setShowCriarCategoriaModal(true);
              }}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Nova Pasta"
              style={{ width: '32px', height: '32px' }}
            >
              <FolderPlus className="w-4 h-4 text-gray-600" />
            </button>
            <label 
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              style={{ width: '32px', height: '32px' }}
            >
              {uploadingFiles.has(item.id) ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-4 h-4 text-gray-600" />
              )}
              <input
                ref={(el) => {
                  if (el) fileInputRefs.current[item.id] = el;
                }}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, item.id)}
                key={item.id + '-' + uploadingFiles.has(item.id)}
              />
            </label>
            
            <button 
              onClick={() => moveItemDown(item.id)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Mover para baixo"
              style={{ width: '32px', height: '32px' }}
            >
              <ArrowDown className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => moveItemUp(item.id)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Mover para cima"
              style={{ width: '32px', height: '32px' }}
            >
              <ArrowUp className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => handleMoveItem(item.id)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Mover"
              style={{ width: '32px', height: '32px' }}
            >
              <GripVertical className="w-4 h-4 text-gray-600" />
            </button>
            
            <button 
              onClick={() => handleDeleteClick(item.id, item.label)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
              title="Excluir"
              style={{ width: '32px', height: '32px' }}
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>
    );
  }

  /* Se é pasta COM filhos */
  return (
    <div 
      className="flex items-center justify-end gap-1 pr-[40px] border-b border-gray-200"
      style={{ minHeight: '48px', width: '296px' }} 
    >
      {!isEditing && (
        <>
          <button 
            onClick={() => handleEditarSubcategoria(item)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Editar"
            style={{ width: '32px', height: '32px' }}
          >
            <EditIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              setCategoriaPaiId(item.id);
              setTipoModal('subcategoria');
              setModoEdicao('criar');
              setCategoriaEditando(null);
              setShowCriarCategoriaModal(true);
            }}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Nova Pasta"
            style={{ width: '32px', height: '32px' }}
          >
            <FolderPlus className="w-4 h-4 text-gray-600" />
          </button>
          <label 
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
            style={{ width: '32px', height: '32px' }}
          >
            {uploadingFiles.has(item.id) ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-4 h-4 text-gray-600" />
            )}
            <input
              ref={(el) => {
                if (el) fileInputRefs.current[item.id] = el;
              }}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e, item.id)}
              key={item.id + '-' + uploadingFiles.has(item.id)}
            />
          </label>
          
          <button 
            onClick={() => moveItemDown(item.id)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Mover para baixo"
            style={{ width: '32px', height: '32px' }}
          >
            <ArrowDown className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => moveItemUp(item.id)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Mover para cima"
            style={{ width: '32px', height: '32px' }}
          >
            <ArrowUp className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => handleMoveItem(item.id)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Mover"
            style={{ width: '32px', height: '32px' }}
          >
            <GripVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          <button 
            onClick={() => handleDeleteClick(item.id, item.label)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
            title="Excluir"
            style={{ width: '32px', height: '32px' }}
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
};

export default SubcategoriaItem;