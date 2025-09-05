import React from 'react';
import { AlertCircle, RefreshCw, FileX } from 'lucide-react';
import type { ErrorStateProps } from '../types';

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  details,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {/* Ícone de erro */}
      <div className="relative mb-4">
        <FileX className="w-16 h-16 text-red-400" />
        <AlertCircle className="w-6 h-6 absolute -top-1 -right-1 text-red-500 bg-white rounded-full" />
      </div>
      
      {/* Mensagem principal */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      
      {/* Detalhes do erro */}
      {details && (
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {details}
        </p>
      )}
      
      {/* Botão de tentar novamente */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      )}
      
      {/* Dicas de solução */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Possíveis soluções:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1 text-left">
          <li>• Verifique se o arquivo não está corrompido</li>
          <li>• Confirme se o formato é suportado</li>
          <li>• Tente recarregar a página</li>
          <li>• Verifique sua conexão com a internet</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorState;