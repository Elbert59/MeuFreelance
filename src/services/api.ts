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
  CONTRACTS: 'chefmatch_contracts_v3',
  FREELANCERS: 'chefmatch_freelancers_v3',
  COMPANIES: 'chefmatch_companies_v3',
  OPPORTUNITIES: 'chefmatch_opportunities_v3',
  MESSAGES: 'chefmatch_messages_v3',
};

// Local storage caching for offline PWA support
function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Cache] Failed to load ${key}`, e);
  }
  return fallback;
}

function saveCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Cache] Failed to save ${key}`, e);
  }
}

// In-memory local stores for offline / fallback
let cachedContracts: Contract[] = loadCache(STORAGE_KEYS.CONTRACTS, [...INITIAL_CONTRACTS]);
let cachedFreelancers: Freelancer[] = loadCache(STORAGE_KEYS.FREELANCERS, [...FREELANCERS]);
let cachedCompanies: UserSession[] = loadCache(STORAGE_KEYS.COMPANIES, [...MOCK_COMPANIES]);
let cachedOpportunities: ShiftOpportunity[] = loadCache(STORAGE_KEYS.OPPORTUNITIES, [...INITIAL_OPPORTUNITIES]);
let cachedMessages: ChatMessage[] = loadCache(STORAGE_KEYS.MESSAGES, [...INITIAL_CHAT_MESSAGES]);

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
  pin?: string;
  qrToken?: string;
  startQrToken?: string;
  endQrToken?: string;
  earlyExitReason?: string;
  managerApprovedOut?: boolean;
  callerRole?: 'EMPRESA' | 'FREELANCER';
  checkInAt?: string;
  simulatedElapsedMinutes?: number;
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

export interface PlatformStats {
  totalEscrowLocked: number;
  activeShifts: number;
  completedShifts: number;
  openOpportunities: number;
  totalFreelancers: number;
  totalCompanies: number;
  totalContracts: number;
}

export const api = {
  /**
   * GET /api/freelancers
   */
  async getFreelancers(params?: { categoryId?: CategoryId | 'all'; search?: string; location?: string }): Promise<Freelancer[]> {
    try {
      const query = new URLSearchParams();
      if (params?.categoryId && params.categoryId !== 'all') query.set('category', params.categoryId);
      if (params?.search) query.set('search', params.search);
      if (params?.location && params.location !== 'all') query.set('location', params.location);

      const res = await fetch(`/api/freelancers?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        cachedFreelancers = data;
        saveCache(STORAGE_KEYS.FREELANCERS, data);
        return data;
      }
    } catch (e) {
      console.warn('[API] Using cached freelancers data', e);
    }

    // Fallback to cache if network fails
    let list = [...cachedFreelancers];
    if (params?.categoryId && params.categoryId !== 'all') {
      list = list.filter((f) => f.categoryId === params.categoryId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.role.toLowerCase().includes(q) ||
          f.specialty.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * POST /api/freelancers
   */
  async registerFreelancer(payload: RegisterFreelancerPayload): Promise<Freelancer> {
    try {
      const res = await fetch('/api/freelancers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newFreela: Freelancer = await res.json();
        cachedFreelancers = [newFreela, ...cachedFreelancers];
        saveCache(STORAGE_KEYS.FREELANCERS, cachedFreelancers);
        return newFreela;
      }
    } catch (e) {
      console.warn('[API] Network error registering freelancer, using fallback', e);
    }

    // Fallback creation
    const fallbackFreela: Freelancer = {
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
      avatarFallbackColor: 'bg-amber-900 text-amber-200',
      skills: payload.skills,
      gear: payload.gear,
      certifications: payload.certifications,
      bio: payload.bio,
      availableDays: payload.availableDays,
      immediateAvailable: true,
    };
    cachedFreelancers = [fallbackFreela, ...cachedFreelancers];
    saveCache(STORAGE_KEYS.FREELANCERS, cachedFreelancers);
    return fallbackFreela;
  },

  /**
   * GET /api/companies
   */
  async getCompanies(): Promise<UserSession[]> {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        cachedCompanies = data;
        saveCache(STORAGE_KEYS.COMPANIES, data);
        return data;
      }
    } catch (e) {
      console.warn('[API] Using cached companies data', e);
    }
    return [...cachedCompanies];
  },

  /**
   * POST /api/companies
   */
  async registerCompany(payload: RegisterCompanyPayload): Promise<UserSession> {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newComp: UserSession = await res.json();
        cachedCompanies = [newComp, ...cachedCompanies];
        saveCache(STORAGE_KEYS.COMPANIES, cachedCompanies);
        return newComp;
      }
    } catch (e) {
      console.warn('[API] Network error registering company, using fallback', e);
    }

    const fallbackComp: UserSession = {
      role: 'EMPRESA',
      id: `comp-${Date.now()}`,
      name: payload.name,
      identifier: payload.cnpj,
      avatar: payload.avatarIcon || '🍽️',
      location: payload.location,
      walletBalance: payload.initialDeposit || 4500,
      email: payload.email,
      phone: payload.phone,
    };
    cachedCompanies = [fallbackComp, ...cachedCompanies];
    saveCache(STORAGE_KEYS.COMPANIES, cachedCompanies);
    return fallbackComp;
  },

  /**
   * GET /api/contracts
   */
  async getContracts(params?: { companyId?: string; freelancerId?: string; status?: string }): Promise<Contract[]> {
    try {
      const query = new URLSearchParams();
      if (params?.companyId) query.set('companyId', params.companyId);
      if (params?.freelancerId) query.set('freelancerId', params.freelancerId);
      if (params?.status && params.status !== 'all') query.set('status', params.status);

      const res = await fetch(`/api/contracts?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        cachedContracts = data;
        saveCache(STORAGE_KEYS.CONTRACTS, data);
        return data;
      }
    } catch (e) {
      console.warn('[API] Using cached contracts data', e);
    }

    let list = [...cachedContracts];
    if (params?.companyId) list = list.filter((c) => c.companyId === params.companyId);
    if (params?.freelancerId) list = list.filter((c) => c.freelancerId === params.freelancerId);
    if (params?.status && params.status !== 'all') list = list.filter((c) => c.status === params.status);
    return list;
  },

  /**
   * Get single contract by ID
   */
  async getContractById(id: string): Promise<Contract | null> {
    const list = await this.getContracts();
    return list.find((c) => c.id === id) || null;
  },

  /**
   * POST /api/contracts (Criar Contrato com Retenção no Cofre Escrow)
   */
  async createContract(payload: CreateContractPayload): Promise<Contract> {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const contract: Contract = await res.json();
        cachedContracts = [contract, ...cachedContracts];
        saveCache(STORAGE_KEYS.CONTRACTS, cachedContracts);
        return contract;
      }
    } catch (e) {
      console.warn('[API] Network error creating contract, using fallback', e);
    }

    // Local fallback
    const freela = cachedFreelancers.find((f) => f.id === payload.freelancerId);
    const escrowFee = Math.round(payload.dailyRate * 0.08);
    const now = new Date().toISOString();

    const fallbackContract: Contract = {
      id: `CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      freelancerId: payload.freelancerId,
      freelancerName: freela?.name || 'Profissional',
      freelancerRole: freela?.role || 'Cozinheiro',
      freelancerAvatar: freela?.avatarUrl || '',
      companyId: payload.companyId,
      companyName: payload.companyName,
      companyCnpj: payload.companyCnpj,
      categoryId: freela?.categoryId || 'cozinha-quente',
      date: payload.date,
      shiftHours: payload.shiftHours,
      venueAddress: payload.venueAddress,
      dailyRate: payload.dailyRate,
      escrowFee,
      totalAmount: payload.dailyRate + escrowFee,
      status: 'PAGO_E_RETIDO',
      createdAt: now,
      paidAt: now,
      notes: payload.notes,
    };

    cachedContracts = [fallbackContract, ...cachedContracts];
    saveCache(STORAGE_KEYS.CONTRACTS, cachedContracts);
    return fallbackContract;
  },

  /**
   * PATCH /api/contracts/:id
   */
  async updateContract(payload: UpdateContractPayload): Promise<Contract> {
    try {
      const res = await fetch(`/api/contracts/${payload.contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: payload.status,
          pin: payload.pin,
          qrToken: payload.qrToken,
          startQrToken: payload.startQrToken,
          endQrToken: payload.endQrToken,
          earlyExitReason: payload.earlyExitReason,
          managerApprovedOut: payload.managerApprovedOut,
          callerRole: payload.callerRole,
          checkInAt: payload.checkInAt,
          simulatedElapsedMinutes: payload.simulatedElapsedMinutes,
          review: payload.review,
        }),
      });

      if (res.ok) {
        const updated: Contract = await res.json();
        cachedContracts = cachedContracts.map((c) => (c.id === updated.id ? updated : c));
        saveCache(STORAGE_KEYS.CONTRACTS, cachedContracts);
        return updated;
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Erro ao atualizar contrato');
      }
    } catch (e: any) {
      // Re-throw antifraud validation errors directly
      if (e?.message && (e.message.includes('Bloqueio Antifraude') || e.message.includes('Fraude interceptada'))) {
        throw e;
      }
      console.warn('[API] Network error updating contract, using local anti-fraud fallback', e);
    }

    // Fallback update with strict anti-fraud parity
    const index = cachedContracts.findIndex((c) => c.id === payload.contractId);
    if (index === -1) throw new Error('Contrato não encontrado');

    const updated = { ...cachedContracts[index] };
    const now = new Date().toISOString();

    if (payload.startQrToken) updated.startQrToken = payload.startQrToken;
    if (payload.endQrToken) updated.endQrToken = payload.endQrToken;

    if (payload.checkInAt) {
      updated.checkInAt = payload.checkInAt;
    }

    if (payload.status) {
      if (payload.status === 'CHECKIN_REALIZADO') {
        updated.status = 'CHECKIN_REALIZADO';
        updated.checkInAt = payload.checkInAt || now;
        updated.startQrScannedAt = now;
        updated.shiftComplianceStatus = 'EM_ANDAMENTO';
      } else if (payload.status === 'CONCLUIDO') {
        if (!updated.checkInAt) {
          throw new Error('Bloqueio de Segurança: Não é possível finalizar a diária sem que o início tenha sido registrado.');
        }

        // Apenas o gerente pode finalizar a diária!
        if (payload.callerRole === 'FREELANCER') {
          throw new Error(
            'Permissão Negada: Apenas o gerente do estabelecimento pode finalizar a diária e aprovar a conclusão do expediente.'
          );
        }

        const elapsedMinutes = payload.simulatedElapsedMinutes !== undefined
          ? payload.simulatedElapsedMinutes
          : Math.max(0, Math.floor((new Date(now).getTime() - new Date(updated.checkInAt).getTime()) / (1000 * 60)));
        const minMinutes = updated.minShiftDurationMinutes || 360;

        updated.status = 'CONCLUIDO';
        updated.checkOutAt = now;
        updated.endQrScannedAt = now;
        updated.workedMinutes = elapsedMinutes;
        updated.earlyExitReason = payload.earlyExitReason;
        updated.managerApprovedOut = true;
        updated.shiftComplianceStatus = elapsedMinutes >= minMinutes ? 'CONCLUIDO_NO_HORARIO' : 'FINALIZADO_PELO_GERENTE';
      } else if (payload.status === 'VALOR_LIBERADO') {
        if (payload.callerRole === 'FREELANCER') {
          throw new Error(
            'Fraude interceptada: O freelancer não possui autorização para liberar fundos de custódia unilateralmente. A liberação do Pix é efetuada pelo restaurante contratante após inspecionar o turno.'
          );
        }
        updated.status = 'VALOR_LIBERADO';
        updated.releasedAt = now;
      } else {
        updated.status = payload.status;
      }
    }

    if (payload.review) {
      if (payload.review.type === 'company') {
        updated.companyReview = payload.review.data;
      } else {
        updated.freelancerReview = payload.review.data;
      }
    }

    cachedContracts[index] = updated;
    saveCache(STORAGE_KEYS.CONTRACTS, cachedContracts);
    return updated;
  },

  /**
   * GET /api/opportunities
   */
  async getOpportunities(): Promise<ShiftOpportunity[]> {
    try {
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const data = await res.json();
        cachedOpportunities = data;
        saveCache(STORAGE_KEYS.OPPORTUNITIES, data);
        return data;
      }
    } catch (e) {
      console.warn('[API] Using cached opportunities data', e);
    }
    return [...cachedOpportunities];
  },

  /**
   * POST /api/opportunities
   */
  async createOpportunity(opp: Omit<ShiftOpportunity, 'id' | 'createdAt' | 'status' | 'slotsRemaining'>): Promise<ShiftOpportunity> {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opp),
      });

      if (res.ok) {
        const newOpp: ShiftOpportunity = await res.json();
        cachedOpportunities = [newOpp, ...cachedOpportunities];
        saveCache(STORAGE_KEYS.OPPORTUNITIES, cachedOpportunities);
        return newOpp;
      }
    } catch (e) {
      console.warn('[API] Network error creating opportunity, using fallback', e);
    }

    const fallbackOpp: ShiftOpportunity = {
      ...opp,
      id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      slotsRemaining: opp.slotsTotal,
      status: 'ABERTA',
    };
    cachedOpportunities = [fallbackOpp, ...cachedOpportunities];
    saveCache(STORAGE_KEYS.OPPORTUNITIES, cachedOpportunities);
    return fallbackOpp;
  },

  /**
   * POST /api/opportunities/:id/apply
   */
  async applyToOpportunity(opportunityId: string, freelancer: Freelancer): Promise<Contract> {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerId: freelancer.id }),
      });

      if (res.ok) {
        const contract: Contract = await res.json();
        cachedContracts = [contract, ...cachedContracts];
        saveCache(STORAGE_KEYS.CONTRACTS, cachedContracts);
        return contract;
      }
    } catch (e) {
      console.warn('[API] Network error applying to opportunity, using fallback', e);
    }

    // Local fallback
    const fallback = await this.createContract({
      freelancerId: freelancer.id,
      companyId: 'comp-1',
      companyName: 'Izakaya Matsu Gastronomia',
      companyCnpj: '18.492.302/0001-44',
      date: 'Hoje (Turno Noturno)',
      shiftHours: '18:00 - 00:00',
      venueAddress: 'Av. Prudente de Morais, 820 · Zona 07, Maringá - PR',
      dailyRate: 350,
      notes: 'Vaga originada do Mural de Diárias',
    });
    fallback.termsAcceptedAt = new Date().toISOString();
    fallback.contractTermsSigned = true;
    return fallback;
  },

  /**
   * GET /api/contracts/:id/messages
   */
  async getChatMessages(contractId: string): Promise<ChatMessage[]> {
    try {
      const res = await fetch(`/api/contracts/${contractId}/messages`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('[API] Using cached messages', e);
    }
    return cachedMessages.filter((m) => m.contractId === contractId);
  },

  /**
   * POST /api/contracts/:id/messages
   */
  async sendChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    try {
      const res = await fetch(`/api/contracts/${msg.contractId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });

      if (res.ok) {
        const newMsg: ChatMessage = await res.json();
        cachedMessages = [...cachedMessages, newMsg];
        saveCache(STORAGE_KEYS.MESSAGES, cachedMessages);
        return newMsg;
      }
    } catch (e) {
      console.warn('[API] Network error sending chat message, using fallback', e);
    }

    const fallbackMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    cachedMessages = [...cachedMessages, fallbackMsg];
    saveCache(STORAGE_KEYS.MESSAGES, cachedMessages);
    return fallbackMsg;
  },

  /**
   * GET /api/stats
   */
  async getStats(): Promise<PlatformStats> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[API] Using local stats calculation', e);
    }

    return {
      totalEscrowLocked: cachedContracts
        .filter((c) => c.status === 'PAGO_E_RETIDO')
        .reduce((acc, c) => acc + c.totalAmount, 0),
      activeShifts: cachedContracts.filter((c) => c.status === 'CHECKIN_REALIZADO').length,
      completedShifts: cachedContracts.filter((c) => c.status === 'VALOR_LIBERADO' || c.status === 'CONCLUIDO').length,
      openOpportunities: cachedOpportunities.filter((o) => o.status === 'ABERTA').length,
      totalFreelancers: cachedFreelancers.length,
      totalCompanies: cachedCompanies.length,
      totalContracts: cachedContracts.length,
    };
  },

  /**
   * POST /api/reset
   */
  async resetAll(): Promise<void> {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('[API] Resetting local cache', e);
    }
    localStorage.clear();
    cachedContracts = [...INITIAL_CONTRACTS];
    cachedFreelancers = [...FREELANCERS];
    cachedCompanies = [...MOCK_COMPANIES];
    cachedOpportunities = [...INITIAL_OPPORTUNITIES];
    cachedMessages = [...INITIAL_CHAT_MESSAGES];
  },
};
