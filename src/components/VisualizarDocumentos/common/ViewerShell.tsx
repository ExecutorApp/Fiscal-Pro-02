import React from 'react';
import type { ViewerShellProps } from '../types';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const ViewerShell: React.FC<ViewerShellProps> = ({
  children,
  toolbar,
  loading = false,
  loadingMessage,
  loadingProgress,
  error,
  onRetry,
  className = ''
}) => {
  return (
    <div 
      className={`w-full h-full flex flex-col bg-white ${className}`}
      role="main"
      aria-label="Visualizador de documento"
    >
      {/* Toolbar */}
      {toolbar}
      
      {/* Conteúdo principal */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <LoadingState 
            message={loadingMessage}
            progress={loadingProgress}
          />
        ) : error ? (
          <ErrorState 
            message="Erro ao carregar documento"
            details={error}
            onRetry={onRetry}
          />
        ) : (
          <div 
            className="w-full h-full"
            tabIndex={0}
            role="document"
            aria-label="Conteúdo do documento"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerShell;