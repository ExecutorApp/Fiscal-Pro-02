import React, { useState } from 'react';
import { X, Upload, FileText, Video, Music, FileImage } from 'lucide-react';
import type { AnexosTabKey } from './EmpresaDetails';
import type { LucideIcon } from 'lucide-react';
import DropdownCustomizado from '../DropdownCustomizado';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabType: AnexosTabKey;
  onUpload: (files: File[], metadata: UploadMetadata) => void;
}

interface UploadMetadata {
  produto: string;
  fase: string;
  atividade: string;
}

const PRODUTO_OPCOES = [
  { value: "hp", label: "Holding Patrimonial" },
  { value: "af", label: "Ativos Fundiários" },
  { value: "pt", label: "Planejamento Tributário" },
];

const FASE_OPCOES = [
  { value: "hp-f01", label: "HP - Fase 01" },
  { value: "hp-f02", label: "HP - Fase 02" },
  { value: "hp-f03", label: "HP - Fase 03" },
  { value: "af-f01", label: "AF - Fase 01" },
  { value: "af-f02", label: "AF - Fase 02" },
  { value: "af-f03", label: "AF - Fase 03" },
  { value: "pt-f01", label: "PT - Fase 01" },
  { value: "pt-f02", label: "PT - Fase 02" },
  { value: "pt-f03", label: "PT - Fase 03" },
];

const ATIVIDADE_OPCOES = [
  { value: "hp-f01-a01", label: "HP/F01 - Atividade 01" },
  { value: "hp-f01-a02", label: "HP/F01 - Atividade 02" },
  { value: "hp-f01-a03", label: "HP/F01 - Atividade 03" },
  { value: "hp-f02-a01", label: "HP/F02 - Atividade 01" },
  { value: "hp-f02-a02", label: "HP/F02 - Atividade 02" },
  { value: "hp-f02-a03", label: "HP/F02 - Atividade 03" },
  { value: "hp-f03-a01", label: "HP/F03 - Atividade 01" },
  { value: "hp-f03-a02", label: "HP/F03 - Atividade 02" },
  { value: "hp-f03-a03", label: "HP/F03 - Atividade 03" },
  { value: "af-f01-a01", label: "AF/F01 - Atividade 01" },
  { value: "af-f01-a02", label: "AF/F01 - Atividade 02" },
  { value: "af-f01-a03", label: "AF/F01 - Atividade 03" },
  { value: "af-f02-a01", label: "AF/F02 - Atividade 01" },
  { value: "af-f02-a02", label: "AF/F02 - Atividade 02" },
  { value: "af-f02-a03", label: "AF/F02 - Atividade 03" },
  { value: "af-f03-a01", label: "AF/F03 - Atividade 01" },
  { value: "af-f03-a02", label: "AF/F03 - Atividade 02" },
  { value: "af-f03-a03", label: "AF/F03 - Atividade 03" },
  { value: "pt-f01-a01", label: "PT/F01 - Atividade 01" },
  { value: "pt-f01-a02", label: "PT/F01 - Atividade 02" },
  { value: "pt-f01-a03", label: "PT/F01 - Atividade 03" },
  { value: "pt-f02-a01", label: "PT/F02 - Atividade 01" },
  { value: "pt-f02-a02", label: "PT/F02 - Atividade 02" },
  { value: "pt-f02-a03", label: "PT/F02 - Atividade 03" },
  { value: "pt-f03-a01", label: "PT/F03 - Atividade 01" },
  { value: "pt-f03-a02", label: "PT/F03 - Atividade 02" },
  { value: "pt-f03-a03", label: "PT/F03 - Atividade 03" },
];

// Funções auxiliares para extrair relacionamentos hierárquicos
const extractProdutoFromFase = (faseValue: string): string => {
  if (!faseValue) return "";
  const [produto] = faseValue.split("-");
  return produto;
};

const extractProdutoFromAtividade = (atividadeValue: string): string => {
  if (!atividadeValue) return "";
  const [produto] = atividadeValue.split("-");
  return produto;
};

const extractFaseFromAtividade = (atividadeValue: string): string => {
  if (!atividadeValue) return "";
  const parts = atividadeValue.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return "";
};

const getFilteredFases = (produtoValue: string) => {
  if (!produtoValue) {
    return FASE_OPCOES;
  }
  return FASE_OPCOES.filter(fase => 
    fase.value.startsWith(produtoValue + "-")
  );
};

const getFilteredAtividades = (produtoValue: string, faseValue: string) => {
  if (!produtoValue && !faseValue) {
    return ATIVIDADE_OPCOES;
  }
  
  if (faseValue) {
    return ATIVIDADE_OPCOES.filter(atividade => 
      atividade.value.startsWith(faseValue + "-")
    );
  }
  
  if (produtoValue) {
    return ATIVIDADE_OPCOES.filter(atividade => 
      atividade.value.startsWith(produtoValue + "-")
    );
  }
  
  return ATIVIDADE_OPCOES;
};

const FILE_TYPE_CONFIG: Record<AnexosTabKey, { title: string; icon: LucideIcon; accept: string; allowedTypes: string[]; description: string; }> = {
  videos: {
    title: 'Adicionar Vídeos',
    icon: Video,
    accept: 'video/*',
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'],
    description: 'Selecione arquivos de vídeo (MP4, AVI, MOV, WMV, MKV)'
  },
  audios: {
    title: 'Adicionar Áudios',
    icon: Music,
    accept: 'audio/*',
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/m4a'],
    description: 'Selecione arquivos de áudio (MP3, WAV, AAC, OGG, M4A)'
  },
  documentos: {
    title: 'Adicionar Documentos',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.txt,.rtf',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'],
    description: 'Selecione documentos (PDF, DOC, DOCX, TXT, RTF)'
  },
  formularios: {
    title: 'Adicionar Formulários',
    icon: FileImage,
    accept: '.pdf,.jpg,.jpeg,.png,.gif',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    description: 'Selecione formulários (PDF, JPG, PNG, GIF)'
  }
};

export default function UploadModal({ isOpen, onClose, tabType, onUpload }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<UploadMetadata>({
    produto: '',
    fase: '',
    atividade: ''
  });
  const [dragActive, setDragActive] = useState(false);

  // Opções filtradas baseadas na seleção hierárquica
  const fasesDisponiveis = getFilteredFases(metadata.produto);
  const atividadesDisponiveis = getFilteredAtividades(metadata.produto, metadata.fase);

  const config = FILE_TYPE_CONFIG[tabType];
  const IconComponent = config.icon;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (config.allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Arquivos não suportados: ${invalidFiles.join(', ')}`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos um arquivo');
      return;
    }

    if (!metadata.produto || !metadata.fase || !metadata.atividade) {
      alert('Preencha todos os campos obrigatórios: Produto, Fase e Atividade');
      return;
    }

    onUpload(selectedFiles, metadata);
    handleClose();
  };

  // Handlers para mudanças hierárquicas
  const handleProdutoChange = (value: string) => {
    const newMetadata = { ...metadata, produto: value };
    
    // Reset fase e atividade quando produto muda
    const novasFases = getFilteredFases(value);
    if (!novasFases.find(f => f.value === metadata.fase)) {
      newMetadata.fase = '';
      newMetadata.atividade = '';
    } else {
      // Verifica se a atividade atual ainda é válida
      const novasAtividades = getFilteredAtividades(value, metadata.fase);
      if (!novasAtividades.find(a => a.value === metadata.atividade)) {
        newMetadata.atividade = '';
      }
    }
    
    setMetadata(newMetadata);
  };

  const handleFaseChange = (value: string) => {
    const newMetadata = { ...metadata, fase: value };
    
    // Reset atividade quando fase muda
    const novasAtividades = getFilteredAtividades(metadata.produto, value);
    if (!novasAtividades.find(a => a.value === metadata.atividade)) {
      newMetadata.atividade = '';
    }
    
    setMetadata(newMetadata);
  };

  const handleAtividadeChange = (value: string) => {
    setMetadata(prev => ({ ...prev, atividade: value }));
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setMetadata({ produto: '', fase: '', atividade: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[900px] h-[700px] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <IconComponent className="w-6 h-6 text-[#1777CF]" />
            <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">Arraste arquivos aqui</p>
                <p className="text-sm text-gray-500">{config.description}</p>
                <div className="pt-2">
                  <label className="inline-flex items-center px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1777CF]/90 cursor-pointer transition-colors">
                    <span>Selecionar Arquivos</span>
                    <input
                      type="file"
                      multiple
                      accept={config.accept}
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Metadata Form */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informações Obrigatórias</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto *
                  </label>
                  <DropdownCustomizado
                    options={PRODUTO_OPCOES}
                    value={metadata.produto}
                    onChange={handleProdutoChange}
                    placeholder="Selecione o produto"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fase *
                  </label>
                  <DropdownCustomizado
                    options={fasesDisponiveis}
                    value={metadata.fase}
                    onChange={handleFaseChange}
                    placeholder="Selecione a fase"
                    className="w-full"
                    disabled={!metadata.produto}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atividade *
                  </label>
                  <DropdownCustomizado
                    options={atividadesDisponiveis}
                    value={metadata.atividade}
                    onChange={handleAtividadeChange}
                    placeholder="Selecione a atividade"
                    className="w-full"
                    disabled={!metadata.fase}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar for uploaded files */}
          <div className="w-80 border-l border-gray-200 bg-[#F4F4F4] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Arquivos Selecionados</h3>
              <p className="text-sm text-gray-500">({selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''})</p>
            </div>
            <div className="flex-1 overflow-y-auto px-[10px] my-[10px] ">
              {selectedFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Nenhum arquivo selecionado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <IconComponent className="w-5 h-5 text-[#1777CF] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0}
            className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1777CF]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar Arquivos ({selectedFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
}