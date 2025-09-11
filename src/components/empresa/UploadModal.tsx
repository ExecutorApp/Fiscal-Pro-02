import React, { useState } from 'react';
import { X, Upload, FileText, Video, Music, FileImage, ChevronDown } from 'lucide-react';
import type { AnexosTabKey } from './EmpresaDetails';
import type { LucideIcon } from 'lucide-react';

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
  { value: 'produto1', label: 'Produto 1' },
  { value: 'produto2', label: 'Produto 2' },
  { value: 'produto3', label: 'Produto 3' },
];

const FASE_OPCOES = [
  { value: 'fase1', label: 'Fase 1' },
  { value: 'fase2', label: 'Fase 2' },
  { value: 'fase3', label: 'Fase 3' },
];

const ATIVIDADE_OPCOES = [
  { value: 'atividade1', label: 'Atividade 1' },
  { value: 'atividade2', label: 'Atividade 2' },
  { value: 'atividade3', label: 'Atividade 3' },
];

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

  const handleClose = () => {
    setSelectedFiles([]);
    setMetadata({ produto: '', fase: '', atividade: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] mx-4 overflow-hidden flex flex-col">
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
                  <div className="relative">
                    <select
                      value={metadata.produto}
                      onChange={(e) => setMetadata(prev => ({ ...prev, produto: e.target.value }))}
                      className="w-full px-3 py-2 pr-[40px] border border-gray-300 rounded-lg focus:ring-0,5 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:outline-none appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {PRODUTO_OPCOES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fase *
                  </label>
                  <div className="relative">
                    <select
                      value={metadata.fase}
                      onChange={(e) => setMetadata(prev => ({ ...prev, fase: e.target.value }))}
                      className="w-full px-3 py-2 pr-[40px] border border-gray-300 rounded-lg focus:ring-0,5 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:outline-none appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {FASE_OPCOES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atividade *
                  </label>
                  <div className="relative">
                    <select
                      value={metadata.atividade}
                      onChange={(e) => setMetadata(prev => ({ ...prev, atividade: e.target.value }))}
                      className="w-full px-3 py-2 pr-[40px] border border-gray-300 rounded-lg focus:ring-0,5 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:outline-none appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {ATIVIDADE_OPCOES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
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