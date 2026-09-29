import React, { useState } from 'react';
import { Copy, Check, FolderTree, Code, ShieldCheck, Layers, FileCode } from 'lucide-react';

export const NextjsArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'folders' | 'page' | 'api' | 'modal'>('folders');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const folderStructureCode = `chefmatch-b2b/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Tela de seleção e acesso
│   │   ├── cadastro-empresa/
│   │   │   └── page.tsx              # Cadastro completo de Restaurante/CNPJ
│   │   └── cadastro-freelancer/
│   │       └── page.tsx              # Cadastro de Sushiman, Garçom, Barman (Pix & Facas)
│   ├── (empresa)/
│   │   ├── page.tsx                  # Dashboard da Empresa (Categorias estilo iFood + Freelas)
│   │   ├── mural/
│   │   │   └── page.tsx              # Mural de Diárias Urgentes B2B
│   │   ├── perfil/[freelancerId]/
│   │   │   └── page.tsx              # Perfil completo e contratação
│   │   └── contratos/
│   │       └── page.tsx              # Acompanhamento do Escrow e Chat de Turno
│   ├── (freelancer)/
│   │   └── painel/
│   │       └── page.tsx              # Painel do Freela (Check-in GPS / Check-out / Saque Pix)
│   ├── api/
│   │   ├── freelancers/
│   │   │   └── route.ts              # GET: Lista e filtros | POST: Cadastro de novo profissional
│   │   ├── companies/
│   │   │   └── route.ts              # GET: Empresas ativas | POST: Cadastro de CNPJ
│   │   ├── opportunities/
│   │   │   └── route.ts              # GET: Diárias urgentes | POST: Publicar nova diária
│   │   ├── contracts/
│   │   │   ├── route.ts              # GET / POST: Criação com Escrow Retido
│   │   │   └── [id]/
│   │   │       └── route.ts          # PATCH: Check-in / Check-out / Liberação Pix
│   │   └── chat/
│   │       └── route.ts              # GET / POST: Mensagens de alinhamento pré-turno
│   ├── layout.tsx                    # Root layout com AuthProvider e Tailwind
│   └── globals.css                   # Tailwind CSS imports
├── components/
│   ├── CategoryCard.tsx              # Card visual de especialidade gastronômica
│   ├── FreelancerCard.tsx            # Card com foto, nota Uber (4.96⭐) e diária
│   ├── HireModal.tsx                 # Modal de reserva e depósito em Escrow
│   ├── CheckinCheckoutModal.tsx      # Modal de Check-in GPS e Check-out
│   ├── RatingModal.tsx               # Modal de avaliação mútua com tags rápidas
│   ├── RegisterCompanyModal.tsx      # Formulário B2B de Restaurante
│   ├── RegisterFreelancerModal.tsx   # Formulário de Profissional (Chave Pix, Facas)
│   ├── OpportunitiesBoard.tsx        # Mural de Diárias Urgentes
│   └── ContractChatModal.tsx         # Chat de alinhamento de turno
├── context/
│   └── AuthContext.tsx               # Gerenciador global de sessão B2B e cadastros
├── lib/
│   └── escrow.ts                     # Regras de custódia e garantia financeira
├── types/
│   └── index.ts                      # Interfaces de Freelancer, Empresa, Contrato e Chat
└── package.json`;

  const companyPageCode = `// app/(empresa)/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Fish, Users, Wine, Flame, ChefHat, Star, ShieldCheck, MapPin } from 'lucide-react';

interface Freelancer {
  id: string;
  name: string;
  role: string;
  categoryId: string;
  specialty: string;
  rating: number;
  completedGigs: number;
  dailyRate: number;
  location: string;
  verified: boolean;
}

export default function EmpresaDashboardPage() {
  const [category, setCategory] = useState<string>('all');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFreela, setSelectedFreela] = useState<Freelancer | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const url = category === 'all' 
        ? '/api/freelancers' 
        : \`/api/freelancers?category=\${category}\`;
      const res = await fetch(url);
      const data = await res.json();
      setFreelancers(data);
      setLoading(false);
    }
    load();
  }, [category]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* 1. Header do Marketplace */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          Encontre Profissionais para o Turno de Hoje
        </h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Contratação rápida B2B em Maringá com diária garantida via Escrow.
        </p>
      </div>

      {/* 2. Categorias Visuais Estilo iFood */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-10">
        {[
          { id: 'cozinha-oriental', title: 'Cozinha Oriental', sub: 'Sushimen & Robata', icon: Fish },
          { id: 'salao-atendimento', title: 'Salão & Atendimento', sub: 'Garçons & Maîtres', icon: Users },
          { id: 'bar-bebidas', title: 'Bar & Mixologia', sub: 'Bartenders & Baristas', icon: Wine },
          { id: 'parrilla-churrasco', title: 'Parrilla & Carnes', sub: 'Churrasqueiros', icon: Flame },
          { id: 'cozinha-quente', title: 'Cozinha Geral', sub: 'Sous-Chefs & Linha', icon: ChefHat },
        ].map((cat) => {
          const Icon = cat.icon;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(active ? 'all' : cat.id)}
              className={\`p-4 rounded-xl border text-left transition-all \${
                active 
                  ? 'border-amber-400 bg-neutral-900 ring-2 ring-amber-400/30' 
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }\`}
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">{cat.title}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{cat.sub}</p>
            </button>
          );
        })}
      </div>

      {/* 3. Lista de Profissionais Disponíveis */}
      <h2 className="text-xl font-bold text-white mb-4">
        Profissionais Prontos para Turno
      </h2>

      {loading ? (
        <div className="text-neutral-400 text-sm">Buscando profissionais...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {freelancers.map((f) => (
            <div key={f.id} className="p-5 rounded-xl border border-neutral-800 bg-neutral-900 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{f.name}</h3>
                    <p className="text-xs text-neutral-400">{f.role}</p>
                  </div>
                  {/* Nota estilo Uber */}
                  <div className="flex items-center gap-1 bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{f.rating.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-amber-200/90 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 mb-3">
                  {f.specialty}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{f.location}</span>
                  <span>·</span>
                  <span>{f.completedGigs} diárias</span>
                </div>
              </div>

              {/* Preço e Botão Contratar */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Diária</span>
                  <span className="text-lg font-bold text-white font-mono">R$ {f.dailyRate}</span>
                </div>
                <button
                  onClick={() => setSelectedFreela(f)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Contratar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}`;

  const apiRouteCode = `// app/api/contracts/route.ts
import { NextResponse } from 'next/server';

// Banco em memória simulando persistência rápida
let contractsDB: any[] = [];

// GET /api/contracts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const freelancerId = searchParams.get('freelancerId');

  let list = [...contractsDB];
  if (companyId) list = list.filter((c) => c.companyId === companyId);
  if (freelancerId) list = list.filter((c) => c.freelancerId === freelancerId);

  return NextResponse.json(list);
}

// POST /api/contracts (Criação com Pagamento Retido no Cofre - Escrow)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { freelancerId, freelancerName, companyId, companyName, companyCnpj, dailyRate, date, shiftHours, venueAddress } = body;

    if (!freelancerId || !companyId || !dailyRate) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const escrowFee = Math.round(dailyRate * 0.08); // 8% taxa de garantia
    const totalAmount = dailyRate + escrowFee;
    const now = new Date().toISOString();

    const newContract = {
      id: \`CTR-\${new Date().getFullYear()}-\${Math.floor(100 + Math.random() * 900)}\`,
      freelancerId,
      freelancerName,
      companyId,
      companyName,
      companyCnpj,
      dailyRate,
      escrowFee,
      totalAmount,
      date: date || 'Hoje',
      shiftHours: shiftHours || '18:00 - 00:00',
      venueAddress: venueAddress || 'Maringá, PR',
      status: 'PAGO_E_RETIDO', // STATUS INICIAL DE ESCROW
      createdAt: now,
      paidAt: now,
    };

    contractsDB.unshift(newContract);

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar contrato escrow' }, { status: 500 });
  }
}

// PATCH /api/contracts (Transição de Status do Escrow e Registro de Reviews)
export async function PATCH(request: Request) {
  try {
    const { contractId, status, review } = await request.json();
    const index = contractsDB.findIndex((c) => c.id === contractId);

    if (index === -1) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const contract = { ...contractsDB[index] };

    // Validação da esteira: PAGO_E_RETIDO -> CHECKIN_REALIZADO -> CONCLUIDO -> VALOR_LIBERADO
    if (status) {
      contract.status = status;
      if (status === 'CHECKIN_REALIZADO') contract.checkInAt = now;
      if (status === 'CONCLUIDO') contract.checkOutAt = now;
      if (status === 'VALOR_LIBERADO') contract.releasedAt = now;
    }

    // Registro das avaliações mútuas estilo Uber
    if (review) {
      if (review.type === 'company') {
        contract.companyReview = review.data;
      } else {
        contract.freelancerReview = review.data;
      }
    }

    contractsDB[index] = contract;
    return NextResponse.json(contract);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 });
  }
}`;

  const modalCode = `// components/CheckinCheckoutModal.tsx
'use client';

import React, { useState } from 'react';
import { Clock, ShieldCheck, Check, Star, ThumbsUp } from 'lucide-react';

interface Props {
  contract: any;
  onUpdate: (updated: any) => void;
  onClose: () => void;
}

export function CheckinCheckoutModal({ contract, onUpdate, onClose }: Props) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = [
    'Ambiente Organizado',
    'Pagamento Pontual',
    'Equipe Acolhedora',
    'Estrutura Impecável',
    'Alimentação Fornecida',
  ];

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    const res = await fetch('/api/contracts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contract.id, status: 'CHECKIN_REALIZADO' }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setIsSubmitting(false);
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    // 1. Marca como Concluído
    await fetch('/api/contracts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contract.id, status: 'CONCLUIDO' }),
    });

    // 2. Libera o pagamento do Escrow (VALOR_LIBERADO)
    const res = await fetch('/api/contracts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contract.id, status: 'VALOR_LIBERADO' }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setIsSubmitting(false);
  };

  const handleSendRating = async () => {
    setIsSubmitting(true);
    const res = await fetch('/api/contracts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: contract.id,
        review: {
          type: 'freelancer',
          data: { rating, tags: selectedTags, comment, createdAt: new Date().toISOString() },
        },
      }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-white">
        <h3 className="text-lg font-bold">Gestão do Turno B2B</h3>
        <p className="text-xs text-neutral-400 mt-1">{contract.companyName} · {contract.shiftHours}</p>

        {/* 1. Estado PAGO_E_RETIDO: Botão Check-in */}
        {contract.status === 'PAGO_E_RETIDO' && (
          <div className="my-6">
            <p className="text-xs text-amber-300 bg-amber-950/60 p-3 rounded-xl border border-amber-800/40 mb-4">
              Valor de R$ {contract.dailyRate} garantido no cofre da plataforma.
            </p>
            <button
              onClick={handleCheckIn}
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-sm"
            >
              Fazer Check-in (Iniciar Expediente)
            </button>
          </div>
        )}

        {/* 2. Estado CHECKIN_REALIZADO: Botão Check-out */}
        {contract.status === 'CHECKIN_REALIZADO' && (
          <div className="my-6">
            <p className="text-xs text-sky-300 bg-sky-950/60 p-3 rounded-xl border border-sky-800/40 mb-4">
              Expediente em andamento. Ao finalizar, o valor será liberado.
            </p>
            <button
              onClick={handleCheckOut}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-sm"
            >
              Fazer Check-out (Finalizar Expediente)
            </button>
          </div>
        )}

        {/* 3. Estado VALOR_LIBERADO: Avaliação Estilo Uber */}
        {(contract.status === 'CONCLUIDO' || contract.status === 'VALOR_LIBERADO') && (
          <div className="my-6 space-y-4">
            <p className="text-xs text-emerald-300 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40">
              Valor de R$ {contract.dailyRate} liberado via Pix! Avalie a Empresa:
            </p>

            {/* Estrelas */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star className={\`w-8 h-8 \${rating >= s ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}\`} />
                </button>
              ))}
            </div>

            {/* Tags rápidas */}
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTags(selectedTags.includes(t) ? selectedTags.filter((x) => x !== t) : [...selectedTags, t])}
                  className={\`text-xs px-2.5 py-1 rounded-lg border \${selectedTags.includes(t) ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-neutral-950 border-neutral-800'}\`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleSendRating}
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-sm"
            >
              Enviar Avaliação
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full text-center text-xs text-neutral-400 mt-2">
          Fechar
        </button>
      </div>
    </div>
  );
}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2.5 mb-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">
            Arquitetura & Entregáveis Next.js (App Router)
          </h2>
        </div>
        <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
          Estrutura pronta para migração e testes em produção com Next.js 14/15, Tailwind CSS, TypeScript e API Routes modulares de Escrow.
        </p>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'folders'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>1. Estrutura de Pastas Next.js</span>
          </button>

          <button
            onClick={() => setActiveTab('page')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'page'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. Página da Empresa (page.tsx)</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'api'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. API Route Escrow (route.ts)</span>
          </button>

          <button
            onClick={() => setActiveTab('modal')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'modal'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>4. Modais Check-in & Rating</span>
          </button>
        </div>
      </div>

      {/* Code Display Container */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/60">
          <span className="text-xs font-mono font-bold text-neutral-300">
            {activeTab === 'folders' && 'Estrutura recomendada do projeto Next.js App Router'}
            {activeTab === 'page' && 'app/(empresa)/page.tsx · Frontend com Categorias & Freelas'}
            {activeTab === 'api' && 'app/api/contracts/route.ts · Backend de Mudança de Status do Escrow'}
            {activeTab === 'modal' && 'components/CheckinCheckoutModal.tsx · Check-in/out & Avaliação Uber'}
          </span>

          <button
            onClick={() => {
              const codeMap = {
                folders: folderStructureCode,
                page: companyPageCode,
                api: apiRouteCode,
                modal: modalCode,
              };
              copyToClipboard(codeMap[activeTab], activeTab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 sm:p-6 text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed max-h-[600px] selection:bg-amber-500 selection:text-neutral-950">
          {activeTab === 'folders' && folderStructureCode}
          {activeTab === 'page' && companyPageCode}
          {activeTab === 'api' && apiRouteCode}
          {activeTab === 'modal' && modalCode}
        </pre>
      </div>
    </div>
  );
};
