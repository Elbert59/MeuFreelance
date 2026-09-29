import {
  Contract,
  ContractStatus,
  Freelancer,
  CategoryId,
  ContractReview,
  UserSession,
  ShiftOpportunity,
  ChatMessage,
  WalletTransaction,
} from '../types';
import {
  FREELANCERS,
  INITIAL_CONTRACTS,
  MOCK_COMPANIES,
  INITIAL_OPPORTUNITIES,
  INITIAL_CHAT_MESSAGES,
} from '../data/mockData';

const STORAGE_KEYS = {
  CONTRACTS: 'chefmatch_contracts_v2',
  FREELANCERS: 'chefmatch_freelancers_v2',
  COMPANIES: 'chefmatch_companies_v2',
  OPPORTUNITIES: 'chefmatch_opportunities_v2',
  MESSAGES: 'chefmatch_messages_v2',
};

// Safe storage loaders
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
}

let contractsStore: Contract[] = loadStorage(STORAGE_KEYS.CONTRACTS, [...INITIAL_CONTRACTS]);
let freelancersStore: Freelancer[] = loadStorage(STORAGE_KEYS.FREELANCERS, [...FREELANCERS]);
let companiesStore: UserSession[] = loadStorage(STORAGE_KEYS.COMPANIES, [...MOCK_COMPANIES]);
let opportunitiesStore: ShiftOpportunity[] = loadStorage(STORAGE_KEYS.OPPORTUNITIES, [...INITIAL_OPPORTUNITIES]);
let messagesStore: ChatMessage[] = loadStorage(STORAGE_KEYS.MESSAGES, [...INITIAL_CHAT_MESSAGES]);

export interface CreateContractPayload {
  freelancerId: string;
  companyId: string;
  companyName: string;
  companyCnpj: string;
  date: string;
  shiftHours: string;
  venueAddress: string;
  dailyRate: number;
  notes?: string;
}

export interface UpdateContractPayload {
  contractId: string;
  status?: ContractStatus;
  review?: {
    type: 'company' | 'freelancer';
    data: ContractReview;
  };
}

export interface RegisterCompanyPayload {
  name: string;
  cnpj: string;
  segment: string;
  location: string;
  responsibleName: string;
  phone: string;
  email: string;
  avatarIcon?: string;
  initialDeposit?: number;
}

export interface RegisterFreelancerPayload {
  name: string;
  identifier: string; // CPF ou MEI
  categoryId: CategoryId;
  role: string;
  specialty: string;
  dailyRate: number;
  location: string;
  experienceYears: number;
  skills: string[];
  gear: string[];
  certifications: string[];
  bio: string;
  availableDays: string[];
  phone: string;
  email: string;
  pixKey: string;
}

export const api = {
  /**
   * GET /api/freelancers
   */
  async getFreelancers(params?: { categoryId?: CategoryId; search?: string }): Promise<Freelancer[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    let list = [...freelancersStore];

    if (params?.categoryId) {
      list = list.filter((f) => f.categoryId === params.categoryId);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.role.toLowerCase().includes(q) ||
          f.specialty.toLowerCase().includes(q) ||
          f.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  },

  /**
   * POST /api/freelancers (Cadastro de Novo Freelancer)
   */
  async registerFreelancer(payload: RegisterFreelancerPayload): Promise<Freelancer> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const colorVariants = [
      'bg-rose-900 text-rose-200',
      'bg-amber-900 text-amber-200',
      'bg-violet-900 text-violet-200',
      'bg-orange-900 text-orange-200',
      'bg-emerald-900 text-emerald-200',
    ];
    const randomColor = colorVariants[Math.floor(Math.random() * colorVariants.length)];

    const newFreelancer: Freelancer = {
      id: `freela-${Date.now()}`,
      name: payload.name,
      role: payload.role,
      categoryId: payload.categoryId,
      specialty: payload.specialty,
      rating: 5.0,
      reviewsCount: 1,
      completedGigs: 0,
      hourlyRate: Math.round(payload.dailyRate / 6),
      dailyRate: payload.dailyRate,
      location: payload.location,
      experienceYears: payload.experienceYears,
      verified: true,
      avatarUrl: '',
      avatarFallbackColor: randomColor,
      skills: payload.skills,
      gear: payload.gear,
      certifications: payload.certifications,
      bio: payload.bio,
      availableDays: payload.availableDays,
      immediateAvailable: true,
    };

    freelancersStore = [newFreelancer, ...freelancersStore];
    saveStorage(STORAGE_KEYS.FREELANCERS, freelancersStore);

    return newFreelancer;
  },

  /**
   * GET /api/companies
   */
  async getCompanies(): Promise<UserSession[]> {
    return [...companiesStore];
  },

  /**
   * POST /api/companies (Cadastro de Nova Empresa CNPJ)
   */
  async registerCompany(payload: RegisterCompanyPayload): Promise<UserSession> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newCompany: UserSession = {
      role: 'EMPRESA',
      id: `comp-${Date.now()}`,
      name: payload.name,
      identifier: payload.cnpj,
      avatar: payload.avatarIcon || '🍽️',
      location: payload.location,
      walletBalance: payload.initialDeposit || 3500,
      email: payload.email,
      phone: payload.phone,
    };

    companiesStore = [newCompany, ...companiesStore];
    saveStorage(STORAGE_KEYS.COMPANIES, companiesStore);

    return newCompany;
  },

  /**
   * GET /api/contracts
   */
  async getContracts(params?: { companyId?: string; freelancerId?: string }): Promise<Contract[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let list = [...contractsStore];

    if (params?.companyId) {
      list = list.filter((c) => c.companyId === params.companyId);
    } else if (params?.freelancerId) {
      list = list.filter((c) => c.freelancerId === params.freelancerId);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * POST /api/contracts (Criação com Depósito em Escrow)
   */
  async createContract(payload: CreateContractPayload): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const freelancer = freelancersStore.find((f) => f.id === payload.freelancerId);
    if (!freelancer) {
      throw new Error('Profissional não encontrado');
    }

    const escrowFee = Math.round(payload.dailyRate * 0.08);
    const totalAmount = payload.dailyRate + escrowFee;
    const now = new Date().toISOString();

    const newContract: Contract = {
      id: `CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      freelancerId: freelancer.id,
      freelancerName: freelancer.name,
      freelancerRole: freelancer.role,
      freelancerAvatar: freelancer.avatarUrl,
      companyId: payload.companyId,
      companyName: payload.companyName,
      companyCnpj: payload.companyCnpj,
      categoryId: freelancer.categoryId,
      date: payload.date,
      shiftHours: payload.shiftHours,
      venueAddress: payload.venueAddress,
      dailyRate: payload.dailyRate,
      escrowFee,
      totalAmount,
      status: 'PAGO_E_RETIDO',
      createdAt: now,
      paidAt: now,
      notes: payload.notes,
    };

    contractsStore = [newContract, ...contractsStore];
    saveStorage(STORAGE_KEYS.CONTRACTS, contractsStore);

    // Initial message in chat
    const initialMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      contractId: newContract.id,
      senderRole: 'EMPRESA',
      senderName: payload.companyName,
      content: `Olá ${freelancer.name}! Contrato firmado com diária de R$ ${payload.dailyRate} retida em cofre Escrow. Te aguardamos às ${payload.shiftHours.split(' ')[0]}!`,
      timestamp: now,
    };
    messagesStore = [...messagesStore, initialMsg];
    saveStorage(STORAGE_KEYS.MESSAGES, messagesStore);

    return newContract;
  },

  /**
   * PATCH /api/contracts
   */
  async updateContract(payload: UpdateContractPayload): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const index = contractsStore.findIndex((c) => c.id === payload.contractId);
    if (index === -1) {
      throw new Error('Contrato não encontrado');
    }

    const current = contractsStore[index];
    const updated = { ...current };
    const now = new Date().toISOString();

    if (payload.status) {
      updated.status = payload.status;
      if (payload.status === 'CHECKIN_REALIZADO') updated.checkInAt = now;
      if (payload.status === 'CONCLUIDO') updated.checkOutAt = now;
      if (payload.status === 'VALOR_LIBERADO') updated.releasedAt = now;
    }

    if (payload.review) {
      if (payload.review.type === 'company') {
        updated.companyReview = payload.review.data;
      } else {
        updated.freelancerReview = payload.review.data;
      }
    }

    contractsStore[index] = updated;
    saveStorage(STORAGE_KEYS.CONTRACTS, contractsStore);

    return updated;
  },

  /**
   * GET /api/opportunities (Mural de Diárias Urgentes)
   */
  async getOpportunities(): Promise<ShiftOpportunity[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return [...opportunitiesStore];
  },

  /**
   * POST /api/opportunities (Publicar Nova Diária Urgente)
   */
  async createOpportunity(opp: Omit<ShiftOpportunity, 'id' | 'createdAt' | 'status' | 'slotsRemaining'>): Promise<ShiftOpportunity> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const newOpp: ShiftOpportunity = {
      ...opp,
      id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      slotsRemaining: opp.slotsTotal,
      status: 'ABERTA',
    };
    opportunitiesStore = [newOpp, ...opportunitiesStore];
    saveStorage(STORAGE_KEYS.OPPORTUNITIES, opportunitiesStore);
    return newOpp;
  },

  /**
   * Freelancer aceita oportunidade -> gera contrato automático em Escrow
   */
  async applyToOpportunity(opportunityId: string, freelancer: Freelancer): Promise<Contract> {
    const opp = opportunitiesStore.find((o) => o.id === opportunityId);
    if (!opp) throw new Error('Oportunidade não encontrada');

    // Create contract
    const contract = await this.createContract({
      freelancerId: freelancer.id,
      companyId: opp.companyId,
      companyName: opp.companyName,
      companyCnpj: opp.companyCnpj,
      date: opp.date,
      shiftHours: opp.shiftHours,
      venueAddress: opp.venueAddress,
      dailyRate: opp.dailyRate,
      notes: `Vaga originada do Mural de Diárias: ${opp.roleTitle}`,
    });

    opp.slotsRemaining = Math.max(0, opp.slotsRemaining - 1);
    if (opp.slotsRemaining === 0) opp.status = 'PREENCHIDA';
    saveStorage(STORAGE_KEYS.OPPORTUNITIES, opportunitiesStore);

    return contract;
  },

  /**
   * Chat messages for contract
   */
  async getChatMessages(contractId: string): Promise<ChatMessage[]> {
    return messagesStore.filter((m) => m.contractId === contractId);
  },

  async sendChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    messagesStore = [...messagesStore, newMsg];
    saveStorage(STORAGE_KEYS.MESSAGES, messagesStore);
    return newMsg;
  },

  /**
   * Reset store helper
   */
  async resetAll(): Promise<void> {
    localStorage.clear();
    contractsStore = [...INITIAL_CONTRACTS];
    freelancersStore = [...FREELANCERS];
    companiesStore = [...MOCK_COMPANIES];
    opportunitiesStore = [...INITIAL_OPPORTUNITIES];
    messagesStore = [...INITIAL_CHAT_MESSAGES];
  },
};
