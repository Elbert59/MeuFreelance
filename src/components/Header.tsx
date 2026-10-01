import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowLeftRight,
  User,
  Building2,
  Flame,
  Wallet,
} from 'lucide-react';

export type AppTab = 'empresa' | 'mural' | 'freelancer' | 'contratos';

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
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab(isCompany ? 'empresa' : 'freelancer')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md py-1"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              CM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
                  ChefMatch <span className="text-amber-600 font-extrabold text-sm tracking-wider">B2B</span>
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Cofre Escrow Ativo
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">Gastronomia & Eventos · Maringá</p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-600">
          <button
            onClick={() => onSelectTab('empresa')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'empresa'
                ? 'bg-neutral-100 text-neutral-950 font-semibold'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            Freelancers
          </button>

          <button
            onClick={() => onSelectTab('mural')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'mural'
                ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                : 'hover:text-amber-700 hover:bg-amber-50/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Mural de Diárias</span>
          </button>

          <button
            onClick={() => onSelectTab('contratos')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'contratos'
                ? 'bg-neutral-100 text-neutral-950 font-semibold'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span>Contratos Escrow</span>
            {pendingEscrowTotal > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('freelancer')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'freelancer'
                ? 'bg-neutral-100 text-neutral-950 font-semibold'
                : 'hover:text-neutral-950 hover:bg-neutral-50'
            }`}
          >
            <span>Painel do Freela</span>
          </button>
        </nav>

        {/* Zone 3: Actions, Registration & Session */}
        <div className="flex items-center gap-2">
          {/* Quick Register button */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={onOpenRegisterCompany}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-amber-50/80 hover:bg-amber-100 transition-colors whitespace-nowrap"
            >
              + Nova Empresa
            </button>
            <button
              onClick={onOpenRegisterFreelancer}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              + Novo Freela
            </button>
          </div>

          {/* Quick switch */}
          <button
            onClick={switchRole}
            title={`Alternar para ${isCompany ? 'Visão Freelancer' : 'Visão Empresa'}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline text-neutral-500">Modo:</span>
            <span className="font-semibold text-neutral-900">
              {isCompany ? 'Empresa' : 'Freelancer'}
            </span>
          </button>

          {/* Profile & Wallet */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-left shadow-xs"
          >
            <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center text-sm border border-neutral-200 shrink-0">
              {isCompany ? <Building2 className="w-3.5 h-3.5 text-amber-600" /> : <User className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-neutral-900 leading-tight truncate max-w-[110px]">
                {session.name}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                <Wallet className="w-2.5 h-2.5 text-emerald-600" />
                <span className="font-mono text-emerald-700 font-semibold">
                  R$ {session.walletBalance || 0}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden border-t border-neutral-200 bg-white px-3 py-2 flex items-center justify-between text-xs overflow-x-auto gap-2">
        <button
          onClick={() => onSelectTab('empresa')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'empresa' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-neutral-600'}`}
        >
          Freelancers
        </button>
        <button
          onClick={() => onSelectTab('mural')}
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${currentTab === 'mural' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-neutral-600'}`}
        >
          <Flame className="w-3 h-3 text-amber-600" /> Mural
        </button>
        <button
          onClick={() => onSelectTab('contratos')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'contratos' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-neutral-600'}`}
        >
          Escrow
        </button>
        <button
          onClick={() => onSelectTab('freelancer')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'freelancer' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-neutral-600'}`}
        >
          Check-in Freela
        </button>
      </div>
    </header>
  );
};
