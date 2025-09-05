import React from 'react'

interface ModalConfirmarExclusaoProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  nomeSegmento: string
}

const TrashIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

export const ModalConfirmarExclusao: React.FC<ModalConfirmarExclusaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nomeSegmento
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <TrashIcon size={24} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Confirmar Remoção
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          Tem certeza que deseja remover o segmento <strong>"{nomeSegmento}"</strong>?
        </p>
        
        <p className="text-sm text-red-600 text-center mb-6">
          Esta ação não pode ser desfeita.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
          >
            Confirmar Remoção
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmarExclusao