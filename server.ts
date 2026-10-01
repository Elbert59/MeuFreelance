import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// ==========================================
// In-Memory Database (Server-authoritative)
// ==========================================
class Database {
  private freelancers: Freelancer[] = JSON.parse(JSON.stringify(FREELANCERS));
  private companies: UserSession[] = JSON.parse(JSON.stringify(MOCK_COMPANIES));
  private contracts: Contract[] = JSON.parse(JSON.stringify(INITIAL_CONTRACTS));
  private opportunities: ShiftOpportunity[] = JSON.parse(JSON.stringify(INITIAL_OPPORTUNITIES));
  private messages: ChatMessage[] = JSON.parse(JSON.stringify(INITIAL_CHAT_MESSAGES));

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

    const newFreela: Freelancer = {
      id: `freela-${Date.now()}`,
      name: data.name || 'Profissional Gastronômico',
      role: data.role || 'Cozinheiro',
      categoryId: (data.categoryId as CategoryId) || 'cozinha-quente',
      specialty: data.specialty || 'Geral',
      rating: 5.0,
      reviewsCount: 1,
      completedGigs: 0,
      hourlyRate: data.dailyRate ? Math.round(data.dailyRate / 6) : 45,
      dailyRate: data.dailyRate || 270,
      location: data.location || 'Maringá, PR',
      experienceYears: data.experienceYears || 3,
      verified: true,
      avatarUrl: data.avatarUrl || '',
      avatarFallbackColor: randomColor,
      skills: data.skills || ['Higiene Sanitária (ANVISA)', 'Boas Práticas'],
      gear: data.gear || ['Dólmã completa', 'Sapatos antiderrapantes'],
      certifications: data.certifications || ['Manipulação de Alimentos'],
      bio: data.bio || 'Profissional qualificado pronto para turnos em Maringá e região.',
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
    const newCompany: UserSession = {
      role: 'EMPRESA',
      id: `comp-${Date.now()}`,
      name: data.name || 'Nova Empresa Gastronômica',
      identifier: data.identifier || '00.000.000/0001-00',
      avatar: data.avatar || '🍽️',
      location: data.location || 'Maringá, PR',
      walletBalance: data.walletBalance || 5000,
      email: data.email || 'contato@empresa.com.br',
      phone: data.phone || '(44) 99999-0000',
    };

    this.companies.unshift(newCompany);
    return newCompany;
  }

  // Contracts & Escrow
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

    const escrowFee = Math.round(payload.dailyRate * 0.08);
    const totalAmount = payload.dailyRate + escrowFee;
    const now = new Date().toISOString();

    const newContract: Contract = {
      id: `CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      freelancerId: freela.id,
      freelancerName: freela.name,
      freelancerRole: freela.role,
      freelancerAvatar: freela.avatarUrl,
      companyId: payload.companyId,
      companyName: payload.companyName,
      companyCnpj: payload.companyCnpj,
      categoryId: freela.categoryId,
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

    this.contracts.unshift(newContract);

    // Automatic escrow system message in chat
    this.addChatMessage({
      contractId: newContract.id,
      senderRole: 'EMPRESA',
      senderName: payload.companyName,
      content: `Olá ${freela.name}! Contrato confirmado. R$ ${newContract.totalAmount.toFixed(2)} retido em custódia (Escrow). Te aguardamos às ${payload.shiftHours.split(' ')[0]} no endereço informado!`,
    });

    return newContract;
  }

  updateContract(
    id: string,
    updates: {
      status?: ContractStatus;
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

    if (updates.status) {
      contract.status = updates.status;
      if (updates.status === 'CHECKIN_REALIZADO') contract.checkInAt = now;
      if (updates.status === 'CONCLUIDO') contract.checkOutAt = now;
      if (updates.status === 'VALOR_LIBERADO') {
        contract.releasedAt = now;
        // Increment completed gigs for freelancer
        const freela = this.getFreelancerById(contract.freelancerId);
        if (freela) {
          freela.completedGigs = (freela.completedGigs || 0) + 1;
        }
      }
    }

    if (updates.review) {
      if (updates.review.type === 'company') {
        contract.companyReview = updates.review.data;
        // Update freelancer rating average
        const freela = this.getFreelancerById(contract.freelancerId);
        if (freela) {
          const newReviewsCount = freela.reviewsCount + 1;
          const newRating = Number(
            ((freela.rating * freela.reviewsCount + updates.review.data.rating) / newReviewsCount).toFixed(1)
          );
          freela.rating = newRating;
          freela.reviewsCount = newReviewsCount;
        }
      } else {
        contract.freelancerReview = updates.review.data;
      }
    }

    return contract;
  }

  // Opportunities (Mural de Diárias Urgentes)
  getOpportunities(): ShiftOpportunity[] {
    return [...this.opportunities];
  }

  getOpportunityById(id: string): ShiftOpportunity | undefined {
    return this.opportunities.find((o) => o.id === id);
  }

  createOpportunity(data: Omit<ShiftOpportunity, 'id' | 'createdAt' | 'status' | 'slotsRemaining'>): ShiftOpportunity {
    const newOpp: ShiftOpportunity = {
      ...data,
      id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      slotsRemaining: data.slotsTotal,
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
// Express Application Setup
// ==========================================
async function startServer() {
  const app = express();

  // Middleware: JSON Body Parser & CORS
  app.use(express.json());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // API Routes (/api/*)
  // ==========================================

  // Health & Stats
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ChefMatch B2B Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
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
    const freelancers = db.getFreelancers({ category, search, location });
    res.json(freelancers);
  });

  app.get('/api/freelancers/:id', (req: Request, res: Response) => {
    const freela = db.getFreelancerById(req.params.id);
    if (!freela) {
      return res.status(404).json({ error: 'Freelancer não encontrado' });
    }
    res.json(freela);
  });

  app.post('/api/freelancers', (req: Request, res: Response) => {
    try {
      const { name, role, categoryId, dailyRate, location } = req.body;
      if (!name || !role || !categoryId || !dailyRate) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes (name, role, categoryId, dailyRate)' });
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
    const company = db.getCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json(company);
  });

  app.post('/api/companies', (req: Request, res: Response) => {
    try {
      const { name, cnpj, location } = req.body;
      if (!name || !cnpj) {
        return res.status(400).json({ error: 'Razão Social e CNPJ são obrigatórios' });
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

  // 3. Contracts & Escrow
  app.get('/api/contracts', (req: Request, res: Response) => {
    const { companyId, freelancerId, status } = req.query as {
      companyId?: string;
      freelancerId?: string;
      status?: string;
    };
    const contracts = db.getContracts({ companyId, freelancerId, status });
    res.json(contracts);
  });

  app.get('/api/contracts/:id', (req: Request, res: Response) => {
    const contract = db.getContractById(req.params.id);
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

      const contract = db.createContract({
        freelancerId,
        companyId,
        companyName: companyName || 'Restaurante Contratante',
        companyCnpj: companyCnpj || '00.000.000/0001-00',
        date,
        shiftHours,
        venueAddress: venueAddress || 'Maringá, PR',
        dailyRate: Number(dailyRate),
        notes,
      });

      res.status(201).json(contract);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao gerar contrato com Escrow' });
    }
  });

  app.patch('/api/contracts/:id', (req: Request, res: Response) => {
    try {
      const { status, review } = req.body;
      const updated = db.updateContract(req.params.id, { status, review });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao atualizar contrato' });
    }
  });

  // 4. Contract Chat Messages
  app.get('/api/contracts/:id/messages', (req: Request, res: Response) => {
    const messages = db.getChatMessages(req.params.id);
    res.json(messages);
  });

  app.post('/api/contracts/:id/messages', (req: Request, res: Response) => {
    try {
      const { senderRole, senderName, content } = req.body;
      if (!senderRole || !senderName || !content) {
        return res.status(400).json({ error: 'senderRole, senderName e content são obrigatórios' });
      }

      const newMsg = db.addChatMessage({
        contractId: req.params.id,
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

      const newOpp = db.createOpportunity(req.body);
      res.status(201).json(newOpp);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao publicar oportunidade' });
    }
  });

  app.post('/api/opportunities/:id/apply', (req: Request, res: Response) => {
    try {
      const { freelancerId } = req.body;
      if (!freelancerId) {
        return res.status(400).json({ error: 'freelancerId é obrigatório para candidatar-se' });
      }

      const contract = db.applyToOpportunity(req.params.id, freelancerId);
      res.status(201).json(contract);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Erro ao candidatar-se à vaga do mural' });
    }
  });

  // Database Reset
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
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  // Start HTTP Listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChefMatch Backend] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ChefMatch Backend] Startup error:', err);
  process.exit(1);
});
