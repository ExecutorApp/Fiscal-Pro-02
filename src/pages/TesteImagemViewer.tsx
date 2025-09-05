import React, { useState } from 'react';
import { saveImage, validateImageFile, listImages, getImageURL, revokeImageURL } from '../utils/dbImages';
import ImageViewer from '../components/VisualizarDocumentos/ImageViewer';
import { ImageMetadata } from '../utils/dbImages';

const TesteImagemViewer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [uploading, setUploading] = useState(false);

  // Carregar lista de imagens
  const loadImages = async () => {
    try {
      const imageList = await listImages();
      setImages(imageList);
      console.log('📋 Imagens carregadas:', imageList);
    } catch (error) {
      console.error('❌ Erro ao carregar imagens:', error);
    }
  };

  // Upload de imagem
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (validateImageFile(file)) {
          console.log('📤 Fazendo upload:', file.name);
          const metadata = await saveImage(file);
          console.log('✅ Upload concluído:', metadata);
        } else {
          console.warn('⚠️ Arquivo não é uma imagem válida:', file.name);
        }
      }
      await loadImages(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro no upload:', error);
    } finally {
      setUploading(false);
      e.target.value = ''; // Limpar input
    }
  };

  // Selecionar imagem
  const selectImage = (image: ImageMetadata) => {
    console.log('🖼️ Selecionando imagem:', image);
    setSelectedImage(image);
  };

  // Carregar imagens ao montar o componente
  React.useEffect(() => {
    loadImages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Teste do ImageViewer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Painel de controle */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Controles</h2>
              
              {/* Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload de Imagem
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && (
                  <p className="text-sm text-blue-600 mt-2">Fazendo upload...</p>
                )}
              </div>
              
              {/* Lista de imagens */}
              <div>
                <h3 className="text-lg font-medium mb-3">Imagens ({images.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {images.map((image) => (
                    <button
                      key={image.storageKey}
                      onClick={() => selectImage(image)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedImage?.storageKey === image.storageKey
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{image.name}</div>
                      <div className="text-xs text-gray-500">
                        {image.type} • {Math.round(image.size / 1024)}KB
                      </div>
                    </button>
                  ))}
                  {images.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhuma imagem encontrada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualizador */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-96 lg:h-[600px]">
              {selectedImage ? (
                <ImageViewer
                  metadata={selectedImage}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      Selecione uma imagem
                    </h3>
                    <p className="text-gray-400">
                      Faça upload ou escolha uma imagem da lista para visualizar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesteImagemViewer;