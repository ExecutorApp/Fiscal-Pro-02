import React from 'react';
import { MenuItem } from './1.GerenciarDocumentos';
import { NovaCategoria } from './Modal-CriarCategoria';
import { saveImage, validateImageFileRobust } from '../../utils/dbImages';

// Função para extrair nome e extensão do arquivo
export const extractFileNameAndExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: fileName, extension: '' };
  }
  return {
    name: fileName.substring(0, lastDotIndex),
    extension: fileName.substring(lastDotIndex)
  };
};

// Função para gerar ID único robusto
export const generateUniqueId = (prefix: string = 'item') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const counter = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}-${counter}`;
};

// Função para adicionar novo item
export const addNewItem = (
  parentId: string, 
  type: 'pasta' | 'arquivo' | 'subcategoria' | 'empresa',
  getCurrentData: () => MenuItem[],
  setCurrentData: (data: MenuItem[]) => void
) => {
  const newItem: MenuItem = {
    id: `${parentId}-${Date.now()}`,
    label: type === 'pasta' ? 'Nova Pasta' : 
           type === 'empresa' ? 'Nova Empresa' :
           type === 'subcategoria' ? 'Nova Subcategoria' : 'Novo Arquivo.pdf',
    type: type === 'subcategoria' ? undefined : type,
    children: type === 'subcategoria' || type === 'pasta' || type === 'empresa' ? [] : undefined
  };

  const addItemRecursive = (items: MenuItem[]): MenuItem[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          children: [...(item.children || []), newItem],
          isExpanded: true
        };
      }
      if (item.children) {
        return {
          ...item,
          children: addItemRecursive(item.children)
        };
      }
      return item;
    });
  };
  
  setCurrentData(addItemRecursive(getCurrentData()));
};

// Função para fazer upload de arquivos
export const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>, 
  parentId: string,
  setUploadingFiles: React.Dispatch<React.SetStateAction<Set<string>>>,
  setCurrentData: (data: MenuItem[]) => void,
  getCurrentData: () => MenuItem[],
  fileInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement }>
) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // Marcar como fazendo upload
  setUploadingFiles(prev => new Set([...prev, parentId]));

  try {
    // Validar arquivos
    const validFiles = Array.from(files).filter(file => {
      // Verificar tamanho (máximo 50MB por arquivo)
      if (file.size > 50 * 1024 * 1024) {
        console.warn(`Arquivo "${file.name}" é muito grande (máximo 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      console.warn('Nenhum arquivo válido selecionado');
      return;
    }

    // Processar arquivos e salvar imagens no IndexedDB
    const timestamp = Date.now();
    const newFiles: MenuItem[] = [];

    for (let index = 0; index < validFiles.length; index++) {
      const file = validFiles[index];
      const fileId = `file-${parentId}-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      
      let menuItem: MenuItem = {
        id: fileId,
        label: file.name,
        type: 'arquivo' as const,
        isExpanded: false
      };

      // Verificar se é uma imagem JPEG/PNG com validação robusta
      const validation = await validateImageFileRobust(file);
      
      if (validation.isValid) {
        try {
          // Criar um novo File com o tipo correto se necessário
          let fileToSave = file;
          if (validation.detectedType && validation.detectedType !== file.type) {
            console.log(`🔧 [CORREÇÃO] Corrigindo tipo MIME de "${file.type}" para "${validation.detectedType}"`);
            fileToSave = new File([file], file.name, { 
              type: validation.detectedType,
              lastModified: file.lastModified 
            });
          }
          
          // Salvar imagem no IndexedDB
          const imageMetadata = await saveImage(fileToSave);
          
          // Adicionar metadados da imagem ao item do menu
          menuItem = {
            ...menuItem,
            // Campos específicos para imagens
            storageKey: imageMetadata.storageKey,
            imageType: imageMetadata.type,
            imageSize: imageMetadata.size,
            createdAt: imageMetadata.createdAt
          };
          
          console.log(`✅ Imagem "${file.name}" salva no IndexedDB com storageKey: ${imageMetadata.storageKey}`);

        } catch (error) {
          console.error(`❌ Erro ao salvar imagem "${file.name}":`, error);
          
          // Fallback: criar dataUrl para casos onde IndexedDB falha
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            menuItem = {
              ...menuItem,
              imageType: validation.detectedType || file.type,
              imageSize: file.size,
              createdAt: new Date().toISOString(),
              dataUrl: dataUrl
            };
            
            console.log(`⚠️ Fallback: Imagem "${file.name}" salva como dataUrl`);
          } catch (fallbackError) {
            console.error(`❌ Erro no fallback para "${file.name}":`, fallbackError);
          }
        }
      } else {
        // Para arquivos não-imagem (TXT, PDF, etc.), criar dataUrl
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          menuItem = {
            ...menuItem,
            fileType: file.type,
            fileSize: file.size,
            createdAt: new Date().toISOString(),
            dataUrl: dataUrl
          };
          
          console.log(`✅ Arquivo "${file.name}" processado com dataUrl (tipo: ${file.type})`);
        } catch (error) {
          console.error(`❌ Erro ao processar arquivo "${file.name}":`, error);
        }
      }

      newFiles.push(menuItem);
    }

    // Simular pequeno delay para garantir consistência
    await new Promise(resolve => setTimeout(resolve, 100));

    // Função recursiva para adicionar arquivos e expandir categoria pai
    const addFilesRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          // Expandir a categoria/pasta pai automaticamente
          return {
            ...item,
            children: [...(item.children || []), ...newFiles],
            isExpanded: true
          };
        }
        if (item.children) {
          return {
            ...item,
            children: addFilesRecursive(item.children)
          };
        }
        return item;
      });
    };

    // Atualizar estado com força total
    const currentData = getCurrentData();
    const newData = addFilesRecursive([...currentData]);
    // Forçar re-render completo
    const finalData = JSON.parse(JSON.stringify(newData));
    setCurrentData(finalData);

    console.log(`✅ ${validFiles.length} arquivo(s) enviado(s) com sucesso para ${parentId}`);

  } catch (error) {
    console.error('Erro no upload:', error);
  } finally {
    // Limpar input para permitir re-upload do mesmo arquivo
    if (fileInputRefs.current[parentId]) {
      fileInputRefs.current[parentId].value = '';
    }
    
    // Remover da lista de upload após pequeno delay
    setTimeout(() => {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    }, 200);
  }
};

// Função para editar categoria
export const handleEditarCategoria = (
  categoria: MenuItem,
  setCategoriaEditando: React.Dispatch<React.SetStateAction<MenuItem | null>>,
  setModoEdicao: React.Dispatch<React.SetStateAction<'criar' | 'editar'>>,
  setTipoModal: React.Dispatch<React.SetStateAction<'categoria' | 'subcategoria'>>,
  setShowCriarCategoriaModal: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setCategoriaEditando(categoria);
  setModoEdicao('editar');
  setTipoModal('categoria');
  setShowCriarCategoriaModal(true);
};

// Função para editar subcategoria
export const handleEditarSubcategoria = (
  subcategoria: MenuItem,
  setCategoriaEditando: React.Dispatch<React.SetStateAction<MenuItem | null>>,
  setModoEdicao: React.Dispatch<React.SetStateAction<'criar' | 'editar'>>,
  setTipoModal: React.Dispatch<React.SetStateAction<'categoria' | 'subcategoria'>>,
  setCategoriaPaiId: React.Dispatch<React.SetStateAction<string | null>>,
  setShowCriarCategoriaModal: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setCategoriaEditando(subcategoria);
  setModoEdicao('editar');
  setTipoModal('subcategoria');
  setCategoriaPaiId(null); // Não precisa do pai ao editar
  setShowCriarCategoriaModal(true);
};

// Função para criar subcategoria
export const handleCriarSubcategoria = (
  categoriaPaiId: string,
  setCategoriaEditando: React.Dispatch<React.SetStateAction<MenuItem | null>>,
  setModoEdicao: React.Dispatch<React.SetStateAction<'criar' | 'editar'>>,
  setTipoModal: React.Dispatch<React.SetStateAction<'categoria' | 'subcategoria'>>,
  setCategoriaPaiId: React.Dispatch<React.SetStateAction<string | null>>,
  setShowCriarCategoriaModal: React.Dispatch<React.SetStateAction<boolean>>
) => {
  console.log('🟡 handleCriarSubcategoria EXECUTADA');
  console.log('🆔 handleCriarSubcategoria chamada com ID:', categoriaPaiId);
  
  if (!categoriaPaiId) {
    console.error('ERRO: categoriaPaiId está vazio!');
    return;
  }

  setCategoriaEditando(null);
  setModoEdicao('criar');
  setTipoModal('subcategoria');
  setCategoriaPaiId(categoriaPaiId);
  console.log('🟡 categoriaPaiId definido como:', categoriaPaiId);
  setShowCriarCategoriaModal(true);
};

// Função para salvar nova categoria
export const handleSalvarNovaCategoria = (
  novaCategoria: NovaCategoria,
  modoEdicao: 'criar' | 'editar',
  categoriaEditando: MenuItem | null,
  tipoModal: 'categoria' | 'subcategoria',
  categoriaPaiId: string | null,
  getCurrentData: () => MenuItem[],
  setCurrentData: (data: MenuItem[]) => void,
  numeracaoAutomatica: boolean,
  renumerarItens: (items: MenuItem[], autoNumerar: boolean) => MenuItem[],
  activeTab: 'fisica' | 'juridica',
  saveToLocalStorage: (key: string, data: any) => void,
  STORAGE_KEY_JURIDICA: string,
  STORAGE_KEY_FISICA: string,
  setCategoriaEditando: React.Dispatch<React.SetStateAction<MenuItem | null>>,
  setModoEdicao: React.Dispatch<React.SetStateAction<'criar' | 'editar'>>,
  setTipoModal: React.Dispatch<React.SetStateAction<'categoria' | 'subcategoria'>>,
  setShowCriarCategoriaModal: React.Dispatch<React.SetStateAction<boolean>>,
  setCategoriaPaiId: React.Dispatch<React.SetStateAction<string | null>>,

) => {
  console.log('=== handleSalvarNovaCategoria CHAMADA ===');
  console.log('Timestamp:', Date.now());
  console.log('Nova categoria:', novaCategoria);

  if (modoEdicao === 'editar' && categoriaEditando) {
    // Lógica para editar categoria existente
    const updateCategoriaRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === categoriaEditando.id) {
          let label = novaCategoria.titulo;

          if (novaCategoria.estilo === 'numerado') {
            if (!numeracaoAutomatica) {
              const numeroManual = novaCategoria.numeroManual || 
                (categoriaEditando.label.match(/^\d{2}\s/) ? 
                  categoriaEditando.label.substring(0, 2) : '01');
              const numeroFormatado = /^\d+$/.test(numeroManual) ? 
                numeroManual.padStart(2, '0') : numeroManual;
              label = `${numeroFormatado} ${novaCategoria.titulo}`;
            }
            
            return {
              ...item,
              label: label,
              showNumber: true,
              numberBgColor: novaCategoria.numeracao?.corFundo,
              numberTextColor: novaCategoria.numeracao?.corTexto,
              folderColor: undefined,
              folderType: undefined
            };
          } else if (novaCategoria.estilo === 'pasta') {
            return {
              ...item,
              label: novaCategoria.titulo,
              showNumber: false,
              numberBgColor: undefined,
              numberTextColor: undefined,
              folderColor: novaCategoria.pasta?.cor || '#6B7280',
              folderType: novaCategoria.pasta?.tipo || 'transparente'
            };
          } else {
            return {
              ...item,
              label: novaCategoria.titulo,
              showNumber: false,
              numberBgColor: undefined,
              numberTextColor: undefined,
              folderColor: undefined,
              folderType: undefined
            };
          }
        }
        if (item.children) {
          return {
            ...item,
            children: updateCategoriaRecursive(item.children)
          };
        }
        return item;
      });
    };
    
    const updatedData = updateCategoriaRecursive(getCurrentData());
    let dataFinal = updatedData;
    
    if (numeracaoAutomatica) {
      const temItensNumerados = updatedData.some(item => item.showNumber === true);
      if (temItensNumerados) {
        dataFinal = renumerarItens(updatedData, true);
      }
    }

    setCurrentData(dataFinal);
    
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }

    setCategoriaEditando(null);
    setModoEdicao('criar');
    setTipoModal('categoria');
    setShowCriarCategoriaModal(false);
    return;
  }
  
  // Criar subcategoria
  if (tipoModal === 'subcategoria' && categoriaPaiId) {
   console.log('?? Iniciando criação de subcategoria');
   console.log('?? Categoria pai ID:', categoriaPaiId);
   console.log('?? Título da nova subcategoria:', novaCategoria.titulo);

    let label = novaCategoria.titulo;
    
    if (novaCategoria.estilo === 'numerado' && !numeracaoAutomatica) {
      const numeroFinal = novaCategoria.numeroManual || '01';
      const numeroFormatado = /^\d+$/.test(numeroFinal) ? 
        numeroFinal.padStart(2, '0') : numeroFinal;
      label = `${numeroFormatado} ${novaCategoria.titulo}`;
    }
    
    const novaSubcategoria: MenuItem = {
      id: generateUniqueId('subcategoria'),
      label,
      type: 'pasta',
      showNumber: novaCategoria.estilo === 'numerado',
      numberBgColor: novaCategoria.estilo === 'numerado' ? 
        novaCategoria.numeracao?.corFundo : undefined,
      numberTextColor: novaCategoria.estilo === 'numerado' ? 
        novaCategoria.numeracao?.corTexto : undefined,
      folderColor: novaCategoria.estilo === 'pasta' ? 
        novaCategoria.pasta?.cor : undefined,
      folderType: novaCategoria.estilo === 'pasta' ? 
        novaCategoria.pasta?.tipo : undefined,
      children: [],
      isExpanded: false
    };

    console.log('🔧 Nova subcategoria criada:', novaSubcategoria);

    const adicionarSubcategoria = (items: MenuItem[]): MenuItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === categoriaPaiId) {
		console.log('🎯 Categoria pai encontrada:', items[i].label);
          const novoItem = { ...items[i] };
          const childrenAtuais = novoItem.children || [];
          
         // Verificar se já existe uma pasta com o mesmo título (ignorando numeração)
         const tituloNovo = novaCategoria.titulo.toLowerCase().trim();
         const jaExiste = childrenAtuais.some(child => {
           if (child.type !== 'pasta') return false;
           
           // Extrair título do label existente (remover numeração se houver)
           let tituloExistente = child.label;
           if (child.label.match(/^\d{2}\s/)) {
             tituloExistente = child.label.substring(3);
           }
           
           return tituloExistente.toLowerCase().trim() === tituloNovo;
         });

          
          if (jaExiste) {
            console.log('⚠️ Pasta com mesmo título já existe, ignorando criação');
            return items;
          }
          
		  console.log('✅ Adicionando nova subcategoria à categoria pai');
          novoItem.children = [...childrenAtuais, novaSubcategoria];

          novoItem.isExpanded = true;
          const novosItems = [...items];
          novosItems[i] = novoItem;
          return novosItems;
        }
        if (items[i].children) {
          const novosFilhos = adicionarSubcategoria(items[i].children!);
          if (novosFilhos !== items[i].children) {
            const novosItems = [...items];
            novosItems[i] = { ...items[i], children: novosFilhos };
            return novosItems;
          }
        }
      }
      return items;
    };
    
    const newData = adicionarSubcategoria(getCurrentData());
	
	   // Verificar se houve mudança nos dados
   const dadosOriginais = getCurrentData();
   if (JSON.stringify(newData) === JSON.stringify(dadosOriginais)) {
     console.log('?? Nenhuma mudança detectada, provavelmente item duplicado foi ignorado');
     setShowCriarCategoriaModal(false);
     setCategoriaPaiId(null);
     setTipoModal('categoria');
     return;
   }
    
    // Renumerar se necessário
    let dataFinal = newData;
    if (numeracaoAutomatica) {
      dataFinal = renumerarItens(newData, true);
    }
    
	console.log('💾 Salvando dados finais');
    setCurrentData(dataFinal);
    
	// Salvar no localStorage
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, dataFinal);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, dataFinal);
    }

    setShowCriarCategoriaModal(false);
    setCategoriaPaiId(null);
    setTipoModal('categoria');
    return;
  }
  
  // Criar categoria raiz - APENAS se não for subcategoria
  if (tipoModal !== 'subcategoria') {
    const currentData = getCurrentData();
    let label = novaCategoria.titulo;

    if (novaCategoria.estilo === 'numerado') {
      if (!numeracaoAutomatica) {
        const numeroManual = novaCategoria.numeroManual || '01';
        const numeroFormatado = /^\d+$/.test(numeroManual) ? 
          numeroManual.padStart(2, '0') : numeroManual;
        label = `${numeroFormatado} ${novaCategoria.titulo}`;
      }
    }
    
    const novaItem: MenuItem = {
      id: `categoria-${Date.now()}`,
      label,
      type: 'categoria',
      viewMode: 'sanfona',
      showNumber: novaCategoria.estilo === 'numerado',
      numberBgColor: novaCategoria.estilo === 'numerado' ? 
        novaCategoria.numeracao?.corFundo : undefined,
      numberTextColor: novaCategoria.estilo === 'numerado' ? 
        novaCategoria.numeracao?.corTexto : undefined,
      folderColor: novaCategoria.estilo === 'pasta' ? 
        novaCategoria.pasta?.cor : undefined,
      folderType: novaCategoria.estilo === 'pasta' ? 
        novaCategoria.pasta?.tipo : undefined,
      children: [],
      isExpanded: false
    };
    
    let newData = [...currentData, novaItem];
    
    // Renumerar se necessário
    if (numeracaoAutomatica && novaCategoria.estilo === 'numerado') {
      newData = renumerarItens(newData, true);
    }
    
    setCurrentData(newData);
    
    if (activeTab === 'juridica') {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, newData);
    } else {
      saveToLocalStorage(STORAGE_KEY_FISICA, newData);
    }

    setShowCriarCategoriaModal(false);
  }
};

// Função para iniciar edição inline
export const startEditing = (
  itemId: string, 
  itemLabel: string,
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingText: React.Dispatch<React.SetStateAction<string>>,
  setOriginalText: React.Dispatch<React.SetStateAction<string>>,
  setOriginalExtension: React.Dispatch<React.SetStateAction<string>>
) => {
  setEditingItemId(itemId);
  const { name, extension } = extractFileNameAndExtension(itemLabel);
  setEditingText(name);
  setOriginalText(name);
  setOriginalExtension(extension);
};

// Função para salvar edição inline
export const saveEdit = (
  editingItemId: string | null,
  editingText: string,
  originalExtension: string,
  getCurrentData: () => MenuItem[],
  setCurrentData: (data: MenuItem[]) => void,
  numeracaoAutomatica: boolean,
  renumerarItens: (items: MenuItem[], autoNumerar: boolean) => MenuItem[],
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingText: React.Dispatch<React.SetStateAction<string>>
) => {
  if (!editingItemId || !editingText.trim()) {
    cancelEdit(setEditingItemId, setEditingText);
    return;
  }

  const updateItemLabel = (items: MenuItem[]): MenuItem[] => {
    return items.map(item => {
      if (item.id === editingItemId) {
        const newLabel = editingText.trim() + originalExtension;
        return { ...item, label: newLabel };
      }
      if (item.children) {
        return {
          ...item,
          children: updateItemLabel(item.children)
        };
      }
      return item;
    });
  };

  const newData = updateItemLabel(getCurrentData());
  // Renumerar apenas se numeração automática estiver ativa
  const dataFinal = numeracaoAutomatica ? renumerarItens(newData, true) : newData;
  setCurrentData(dataFinal);
  
  setEditingItemId(null);
  setEditingText('');
};

// Função para cancelar edição inline
export const cancelEdit = (
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingText: React.Dispatch<React.SetStateAction<string>>
) => {
  setEditingItemId(null);
  setEditingText('');
};