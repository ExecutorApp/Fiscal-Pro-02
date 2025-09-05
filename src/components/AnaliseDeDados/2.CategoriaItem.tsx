import React from 'react';
import { ChevronDown, ChevronRight, Upload, FolderPlus, ArrowUp, ArrowDown, GripVertical, Trash2 } from 'lucide-react';
import { MenuItem } from './1.GerenciarDocumentos';
import { PastaCustomIcon } from './Modal-CriarCategoria';

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

interface CategoriaItemProps {
  categoria: MenuItem;
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
  toggleSubcategoriaExpansion: (subcategoriaId: string) => void;
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
  handleEditarCategoria: (categoria: MenuItem) => void;
  handleEditarSubcategoria: (subcategoria: MenuItem) => void;
  handleCriarSubcategoria: (categoriaPaiId: string) => void;
  startEditing: (itemId: string, itemLabel: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setEditingText: React.Dispatch<React.SetStateAction<string>>;
}

const CategoriaItem: React.FC<CategoriaItemProps> = ({
  categoria,
  editingItemId,
  editingText,
  uploadingFiles,
  fileInputRefs,
  selectionMode,
  toggleCategoriaExpansion,
  toggleSubcategoriaExpansion,
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
  handleEditarCategoria,
  handleEditarSubcategoria,
  handleCriarSubcategoria,
  startEditing,
  saveEdit,
  cancelEdit,
  setEditingText
}) => {
  const hasChildren = categoria.children && categoria.children.length > 0 && categoria.type !== 'arquivo';
  const isEditingCategoria = editingItemId === categoria.id;
  
  // Extrair nome da categoria - manter números se existirem
  let displayName = categoria.label;
  let itemNumber = '';
  
  // Verificar se a categoria tem numeração
  if (categoria.label.match(/^\d{2}\s/)) {
    itemNumber = categoria.label.substring(0, 2);
    displayName = categoria.label.substring(3);
  }
  
   // Função para alternar seleção de item
 const toggleItemSelection = (itemId: string) => {
   setSelectionMode(prev => {
     const newItems = new Set(prev.items);
     if (newItems.has(itemId)) {
       newItems.delete(itemId);
     } else {
       newItems.add(itemId);
     }
     return { ...prev, items: newItems };
   });
 };

 const toggleSubcategoriaFilhaExpansion = (subcategoriaId: string) => {
   toggleSubcategoriaExpansion(subcategoriaId);
 };

 const toggleSubcategoriaPaiExpansion = (subcategoriaId: string) => {
   toggleSubcategoriaExpansion(subcategoriaId);
 };

 // Função para renderizar conteúdo das subcategorias filhas (lado esquerdo)
 const renderSubcategoriaFilhaContent = (items: MenuItem[]) => {
   if (items.length === 0) {
     return (
       <div className="px-4 py-6 text-center">
         <p className="text-gray-400 text-sm">Nenhum item adicionado</p>
       </div>
     );
   }

   return items.map((item) => {
     const isEditing = editingItemId === item.id;
     const isArquivo = item.type === 'arquivo';

     return (
       <div key={item.id}>
         {/* Se for arquivo, renderizar como item simples na lista */}
         {isArquivo ? (
           <div 
             className="flex items-center px-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
             style={{ minHeight: '48px' }}
           >
             <div className="flex items-center gap-2 flex-1">
               {isEditing ? (
                 <div className="flex items-center flex-1">
                   <input
                     type="text"
                     value={editingText}
                     onChange={(e) => setEditingText(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') saveEdit();
                       if (e.key === 'Escape') cancelEdit();
                     }}
                     placeholder="Digite o nome do arquivo"
                     className="flex-1 px-2 py-1 text-xs border border-blue-400 rounded-l focus:outline-none focus:border-blue-400"
                     autoFocus
                   />
                   {/* {originalExtension && (
                     <span className="px-2 py-1 text-xs bg-gray-100 border border-l-0 border-blue-400 rounded-r text-gray-500">
                       {originalExtension}
                     </span>
                   )} */}
                 </div>
               ) : (
                 <span className="text-xs text-gray-600 flex-1">{item.label}</span>
               )}
             </div>
           </div>
         ) : (
           /* Subcategoria Filha Principal (ex: Balancetes, Certidões) */ 
           <>
             {/* Renderizar cabeçalho da pasta */}
             <div 
               className="flex items-center justify-between px-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
               style={{ height: '48px' }}
             >
               <div className="flex items-center gap-2 flex-1">
                 {/* Renderizar baseado no estilo escolhido */}
                 {item.showNumber && item.label.match(/^\d{2}\s/) ? (
                   // Título com Numeração
                   <div 
                     className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
                     style={{
                       backgroundColor: item.numberBgColor || '#6B7280',
                       color: item.numberTextColor || '#FFFFFF'
                     }}
                   >
                     {item.label.substring(0, 2)}
                   </div>
                 ) : item.folderColor ? (
                   // Título com Ícone de Pasta
                   <PastaCustomIcon 
                     fillColor={item.folderColor} 
                     strokeColor={item.folderColor}
                     solid={item.folderType === 'colorida'}
                     className="w-4 h-4 flex-shrink-0" 
                   />
                 ) : (
                   // Título Simples - sem ícone
                   null
                 )}

                 <span className="text-sm font-medium flex-1">
                   {item.showNumber && item.label.match(/^\d{2}\s/) ? item.label.substring(3) : item.label}
                 </span>
               </div>

               {/* Seta no lado direito */}
               <button 
                 onClick={() => toggleSubcategoriaFilhaExpansion(item.id)}
                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors"
                 style={{ width: '32px', height: '32px' }}
               >
                 {item.isExpanded ? (
                   <ChevronDown className="w-4 h-4 text-gray-600" />
                 ) : (
                   <ChevronRight className="w-4 h-4 text-gray-600" />
                 )}
               </button>
             </div>

             {/* Conteúdo expandido da pasta */}
             {item.isExpanded && (
               <div>
                 {hasChildren ? (
                   renderSubcategoriaFilhaContent(item.children!)
                 ) : (
                   <div className="px-4 py-6 text-center border-b border-gray-100 min-h-[120px] flex items-center justify-center">
                     <p className="text-gray-400 text-sm">Nenhum item adicionado</p>
                   </div>
                 )}
               </div>
             )}
           </>
         )}
       </div>
     );
   });
 };

 // Função para renderizar ações das subcategorias filhas (lado direito)
 const renderSubcategoriaFilhaActions = (items: MenuItem[]) => {
   if (items.length === 0) {
     return (
       <div className="flex items-center justify-start gap-1 pl-[10px]" style={{ minHeight: '48px' }}>
         {/* Container vazio para manter altura */}
       </div>
     );
   }

   return items.map((item) => {
     const isEditing = editingItemId === item.id;
     const isArquivo = item.type === 'arquivo';
     
     return (
       <div key={`actions-${item.id}`}>
         {/* Ações para arquivos - layout simples */}
         {isArquivo ? (
           <div className="flex items-center justify-end border-b border-gray-100 pr-[40px]" style={{ minHeight: '48px', width: '296px' }}>
             {isEditing ? (
               /* Botões Cancelar e Salvar durante edição */
               <div className="flex items-center justify-center gap-2 w-full">
                 <button 
                   onClick={cancelEdit}
                   className="px-[10px] py-[8px] text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium min-w-[70px]"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={saveEdit}
                   disabled={editingText.trim() === ''}
                   className={`px-[10px] py-[8px] text-xs rounded transition-colors ${
                     editingText.trim() === ''
                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       : 'bg-blue-500 text-white hover:bg-blue-600'
                   }`}
                 >
                   Salvar
                 </button>
               </div>
             ) : (
               /* Botões normais quando não está editando */
               <div className="flex items-center justify-end gap-1 pl-[10px] w-full">
                 <button 
                   onClick={() => startEditing(item.id, item.label)}
                   className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                   title="Editar"
                   style={{ width: '32px', height: '32px' }}
                 >
                   <EditIcon className="w-4 h-4 text-gray-600" />
                 </button>
                 
                 <label 
                   className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                   title="Upload de arquivos"
                   style={{ width: '32px', height: '32px' }}
                 >
                   {uploadingFiles.has(item.id) ? (
                     <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                   ) : (
                     <Upload className="w-4 h-4 text-gray-600" />
                   )}
                   <input
                     ref={el => {
                       if (el) fileInputRefs.current[item.id] = el;
                     }}
                     type="file"
                     multiple
                     onChange={(e) => handleFileUpload(e, item.id)}
                     className="hidden"
                     accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                   />
                 </label>
                 
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
               </div>
             )}
           </div>
         ) : (
           /* Ações para pastas/subcategorias - layout unificado */
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
         )}
         
         {/* Renderizar ações recursivamente para pastas com filhos */}
         {hasChildren && item.isExpanded && (
           <>
             {renderSubcategoriaFilhaActions(item.children!)}
           </>
         )}
       </div>
     );
   });
 };


  return (
    <div key={categoria.id} className="border border-gray-300 rounded-lg overflow-hidden"> 
      {/* HEADER DA CATEGORIA */}
     <div className="bg-white border-b border-gray-200">
       <div className="flex" style={{ minHeight: '0px' }}>

          {/* Container Esquerdo - Nome da Categoria */}
         <div className="flex items-center justify-between pl-[32px] pr-[18px]" style={{ width: 'calc(100% - 280px)' }}>
           <div className="flex items-center gap-2">
             {isEditingCategoria ? (
               <div className="flex items-center gap-2">
                 <input
                   type="text"
                   value={editingText}
                   onChange={() => {/* handled by parent */}}
                   onBlur={saveEdit}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       saveEdit();
                     } else if (e.key === 'Escape') {
                       cancelEdit();
                     }
                   }}
                   className="px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/10 text-white placeholder-white/70"
                   autoFocus
                 />
                 <button
                   onClick={saveEdit}
                   className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                 >
                   Salvar
                 </button>
                 <button
                   onClick={cancelEdit}
                   className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                 >
                   Cancelar
                 </button>
               </div>
             ) : (
               <div className="flex items-center gap-2">
                 {categoria.folderColor !== undefined && categoria.folderColor !== null ? (
                   <>
                     <PastaCustomIcon 
                       fillColor={categoria.folderColor} 
                       strokeColor={categoria.folderColor} 
                       solid={categoria.folderType === 'colorida'}
                       className="w-[20px] h-[20px]" // Tamanho da pasta dos títulos
                     />
                     <h3 className="text-[15px] font-semibold text-blue-600">{displayName}</h3>
                   </>
                 ) : categoria.showNumber && categoria.numberBgColor ? (
                   <>
                     <div 
                       className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                       style={{  
                         backgroundColor: categoria.numberBgColor, 
                         color: categoria.numberTextColor || '#FFFFFF'
                       }}
                     >
                       {itemNumber}
                     </div>
                     <h3 className="text-[15px] font-semibold text-blue-600">{categoria.label}</h3>
                   </>
                 ) : (
                   <h3 className="text-[15px] font-semibold text-blue-600">{categoria.label}</h3>
                 )}
               </div>
             )}
           </div>

           {/* Seta no lado direito do container esquerdo */}

            <button
              onClick={() => toggleCategoriaExpansion(categoria.id)}
              className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded transition-colors"
              style={{ width: '32px', height: '32px' }}

            >
              {categoria.isExpanded ? 
               <ChevronDown className="w-4 h-4 text-blue-600" /> : 
               <ChevronRight className="w-4 h-4 text-blue-600" />
              }
            </button>          
          </div>

         {/* Linha Vertical de Separação */}
         <div className="w-px bg-gray-300"></div>
 
         {/* Container Direito - Botões de Ação da Categoria */}
         <div className="flex items-center justify-end gap-1 py-2 pl-[9px] pr-[0px] " style={{ width: '255px' }}>
           {!isEditingCategoria && (
             <>

                {/* Botão Editar */}
                <button 
                  onClick={() => handleEditarCategoria(categoria)}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar categoria"
				  style={{ width: '32px', height: '32px' }}
                >
                  <EditIcon className="w-4 h-4 text-blue-600" />
                </button>
                
                {/* Botão Criar Subcategoria */}				  
                <button 
                  onClick={() => {
                    console.log('🎯 BOTÃO CLICADO - handleCriarSubcategoria');
                    handleCriarSubcategoria(categoria.id);
                  }}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Criar subcategoria"
				  style={{ width: '32px', height: '32px' }}
                >
                  <FolderPlus className="w-4 h-4 text-blue-600"/>
                </button>				  
                
                {/* Botão Upload */}
                <label 
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Upload de arquivos"
				  style={{ width: '32px', height: '32px' }}
                >
                  {uploadingFiles.has(categoria.id) ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-4 h-4 text-blue-600" />
                  )}

                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current[categoria.id] = el;
                    }}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, categoria.id)}
                    key={categoria.id + '-' + uploadingFiles.has(categoria.id)}
                  />
                </label>

                {/* Botão Mover para baixo */}
                <button 
                  onClick={() => moveItemDown(categoria.id)}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mover para baixo"
				  style={{ width: '32px', height: '32px' }}
                >
                  <ArrowDown className="w-4 h-4 text-blue-600" />
                </button>
                
                {/* Botão Mover para cima */}
                <button 
                  onClick={() => moveItemUp(categoria.id)}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mover para cima"
				  style={{ width: '32px', height: '32px' }}
                >
                  <ArrowUp className="w-4 h-4 text-blue-600" />
                </button>
                
                {/* Botão Mover */}
                <button 
                  onClick={() => handleMoveItem(categoria.id)}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mover categoria"
				  style={{ width: '32px', height: '32px' }}
                >
                  <GripVertical className="w-4 h-4 text-blue-600" />
                </button>
                
                {/* Botão Deletar */}
                <button 
                  onClick={() => handleDeleteClick(categoria.id, categoria.label)}
                  className="flex items-center justify-center p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Excluir categoria"
				  style={{ width: '32px', height: '32px' }}
                >
                  <Trash2 className="w-4 h-4 text-blue-600" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO DA CATEGORIA */}
      {categoria.isExpanded && (
       <div className={categoria.children && categoria.children.length > 0 ? "p-4 space-y-[10px]" : ""}>  
         {/* Se a categoria tem empresas (subcategorias pai), renderizar cada uma separadamente */}
         {categoria.children && categoria.children.length > 0 ? (
           // Renderizar subcategorias pai (empresas) em containers separados
           <div className="space-y-[10px]">
             {/* Renderizar apenas itens que não são arquivos simples */}
             {categoria.children.map(subcategoriaPai => {
               if (subcategoriaPai.type === 'arquivo') return null;

               const isEditingSubPai = editingItemId === subcategoriaPai.id;
               
               return (
                 <div key={subcategoriaPai.id} className="mx-[0px] border border-gray-200 rounded-lg overflow-hidden">
                   {/* HEADER DA SUBCATEGORIA PAI */}
                   <div className="bg-gray-100 border-b border-gray-200"> 
                     <div className="flex" style={{ minHeight: '48px' }}>
                       {/* Container Esquerdo - Nome da Subcategoria Pai */}
                       <div className="flex items-center justify-between pl-[16px] pr-[18px]" style={{ width: 'calc(100% - 215px)' }}>
                         <div className="flex items-center gap-2">
                           {selectionMode.active && selectionMode.type === 'pasta' && (
                             <input
                               type="checkbox"
                               checked={selectionMode.items.has(subcategoriaPai.id)}
                               onChange={() => toggleItemSelection(subcategoriaPai.id)}
                               className="ml-[-8px] mr-2"
                               onClick={(e) => e.stopPropagation()}
                             />
                           )}
                           
                           {/* Renderização com formatação completa igual ao original */}
                           {(() => {
                             let displayName = subcategoriaPai.label;
                             let itemNumber = '';
                             let showNumberBadge = false;
                             let showFolderIcon = false;
                             
                             // Verificar se tem numeração
                             if (subcategoriaPai.label.match(/^\d{2}\s/)) {
                               itemNumber = subcategoriaPai.label.substring(0, 2);
                               displayName = subcategoriaPai.label.substring(3);
                               showNumberBadge = true;
                             }
                             // Verificar se tem ícone de pasta
                             if (subcategoriaPai.folderColor && subcategoriaPai.folderColor !== 'undefined') {
                               showFolderIcon = true;
                             }
                             
                             return (
                               <>
                                 {/* Badge de numeração */}
                                 {showNumberBadge && (
                                   <div 
                                     className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
                                     style={{
                                       backgroundColor: subcategoriaPai.numberBgColor || '#6B7280',
                                       color: subcategoriaPai.numberTextColor || '#FFFFFF'
                                     }}
                                   >
                                     {itemNumber}
                                   </div>
                                 )}
                                 
                                 {/* Ícone de Pasta */}
                                 {showFolderIcon && (
                                   <PastaCustomIcon 
                                     fillColor={subcategoriaPai.folderColor} 
                                     strokeColor={subcategoriaPai.folderColor}              
                                     solid={subcategoriaPai.folderType === 'colorida'}
                                     className="w-5 h-5 flex-shrink-0" 
                                   />
                                 )}

                                 {/* Nome da subcategoria */}
                                 <span className="font-medium text-gray-800">
                                   {showNumberBadge ? displayName : subcategoriaPai.label}
                                 </span>
                               </>
                             );
                           })()}
                         </div>

                         {/* Seta no lado direito do container esquerdo */}
                         <button 
                           onClick={() => toggleSubcategoriaPaiExpansion(subcategoriaPai.id)}
                           className="flex items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                           style={{ width: '28px', height: '28px' }}
                         >
                           {subcategoriaPai.isExpanded ? (
                             <ChevronDown className="w-4 h-4 text-gray-600" />
                           ) : (
                             <ChevronRight className="w-4 h-4 text-gray-600" />
                           )}
                         </button>
                       </div>
                       
                       {/* Linha Vertical de Separação */}
                       <div className="w-px bg-gray-300"></div>

                       {/* Container Direito - Botões de Ação da Subcategoria Pai */}
                       {!isEditingSubPai && (
                         <div className="flex items-center justify-end gap-1 py-3 pr-[6px]" style={{ width: '280px' }}>
                           {!selectionMode.active && (
                             <>  
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleEditarSubcategoria(subcategoriaPai);
                                 }}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                                 title="Editar"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 <EditIcon className="w-4 h-4 text-gray-600" />
                              </button>		
                               
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setCategoriaPaiId(subcategoriaPai.id);
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
                                 onClick={(e) => e.stopPropagation()}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                 title="Upload de arquivos"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 {uploadingFiles.has(subcategoriaPai.id) ? (
                                   <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                 ) : (
                                   <Upload className="w-4 h-4 text-gray-600" />
                                 )}

                                 <input
                                   ref={(el) => {
                                     if (el) fileInputRefs.current[subcategoriaPai.id] = el;
                                   }}
                                   type="file"
                                   multiple
                                   className="hidden"
                                   onChange={(e) => handleFileUpload(e, subcategoriaPai.id)}
                                   key={subcategoriaPai.id + '-' + uploadingFiles.has(subcategoriaPai.id)}
                                 />
                               </label>

                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   moveItemDown(subcategoriaPai.id);
                                 }}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                                 title="Mover para baixo"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 <ArrowDown className="w-4 h-4 text-gray-600" />
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   moveItemUp(subcategoriaPai.id);
                                 }}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                                 title="Mover para cima"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 <ArrowUp className="w-4 h-4 text-gray-600" />
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleMoveItem(subcategoriaPai.id);
                                 }}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                                 title="Mover"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 <GripVertical className="w-4 h-4 text-gray-600" />
                               </button>
                               
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteClick(subcategoriaPai.id, subcategoriaPai.label);
                                 }}
                                 className="flex items-center justify-center p-1.5 hover:bg-gray-200 rounded transition-colors" 
                                 title="Excluir"
                                 style={{ width: '32px', height: '32px' }}
                               >
                                 <Trash2 className="w-4 h-4 text-gray-600" />
                               </button>                                                                                                                             
                             </>
                           )}						
                         </div>
                       )}
                     </div>
                   </div>

                   {/* CONTEÚDO DA SUBCATEGORIA PAI - CONTAINERS LADO A LADO */}
                   {subcategoriaPai.isExpanded && (
                     <div className="flex border-t border-gray-200">
                       {/* Container Esquerdo - Subcategorias Filhas */}
                       <div className="flex-1 bg-white">
                         {subcategoriaPai.children && subcategoriaPai.children.length > 0 ? (
                           renderSubcategoriaFilhaContent(subcategoriaPai.children!)
                         ) : (
                           <div className="px-4 py-6 text-center min-h-[120px] flex items-center justify-center">
                             <p className="text-gray-400 text-sm">Nenhum item adicionado</p>
                           </div>
                         )}
                       </div>

                       {/* Linha Vertical de Separação */}
                       <div className="w-px bg-gray-300"></div>

                       {/* Container Direito - Ações (COLADO ao esquerdo) */}
                       <div className="w-[263px] bg-white">
                         {subcategoriaPai.children && subcategoriaPai.children.length > 0 ? (
                           renderSubcategoriaFilhaActions(subcategoriaPai.children!)
                         ) : (
                           <div className="min-h-[120px]"></div>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               );
             })}
             

           </div>
         ) : (
           // Categoria vazia ou com arquivos diretos (sem empresas)
           <div className="flex border-t border-gray-200"> 
             {/* Container Esquerdo - Arquivos Diretos */}
             <div className="flex-1 min-h-[120px] bg-white">
               <div className="px-4 py-6 text-center min-h-[120px] flex items-center justify-center">
                 <p className="text-gray-400 text-sm">Nenhum item adicionado</p>
               </div>
             </div>

             {/* Linha Vertical de Separação */}
             <div className="w-px bg-gray-300"></div>

             {/* Container Direito - Ações */}
             <div className="w-[279px] min-h-[120px] bg-white">
               <div className="py-6"></div>
             </div>
           </div>
         )}
       </div>

      )}
    </div>
  );
};

export default CategoriaItem;