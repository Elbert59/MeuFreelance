export type Role = 'EMPRESA' | 'FREELANCER';

export type CategoryId = 
  | 'cozinha-oriental'
  | 'salao-atendimento'
  | 'bar-bebidas'
  | 'parrilla-churrasco'
  | 'cozinha-quente';

export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  tagline: string;
  iconName: string;
  gradient: string;
  badge: string;
  freelancerCount: number;
  highlightRoles: string[];
}

export interface Freelancer {
  id: string;
  name: string;
  role: string;
  categoryId: CategoryId;
  specialty: string;
  rating: number;
  reviewsCount: number;
  completedGigs: number;
  hourlyRate: number;
  dailyRate: number; // Preço da Diária
  location: string;
  experienceYears: number;
  verified: boolean;
  avatarUrl: string;
  avatarFallbackColor: string;
  skills: string[];
  gear: string[]; // Equipamentos próprios (ex: Faca Yanagiba, Avental, Coqueteleira)
  certifications: string[]; // ex: Boas Práticas ANVISA
  bio: string;
  availableDays: string[];
  immediateAvailable: boolean;
}

export type ContractStatus = 
  | 'AGUARDANDO'
  | 'PAGO_E_RETIDO'
  | 'CHECKIN_REALIZADO'
  | 'CONCLUIDO'
  | 'VALOR_LIBERADO';

export interface ContractReview {
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerRole: string;
  freelancerAvatar: string;
  companyId: string;
  companyName: string;
  companyCnpj: string;
  categoryId: CategoryId;
  date: string;
  shiftHours: string; // ex: '18:00 - 00:00'
  venueAddress: string;
  dailyRate: number;
  escrowFee: number;
  totalAmount: number;
  status: ContractStatus;
  createdAt: string;
  paidAt?: string;
  checkInAt?: string;
  checkOutAt?: string;
  releasedAt?: string;
  freelancerReview?: ContractReview;
  companyReview?: ContractReview;
  notes?: string;
  escrowHash?: string; // Hash criptográfico de custódia antifraude (SHA-256)
  auditTrail?: Array<{ timestamp: string; action: string; details?: string }>;

  // PROTEÇÃO ANTIFRAUDE & CUMPRIMENTO DE HORÁRIO OBRIGATÓRIO
  checkInPin?: string; // PIN seguro de 4 dígitos gerado pelo restaurante para validar presença física
  checkOutPin?: string; // PIN seguro de 4 dígitos fornecido pelo gerente para aprovar liberação de saída
  minShiftDurationMinutes?: number; // Duração mínima calculada do expediente (em minutos)
  workedMinutes?: number; // Minutos reais trabalhados
  shiftComplianceStatus?: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO_NO_HORARIO' | 'SAIDA_ANTECIPADA_AUTORIZADA' | 'HORARIO_INCOMPLETO' | 'FINALIZADO_PELO_GERENTE';
  managerApprovedOut?: boolean; // Validação expressa do contratante
  earlyExitReason?: string; // Justificativa auditável em caso de saída antecipada autorizada
  termsAcceptedAt?: string; // Data/Hora do aceite formal do Contrato de Prestação de Serviços (Freelance)
  contractTermsSigned?: boolean; // Confirmação de assinatura digital das cláusulas contratuais
}

export interface UserSession {
  role: Role;
  id: string;
  name: string;
  identifier: string; // CNPJ ou CPF/MEI
  avatar: string;
  location: string;
  walletBalance?: number;
  phone?: string;
  email?: string;
  pixKey?: string;
}

export interface ShiftOpportunity {
  id: string;
  companyId: string;
  companyName: string;
  companyCnpj: string;
  categoryId: CategoryId;
  roleTitle: string;
  description: string;
  date: string;
  shiftHours: string;
  venueAddress: string;
  dailyRate: number;
  escrowTotal: number;
  requiredSkills: string[];
  slotsTotal: number;
  slotsRemaining: number;
  createdAt: string;
  urgent: boolean;
  status: 'ABERTA' | 'PREENCHIDA' | 'CANCELADA';
}

export interface ChatMessage {
  id: string;
  contractId: string;
  senderRole: Role;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'DEPOSITO_ESCROW' | 'LIBERACAO_PIX' | 'ESTORNO_ESCROW' | 'SAQUE_PIX';
  amount: number;
  description: string;
  timestamp: string;
  contractId?: string;
  status: 'CONCLUIDO' | 'PROCESSANDO';
}

