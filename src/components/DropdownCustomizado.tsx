import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownCustomizadoProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DropdownCustomizado: React.FC<DropdownCustomizadoProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    if (optionValue === '----------') {
      onChange('');
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value || value === '') return placeholder;
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={`dropdown-customizado ${className}`} ref={dropdownRef}>
      <div
        className={`dropdown-trigger ${
          disabled ? 'disabled' : ''
        } ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        title={getDisplayValue()}
      >
        <span className={`dropdown-value ${!value ? 'placeholder' : ''}`}>
          {truncateText(getDisplayValue())}
        </span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="#6b7280"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="m6 8 4 4 4-4"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="dropdown-options">
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`dropdown-option ${
                option.value === value ? 'selected' : ''
              } ${index < options.length - 1 ? 'with-border' : ''}`}
              onClick={() => handleOptionClick(option.value)}
              title={option.label}
            >
              {truncateText(option.label)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownCustomizado;