import React from "react";
import { Pencil, Share2, Link as LinkIcon, Download, Trash2 } from "lucide-react";

interface EditBarProps {
  onRename: () => void;
  onShare: () => void;
  onLink: () => void;
  onDownload: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

const IconButton: React.FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] border transition-all mb-2 ${
      disabled
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const EditBar: React.FC<EditBarProps> = ({ onRename, onShare, onLink, onDownload, onDelete, disabled }) => {
  return (
    <div className="flex flex-col p-2 bg-white border border-[#E5E7EB] rounded-[10px] shadow-sm">
      <IconButton title="Renomear" onClick={onRename} disabled={disabled}>
        <Pencil className="w-4 h-4" />
      </IconButton>
      <IconButton title="Compartilhar" onClick={onShare} disabled={disabled}>
        <Share2 className="w-4 h-4" />
      </IconButton>
      <IconButton title="Vincular" onClick={onLink} disabled={disabled}>
        <LinkIcon className="w-4 h-4" />
      </IconButton>
      <div className="my-1 border-t border-[#E5E7EB]" />
      <IconButton title="Download" onClick={onDownload} disabled={disabled}>
        <Download className="w-4 h-4" />
      </IconButton>
      <IconButton title="Excluir" onClick={onDelete} disabled={disabled}>
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  );
};

export default EditBar;