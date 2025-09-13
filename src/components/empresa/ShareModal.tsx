import React, { useState, useEffect } from 'react';
import { X, Share2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileUrl?: string;
}

type ShareStatus = 'idle' | 'sharing' | 'success' | 'error';
type ShareMethod = 'web-share' | 'whatsapp-desktop' | 'whatsapp-web';

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, fileName, fileUrl }) => {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [currentMethod, setCurrentMethod] = useState<ShareMethod | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Limpar URL quando o modal fechar para evitar vazamentos de memória
  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Detectar suporte à Web Share API
  const detectWebShareSupport = (): boolean => {
    return 'share' in navigator && 'canShare' in navigator;
  };

  // Compartilhar via Web Share API nativa
  const shareViaWebAPI = async (): Promise<boolean> => {
    try {
      const shareData = {
        title: 'Compartilhar Arquivo',
        text: `Confira este arquivo: ${fileName || 'BD-IncentivosF iscais.txt'}`,
        url: fileUrl || window.location.href
      };

      if (navigator.canShare && !navigator.canShare(shareData)) {
        return false;
      }

      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.log('Web Share API falhou:', error);
      return false;
    }
  };

  // Compartilhar via WhatsApp (Desktop ou Web)
  const shareViaWhatsApp = async (method: 'desktop' | 'web'): Promise<boolean> => {
    try {
      let messageText = `Olá! Compartilho com você o arquivo: ${fileName || "BD-IncentivosF iscais.txt"}`;
      
      // Se temos uma URL do arquivo, incluir na mensagem
      if (fileUrl) {
        messageText += `\n\nLink do arquivo: ${fileUrl}`;
      }
      
      messageText += `\n\nEste arquivo contém informações importantes sobre incentivos fiscais.\n\nAtenciosamente,\nEquipe Fiscal Pro`;
      
      const message = encodeURIComponent(messageText);
      
      if (method === 'desktop') {
        // Tentar WhatsApp Desktop
        const desktopUrl = `whatsapp://send?text=${message}`;
        window.location.href = desktopUrl;
        
        // Aguardar um pouco para ver se o app abre
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      } else {
        // WhatsApp Web
        const webUrl = `https://web.whatsapp.com/send?text=${message}`;
        window.open(webUrl, '_blank', 'noopener,noreferrer');
        return true;
      }
    } catch (error) {
      console.log(`WhatsApp ${method} falhou:`, error);
      return false;
    }
  };

  // Executar fluxo de compartilhamento
  const executeShare = async () => {
    setShareStatus('sharing');
    setErrorMessage('');

    try {
      // 1. Tentar Web Share API primeiro
      if (detectWebShareSupport()) {
        setCurrentMethod('web-share');
        const webShareSuccess = await shareViaWebAPI();
        if (webShareSuccess) {
          setShareStatus('success');
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        }
      }

      // 2. Tentar WhatsApp Desktop
      setCurrentMethod('whatsapp-desktop');
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequena pausa para feedback visual
      
      const desktopSuccess = await shareViaWhatsApp('desktop');
      if (desktopSuccess) {
        setShareStatus('success');
        setTimeout(() => {
          onClose();
        }, 1500);
        return;
      }

      // 3. Fallback para WhatsApp Web
      setCurrentMethod('whatsapp-web');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const webSuccess = await shareViaWhatsApp('web');
      if (webSuccess) {
        setShareStatus('success');
        setTimeout(() => {
          onClose();
        }, 1500);
        return;
      }

      // Se chegou até aqui, algo deu errado
      throw new Error('Nenhum método de compartilhamento funcionou');
      
    } catch (error) {
      setShareStatus('error');
      setErrorMessage('Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.');
      setCurrentMethod(null);
    }
  };

  // Executar compartilhamento automaticamente quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setShareStatus('idle');
      setCurrentMethod(null);
      setErrorMessage('');
      
      // Pequeno delay para melhor UX
      const timer = setTimeout(() => {
        executeShare();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Tentar novamente
  const handleRetry = () => {
    executeShare();
  };

  // Obter texto do status atual
  const getStatusText = (): string => {
    if (shareStatus === 'sharing') {
      switch (currentMethod) {
        case 'web-share':
          return 'Tentando painel nativo de compartilhamento...';
        case 'whatsapp-desktop':
          return 'Abrindo WhatsApp Desktop...';
        case 'whatsapp-web':
          return 'Abrindo WhatsApp Web...';
        default:
          return 'Preparando compartilhamento...';
      }
    }
    
    if (shareStatus === 'success') {
      return 'WhatsApp aberto com sucesso!';
    }
    
    if (shareStatus === 'error') {
      return errorMessage;
    }
    
    return 'Abrindo WhatsApp...';
  };

  // Obter ícone do status
  const getStatusIcon = () => {
    if (shareStatus === 'sharing') {
      return <Loader2 className="w-8 h-8 text-green-600 animate-spin" />;
    }
    
    if (shareStatus === 'success') {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    }
    
    if (shareStatus === 'error') {
      return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
    
    return <Share2 className="w-8 h-8 text-green-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Compartilhar via WhatsApp</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Content */}
        <div className="text-center py-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>

          {/* Status Text */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {shareStatus === 'success' ? 'Sucesso!' : 
             shareStatus === 'error' ? 'Erro' : 'Compartilhando...'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {getStatusText()}
          </p>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Arquivo:</span> {fileName || 'BD-IncentivosF iscais.txt'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {shareStatus === 'error' && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                shareStatus === 'error' 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {shareStatus === 'success' ? 'Fechar' : 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;