import React, { useState, useRef, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface ModalCriarTagProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTag: (tag: Omit<Tag, 'id'>) => void;
   editingTag?: Tag | null;
 isEditMode?: boolean;

}

export const ModalCriarTag: React.FC<ModalCriarTagProps> = ({
  isOpen,
  onClose,
  onAddTag,
   editingTag,
 isEditMode = false,

}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#007AFF');
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState('');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
 const [showRightArrow, setShowRightArrow] = useState(false);
 const carouselRef = useRef<HTMLDivElement>(null);
   // useEffect para pré-preencher dados quando editando
  useEffect(() => {
    if (isEditMode && editingTag) {
      setNewTagName(editingTag.name);
      setNewTagColor(editingTag.color);
    }
  }, [isEditMode, editingTag]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [colorToDelete, setColorToDelete] = useState<string | null>(null);


  // Cores padrão estilo Apple
  const predefinedColors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
    '#FF2D92', '#5AC8FA', '#FFCC00', '#8E8E93', '#636366'
  ];

 // CSS para ocultar scrollbar
 const scrollbarHideStyle = `
   .scrollbar-hide::-webkit-scrollbar {
     display: none;
   }
 `;

  const handleAddTag = () => {
    if (newTagName.trim() === '') return;

    const newTag = {
      name: newTagName.trim(),
      color: newTagColor,
      isActive: true,
    };

    onAddTag(newTag);
    handleClose();
  };

  const handleClose = () => {
    setNewTagName('');
    setNewTagColor('#007AFF');
    setCustomColorInput('');
	setShowDeleteConfirm(false);
    setColorToDelete(null);

    onClose();
  };

  const handleAddCustomColor = () => {
    const color = customColorInput.trim().toUpperCase();
    if (color && !customColors.includes(color) && !predefinedColors.includes(color)) {
           setCustomColors(prev => {
       const updatedColors = [...prev, color];
       
       // Salvar no localStorage
       try {
         const dataToSave = {
           timestamp: new Date().toISOString(),
           version: "1.0",
           customColors: updatedColors
         };
         localStorage.setItem('modal_criar_tag_custom_colors', JSON.stringify(dataToSave));
         console.log('?? Cores personalizadas salvas no localStorage!');
       } catch (error) {
         console.error('? Erro ao salvar cores personalizadas:', error);
       }
       
       return updatedColors;
     });

      setNewTagColor(color);
	  setCustomColorInput(''); // Limpar input após criar cor
	       setTimeout(() => {
       checkArrows();
       // Forçar re-render para verificar overflow
       if (carouselRef.current) {
         carouselRef.current.scrollLeft = carouselRef.current.scrollLeft;
       }
     }, 100);
    }
  };

 const handleRemoveCustomColor = (colorToRemove: string) => {
   setColorToDelete(colorToRemove);
   setShowDeleteConfirm(true);
 };
 
 const handleConfirmDelete = () => {
   if (colorToDelete) {
          setCustomColors(prev => {
       const updatedColors = prev.filter(color => color !== colorToDelete);
       
       // Salvar no localStorage
       try {
         const dataToSave = {
           timestamp: new Date().toISOString(),
           version: "1.0",
           customColors: updatedColors
         };
         localStorage.setItem('modal_criar_tag_custom_colors', JSON.stringify(dataToSave));
         console.log('?? Cor removida e localStorage atualizado!');
       } catch (error) {
         console.error('? Erro ao atualizar cores personalizadas:', error);
       }
       
       return updatedColors;
     });

     
     // Se a cor removida era a selecionada, voltar para a primeira cor padrão
     if (newTagColor === colorToDelete) {
       setNewTagColor('#007AFF');
     }
     
     // Verificar setas após remover
     setTimeout(() => {
       checkArrows();
     }, 100);
   }
   
   setShowDeleteConfirm(false);
   setColorToDelete(null);
 };
 
 const handleCancelDelete = () => {
   setShowDeleteConfirm(false);
   setColorToDelete(null);
 };


  const handleColorSelect = (color: string) => {
    setNewTagColor(color);
  };

  const isValidHex = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };
  
   // Função para capitalizar primeira letra
 const capitalizeFirstLetter = (text: string) => {
   if (!text) return text;
   return text.charAt(0).toUpperCase() + text.slice(1);
 };

 // Função para lidar com mudança no nome da tag
 const handleTagNameChange = (value: string) => {
   const formattedValue = capitalizeFirstLetter(value);
   setNewTagName(formattedValue);
 };

   const checkArrows = () => {
   if (carouselRef.current) {
     const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
     setShowLeftArrow(scrollLeft > 0);
     setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
   }
 };

 const hasOverflow = () => {
   if (carouselRef.current) {
     const { scrollWidth, clientWidth } = carouselRef.current;
     return scrollWidth > clientWidth;
   }
   return false;
 };

 const scrollLeft = () => {
   if (carouselRef.current) {
     carouselRef.current.scrollBy({ left: -40, behavior: 'smooth' });
   }
 };

 const scrollRight = () => {
   if (carouselRef.current) {
     carouselRef.current.scrollBy({ left: 40, behavior: 'smooth' });
   }
 };

 useEffect(() => {
   checkArrows();
   const handleResize = () => checkArrows();
   window.addEventListener('resize', handleResize);
   return () => window.removeEventListener('resize', handleResize);
 }, [customColors]);
 
  // Carregar cores personalizadas do localStorage na inicialização
 useEffect(() => {
   const loadPersistedCustomColors = () => {
     try {
       const savedData = localStorage.getItem('modal_criar_tag_custom_colors');
       
       if (savedData) {
         const parsedData = JSON.parse(savedData);
         setCustomColors(parsedData.customColors || []);
         console.log('? Cores personalizadas carregadas do localStorage!');
       } else {
         console.log('?? Primeira vez - sem cores personalizadas salvas');
       }
     } catch (error) {
       console.error('? Erro ao carregar cores personalizadas:', error);
       console.log('?? Usando lista vazia devido ao erro');
     }
   };
 
   loadPersistedCustomColors();
 }, []);



  if (!isOpen) return null;

  return (
     <>
     <style>{scrollbarHideStyle}</style>

    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] w-[480px] h-[530px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
             <h3 className="text-xl font-semibold text-gray-900">
             {isEditMode ? 'Editar Tag' : 'Criar Nova Tag'}
             </h3>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-5 overflow-hidden">
          {/* Nome da Tag */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 ml-[10px]">
              Nome da Tag
            </label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => handleTagNameChange(e.target.value)}
              placeholder="Digite o nome da tag"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#007AFF] text-sm transition-all duration-200"
              autoFocus
            />
          </div>

          {/* Cores Padrão */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Cores padrão</h4>
            <div className="py-1">
             <div className="flex gap-2">

                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-lg border transition-all duration-200 hover:scale-105 flex-shrink-0 ${
                      newTagColor === color
                       ? 'border-2 border-[#007AFF] shadow-md ring-2 ring-[#007AFF]/20'
                       : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
            
          {/* Cores Personalizadas */}
          <div className="overflow-visible"> 
            <h4 className="text-sm font-medium text-gray-700 mb-3">Cores personalizadas</h4>
            
            {/* Criador de Cor Personalizada */}
           <div className="flex items-center gap-3 mb-4">
            {/* Preview da cor à esquerda com seletor */}
            <div className="relative flex-shrink-0">
              <input
                type="color"
                value={isValidHex(customColorInput) ? customColorInput : '#203246'}
                onChange={(e) => {
                  setCustomColorInput(e.target.value.toUpperCase());
                  setNewTagColor(e.target.value.toUpperCase());
                }}
                className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
              />
              <div
               className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer hover:border-gray-400 transition-all duration-200"
               style={{ 
                 background: isValidHex(customColorInput) 
                   ? customColorInput 
                   : 'linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FECA57 100%)'
               }}
               title={isValidHex(customColorInput) ? `${customColorInput} - Clique para escolher cor` : 'Clique para personalizar cor'}

              />
            </div>

             
             {/* Input no centro */}
             <input
               type="text"
               value={customColorInput}
               onChange={(e) => setCustomColorInput(e.target.value)}
               placeholder="#203246"
               className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#007AFF] text-sm font-mono"
               maxLength={7}
             />
             
             {/* Botão à direita */}
             <button
               onClick={handleAddCustomColor}
               disabled={!isValidHex(customColorInput) || customColors.includes(customColorInput.toUpperCase()) || predefinedColors.includes(customColorInput)}
               className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0056CC] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 flex-shrink-0"
             >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="12" y1="5" x2="12" y2="19"/>
                 <line x1="5" y1="12" x2="19" y2="12"/>
               </svg>
               Criar cor
             </button>
           </div>


            {/* Lista de Cores Personalizadas */}
            {customColors.length > 0 && (
              <div className={`relative ${hasOverflow() ? 'px-[22px]' : 'px-0'}`}>
               {/* Seta Esquerda - Sempre visível quando há overflow */}
               {hasOverflow() && ( 

                 <button
                   onClick={scrollLeft}
                  disabled={!showLeftArrow}
                  className={`absolute -left-2 top-[28px] -translate-y-1/2 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 flex items-center justify-center transition-all duration-200 ${
                    !showLeftArrow ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
                  }`}

                 >
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                     <polyline points="15,18 9,12 15,6"/>
                   </svg>
                 </button>
               )}
               
               {/* Container das Cores com Scroll */}
               <div 
                 ref={carouselRef}
className="flex gap-2 overflow-x-auto scrollbar-hide py-3"


                 onScroll={checkArrows}
                 style={{
                   scrollbarWidth: 'none',
                   msOverflowStyle: 'none'
                 }}
               >
                 {customColors.map((color, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 group pl-[3px]"
                  >
                    <button
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-lg border transition-all duration-200 hover:scale-105 ${
                        newTagColor === color
                          ? 'border-2 border-[#007AFF] shadow-md ring-2 ring-[#007AFF]/20'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    
                    {/* Botão de Remover - Aparece no Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomColor(color);
                      }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm z-10 transform translate-x-1 -translate-y-1"
                      title="Remover cor"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>

                 ))}
               </div>
               
               {/* Seta Direita - Sempre visível quando há overflow */}
               {hasOverflow() && (

                 <button
                   onClick={scrollRight}
                                     disabled={!showRightArrow}
                  className={`absolute -right-2 top-[28px] -translate-y-1/2 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 flex items-center justify-center transition-all duration-200 ${
                    !showRightArrow ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
                  }`}

                 >
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                     <polyline points="9,18 15,12 9,6"/>
                   </svg>
                 </button>
               )}
             </div>
           )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 shrink-0 mt-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddTag}
              disabled={newTagName.trim() === ''}
              className="px-6 py-2.5 bg-[#007AFF] text-white rounded-xl font-medium text-sm hover:bg-[#0056CC] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isEditMode ? 'Salvar Alterações' : 'Criar Tag'}
            </button>
          </div>
        </div>
      </div>
    </div>
	
	   {/* Modal de Confirmação de Exclusão */}
   {showDeleteConfirm && (
     <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[200]">
       <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100">
         <div className="text-center">
           {/* Ícone centralizado no topo */}
           <div className="flex justify-center mb-4">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                 <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                 <line x1="12" y1="9" x2="12" y2="13"/>
                 <line x1="12" y1="17" x2="12.01" y2="17"/>
               </svg>
             </div>
           </div>
           
           {/* Título centralizado */}
           <h3 className="text-lg font-semibold text-gray-900 mb-3">
             Confirmar exclusão
           </h3>
           
           {/* Mensagem centralizada */}
           <p className="text-sm text-gray-600 mb-8 leading-relaxed">
             Tem certeza que deseja excluir esta cor personalizada? Esta ação não pode ser desfeita.
           </p>
         </div>
         
         <div className="flex gap-4 mt-6">
           <button
             onClick={handleCancelDelete}
             className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
           >
             Cancelar
           </button>
           <button 
             onClick={handleConfirmDelete}
             className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
           >
             Confirmar
           </button>
         </div>
       </div>
     </div>
   )}

	</>
  );
};

export default ModalCriarTag;