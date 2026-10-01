import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

import {
  FREELANCERS,
  INITIAL_CONTRACTS,
  MOCK_COMPANIES,
  INITIAL_OPPORTUNITIES,
  INITIAL_CHAT_MESSAGES,
} from './src/data/mockData.ts';
import type {
  Contract,
  ContractStatus,
  Freelancer,
  CategoryId,
  ContractReview,
  UserSession,
  ShiftOpportunity,
  ChatMessage,
} from './src/types/index.ts';
import {
  sanitizeInput,
  validateCNPJ,
  validateCPF,
  isAllowedStatusTransition,
  generateEscrowAuditHash,
  parseShiftHours,
  generateShiftPin,
  calculateShiftCompliance,
} from './src/utils/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// ==========================================
// Rate Limiter Memory Store (Anti-DDoS / Brute Force)
// ==========================================
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function createRateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    record.count++;
    if (record.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Limite de requisições excedido temporariamente. Tente novamente em breve.',
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
}

// Clean old rate limit entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// In-Memory Database (Server-authoritative)
// ==========================================
class Database {
  private freelancers: Freelancer[] = JSON.parse(JSON.stringify(FREELANCERS));
  private companies: UserSession[] = JSON.parse(JSON.stringify(MOCK_COMPANIES));
  private contracts: Contract[] = JSON.parse(JSON.stringify(INITIAL_CONTRACTS));
  private opportunities: ShiftOpportunity[] = JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES));
  private messages: ChatMessage[] = JSON.parse(JSON.stringify(INITIAL_CHAT_MESSAGES));

  constructor() {
    // Seed existing contracts with audit hashes
    this.contracts.forEach((c) => {
      if (!c.escrowHash) {
        c.escrowHash = generateEscrowAuditHash(c.id, c.totalAmount, c.createdAt);
      }
      if (!c.auditTrail) {
        c.auditTrail = [
          { timestamp: c.createdAt, action: 'CONTRATO_CRIADO', details: 'Depósito em custódia Escrow confirmado' },
        ];
      }
    });
  }

  // Freelancers
  getFreelancers(params?: { category?: string; search?: string; location?: string }): Freelancer[] {
    let list = [...this.freelancers];
    if (params?.category && params.category !== 'all') {
      list = list.filter((f) => f.categoryId === params.category);
    }
    if (params?.location && params.location !== 'all') {
      list = list.filter((f) => f.location.toLowerCase().includes(params.location!.toLowerCase()));
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
  }

  getFreelancerById(id: string): Freelancer | undefined {
    return this.freelancers.find((f) => f.id === id);
  }

  addFreelancer(data: Partial<Freelancer>): Freelancer {
    const colorVariants = [
      'bg-rose-900 text-rose-200',
      'bg-amber-900 text-amber-200',
      'bg-violet-900 text-violet-200',
      'bg-orange-900 text-orange-200',
      'bg-emerald-900 text-emerald-200',
    ];
    const randomColor = colorVariants[Math.floor(Math.random() * colorVariants.length)];

    const sanitizedName = sanitizeInput(data.name || 'Profissional Gastronômico', 100);
    const sanitizedRole = sanitizeInput(data.role || 'Cozinheiro', 100);
    const sanitizedSpecialty = sanitizeInput(data.specialty || 'Geral', 100);
    const sanitizedBio = sanitizeInput(data.bio || 'Profissional qualificado pronto para turnos em Maringá e região.', 500);
    const sanitizedLocation = sanitizeInput(data.location || 'Maringá, PR', 100);

    const safeDailyRate = Math.min(Math.max(Number(data.dailyRate) || 270, 80), 5000);

    const newFreela: Freelancer = {
      id: `freela-${Date.now()}`,
      name: sanitizedName,
      role: sanitizedRole,
      categoryId: (data.categoryId as CategoryId) || 'cozinha-quente',
      specialty: sanitizedSpecialty,
      rating: 5.0,
      reviewsCount: 1,
      completedGigs: 0,
      hourlyRate: Math.round(safeDailyRate / 6),
      dailyRate: safeDailyRate,
      location: sanitizedLocation,
      experienceYears: Math.min(Math.max(Number(data.experienceYears) || 3, 0), 40),
      verified: true,
      avatarUrl: '',
      avatarFallbackColor: randomColor,
      skills: (data.skills || ['Higiene Sanitária (ANVISA)']).map((s) => sanitizeInput(s, 50)),
      gear: (data.gear || ['Dólmã completa']).map((g) => sanitizeInput(g, 50)),
      certifications: (data.certifications || ['Manipulação de Alimentos']).map((c) => sanitizeInput(c, 50)),
      bio: sanitizedBio,
      availableDays: data.availableDays || ['Segunda a Domingo'],
      immediateAvailable: true,
    };

    this.freelancers.unshift(newFreela);
    return newFreela;
  }

  // Companies
  getCompanies(): UserSession[] {
    return [...this.companies];
  }

  getCompanyById(id: string): UserSession | undefined {
    return this.companies.find((c) => c.id === id);
  }

  addCompany(data: Partial<UserSession>): UserSession {
    const sanitizedName = sanitizeInput(data.name || 'Nova Empresa', 100);
    const sanitizedIdentifier = sanitizeInput(data.identifier || '00.000.000/0001-00', 30);
    const sanitizedLocation = sanitizeInput(data.location || 'Maringá, PR', 100);
    const sanitizedEmail = sanitizeInput(data.email || 'contato@empresa.com.br', 100);
    const sanitizedPhone = sanitizeInput(data.phone || '(44) 99999-0000', 30);

    const newCompany: UserSession = {
      role: 'EMPRESA',
      id: `comp-${Date.now()}`,
      name: sanitizedName,
      identifier: sanitizedIdentifier,
      avatar: data.avatar || '🍽️',
      location: sanitizedLocation,
      walletBalance: Math.min(Math.max(Number(data.walletBalance) || 5000, 0), 100000),
      email: sanitizedEmail,
      phone: sanitizedPhone,
    };

    this.companies.unshift(newCompany);
    return newCompany;
  }

  // Contracts & Escrow Security
  getContracts(params?: { companyId?: string; freelancerId?: string; status?: string }): Contract[] {
    let list = [...this.contracts];
    if (params?.companyId) {
      list = list.filter((c) => c.companyId === params.companyId);
    }
    if (params?.freelancerId) {
      list = list.filter((c) => c.freelancerId === params.freelancerId);
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((c) => c.status === params.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getContractById(id: string): Contract | undefined {
    return this.contracts.find((c) => c.id === id);
  }

  createContract(payload: {
    freelancerId: string;
    companyId: string;
    companyName: string;
    companyCnpj: string;
    date: string;
    shiftHours: string;
    venueAddress: string;
    dailyRate: number;
    notes?: string;
  }): Contract {
    const freela = this.getFreelancerById(payload.freelancerId);
    if (!freela) {
      throw new Error('Freelancer não encontrado no banco de dados');
    }

    const safeDailyRate = Math.min(Math.max(Number(payload.dailyRate), 80), 5000);
    const escrowFee = Math.round(safeDailyRate * 0.08);
    const totalAmount = safeDailyRate + escrowFee;
    const now = new Date().toISOString();
    const contractId = `CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const escrowHash = generateEscrowAuditHash(contractId, totalAmount, now);

    const parsedHours = parseShiftHours(payload.shiftHours);
    const checkInPin = generateShiftPin(contractId, 1);
    const checkOutPin = generateShiftPin(contractId, 2);

    const newContract: Contract = {
      id: contractId,
      freelancerId: freela.id,
      freelancerName: freela.name,
      freelancerRole: freela.role,
      freelancerAvatar: freela.avatarUrl,
      companyId: payload.companyId,
      companyName: sanitizeInput(payload.companyName, 100),
      companyCnpj: sanitizeInput(payload.companyCnpj, 30),
      categoryId: freela.categoryId,
      date: sanitizeInput(payload.date, 50),
      shiftHours: sanitizeInput(payload.shiftHours, 50),
      venueAddress: sanitizeInput(payload.venueAddress, 150),
      dailyRate: safeDailyRate,
      escrowFee,
      totalAmount,
      status: 'PAGO_E_RETIDO',
      createdAt: now,
      paidAt: now,
      notes: payload.notes ? sanitizeInput(payload.notes, 500) : undefined,
      escrowHash,
      checkInPin,
      checkOutPin,
      minShiftDurationMinutes: parsedHours.totalDurationMinutes,
      shiftComplianceStatus: 'PENDENTE',
      auditTrail: [
        {
          timestamp: now,
          action: 'ESCROW_DEPOSITADO',
          details: `Valor total de R$ ${totalAmount.toFixed(2)} retido em custódia. PINs antifraude gerados para o restaurante. Hash: ${escrowHash}`,
        },
      ],
    };

    this.contracts.unshift(newContract);

    // Automatic escrow audit message in chat
    this.addChatMessage({
      contractId: newContract.id,
      senderRole: 'EMPRESA',
      senderName: 'Cofre Escrow ChefMatch',
      content: `[Garantia B2B & Antifraude] Contrato firmado. Horário contratado: ${payload.shiftHours} (${parsedHours.formattedDuration}). PIN de entrada do restaurante: ${checkInPin}. Hash: ${escrowHash}.`,
    });

    return newContract;
  }

  updateContract(
    id: string,
    updates: {
      status?: ContractStatus;
      pin?: string;
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
  ): Contract {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Contrato ${id} não encontrado`);
    }

    const now = new Date().toISOString();
    if (!contract.auditTrail) contract.auditTrail = [];

    // Allow updating checkInAt timestamp (e.g. for time simulator testing)
    if (updates.checkInAt) {
      contract.checkInAt = updates.checkInAt;
    }

    // State machine validation
    if (updates.status) {
      if (!isAllowedStatusTransition(contract.status, updates.status)) {
        throw new Error(
          `Transição de estado inválida: de ${contract.status} para ${updates.status}. O fluxo de segurança Escrow não permite pular etapas de validação presencial.`
        );
      }

      // ==========================================
      // REGRA ANTIFRAUDE 1: VALIDAÇÃO DE CHECK-IN
      // ==========================================
      if (updates.status === 'CHECKIN_REALIZADO') {
        // Se chamado pelo freelancer, é obrigatório validar o PIN fornecido pelo restaurante presencialmente
        if (updates.callerRole === 'FREELANCER') {
          if (!updates.pin || updates.pin.trim() !== contract.checkInPin) {
            throw new Error(
              `Bloqueio Antifraude: PIN de entrada incorreto. Solicite o PIN de 4 dígitos ao gerente do restaurante (${contract.companyName}) ao chegar no local para confirmar seu início de turno.`
            );
          }
        }

        contract.status = 'CHECKIN_REALIZADO';
        contract.checkInAt = updates.checkInAt || now;
        contract.shiftComplianceStatus = 'EM_ANDAMENTO';
        contract.auditTrail.push({
          timestamp: now,
          action: 'CHECKIN_PRESENCIAL_VALIDADO',
          details: updates.callerRole === 'EMPRESA'
            ? 'Presença no local confirmada diretamente pelo gerente da empresa.'
            : `Presença presencial autenticada com PIN do gerente (${updates.pin}).`,
        });
      }

      // ==========================================
      // REGRA ANTIFRAUDE 2: CUMPRIMENTO DO EXPEDIENTE (CHECK-OUT)
      // ==========================================
      else if (updates.status === 'CONCLUIDO') {
        if (!contract.checkInAt) {
          throw new Error('Bloqueio Antifraude: Não é possível realizar check-out sem check-in validado previamente.');
        }

        const elapsedMinutes = updates.simulatedElapsedMinutes !== undefined
          ? updates.simulatedElapsedMinutes
          : Math.max(0, Math.floor((new Date(now).getTime() - new Date(contract.checkInAt).getTime()) / (1000 * 60)));
        const minMinutes = contract.minShiftDurationMinutes || 360;

        // Se a solicitação vier do Freelancer:
        if (updates.callerRole === 'FREELANCER') {
          const isPinValid = updates.pin && updates.pin.trim() === contract.checkOutPin;
          const isEarly = elapsedMinutes < minMinutes;

          if (isEarly && (!isPinValid || !updates.earlyExitReason)) {
            const remainingMins = minMinutes - elapsedMinutes;
            const remH = Math.floor(remainingMins / 60);
            const remM = remainingMins % 60;
            const formattedRemaining = remH > 0 ? `${remH}h ${remM}min` : `${remM}min`;
            throw new Error(
              `Bloqueio Antifraude: Tentativa de saída antecipada detectada (${elapsedMinutes}min trabalhados de ${minMinutes}min contratados. Faltam ${formattedRemaining}). O encerramento prematuro exige o PIN de liberação do gerente (${contract.checkOutPin}) e uma justificativa obrigatória.`
            );
          }

          // Se cumprido no horário integral, exige validação do PIN de saída do restaurante
          if (!isEarly && !isPinValid && !updates.managerApprovedOut) {
            throw new Error(
              `Bloqueio Antifraude: Insira o PIN de saída de 4 dígitos fornecido pelo gerente do restaurante (${contract.companyName}) para formalizar o encerramento do posto de trabalho.`
            );
          }
        }

        contract.status = 'CONCLUIDO';
        contract.checkOutAt = now;
        contract.workedMinutes = elapsedMinutes;
        contract.earlyExitReason = updates.earlyExitReason ? sanitizeInput(updates.earlyExitReason, 200) : undefined;
        contract.managerApprovedOut = !!(updates.managerApprovedOut || (updates.pin && updates.pin.trim() === contract.checkOutPin));
        contract.shiftComplianceStatus = elapsedMinutes >= minMinutes ? 'CONCLUIDO_NO_HORARIO' : 'SAIDA_ANTECIPADA_AUTORIZADA';

        contract.auditTrail.push({
          timestamp: now,
          action: 'CHECKOUT_VALIDADO',
          details: `Expediente encerrado. Minutos trabalhados: ${elapsedMinutes}min de ${minMinutes}min. Status: ${contract.shiftComplianceStatus}.`,
        });
      }

      // ==========================================
      // REGRA ANTIFRAUDE 3: LIQUIDAÇÃO DE PAGAMENTO (ESCROW PAYOUT)
      // ==========================================
      else if (updates.status === 'VALOR_LIBERADO') {
        // Bloqueio rigoroso: O freelancer JAMAIS pode liberar o próprio pagamento unilateralmente
        if (updates.callerRole === 'FREELANCER') {
          throw new Error(
            'Fraude interceptada: O freelancer não possui autorização para liberar fundos de custódia unilateralmente. A liberação do Pix é efetuada pelo restaurante contratante após inspecionar o turno.'
          );
        }

        if (contract.releasedAt) {
          throw new Error('O pagamento deste contrato já foi liquidado anteriormente.');
        }

        contract.status = 'VALOR_LIBERADO';
        contract.releasedAt = now;
        contract.auditTrail.push({
          timestamp: now,
          action: 'PIX_LIQUIDADO',
          details: `Valor líquido de R$ ${contract.dailyRate.toFixed(2)} transferido via Pix garantido após validação do turno pelo contratante.`,
        });

        // Increment completed gigs for freelancer
        const freela = this.getFreelancerById(contract.freelancerId);
        if (freela) {
          freela.completedGigs = (freela.completedGigs || 0) + 1;
        }
      } else {
        contract.status = updates.status;
      }
    }

    // Review sanitization and rating update
    if (updates.review) {
      const sanitizedRating = Math.min(Math.max(Number(updates.review.data.rating) || 5, 1), 5);
      const sanitizedTags = (updates.review.data.tags || []).map((t) => sanitizeInput(t, 40));
      const sanitizedComment = updates.review.data.comment ? sanitizeInput(updates.review.data.comment, 300) : undefined;

      const cleanReview: ContractReview = {
        rating: sanitizedRating,
        tags: sanitizedTags,
        comment: sanitizedComment,
        createdAt: now,
      };

      if (updates.review.type === 'company') {
        if (contract.companyReview) throw new Error('A empresa já avaliou este turno.');
        contract.companyReview = cleanReview;

        // Recalculate freelancer rating
        const freela = this.getFreelancerById(contract.freelancerId);
        if (freela) {
          const newReviewsCount = freela.reviewsCount + 1;
          const newRating = Number(
            ((freela.rating * freela.reviewsCount + sanitizedRating) / newReviewsCount).toFixed(1)
          );
          freela.rating = newRating;
          freela.reviewsCount = newReviewsCount;
        }
      } else {
        if (contract.freelancerReview) throw new Error('O freelancer já avaliou esta empresa.');
        contract.freelancerReview = cleanReview;
      }
    }

    return contract;
  }

  // Opportunities (Mural de Diárias)
  getOpportunities(): ShiftOpportunity[] {
    return [...this.opportunities];
  }

  getOpportunityById(id: string): ShiftOpportunity | undefined {
    return this.opportunities.find((o) => o.id === id);
  }

  createOpportunity(data: Omit<ShiftOpportunity, 'id' | 'createdAt' | 'status' | 'slotsRemaining'>): ShiftOpportunity {
    const safeDailyRate = Math.min(Math.max(Number(data.dailyRate) || 250, 80), 5000);
    const newOpp: ShiftOpportunity = {
      ...data,
      id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
      roleTitle: sanitizeInput(data.roleTitle, 100),
      companyName: sanitizeInput(data.companyName, 100),
      venueAddress: sanitizeInput(data.venueAddress, 150),
      shiftHours: sanitizeInput(data.shiftHours, 50),
      date: sanitizeInput(data.date, 50),
      dailyRate: safeDailyRate,
      slotsTotal: Math.min(Math.max(Number(data.slotsTotal) || 1, 1), 20),
      createdAt: new Date().toISOString(),
      slotsRemaining: Math.min(Math.max(Number(data.slotsTotal) || 1, 1), 20),
      status: 'ABERTA',
    };
    this.opportunities.unshift(newOpp);
    return newOpp;
  }

  applyToOpportunity(opportunityId: string, freelancerId: string): Contract {
    const opp = this.getOpportunityById(opportunityId);
    if (!opp) throw new Error('Oportunidade não encontrada');
    if (opp.slotsRemaining <= 0 || opp.status !== 'ABERTA') {
      throw new Error('Esta diária urgente já foi preenchida');
    }

    const freela = this.getFreelancerById(freelancerId);
    if (!freela) throw new Error('Freelancer não encontrado');

    const contract = this.createContract({
      freelancerId: freela.id,
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

    return contract;
  }

  // Chat Messages
  getChatMessages(contractId: string): ChatMessage[] {
    return this.messages.filter((m) => m.contractId === contractId);
  }

  addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      content: sanitizeInput(msg.content, 1000),
      senderName: sanitizeInput(msg.senderName, 100),
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // Platform Metrics
  getStats() {
    const totalEscrowLocked = this.contracts
      .filter((c) => c.status === 'PAGO_E_RETIDO')
      .reduce((acc, c) => acc + c.totalAmount, 0);

    const activeShifts = this.contracts.filter((c) => c.status === 'CHECKIN_REALIZADO').length;
    const completedShifts = this.contracts.filter(
      (c) => c.status === 'VALOR_LIBERADO' || c.status === 'CONCLUIDO'
    ).length;
    const openOpportunities = this.opportunities.filter((o) => o.status === 'ABERTA').length;

    return {
      totalEscrowLocked,
      activeShifts,
      completedShifts,
      openOpportunities,
      totalFreelancers: this.freelancers.length,
      totalCompanies: this.companies.length,
      totalContracts: this.contracts.length,
    };
  }

  resetAll() {
    this.freelancers = JSON.parse(JSON.stringify(FREELANCERS));
    this.companies = JSON.parse(JSON.stringify(MOCK_COMPANIES));
    this.contracts = JSON.parse(JSON.stringify(INITIAL_CONTRACTS));
    this.opportunities = JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES));
    this.messages = JSON.parse(JSON.stringify(INITIAL_CHAT_MESSAGES));
  }
}

const db = new Database();

// ==========================================
// Express Application Setup with Security Hardening
// ==========================================
async function startServer() {
  const app = express();

  // 1. Disable server fingerprinting
  app.disable('x-powered-by');

  // 2. Strict Security Headers (OWASP recommendations)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    next();
  });

  // 3. Payload size limiting to prevent payload flooding / memory starvation
  app.use(express.json({ limit: '500kb' }));

  // 4. Controlled CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 5. Rate Limiting Middleware
  const generalRateLimiter = createRateLimiter({
    maxRequests: 180,
    windowMs: 60 * 1000,
    message: 'Muitas requisições originadas do seu IP. Por favor, aguarde alguns segundos.',
  });

  const mutationRateLimiter = createRateLimiter({
    maxRequests: 45,
    windowMs: 60 * 1000,
    message: 'Muitas tentativas de alteração em curto intervalo. Proteção antifraude ativada.',
  });

  app.use('/api', generalRateLimiter);
  app.use('/api/contracts', mutationRateLimiter);
  app.use('/api/companies', mutationRateLimiter);
  app.use('/api/freelancers', mutationRateLimiter);

  // ==========================================
  // API Routes (/api/*) with Validation
  // ==========================================

  // Health, Stats & Security Audit info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ChefMatch B2B Secured Backend',
      version: '1.2.0',
      uptime: process.uptime(),
      security: {
        escrowProtection: 'ACTIVE_SHA256',
        antiDDoS: 'ACTIVE_RATE_LIMITER',
        xssSanitization: 'ENABLED',
        stateMachineGuard: 'STRICT',
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/stats', (_req: Request, res: Response) => {
    res.json(db.getStats());
  });

  // 1. Freelancers
  app.get('/api/freelancers', (req: Request, res: Response) => {
    const { category, search, location } = req.query as {
      category?: string;
      search?: string;
      location?: string;
    };
    const freelancers = db.getFreelancers({
      category: category ? sanitizeInput(category, 50) : undefined,
      search: search ? sanitizeInput(search, 100) : undefined,
      location: location ? sanitizeInput(location, 50) : undefined,
    });
    res.json(freelancers);
  });

  app.get('/api/freelancers/:id', (req: Request, res: Response) => {
    const id = sanitizeInput(req.params.id, 50);
    const freela = db.getFreelancerById(id);
    if (!freela) {
      return res.status(404).json({ error: 'Freelancer não encontrado' });
    }
    res.json(freela);
  });

  app.post('/api/freelancers', (req: Request, res: Response) => {
    try {
      const { name, role, categoryId, dailyRate, identifier } = req.body;
      if (!name || !role || !categoryId || !dailyRate) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes (name, role, categoryId, dailyRate)' });
      }

      // Check CPF/MEI format if provided
      if (identifier && !validateCPF(identifier) && !validateCNPJ(identifier)) {
        return res.status(400).json({ error: 'CPF ou CNPJ informado possui formato ou dígitos verificadores inválidos.' });
      }

      const rate = Number(dailyRate);
      if (isNaN(rate) || rate < 80 || rate > 5000) {
        return res.status(400).json({ error: 'O valor da diária deve estar entre R$ 80,00 e R$ 5.000,00.' });
      }

      const newFreela = db.addFreelancer(req.body);
      res.status(201).json(newFreela);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Erro ao cadastrar freelancer' });
    }
  });

  // 2. Companies (B2B CNPJ)
  app.get('/api/companies', (_req: Request, res: Response) => {
    res.json(db.getCompanies());
  });

  app.get('/api/companies/:id', (req: Request, res: Response) => {
    const id = sanitizeInput(req.params.id, 50);
    const company = db.getCompanyById(id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json(company);
  });

  app.post('/api/companies', (req: Request, res: Response) => {
    try {
      const { name, cnpj, location } = req.body;
      if (!name || !cnpj) {
        return res.status(400).json({ error: 'Razão Social e CNPJ são obrigatórios.' });
      }

      if (!validateCNPJ(cnpj)) {
        return res.status(400).json({ error: 'CNPJ inválido. Verifique os números digitados.' });
      }

      const newCompany = db.addCompany({
        name,
        identifier: cnpj,
        location,
        avatar: req.body.avatarIcon || '🍽️',
        walletBalance: req.body.initialDeposit || 4500,
        email: req.body.email,
        phone: req.body.phone,
      });
      res.status(201).json(newCompany);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Erro ao cadastrar empresa' });
    }
  });

  // 3. Contracts & Escrow Security
  app.get('/api/contracts', (req: Request, res: Response) => {
    const { companyId, freelancerId, status } = req.query as {
      companyId?: string;
      freelancerId?: string;
      status?: string;
    };
    const contracts = db.getContracts({
      companyId: companyId ? sanitizeInput(companyId, 50) : undefined,
      freelancerId: freelancerId ? sanitizeInput(freelancerId, 50) : undefined,
      status: status ? sanitizeInput(status, 30) : undefined,
    });
    res.json(contracts);
  });

  app.get('/api/contracts/:id', (req: Request, res: Response) => {
    const id = sanitizeInput(req.params.id, 50);
    const contract = db.getContractById(id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    res.json(contract);
  });

  app.post('/api/contracts', (req: Request, res: Response) => {
    try {
      const { freelancerId, companyId, companyName, companyCnpj, date, shiftHours, venueAddress, dailyRate, notes } =
        req.body;

      if (!freelancerId || !companyId || !date || !shiftHours || !dailyRate) {
        return res.status(400).json({ error: 'Dados insuficientes para firmar contrato Escrow' });
      }

      const rate = Number(dailyRate);
      if (isNaN(rate) || rate < 80 || rate > 5000) {
        return res.status(400).json({ error: 'Valor da diária inválido para custódia Escrow.' });
      }

      const contract = db.createContract({
        freelancerId: sanitizeInput(freelancerId, 50),
        companyId: sanitizeInput(companyId, 50),
        companyName: companyName || 'Restaurante Contratante',
        companyCnpj: companyCnpj || '00.000.000/0001-00',
        date,
        shiftHours,
        venueAddress: venueAddress || 'Maringá, PR',
        dailyRate: rate,
        notes,
      });

      res.status(201).json(contract);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao gerar contrato com Escrow' });
    }
  });

  app.patch('/api/contracts/:id', (req: Request, res: Response) => {
    try {
      const id = sanitizeInput(req.params.id, 50);
      const { status, pin, earlyExitReason, managerApprovedOut, callerRole, checkInAt, simulatedElapsedMinutes, review } = req.body;
      const updated = db.updateContract(id, {
        status,
        pin: pin ? sanitizeInput(pin, 10) : undefined,
        earlyExitReason: earlyExitReason ? sanitizeInput(earlyExitReason, 200) : undefined,
        managerApprovedOut: Boolean(managerApprovedOut),
        callerRole,
        checkInAt: checkInAt ? sanitizeInput(checkInAt, 50) : undefined,
        simulatedElapsedMinutes: typeof simulatedElapsedMinutes === 'number' ? simulatedElapsedMinutes : undefined,
        review,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao atualizar contrato' });
    }
  });

  // 4. Contract Chat Messages
  app.get('/api/contracts/:id/messages', (req: Request, res: Response) => {
    const id = sanitizeInput(req.params.id, 50);
    const messages = db.getChatMessages(id);
    res.json(messages);
  });

  app.post('/api/contracts/:id/messages', (req: Request, res: Response) => {
    try {
      const id = sanitizeInput(req.params.id, 50);
      const { senderRole, senderName, content } = req.body;
      if (!senderRole || !senderName || !content) {
        return res.status(400).json({ error: 'senderRole, senderName e content são obrigatórios' });
      }

      const newMsg = db.addChatMessage({
        contractId: id,
        senderRole,
        senderName,
        content,
      });

      res.status(201).json(newMsg);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao enviar mensagem no chat do contrato' });
    }
  });

  // 5. Urgent Opportunities (Mural de Diárias)
  app.get('/api/opportunities', (_req: Request, res: Response) => {
    res.json(db.getOpportunities());
  });

  app.post('/api/opportunities', (req: Request, res: Response) => {
    try {
      const { companyId, companyName, companyCnpj, roleTitle, categoryId, dailyRate, date, shiftHours, venueAddress } =
        req.body;

      if (!companyId || !roleTitle || !dailyRate || !date || !shiftHours) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes para publicar diária' });
      }

      const rate = Number(dailyRate);
      if (isNaN(rate) || rate < 80 || rate > 5000) {
        return res.status(400).json({ error: 'Valor da diária deve estar entre R$ 80 e R$ 5.000.' });
      }

      const newOpp = db.createOpportunity(req.body);
      res.status(201).json(newOpp);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao publicar oportunidade' });
    }
  });

  app.post('/api/opportunities/:id/apply', (req: Request, res: Response) => {
    try {
      const id = sanitizeInput(req.params.id, 50);
      const { freelancerId } = req.body;
      if (!freelancerId) {
        return res.status(400).json({ error: 'freelancerId é obrigatório para candidatar-se' });
      }

      const contract = db.applyToOpportunity(id, sanitizeInput(freelancerId, 50));
      res.status(201).json(contract);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao candidatar-se à vaga do mural' });
    }
  });

  // Application Build / Version Check (Auto-Update Support)
  const serverBuildTimestamp = Date.now();
  app.get('/api/version', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      version: '2.1.0',
      timestamp: serverBuildTimestamp,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Database Reset (for clean demo testing)
  app.post('/api/reset', (_req: Request, res: Response) => {
    db.resetAll();
    res.json({ message: 'Banco de dados restaurado aos dados originais com sucesso.' });
  });

  // ==========================================
  // Vite Integration (Dev) or Static (Prod)
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      // Ensure sw.js is never cached by browser HTTP cache
      app.get('/sw.js', (_req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.resolve(distPath, 'sw.js'));
      });

      // Serve static assets with standard caching
      app.use(express.static(distPath));

      // Ensure index.html always forces revalidation so users get fresh bundles immediately
      app.get('*', (_req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  // Start HTTP Listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChefMatch Secured Backend] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ChefMatch Secured Backend] Startup error:', err);
  process.exit(1);
});
