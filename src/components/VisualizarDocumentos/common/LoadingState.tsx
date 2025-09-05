import React from 'react';
import { Loader2, FileText } from 'lucide-react';
import type { LoadingStateProps } from '../types';

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  progress,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-gray-600 ${className}`}>
      {/* Ícone de loading animado */}
      <div className="relative mb-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <FileText className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400" />
      </div>
      
      {/* Mensagem */}
      <p className="text-lg font-medium mb-2">{message}</p>
      
      {/* Barra de progresso se fornecida */}
      {typeof progress === 'number' && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Skeleton para conteúdo */}
      <div className="w-full max-w-md mt-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
};

export default LoadingState;