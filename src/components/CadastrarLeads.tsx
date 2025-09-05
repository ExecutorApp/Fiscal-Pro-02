import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import EmpresasScreen, { EmpresasScreenHandle } from './empresa/EmpresasScreen';
import { SecaoFamiliaV2 } from './SecaoFamiliaV2';
import { verificarDadosAntigos, migrarDadosParaNovaVersao } from '../utils/limparDadosAntigos';
import { criarDadosFamiliaresVazios } from '../types/familia';

type CadastrarLeadsProps = {
  onClose: () => void;
  onLeadSaved?: (savedLead: any, action?: 'create' | 'edit') => void;
  editingClient?: any;
};

export default function CadastrarLeads({ onClose, onLeadSaved, editingClient }: CadastrarLeadsProps) {
  const [userPhoto, setUserPhoto] = useState("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDAgMi42MzItNS4zMDRjMS4wODYtLjMzNSAxLjg4Ni0xLjMzOCAxLjg4Ni0yLjUzdi0zLjU0NmMwLS43OC0uMzQ3LTEuNDc3LS44ODYtMS45NjV2LTUuMTI2czEuMDUzLTcuOTc3LTkuNzUtNy45NzctOS43NSA3Ljk3Ny05Ljc1IDcuOTc3djUuMTI2YTIuNjQ0IDIuNjQ0IDAgMCAwLS44ODYgMS45NjV2My41NDZjMCAuOTM0LjQ5MSAxLjc1NiAxLjIyNiAyLjIzMS44ODYgMy44NTcgMy4yMDYgNi42MzMgMy4yMDYgNi42MzN2My4yNGEzLjIzMiAzLjIzMiAwIDAgMS0xLjY4NCAyLjgzM3oiIHN0eWxlPSIiIGZpbGw9IiNlN2VjZWQiIGRhdGEtb3JpZ2luYWw9IiNlN2VjZWQiIGNsYXNzPSIiPjwvcGF0aD48cGF0aCBkPSJNMjYuOTUzLjAwNEMxMi4zMi0uMjQ2LjI1NCAxMS40MTQuMDA0IDI2LjA0Ny0uMTM4IDM0LjM0NCAzLjU2IDQxLjgwMSA5LjQ0OCA0Ni43NmE3LjA0MSA3LjA0MSAwIDAgMSAxLjI1Ny0uODk0bDcuOTA3LTQuMzEzYTMuMjMgMy4yMyAwIDAgMCAxLjY4My0yLjgzNXYtMy4yNHMtMi4zMjEtMi43NzYtMy4yMDYtNi42MzNhMi42NiAyLjY2IDAgMCAxLTEuMjI2LTIuMjMxdi0zLjU0NmMwLS43OC4zNDctMS40NzcuODg2LTEuOTY1di01LjEyNlMxNS42OTYgOCAyNi40OTkgOHM5Ljc1IDcuOTc3IDkuNzUgNy45Nzd2NS4xMjZjLjU0LjQ4OC44ODYgMS4xODUuODg2IDEuOTY1djMuNTQ2YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAxLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDNWMzguOGMwIDEuMjIzLjY5MSAyLjM0MiAxLjc4NSAyLjg4OGw4LjQ2NyA0LjIzM2E3LjA1IDcuMDUgMCAwIDEgMS4zOS45MzJjNS43MS00Ljc2MiA5LjM5OS0xMS44ODIgOS41MzYtMTkuOUM1My4yNDYgMTIuMzIgNDEuNTg3LjI1NCAyNi45NTMuMDA0eiIgc3R5bGU9IiIgZmlsbD0iIzU1NjA4MCIgZGF0YS1vcmlnaW5hbD0iIzU1NjA4MCIgY2xhc3M9IiI+PC9wYXRoPjwvZz48L3N2Zz4=");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const empresasRef = useRef<EmpresasScreenHandle>(null);
  
  // Estados para navegação do menu lateral
  const [activeSection, setActiveSection] = useState('dados-pessoais');
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  
  // Estados do formulário
  const [userNameState, setUserNameState] = useState("");
  const [cpfCnpjState, setCpfCnpjState] = useState("");
  const [whatsappState, setWhatsappState] = useState("");
  const [cityState, setCityState] = useState("");
  const [emailState, setEmailState] = useState("");
  const [stateState, setStateState] = useState("");
  const [cepState, setCepState] = useState("");
  const [bairroState, setBairroState] = useState("");
  const [streetState, setStreetState] = useState("");
  const [numberState, setNumberState] = useState("");

  // Estados para validação e feedback
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<Record<string, string>>({});
  
  // Estados para família
   const [dadosFamilia, setDadosFamilia] = useState(criarDadosFamiliaresVazios());
  
  // Estados para autocomplete de estados brasileiros
  const brazilianStates = [
    "AC - Acre",
    "AL - Alagoas", 
    "AP - Amapá",
    "AM - Amazonas",
    "BA - Bahia",
    "CE - Ceará",
    "DF - Distrito Federal",
    "ES - Espírito Santo",
    "GO - Goiás",
    "MA - Maranhão",
    "MT - Mato Grosso",
    "MS - Mato Grosso do Sul",
    "MG - Minas Gerais",
    "PA - Pará",
    "PB - Paraíba",
    "PR - Paraná",
    "PE - Pernambuco",
    "PI - Piauí",
    "RJ - Rio de Janeiro",
    "RN - Rio Grande do Norte",
    "RS - Rio Grande do Sul",
    "RO - Rondônia",
    "RR - Roraima",
    "SC - Santa Catarina",
    "SP - São Paulo",
    "SE - Sergipe",
    "TO - Tocantins"
  ];
  
  const [filteredStates, setFilteredStates] = useState(brazilianStates);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState("");

  // Itens do menu lateral
  const menuItems = [
    { 
      id: 'dados-pessoais', 
      label: 'Dados Pessoais', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    { 
      id: 'familia', 
      label: 'Família', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    { 
       id: 'canal-entrada', 
       label: 'Canal de entrada', 
       icon: (
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
           <path d="M4 7h3m0 0v10m0-10l3-3m-3 3l3 3"/>
           <path d="M20 17h-3m0 0V7m0 10l-3 3m3-3l-3-3"/>
           <path d="M12 14l1.5-1.5L12 11l-1.5 1.5L12 14z"/>
         </svg>
       )
     },
    { 
      id: 'empresas', 
      label: 'Empresas', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <path d="M9 9v.01"/>
          <path d="M9 12v.01"/>
          <path d="M9 15v.01"/>
          <path d="M16 12v.01"/>
          <path d="M16 15v.01"/>
        </svg>
      )
    },
    { 
      id: 'videos', 
      label: 'Vídeos', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      )
    },
    { 
      id: 'contadores', 
      label: 'Contadores', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v4"/>
          <path d="M15 1v4"/>
          <path d="M9 19v4"/>
          <path d="M15 19v4"/>
          <path d="M1 9h4"/>
          <path d="M1 15h4"/>
          <path d="M19 9h4"/>
          <path d="M19 15h4"/>
        </svg>
      )
    },
  ];

  // Função para obter título da seção ativa
  const getSectionTitle = () => {
    const item = menuItems.find(item => item.id === activeSection);
    return item ? item.label : 'Dados Pessoais';
  };

  // Pré-preenchimento para edição
  useEffect(() => {
    if (editingClient) {
      const formData = {
        name: editingClient.name || "",
        whatsapp: editingClient.whatsapp || "",
        email: editingClient.email || "",
        city: editingClient.city || "",
        estado: editingClient.estado || "",
        cep: editingClient.cep || "",
        bairro: editingClient.bairro || "",
        street: editingClient.street || "",
        number: editingClient.number || "",
        cpfCnpj: editingClient.cpfCnpj || "",
        photo: editingClient.photo || userPhoto
      };
      
      setUserNameState(formData.name);
      setWhatsappState(formData.whatsapp);
      setEmailState(formData.email);
      setCityState(formData.city);
      setStateState(formData.estado);
      setStateSearchTerm(formData.estado);
      setCepState(formData.cep);
      setBairroState(formData.bairro);
      setStreetState(formData.street);
      setNumberState(formData.number);
      setCpfCnpjState(formData.cpfCnpj);
      setUserPhoto(formData.photo);
      
      // Os dados da família serão carregados automaticamente pelo SecaoFamiliaV2
      
      setOriginalFormData(formData);
      setHasChanges(false);
    } else {
      const emptyFormData = {
        name: "",
        whatsapp: "",
        email: "",
        city: "",
        estado: "",
        cep: "",
        bairro: "",
        street: "",
        number: "",
        cpfCnpj: "",
        photo: userPhoto
      };
      
      setDadosFamilia(criarDadosFamiliaresVazios());
      setOriginalFormData(emptyFormData);
      setHasChanges(false);
    }
  }, [editingClient]);

  // Verificar e limpar dados antigos na inicialização
  useEffect(() => {
    const temDadosAntigos = verificarDadosAntigos();
    if (temDadosAntigos) {
      console.log('CadastrarLeads: Detectados dados antigos. Executando migração...');
      migrarDadosParaNovaVersao();
    }
  }, []);

  // Detectar mudanças no formulário
  const checkForChanges = () => {
    const currentFormData = {
      name: userNameState,
      whatsapp: whatsappState,
      email: emailState,
      city: cityState,
      estado: stateState,
      cep: cepState,
      bairro: bairroState,
      street: streetState,
      number: numberState,
      cpfCnpj: cpfCnpjState,
      photo: userPhoto
    };

    const hasFormChanges = Object.keys(currentFormData).some(key => {
      return currentFormData[key as keyof typeof currentFormData] !== (originalFormData[key] || "");
    });

    setHasChanges(hasFormChanges);
  };

  useEffect(() => {
    checkForChanges();
  }, [
    userNameState,
    whatsappState,
    emailState,
    cityState,
    stateState,
    cepState,
    bairroState,
    streetState,
    numberState,
    cpfCnpjState,
    userPhoto,
    originalFormData
  ]);

  // Validações
  const validateCpfCnpj = (value: string): boolean => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return validateCPF(cleanValue);
    } else if (cleanValue.length === 14) {
      return validateCNPJ(cleanValue);
    }
    return false;
  };

  const validateCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  };

  const validateCNPJ = (cnpj: string): boolean => {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(digits.charAt(1));
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getFormErrors = (): string[] => {
    const errors: string[] = [];
    
    if (!userNameState.trim()) {
      errors.push("Nome/Razão Social é obrigatório");
    }
    
    if (!cpfCnpjState.trim()) {
      errors.push("CPF/CNPJ é obrigatório");
    } else if (!validateCpfCnpj(cpfCnpjState)) {
      errors.push("CPF/CNPJ inválido");
    }
    
    if (!whatsappState.trim()) {
      errors.push("WhatsApp é obrigatório");
    }
    
    if (!emailState.trim()) {
      errors.push("Email é obrigatório");
    } else if (!isValidEmail(emailState)) {
      errors.push("Email inválido");
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    return getFormErrors().length === 0;
  };

  const formErrors = getFormErrors();

  // Funções de manipulação
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setUserPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCpfCnpj = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 11) {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatWhatsApp = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatCep = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleStateSearch = (value: string): void => {
    setStateSearchTerm(value);
    setStateState(value);
    
    if (value.trim() === '') {
      setFilteredStates(brazilianStates);
    } else {
      const filtered = brazilianStates.filter((state: string) => 
        state.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStates(filtered);
    }
    
    setShowStateDropdown(true);
  };

  const handleStateSelect = (state: string): void => {
    setStateState(state);
    setStateSearchTerm(state);
    setShowStateDropdown(false);
  };

  // Funções de salvamento
  const generateId = (): number => {
    return Date.now();
  };

  const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
  };

  const saveLeadToStorage = (leadData: any): any => {
    try {
      const existingLeads = JSON.parse(localStorage.getItem('fiscalpro_leads') || '[]');
      
      const newLead = {
        id: generateId(),
        name: leadData.name,
        photo: leadData.photo,
        whatsapp: leadData.whatsapp,
        estado: leadData.estado,
        email: leadData.email,
        city: leadData.city,
        cep: leadData.cep,
        bairro: leadData.bairro,
        street: leadData.street,
        number: leadData.number,
        cpfCnpj: leadData.cpfCnpj,
        formularios: 0,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
      
      existingLeads.push(newLead);
      localStorage.setItem('fiscalpro_leads', JSON.stringify(existingLeads));
      
      return newLead;
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      throw error;
    }
  };

  const updateLeadInStorage = (leadData: any): any => {
    try {
      const existingLeads = JSON.parse(localStorage.getItem('fiscalpro_leads') || '[]');
      
      const leadIndex = existingLeads.findIndex((lead: any) => lead.id === editingClient.id);
      
      if (leadIndex !== -1) {
        const updatedLead = {
          ...existingLeads[leadIndex],
          name: leadData.name,
          photo: leadData.photo,
          whatsapp: leadData.whatsapp,
          estado: leadData.estado,
          email: leadData.email,
          city: leadData.city,
          cep: leadData.cep,
          bairro: leadData.bairro,
          street: leadData.street,
          number: leadData.number,
          cpfCnpj: leadData.cpfCnpj,
          updatedAt: getCurrentTimestamp()
        };
        
        existingLeads[leadIndex] = updatedLead;
        localStorage.setItem('fiscalpro_leads', JSON.stringify(existingLeads));
        
        return updatedLead;
      } else {
        throw new Error('Lead não encontrado para atualização');
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  };

  const handleSaveLead = async (): Promise<void> => {
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }

    setIsSaving(true);
    setShowErrors(false);

    try {
      const leadData = {
        name: userNameState,
        photo: userPhoto,
        whatsapp: whatsappState,
        estado: stateState,
        email: emailState,
        city: cityState,
        cep: cepState,
        bairro: bairroState,
        street: streetState,
        number: numberState,
        cpfCnpj: cpfCnpjState
      };

      let savedLead;
      if (editingClient) {
          savedLead = updateLeadInStorage(leadData);
        } else {
          savedLead = saveLeadToStorage(leadData);
        }
        
        // Os dados da família são salvos automaticamente pelo SecaoFamiliaV2

      if (onLeadSaved) {
        onLeadSaved(savedLead, editingClient ? 'edit' : 'create');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = (): void => {
    if (hasChanges) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = (): void => {
    setShowConfirmCancel(false);
    onClose();
  };

  const handleBackToForm = (): void => {
    setShowConfirmCancel(false);
  };

  const handleCloseModal = (): void => {
    if (hasChanges) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  };

  // Componente de Dados Pessoais
  const DadosPessoaisContent = (): JSX.Element => (
    <div className="space-y-[16px]">
      {/* Exibição de Erros de Validação */}
      {showErrors && formErrors.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] p-[16px] mb-[20px]">
          <div className="flex items-center mb-[8px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="mr-[8px]">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h4 className="text-[14px] font-semibold text-[#DC2626] font-inter">
              Erro na validação
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-[4px]">
            {formErrors.map((error, index) => (
              <li key={index} className="text-[12px] text-[#DC2626] font-inter">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nome/Razão Social e CPF/CNPJ */}
      <div className="flex gap-[20px]">
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Nome/Razão Social *
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] mb-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o nome completo ou razão social"
            value={userNameState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserNameState(capitalizeWords(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            CPF/CNPJ *
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o CPF ou CNPJ"
            value={formatCpfCnpj(cpfCnpjState)}
            maxLength={18}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const cleanValue = e.target.value.replace(/\D/g, '');
              if (cleanValue.length <= 14) {
                setCpfCnpjState(cleanValue);
              }
            }}
          />
        </div>
      </div>

      {/* WhatsApp e Email */}
      <div className="flex gap-[20px]">
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            WhatsApp *
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="(00) 00000-0000"
            value={formatWhatsApp(whatsappState)}
            maxLength={15}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const cleanValue = e.target.value.replace(/\D/g, '');
              if (cleanValue.length <= 11) {
                setWhatsappState(cleanValue);
              }
            }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Email *
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o email"
            type="email"
            value={emailState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailState(e.target.value.toLowerCase())}
          />
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="flex gap-[20px]">
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Cidade
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite a cidade"
            value={cityState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCityState(capitalizeWords(e.target.value))}
          />
        </div>
        <div className="flex-1 relative">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Estado
          </label>
          <div className="relative">
            <Input
              className="h-[40px] px-[16px] py-[12px] pr-[40px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
              placeholder="Digite ou selecione o estado"
              value={stateSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStateSearch(e.target.value)}
              onFocus={() => setShowStateDropdown(true)}
            />
            <button
              type="button"
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className="absolute right-[12px] top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#374151] transition-colors"
            >
              <ChevronDown size={20} />
            </button>
            
            {showStateDropdown && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[#D8E0F0] rounded-[8px] shadow-lg z-50 max-h-[200px] overflow-y-auto">
                {filteredStates.map((state, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleStateSelect(state)}
                    className="w-full text-left px-[16px] py-[8px] hover:bg-[#F3F4F6] transition-colors text-[14px] font-inter"
                  >
                    {state}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CEP e Bairro */}
      <div className="flex gap-[20px]">
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            CEP
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="00000-000"
            value={formatCep(cepState)}
            maxLength={9}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const cleanValue = e.target.value.replace(/\D/g, '');
              if (cleanValue.length <= 8) {
                setCepState(cleanValue);
              }
            }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Bairro
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o bairro"
            value={bairroState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBairroState(capitalizeWords(e.target.value))}
          />
        </div>
      </div>

      {/* Endereço e Número */}
      <div className="flex gap-[20px]">
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Endereço
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] mb-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o nome do endereço"
            value={streetState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStreetState(capitalizeWords(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[14px] font-bold text-[#7D8592] mb-[6px] px-[6px] font-inter">
            Número
          </label>
          <Input
            className="h-[40px] px-[16px] py-[12px] text-[16px] text-[#1F2937] bg-white border-[#D8E0F0] rounded-[12px] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] font-inter"
            placeholder="Digite o número do endereço"
            value={numberState}
            maxLength={10}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberState(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    </div>
  );

  // Função para renderizar conteúdo baseado na seção ativa
  const renderSectionContent = (): JSX.Element => {
    switch (activeSection) {
      case 'dados-pessoais':
        return <DadosPessoaisContent />;
      case 'familia':
        return (
          <SecaoFamiliaV2
             dadosIniciais={dadosFamilia}
             onChange={setDadosFamilia}
             clienteId={editingClient?.id}
           />
        );
      case 'canal-entrada':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-lg font-semibold mb-2">Seção Canal de entrada</h3>
            <p className="text-sm text-center">Conteúdo em desenvolvimento</p>
          </div>
        );
      case 'empresas':
        return (
          <div className="h-full">
            <EmpresasScreen ref={empresasRef} />
          </div>
        );
      case 'videos':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-lg font-semibold mb-2">Seção Vídeos</h3>
            <p className="text-sm text-center">Conteúdo em desenvolvimento</p>
          </div>
        );
      case 'contadores':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-4">🧮</div>
            <h3 className="text-lg font-semibold mb-2">Seção Contadores</h3>
            <p className="text-sm text-center">Conteúdo em desenvolvimento</p>
          </div>
        );
      default:
        return <DadosPessoaisContent />;
    }
  };

  return (
    <>
      <style>{`
        .avatar-container {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .gradient-border {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, #1777CF, #3B82F6, #0EA5E9, #1777CF);
          background-size: 300% 300%;
          animation: gradientBorderMove 4s ease infinite;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-container {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .static-image {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 50%;
        }

        @keyframes gradientBorderMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }

        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
          border: none;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }

        .modern-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-full max-w-[calc(100vw-20px)] h-[calc(100vh-20px)] overflow-hidden bg-white rounded-[16px] flex shadow-lg relative">
          
          {/* Menu Lateral */}
          <div className={`${isMenuExpanded ? 'w-[200px]' : 'w-[60px]'} bg-[#1777CF] flex flex-col transition-all duration-300 ease-in-out`}>
            {/* Header do Menu com Avatar */}
            <div className="p-4 border-b border-[#1565C0] relative">
              {/* Botão de Toggle */}
              <button
                onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white z-10"
                title={isMenuExpanded ? 'Recolher menu' : 'Expandir menu'}
              >
                {isMenuExpanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
              </button>
              <div className={`flex flex-col items-center text-center transition-opacity duration-300 ${isMenuExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 {/* Avatar */}
                 <div className={`avatar-container mb-3 ${isMenuExpanded ? 'block' : 'hidden'}`}>
                  <div className="gradient-border">
                    <div className="image-container">
                      <img
                        src={userPhoto}
                        alt="Avatar"
                        className="static-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNTMgNTMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPjxwYXRoIGQ9Im0xOC42MTMgNDEuNTUyLTcuOTA3IDQuMzEzYTcuMTA2IDcuMTA2IDAgMCAwLTEuMjY5LjkwM0EyNi4zNzcgMjYuMzc3IDAgMCAwIDI2LjUgNTNjNi40NTQgMCAxMi4zNjctMi4zMSAxNi45NjQtNi4xNDRhNy4wMTUgNy4wMTUgMCAwIDAtMS4zOTQtLjkzNGwtOC40NjctNC4yMzNhMy4yMjkgMy4yMjkgMCAwIDEtMS43ODUtMi44ODh2LTMuMzIyYy4yMzgtLjI3MS41MS0uNjE5LjgwMS0xLjAzYTE5LjQ4MiAxOS40ODIgMCAwIDAgMi42MzItNS4zMDRjMS4wODYtLjMzNSAxLjg4Ni0xLjMzOCAxLjg4Ni0yLjUzdi0zLjU0NmMwLS43OC0uMzQ3LTEuNDc3LS44ODYtMS45NjV2LTUuMTI2czEuMDUzLTcuOTc3LTkuNzUtNy45NzctOS43NSA3Ljk3Ny05Ljc1IDcuOTc3djUuMTI2YTIuNjQ0IDIuNjQ0IDAgMCAwLS44ODYgMS45NjV2My41NDZjMCAuOTM0LjQ5MSAxLjc1NiAxLjIyNiAyLjIzMS44ODYgMy44NTcgMy4yMDYgNi42MzMgMy4yMDYgNi42MzN2My4yNGEzLjIzMiAzLjIzMiAwIDAgMS0xLjY4NCAyLjgzM3oiIHN0eWxlPSIiIGZpbGw9IiNlN2VjZWQiIGRhdGEtb3JpZ2luYWw9IiNlN2VjZWQiIGNsYXNzPSIiPjwvcGF0aD48cGF0aCBkPSJNMjYuOTUzLjAwNEMxMi4zMi0uMjQ2LjI1NCAxMS40MTQuMDA0IDI2LjA0Ny0uMTM4IDM0LjM0NCAzLjU2IDQxLjgwMSA5LjQ0OCA0Ni43NmE3LjA0MSA3LjA0MSAwIDAgMSAxLjI1Ny0uODk0bDcuOTA3LTQuMzEzYTMuMjMgMy4yMyAwIDAgMCAxLjY4My0yLjgzNXYtMy4yNHMtMi4zMjEtMi43NzYtMy4yMDYtNi42MzNhMi42NiAyLjY2IDAgMCAxLTEuMjI2LTIuMjMxdi0zLjU0NmMwLS43OC4zNDctMS40NzcuODg2LTEuOTY1di01LjEyNlMxNS42OTYgOCAyNi40OTkgOHM5Ljc1IDcuOTc3IDkuNzUgNy45Nzd2NS4xMjZjLjU0LjQ4OC44ODYgMS4xODUuODg2IDEuOTY1djMuNTQ2YzAgMS4xOTItLjggMi4xOTUtMS44ODYgMi41M2ExOS40ODIgMTkuNDgyIDAgMCAxLTIuNjMyIDUuMzA0Yy0uMjkxLjQxMS0uNTYzLjc1OS0uODAxIDEuMDNWMzguOGMwIDEuMjIzLjY5MSAyLjM0MiAxLjc4NSAyLjg4OGw4LjQ2NyA0LjIzM2E3LjA1IDcuMDUgMCAwIDEgMS4zOS45MzJjNS43MS00Ljc2MiA5LjM5OS0xMS44ODIgOS41MzYtMTkuOUM1My4yNDYgMTIuMzIgNDEuNTg3LjI1NCAyNi45NTMuMDA0eiIgc3R5bGU9IiIgZmlsbD0iIzU1NjA4MCIgZGF0YS1vcmlnaW5hbD0iIzU1NjA4MCIgY2xhc3M9IiI+PC9wYXRoPjwvZz48L3N2Zz4=';
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Botão de câmera */}
                  <button
                    onClick={handlePhotoClick}
                    className="absolute w-[24px] h-[24px] bottom-[-2px] right-[-2px] bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F9FAFB] transition-colors border border-[#E5E7EB] z-[100]"
                    title="Clique para alterar foto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 17 12" fill="none">
                      <path d="M15.1548 2.05714H12.6348C12.5151 2.05712 12.3972 2.02923 12.2917 1.97594C12.1861 1.92265 12.0961 1.84561 12.0297 1.75166L11.2228 0.610629C11.09 0.422794 10.91 0.268782 10.6989 0.162261C10.4878 0.0557398 10.2521 3.85815e-06 10.0126 0H7.2061C6.96666 3.85815e-06 6.73093 0.0557398 6.51982 0.162261C6.30871 0.268782 6.12875 0.422794 5.99592 0.610629L5.18901 1.75166C5.12262 1.84561 5.03265 1.92265 4.92709 1.97594C4.82154 2.02923 4.70366 2.05712 4.58392 2.05714H4.24574V1.71429C4.24574 1.62335 4.20743 1.53615 4.13923 1.47185C4.07104 1.40755 3.97854 1.37143 3.8821 1.37143H2.79119C2.69475 1.37143 2.60226 1.40755 2.53406 1.47185C2.46587 1.53615 2.42756 1.62335 2.42756 1.71429V2.05714H2.06392C1.67815 2.05714 1.30818 2.20163 1.0354 2.45882C0.762621 2.71602 0.609375 3.06485 0.609375 3.42857V10.6286C0.609375 10.9923 0.762621 11.3411 1.0354 11.5983C1.30818 11.8555 1.67815 12 2.06392 12H15.1548C15.5406 12 15.9106 11.8555 16.1833 11.5983C16.4561 11.3411 16.6094 10.9923 16.6094 10.6286V3.42857C16.6094 3.06485 16.4561 2.71602 16.1833 2.45882C15.9106 2.20163 15.5406 2.05714 15.1548 2.05714ZM8.60938 10.6286C7.78229 10.6286 6.97378 10.3973 6.28608 9.96408C5.59839 9.53083 5.06239 8.91504 4.74588 8.19458C4.42937 7.47412 4.34655 6.68134 4.50791 5.9165C4.66927 5.15166 5.06755 4.44911 5.65238 3.89769C6.23722 3.34627 6.98235 2.97075 7.79354 2.81862C8.60474 2.66648 9.44556 2.74456 10.2097 3.04299C10.9738 3.34141 11.6269 3.84678 12.0864 4.49518C12.5459 5.14358 12.7912 5.90589 12.7912 6.68571C12.7912 7.73142 12.3506 8.73431 11.5664 9.47374C10.7821 10.2132 9.71846 10.6286 8.60938 10.6286Z" fill="#3A3F51"/>
                      <path d="M8.60938 4.11429C8.06997 4.11429 7.54268 4.2651 7.09418 4.54765C6.64569 4.8302 6.29612 5.2318 6.0897 5.70167C5.88328 6.17154 5.82927 6.68857 5.93451 7.18737C6.03974 7.68618 6.29949 8.14437 6.6809 8.50399C7.06232 8.86361 7.54827 9.10851 8.07731 9.20773C8.60635 9.30695 9.15471 9.25603 9.65306 9.0614C10.1514 8.86678 10.5773 8.53719 10.877 8.11432C11.1767 7.69145 11.3366 7.19429 11.3366 6.68571C11.3366 6.00373 11.0493 5.34968 10.5378 4.86744C10.0264 4.3852 9.33269 4.11429 8.60938 4.11429Z" fill="#3A3F51"/>
                     </svg>
                   </button>
                   
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/jpeg,image/jpg,image/png,image/webp"
                     className="hidden"
                     onChange={handlePhotoChange}
                   />
                 </div>

                 {/* Nome e Telefone */}
                 <div className={`text-center ${isMenuExpanded ? 'block' : 'hidden'}`}>
                   <h3 className="text-white font-semibold text-sm truncate mb-1">
                     {userNameState || "Nome do Lead"}
                   </h3>
                   <p className="text-blue-200 text-xs truncate">
                     {formatWhatsApp(whatsappState) || "(00) 00000-0000"}
                   </p>
                 </div>
               </div>
             </div>

             {/* Lista de Navegação */}
             <div className="flex-1 overflow-y-auto modern-scrollbar">
               <nav className={`${isMenuExpanded ? 'p-2' : 'p-1'}`}>
                 {menuItems.map((item) => (
                   <div key={item.id} className="relative group">
                     <button
                       onClick={() => setActiveSection(item.id)}
                       className={`w-full flex items-center ${isMenuExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-3'} rounded-lg text-left transition-all duration-200 mb-1 ${
                         activeSection === item.id
                           ? 'bg-white/20 text-white font-medium'
                           : 'text-blue-100 hover:bg-white/10 hover:text-white'
                       }`}
                       title={!isMenuExpanded ? item.label : ''}
                     >
                       <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>
                       {isMenuExpanded && (
                         <span className="text-sm truncate transition-opacity duration-300" title={item.label}>
                           {item.label}
                         </span>
                       )}
                     </button>
                     
                     {/* Tooltip para menu recolhido */}
                     {!isMenuExpanded && (
                       <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                         {item.label}
                         <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                       </div>
                     )}
                   </div>
                 ))}
               </nav>
             </div>
           </div>

           {/* Área de Conteúdo */}
           <div className="flex-1 flex flex-col">
             {/* Header Fixo */}
             <div className="flex items-center p-4 border-b border-gray-200 bg-white gap-3">
               <h2 className="text-xl font-semibold text-gray-900 flex-1">
                 {getSectionTitle()}
               </h2>
               {activeSection === 'empresas' && (
                 <div className="flex items-center gap-2">
                   <Button
                     onClick={() => empresasRef.current?.openAddEmpresa?.()}
                     className="bg-[#1777CF] hover:bg-[#1565C0] text-white"
                   >
                     + Adicionar Empresa
                   </Button>
                   <Button
                     variant="outline"
                     onClick={() => empresasRef.current?.openGerenciarEstrutura?.()}
                   >
                     Gerenciar Estrutura
                   </Button>
                 </div>
               )}
               <button
                 onClick={handleCloseModal}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X size={20} />
               </button>
             </div>

             {/* Conteúdo com Scroll */}
             <div className="flex-1 overflow-y-auto modern-scrollbar p-6">
               {renderSectionContent()}
             </div>

             {/* Footer Fixo */}
             <div className="border-t border-gray-200 p-4 bg-white">
               <div className="flex justify-between items-center">
                 <Button
                   onClick={handleCancelClick}
                   disabled={isSaving}
                   className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                 >
                   Cancelar
                 </Button>
                 <Button
                   onClick={handleSaveLead}
                   disabled={isSaving}
                   className="px-6 py-2 bg-[#1777CF] hover:bg-[#1565C0] text-white rounded-lg transition-colors disabled:opacity-50"
                 >
                   {isSaving ? (
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       {editingClient ? 'Atualizando...' : 'Salvando...'}
                     </div>
                   ) : (
                     editingClient ? 'Salvar' : 'Salvar'
                   )}
                 </Button>
               </div>
             </div>
           </div>
         </div>
       </div>

       {/* Modal de Confirmação */}
       {showConfirmCancel && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] modal-overlay">
           <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw] modal-content">
             <div className="flex justify-center mb-4">
               <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                   <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                   <line x1="12" y1="9" x2="12" y2="13"/>
                   <line x1="12" y1="17" x2="12.01" y2="17"/>
                 </svg>
               </div>
             </div>
             <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
               Confirmar Cancelamento
             </h3>
             <p className="text-gray-600 text-center mb-6">
               Tem certeza que deseja cancelar? Todas as informações digitadas serão perdidas.
             </p>
             <div className="flex justify-end gap-3">
               <button
                 onClick={handleBackToForm}
                 className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
               >
                 Voltar e continuar editando
               </button>
               <button
                 onClick={handleConfirmCancel}
                 className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
               >
                 Descartar alterações
               </button>
             </div>
           </div>
         </div>
       )}
     </>
   );
}