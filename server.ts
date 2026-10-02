import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
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

// Disk persistence paths
const DATA_DIR = path.resolve(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'db-store.json');
const DEVICES_FILE = path.join(DATA_DIR, 'devices-cache.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('[Disk] Failed to create .data dir', e);
  }
}

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
    // Exclude SSE stream and device ping from rate limiting
    if (req.path.startsWith('/api/realtime') || req.path.endsWith('/ping')) {
      return next();
    }

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

// Clean old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// Real-Time Multi-Device Sync Hub (Server-Sent Events)
// ==========================================
interface ConnectedClient {
  id: string;
  res: Response;
  deviceId: string;
  role: string;
  ip: string;
  userAgent: string;
  connectedAt: number;
}

class RealtimeHub {
  private clients: Map<string, ConnectedClient> = new Map();

  addClient(client: ConnectedClient) {
    this.clients.set(client.id, client);
    this.broadcast('devices_changed', this.getConnectedDevices());
  }

  removeClient(id: string) {
    if (this.clients.has(id)) {
      this.clients.delete(id);
      this.broadcast('devices_changed', this.getConnectedDevices());
    }
  }

  broadcast(event: string, payload: any) {
    const data = JSON.stringify(payload);
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`event: ${event}\ndata: ${data}\n\n`);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  getConnectedDevices() {
    const list: any[] = [];
    const seen = new Set<string>();
    for (const client of this.clients.values()) {
      if (!seen.has(client.deviceId)) {
        seen.add(client.deviceId);
        list.push({
          deviceId: client.deviceId,
          role: client.role,
          ip: client.ip,
          userAgent: client.userAgent,
          connectedAt: client.connectedAt,
          isOnline: true,
        });
      }
    }
    return list;
  }

  getOnlineCount(): number {
    return new Set(Array.from(this.clients.values()).map((c) => c.deviceId)).size;
  }
}

const realtimeHub = new RealtimeHub();

// SSE Heartbeat every 15s to keep connections alive
setInterval(() => {
  for (const [id, client] of (realtimeHub as any).clients.entries()) {
    try {
      client.res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      realtimeHub.removeClient(id);
    }
  }
}, 15000);

// ==========================================
// Device Registry & Cookie / Cache Store
// ==========================================
export interface DeviceSessionRecord {
  deviceId: string;
  deviceName: string;
  role: 'EMPRESA' | 'FREELANCER';
  userId: string;
  userName: string;
  avatar?: string;
  ip: string;
  userAgent: string;
  lastActive: string;
  lastPing: number;
  cache: Record<string, any>;
  cookies: Record<string, string>;
}

class DeviceStore {
  private devices: Map<string, DeviceSessionRecord> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DEVICES_FILE)) {
        const raw = fs.readFileSync(DEVICES_FILE, 'utf-8');
        const parsed: Record<string, DeviceSessionRecord> = JSON.parse(raw);
        for (const [id, rec] of Object.entries(parsed)) {
          this.devices.set(id, rec);
        }
      }
    } catch (e) {
      console.warn('[DeviceStore] Failed to load devices from disk', e);
    }
  }

  private saveToDisk() {
    try {
      const obj: Record<string, DeviceSessionRecord> = {};
      for (const [id, rec] of this.devices.entries()) {
        obj[id] = rec;
      }
      fs.writeFileSync(DEVICES_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[DeviceStore] Failed to save devices to disk', e);
    }
  }

  registerOrUpdate(data: Partial<DeviceSessionRecord> & { deviceId: string }): DeviceSessionRecord {
    const existing = this.devices.get(data.deviceId);
    const now = new Date().toISOString();

    const updated: DeviceSessionRecord = {
      deviceId: data.deviceId,
      deviceName: data.deviceName || existing?.deviceName || 'Dispositivo Desconhecido',
      role: data.role || existing?.role || 'EMPRESA',
      userId: data.userId || existing?.userId || 'user-1',
      userName: data.userName || existing?.userName || 'Usuário',
      avatar: data.avatar || existing?.avatar || '',
      ip: data.ip || existing?.ip || '127.0.0.1',
      userAgent: data.userAgent || existing?.userAgent || '',
      lastActive: now,
      lastPing: Date.now(),
      cache: data.cache !== undefined ? data.cache : existing?.cache || {},
      cookies: data.cookies !== undefined ? data.cookies : existing?.cookies || {},
    };

    this.devices.set(data.deviceId, updated);
    this.saveToDisk();
    return updated;
  }

  getDevice(deviceId: string): DeviceSessionRecord | undefined {
    return this.devices.get(deviceId);
  }

  pingDevice(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.lastPing = Date.now();
      dev.lastActive = new Date().toISOString();
    }
  }

  getAllDevices() {
    const now = Date.now();
    return Array.from(this.devices.values()).map((d) => ({
      ...d,
      isOnline: now - d.lastPing < 35000,
    }));
  }

  setCache(deviceId: string, cacheData: any) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.cache = cacheData;
      dev.lastActive = new Date().toISOString();
      this.saveToDisk();
    }
  }

  getCache(deviceId: string) {
    return this.devices.get(deviceId)?.cache || null;
  }

  clearCache(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.cache = {};
      this.saveToDisk();
    }
  }

  setCookies(deviceId: string, cookies: Record<string, string>) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.cookies = { ...dev.cookies, ...cookies };
      this.saveToDisk();
    }
  }

  getCookies(deviceId: string) {
    return this.devices.get(deviceId)?.cookies || {};
  }
}

const deviceStore = new DeviceStore();

// ==========================================
// In-Memory Database with Disk Persistence (Server-authoritative)
// ==========================================
class Database {
  private freelancers: Freelancer[] = JSON.parse(JSON.stringify(FREELANCERS));
  private companies: UserSession[] = JSON.parse(JSON.stringify(MOCK_COMPANIES));
  private contracts: Contract[] = JSON.parse(JSON.stringify(INITIAL_CONTRACTS));
  private opportunities: ShiftOpportunity[] = JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES));
  private messages: ChatMessage[] = JSON.parse(JSON.stringify(INITIAL_CHAT_MESSAGES));

  constructor() {
    this.loadFromDisk();
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

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.contracts) this.contracts = parsed.contracts;
        if (parsed.freelancers) this.freelancers = parsed.freelancers;
        if (parsed.companies) this.companies = parsed.companies;
        if (parsed.opportunities) this.opportunities = parsed.opportunities;
        if (parsed.messages) this.messages = parsed.messages;
      }
    } catch (e) {
      console.warn('[Database] Failed to load DB from disk, using seed data', e);
    }
  }

  private persist() {
    try {
      const data = {
        contracts: this.contracts,
        freelancers: this.freelancers,
        companies: this.companies,
        opportunities: this.opportunities,
        messages: this.messages,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Database] Failed to persist DB to disk', e);
    }
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

  addFreelancer(data: any): Freelancer {
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

    const safeDailyRate = Math.min(Math.max(Number(data.dailyRate) || 280, 80), 5000);
    const hourlyRate = Math.round(safeDailyRate / 6);

    const newFreela: Freelancer = {
      id: `freela-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sanitizedName,
      role: sanitizedRole,
      categoryId: (data.categoryId as CategoryId) || 'cozinha-quente',
      specialty: sanitizedSpecialty,
      rating: 5.0,
      reviewsCount: 1,
      completedGigs: 0,
      hourlyRate,
      dailyRate: safeDailyRate,
      location: sanitizeInput(data.location || 'Maringá, PR', 100),
      experienceYears: Math.min(Math.max(Number(data.experienceYears) || 2, 0), 40),
      verified: true,
      avatarUrl: data.avatarUrl || '',
      avatarFallbackColor: randomColor,
      skills: (data.skills || ['Agilidade', 'Higiene']).map((s: string) => sanitizeInput(s, 50)),
      gear: (data.gear || ['Facas próprias']).map((g: string) => sanitizeInput(g, 50)),
      certifications: (data.certifications || ['Boas Práticas ANVISA']).map((c: string) => sanitizeInput(c, 80)),
      bio: sanitizedBio,
      availableDays: data.availableDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      immediateAvailable: true,
      phone: data.phone ? sanitizeInput(data.phone, 30) : undefined,
      email: data.email ? sanitizeInput(data.email, 100) : undefined,
      pixKey: data.pixKey ? sanitizeInput(data.pixKey, 60) : undefined,
    };

    this.freelancers.unshift(newFreela);
    this.persist();
    return newFreela;
  }

  // Companies
  getCompanies(): UserSession[] {
    return this.companies;
  }

  getCompanyById(id: string): UserSession | undefined {
    return this.companies.find((c) => c.id === id);
  }

  addCompany(data: Partial<UserSession>): UserSession {
    const sanitizedName = sanitizeInput(data.name || 'Restaurante Parceiro', 100);
    const sanitizedCnpj = sanitizeInput(data.identifier || '00.000.000/0001-00', 30);
    const sanitizedLocation = sanitizeInput(data.location || 'Maringá, PR', 100);

    const newComp: UserSession = {
      role: 'EMPRESA',
      id: `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sanitizedName,
      identifier: sanitizedCnpj,
      avatar: data.avatar || '🍽️',
      location: sanitizedLocation,
      walletBalance: Number(data.walletBalance) || 5000,
      email: data.email ? sanitizeInput(data.email, 100) : undefined,
      phone: data.phone ? sanitizeInput(data.phone, 30) : undefined,
    };

    this.companies.unshift(newComp);
    this.persist();
    return newComp;
  }

  // Contracts & Escrow Operations
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
    return list;
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
          details: `Valor total de R$ ${totalAmount.toFixed(2)} retido em custódia. QR Code antifraude habilitado. Hash: ${escrowHash}`,
        },
      ],
    };

    this.contracts.unshift(newContract);
    this.persist();

    // Automatic escrow audit message in chat
    this.addChatMessage({
      contractId: newContract.id,
      senderRole: 'EMPRESA',
      senderName: 'Cofre Escrow TurnoExtra',
      content: `[Garantia B2B & Escrow] Contrato firmado. Horário contratado: ${payload.shiftHours} (${parsedHours.formattedDuration}). Valor 100% garantido em custódia. O freelancer gera o QR Code no app e a finalização é realizada exclusivamente pelo gerente. Hash: ${escrowHash}.`,
    });

    realtimeHub.broadcast('contract_updated', newContract);
    return newContract;
  }

  updateContract(
    id: string,
    updates: {
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
  ): Contract {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Contrato ${id} não encontrado`);
    }

    const now = new Date().toISOString();
    if (!contract.auditTrail) contract.auditTrail = [];

    // Save tokens if provided
    if (updates.startQrToken) {
      contract.startQrToken = updates.startQrToken;
    }
    if (updates.endQrToken) {
      contract.endQrToken = updates.endQrToken;
    }

    // Allow updating checkInAt timestamp
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
      // REGRA: INÍCIO DE DIÁRIA (QR CODE / CHECK-IN)
      // ==========================================
      if (updates.status === 'CHECKIN_REALIZADO') {
        contract.status = 'CHECKIN_REALIZADO';
        contract.checkInAt = updates.checkInAt || now;
        contract.startQrScannedAt = now;
        contract.shiftComplianceStatus = 'EM_ANDAMENTO';
        contract.auditTrail.push({
          timestamp: now,
          action: 'CHECKIN_QRCODE_VALIDADO',
          details: updates.callerRole === 'EMPRESA'
            ? 'QR Code do freelancer escaneado pelo gerente. Presença física validada e diária iniciada.'
            : `Início de diária registrado pelo freelancer (${contract.freelancerName}).`,
        });
      }

      // ==========================================
      // REGRA: FINALIZAÇÃO DE DIÁRIA (QR CODE / ENCERRAMENTO PELO GERENTE)
      // ==========================================
      else if (updates.status === 'CONCLUIDO') {
        if (!contract.checkInAt) {
          throw new Error('Bloqueio de Segurança: Não é possível finalizar a diária sem que o início tenha sido registrado.');
        }

        // Apenas o gerente pode finalizar a diária!
        if (updates.callerRole === 'FREELANCER') {
          throw new Error(
            'Permissão Negada: Apenas o gerente do estabelecimento pode finalizar a diária ao escanear o QR Code de saída do freelancer.'
          );
        }

        const elapsedMinutes = updates.simulatedElapsedMinutes !== undefined
          ? updates.simulatedElapsedMinutes
          : Math.max(0, Math.floor((new Date(now).getTime() - new Date(contract.checkInAt).getTime()) / (1000 * 60)));
        const minMinutes = contract.minShiftDurationMinutes || 360;

        contract.status = 'CONCLUIDO';
        contract.checkOutAt = now;
        contract.endQrScannedAt = now;
        contract.workedMinutes = elapsedMinutes;
        contract.earlyExitReason = updates.earlyExitReason ? sanitizeInput(updates.earlyExitReason, 200) : undefined;
        contract.managerApprovedOut = true;
        contract.shiftComplianceStatus = elapsedMinutes >= minMinutes ? 'CONCLUIDO_NO_HORARIO' : 'FINALIZADO_PELO_GERENTE';

        contract.auditTrail.push({
          timestamp: now,
          action: 'CHECKOUT_QRCODE_VALIDADO',
          details: `QR Code de encerramento escaneado pelo gerente. Minutos trabalhados: ${elapsedMinutes}min. Status: ${contract.shiftComplianceStatus}.`,
        });
      }

      // ==========================================
      // REGRA: LIQUIDAÇÃO DE PAGAMENTO (ESCROW PAYOUT)
      // ==========================================
      else if (updates.status === 'VALOR_LIBERADO') {
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
        punctualityRating: updates.review.data.punctualityRating,
        proactivityRating: updates.review.data.proactivityRating,
        postureRating: updates.review.data.postureRating,
        hygieneRating: updates.review.data.hygieneRating,
        equipmentRating: updates.review.data.equipmentRating,
        rehireRecommended: updates.review.data.rehireRecommended !== false,
      };

      if (updates.review.type === 'company') {
        contract.companyReview = cleanReview;
        const freela = this.getFreelancerById(contract.freelancerId);
        if (freela) {
          const currentCount = freela.reviewsCount || 1;
          const currentRating = freela.rating || 5.0;
          const newRating = Number(((currentRating * currentCount + sanitizedRating) / (currentCount + 1)).toFixed(1));
          freela.rating = newRating;
          freela.reviewsCount = currentCount + 1;
        }
      } else {
        contract.freelancerReview = cleanReview;
      }
    }

    this.persist();
    realtimeHub.broadcast('contract_updated', contract);
    return contract;
  }

  /**
   * Direct Authoritative QR Code Scanner Engine
   * Validates tokens across devices and transitions contract state seamlessly.
   */
  scanQrToken(params: {
    qrToken: string;
    callerRole: 'EMPRESA' | 'FREELANCER';
    deviceId?: string;
    simulatedElapsedMinutes?: number;
  }): { contract: Contract; type: 'CHECKIN' | 'CHECKOUT'; message: string } {
    const raw = (params.qrToken || '').trim();
    if (!raw) {
      throw new Error('Token de QR code não fornecido.');
    }

    let contractId = '';
    let actionType: 'CHECKIN' | 'CHECKOUT' = 'CHECKIN';

    // 1. TURNOEXTRA::[TYPE]::[CONTRACT_ID]::...
    if (raw.startsWith('TURNOEXTRA::')) {
      const parts = raw.split('::');
      if (parts.length >= 3) {
        actionType = parts[1] as 'CHECKIN' | 'CHECKOUT';
        contractId = parts[2];
      }
    }
    // 2. JSON format: {"contractId": "...", "type": "..."}
    else if (raw.startsWith('{')) {
      try {
        const obj = JSON.parse(raw);
        contractId = obj.contractId;
        actionType = obj.type || 'CHECKIN';
      } catch {}
    }
    // 3. Short codes: CTR-2026-xxx or TE-xxxx
    else if (raw.startsWith('CTR-') || raw.startsWith('TE-')) {
      const parts = raw.split(':');
      contractId = parts[0];
      if (parts[1] === 'OUT' || parts[1] === 'CHECKOUT') {
        actionType = 'CHECKOUT';
      }
    } else {
      contractId = raw;
    }

    // Locate contract in database
    let contract = this.getContractById(contractId);
    if (!contract) {
      // Fuzzy lookup by ID substring or tokens
      contract = this.contracts.find(
        (c) =>
          c.id.toLowerCase() === contractId.toLowerCase() ||
          c.id.includes(contractId) ||
          (c.startQrToken && c.startQrToken.includes(raw)) ||
          (c.endQrToken && c.endQrToken.includes(raw))
      );
    }

    if (!contract) {
      throw new Error(`Contrato de diária correspondente ao token "${raw.slice(0, 25)}" não foi encontrado.`);
    }

    // Determine target action based on current state if not strictly specified
    if (contract.status === 'PAGO_E_RETIDO') {
      actionType = 'CHECKIN';
    } else if (contract.status === 'CHECKIN_REALIZADO') {
      actionType = 'CHECKOUT';
    }

    const updated = this.updateContract(contract.id, {
      status: actionType === 'CHECKIN' ? 'CHECKIN_REALIZADO' : 'CONCLUIDO',
      callerRole: params.callerRole,
      startQrToken: actionType === 'CHECKIN' ? raw : undefined,
      endQrToken: actionType === 'CHECKOUT' ? raw : undefined,
      managerApprovedOut: actionType === 'CHECKOUT',
      simulatedElapsedMinutes: params.simulatedElapsedMinutes,
    });

    const msg =
      actionType === 'CHECKIN'
        ? `Presença de ${contract.freelancerName} confirmada! Diária iniciada com sucesso.`
        : `Expediente de ${contract.freelancerName} finalizado com sucesso pelo gerente!`;

    // Notify all listening devices
    realtimeHub.broadcast('qr_scanned', {
      contractId: updated.id,
      type: actionType,
      timestamp: Date.now(),
      byDevice: params.deviceId || 'desconhecido',
      contract: updated,
    });

    return { contract: updated, type: actionType, message: msg };
  }

  // Urgent Opportunities
  getOpportunities(): ShiftOpportunity[] {
    return this.opportunities;
  }

  createOpportunity(payload: {
    companyId: string;
    companyName: string;
    companyCnpj: string;
    roleTitle: string;
    categoryId: CategoryId;
    dailyRate: number;
    date: string;
    shiftHours: string;
    venueAddress: string;
    slotsTotal?: number;
    description?: string;
  }): ShiftOpportunity {
    const slots = Math.min(Math.max(Number(payload.slotsTotal) || 1, 1), 10);
    const safeDailyRate = Math.min(Math.max(Number(payload.dailyRate), 80), 5000);

    const newOpp: ShiftOpportunity = {
      id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
      companyId: payload.companyId,
      companyName: sanitizeInput(payload.companyName, 100),
      companyCnpj: sanitizeInput(payload.companyCnpj, 30),
      roleTitle: sanitizeInput(payload.roleTitle, 100),
      categoryId: payload.categoryId,
      dailyRate: safeDailyRate,
      date: sanitizeInput(payload.date, 50),
      shiftHours: sanitizeInput(payload.shiftHours, 50),
      venueAddress: sanitizeInput(payload.venueAddress, 150),
      slotsTotal: slots,
      slotsRemaining: slots,
      status: 'ABERTA',
      createdAt: new Date().toISOString(),
      escrowTotal: safeDailyRate + Math.round(safeDailyRate * 0.08),
      requiredSkills: ['Agilidade', 'Boas Práticas'],
      urgent: true,
      description: payload.description ? sanitizeInput(payload.description, 400) : 'Diária presencial confirmada via TurnoExtra.',
    };

    this.opportunities.unshift(newOpp);
    this.persist();
    realtimeHub.broadcast('opportunity_created', newOpp);
    return newOpp;
  }

  applyToOpportunity(opportunityId: string, freelancerId: string): Contract {
    const opp = this.opportunities.find((o) => o.id === opportunityId);
    if (!opp) {
      throw new Error('Vaga de diária não encontrada');
    }

    if (opp.status !== 'ABERTA' || opp.slotsRemaining <= 0) {
      throw new Error('Esta oportunidade já foi preenchida.');
    }

    const freela = this.getFreelancerById(freelancerId);
    if (!freela) {
      throw new Error('Freelancer não cadastrado');
    }

    opp.slotsRemaining -= 1;
    if (opp.slotsRemaining <= 0) {
      opp.status = 'PREENCHIDA';
    }

    const contract = this.createContract({
      freelancerId: freela.id,
      companyId: opp.companyId,
      companyName: opp.companyName,
      companyCnpj: opp.companyCnpj,
      date: opp.date,
      shiftHours: opp.shiftHours,
      venueAddress: opp.venueAddress,
      dailyRate: opp.dailyRate,
      notes: `Vaga do Mural: ${opp.roleTitle}`,
    });

    contract.contractTermsSigned = true;
    contract.termsAcceptedAt = new Date().toISOString();

    this.persist();
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
    this.persist();
    realtimeHub.broadcast('chat_message', newMsg);
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
    this.persist();
    realtimeHub.broadcast('system_notice', { action: 'RESET_DATABASE' });
  }
}

const db = new Database();

// ==========================================
// Express Application Setup with Multi-Device Support
// ==========================================
async function startServer() {
  const app = express();

  // 1. Disable server fingerprinting
  app.disable('x-powered-by');

  // 2. Strict Security Headers (Enabling camera for QR scanning!)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Ensure camera is permitted on self for QR scanner!
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
    next();
  });

  // 3. Payload size limiting & Cookie Parser
  app.use(express.json({ limit: '500kb' }));
  app.use(cookieParser());

  // 4. Controlled CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 5. Rate Limiting Middleware
  const generalRateLimiter = createRateLimiter({
    maxRequests: 240,
    windowMs: 60 * 1000,
    message: 'Muitas requisições originadas do seu IP. Por favor, aguarde alguns segundos.',
  });

  const mutationRateLimiter = createRateLimiter({
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: 'Muitas tentativas de alteração em curto intervalo. Proteção antifraude ativada.',
  });

  app.use('/api', generalRateLimiter);
  app.use('/api/contracts', mutationRateLimiter);
  app.use('/api/companies', mutationRateLimiter);
  app.use('/api/freelancers', mutationRateLimiter);

  // ==========================================
  // Real-Time SSE Stream Endpoint (/api/realtime/stream)
  // ==========================================
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    const deviceId = (req.query.deviceId as string) || req.cookies?.['turnoextra_device_id'] || `dev_${Date.now()}`;
    const role = (req.query.role as string) || req.cookies?.['turnoextra_device_role'] || 'EMPRESA';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    const clientId = `client_${deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Register client in real-time hub
    realtimeHub.addClient({
      id: clientId,
      res,
      deviceId,
      role,
      ip,
      userAgent,
      connectedAt: Date.now(),
    });

    // Update device store
    deviceStore.registerOrUpdate({
      deviceId,
      role: role === 'FREELANCER' ? 'FREELANCER' : 'EMPRESA',
      ip,
      userAgent,
    });

    // Send initial handshake acknowledgement
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        clientId,
        deviceId,
        onlineCount: realtimeHub.getOnlineCount(),
        timestamp: Date.now(),
      })}\n\n`
    );

    req.on('close', () => {
      realtimeHub.removeClient(clientId);
    });
  });

  // ==========================================
  // Device Registry & Cookie / Cache Repositories
  // ==========================================
  app.get('/api/devices', (_req: Request, res: Response) => {
    const list = deviceStore.getAllDevices();
    res.json({
      devices: list,
      onlineCount: realtimeHub.getOnlineCount(),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/devices/handshake', (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const cookieDeviceId = req.cookies?.['turnoextra_device_id'];
      const deviceId = body.deviceId || cookieDeviceId || `dev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const role = body.role || req.cookies?.['turnoextra_device_role'] || 'EMPRESA';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';

      const session = deviceStore.registerOrUpdate({
        deviceId,
        deviceName: body.deviceName,
        role: role === 'FREELANCER' ? 'FREELANCER' : 'EMPRESA',
        userId: body.userId,
        userName: body.userName,
        avatar: body.avatar,
        ip,
        userAgent,
      });

      // Set HTTP Cookies on this device
      const cookieOptions = {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax' as const,
        path: '/',
      };

      res.cookie('turnoextra_device_id', deviceId, cookieOptions);
      res.cookie('turnoextra_device_role', session.role, cookieOptions);
      res.cookie('turnoextra_user_id', session.userId, cookieOptions);
      res.cookie('turnoextra_user_name', session.userName, cookieOptions);

      res.json(session);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Erro no handshake do dispositivo' });
    }
  });

  app.post('/api/devices/:deviceId/ping', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    deviceStore.pingDevice(deviceId);
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.get('/api/devices/:deviceId/cache', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    const cache = deviceStore.getCache(deviceId);
    res.json(cache || {});
  });

  app.post('/api/devices/:deviceId/cache', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    const cacheData = req.body;
    deviceStore.setCache(deviceId, cacheData);
    res.json({ success: true, updated: new Date().toISOString() });
  });

  app.post('/api/devices/:deviceId/clear-cache', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    deviceStore.clearCache(deviceId);
    res.json({ success: true, cleared: true });
  });

  app.get('/api/devices/:deviceId/cookies', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    const cookies = deviceStore.getCookies(deviceId);
    res.json(cookies);
  });

  app.post('/api/devices/:deviceId/cookies', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    const cookies = req.body || {};
    deviceStore.setCookies(deviceId, cookies);
    res.json({ success: true, cookies: deviceStore.getCookies(deviceId) });
  });

  // ==========================================
  // Direct Authoritative QR Code Scan Endpoint
  // ==========================================
  app.post('/api/contracts/scan-qr', (req: Request, res: Response) => {
    try {
      const { qrToken, callerRole, managerDeviceId, simulatedElapsedMinutes } = req.body;
      if (!qrToken) {
        return res.status(400).json({ error: 'Token do QR Code é obrigatório.' });
      }

      const result = db.scanQrToken({
        qrToken,
        callerRole: callerRole || 'EMPRESA',
        deviceId: managerDeviceId,
        simulatedElapsedMinutes,
      });

      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao processar leitura do QR Code.' });
    }
  });

  // Health, Stats & Security Audit info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'TurnoExtra Multi-Device Secured Backend',
      version: '2.5.0',
      uptime: process.uptime(),
      onlineDevices: realtimeHub.getOnlineCount(),
      security: {
        escrowProtection: 'ACTIVE_SHA256',
        antiDDoS: 'ACTIVE_RATE_LIMITER',
        xssSanitization: 'ENABLED',
        stateMachineGuard: 'STRICT',
        multiDeviceSync: 'SSE_ACTIVE',
        deviceCacheRepository: 'ACTIVE',
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
      const {
        status,
        pin,
        qrToken,
        startQrToken,
        endQrToken,
        earlyExitReason,
        managerApprovedOut,
        callerRole,
        checkInAt,
        simulatedElapsedMinutes,
        review,
      } = req.body;
      const updated = db.updateContract(id, {
        status,
        pin: pin ? sanitizeInput(pin, 10) : undefined,
        qrToken: qrToken ? sanitizeInput(qrToken, 200) : undefined,
        startQrToken: startQrToken ? sanitizeInput(startQrToken, 200) : undefined,
        endQrToken: endQrToken ? sanitizeInput(endQrToken, 200) : undefined,
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
      version: '2.5.0',
      timestamp: serverBuildTimestamp,
      onlineDevices: realtimeHub.getOnlineCount(),
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
      app.get('/sw.js', (_req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.resolve(distPath, 'sw.js'));
      });

      app.use(express.static(distPath));

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
    console.log(`[TurnoExtra Multi-Device Backend] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TurnoExtra Multi-Device Backend] Startup error:', err);
  process.exit(1);
});
