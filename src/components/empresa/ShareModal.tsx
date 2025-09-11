import React from "react";

interface ShareModalProps {
  isOpen: boolean;
  fileName?: string;
  onClose: () => void;
}

// Placeholder: abre o WhatsApp Desktop via protocolo quando confirmar. Lista estática para layout.
const ShareModal: React.FC<ShareModalProps> = ({ isOpen, fileName, onClose }) => {
  if (!isOpen) return null;

  const shareViaWhatsApp = () => {
    // Protocolo simples para abrir WhatsApp (o envio real exigiria integração adicional)
    // Mantemos KISS e focamos no layout e fluxo conforme pedido.
    window.open(`whatsapp://send?text=${encodeURIComponent(fileName || "Arquivo")}`, "_self");
    onClose();
  };

  const contacts = [
    { id: 1, name: "Contato A" },
    { id: 2, name: "Contato B" },
    { id: 3, name: "Contato C" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold mb-2">Compartilhar com...</div>
        <input placeholder="Pesquisar" className="w-full border rounded px-3 py-2 mb-3" />
        <div className="max-h-60 overflow-auto border rounded">
          {contacts.map((c) => (
            <label key={c.id} className="flex items-center gap-2 p-2 border-b">
              <input type="checkbox" />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={shareViaWhatsApp} className="px-3 py-2 rounded bg-green-600 text-white">Compartilhar</button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;