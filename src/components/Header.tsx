import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowLeftRight,
  User,
  Building2,
  BookOpen,
  Flame,
  UserPlus,
  Wallet,
} from 'lucide-react';

export type AppTab = 'empresa' | 'mural' | 'freelancer' | 'contratos' | 'docs';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenLogin: () => void;
  onOpenRegisterCompany: () => void;
  onOpenRegisterFreelancer: () => void;
  pendingEscrowTotal: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
  onOpenRegisterCompany,
  onOpenRegisterFreelancer,
  pendingEscrowTotal,
}) => {
  const { session, switchRole } = useAuth();
  const isCompany = session.role === 'EMPRESA';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab(isCompany ? 'empresa' : 'freelancer')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md py-1"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-neutral-950 text-base shadow-sm">
              CM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  ChefMatch <span className="text-amber-500 font-extrabold text-sm tracking-wider">B2B</span>
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Cofre Escrow Ativo
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">Gastronomia & Eventos · Maringá</p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-300">
          <button
            onClick={() => onSelectTab('empresa')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'empresa'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            Freelancers
          </button>

          <button
            onClick={() => onSelectTab('mural')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'mural'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Mural de Diárias</span>
          </button>

          <button
            onClick={() => onSelectTab('contratos')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'contratos'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <span>Contratos Escrow</span>
            {pendingEscrowTotal > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('freelancer')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'freelancer'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <span>Painel do Freela</span>
          </button>

          <button
            onClick={() => onSelectTab('docs')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'docs'
                ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm'
                : 'hover:text-amber-400 hover:bg-neutral-900/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Next.js Docs</span>
          </button>
        </nav>

        {/* Zone 3: Actions, Registration & Session */}
        <div className="flex items-center gap-2">
          {/* Quick Register button */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={onOpenRegisterCompany}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
            >
              + Nova Empresa
            </button>
            <button
              onClick={onOpenRegisterFreelancer}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors whitespace-nowrap"
            >
              + Novo Freela
            </button>
          </div>

          {/* Quick switch */}
          <button
            onClick={switchRole}
            title={`Alternar para ${isCompany ? 'Visão Freelancer' : 'Visão Empresa'}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline text-neutral-400">Modo:</span>
            <span className="font-semibold text-amber-300">
              {isCompany ? 'Empresa' : 'Freelancer'}
            </span>
          </button>

          {/* Profile & Wallet */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-sm border border-neutral-700 shrink-0">
              {isCompany ? <Building2 className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                {session.name}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                <Wallet className="w-2.5 h-2.5 text-emerald-400" />
                <span className="font-mono text-emerald-400 font-semibold">
                  R$ {session.walletBalance || 0}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden border-t border-neutral-900 bg-neutral-950 px-3 py-2 flex items-center justify-between text-xs overflow-x-auto gap-2">
        <button
          onClick={() => onSelectTab('empresa')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'empresa' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          Freelancers
        </button>
        <button
          onClick={() => onSelectTab('mural')}
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${currentTab === 'mural' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          <Flame className="w-3 h-3 text-amber-400" /> Mural
        </button>
        <button
          onClick={() => onSelectTab('contratos')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'contratos' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          Escrow
        </button>
        <button
          onClick={() => onSelectTab('freelancer')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'freelancer' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          Check-in Freela
        </button>
        <button
          onClick={() => onSelectTab('docs')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'docs' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400'}`}
        >
          Next.js Docs
        </button>
      </div>
    </header>
  );
};
