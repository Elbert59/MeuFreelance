import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShieldCheck,
  User,
  Building2,
  Flame,
  Wallet,
  LogOut,
  Lock,
  Search,
  Smartphone,
  Radio,
} from 'lucide-react';

export type AppTab = 'empresa' | 'mural' | 'freelancer' | 'contratos';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenLogin: () => void;
  onOpenRegisterCompany: () => void;
  onOpenRegisterFreelancer: () => void;
  onOpenSecurityModal: () => void;
  onOpenDeviceCacheModal?: () => void;
  onlineDeviceCount?: number;
  pendingEscrowTotal: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
  onOpenRegisterCompany,
  onOpenRegisterFreelancer,
  onOpenSecurityModal,
  onOpenDeviceCacheModal,
  onlineDeviceCount = 1,
  pendingEscrowTotal,
}) => {
  const { session, isLoggedIn, logout } = useAuth();
  const isCompany = session.role === 'EMPRESA';

  const handleNavClick = (tab: AppTab) => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick(isCompany ? 'empresa' : 'freelancer')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md py-1"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              TE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
                  TurnoExtra <span className="text-amber-600 font-extrabold text-sm tracking-wider">B2B</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSecurityModal();
                  }}
                  title="Conheça a Central de Segurança & Garantia Escrow"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cofre Escrow</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">Gastronomia & Eventos · Maringá</p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links - STRICTLY SEGREGATED BY ROLE */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-neutral-600">
          {!isLoggedIn ? (
            /* Visitor Navigation */
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Página Principal · Faça login ou cadastre-se para acessar</span>
            </div>
          ) : isCompany ? (
            /* EMPRESA EXCLUSIVE NAVIGATION */
            <>
              <button
                onClick={() => handleNavClick('empresa')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'empresa'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                    : 'hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span>Buscar Freelancers</span>
              </button>

              <button
                onClick={() => handleNavClick('mural')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'mural'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                    : 'hover:text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Mural de Vagas</span>
              </button>

              <button
                onClick={() => handleNavClick('contratos')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'contratos'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                    : 'hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                <span>Contratos & Escrow</span>
                {pendingEscrowTotal > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </>
          ) : (
            /* FREELANCER EXCLUSIVE NAVIGATION */
            <>
              <button
                onClick={() => handleNavClick('freelancer')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'freelancer'
                    ? 'bg-emerald-100 text-emerald-950 font-bold shadow-xs'
                    : 'hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Meu Painel / Check-in</span>
              </button>

              <button
                onClick={() => handleNavClick('mural')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'mural'
                    ? 'bg-emerald-100 text-emerald-950 font-bold shadow-xs'
                    : 'hover:text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Mural de Diárias</span>
              </button>

              <button
                onClick={() => handleNavClick('contratos')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'contratos'
                    ? 'bg-emerald-100 text-emerald-950 font-bold shadow-xs'
                    : 'hover:text-neutral-950 hover:bg-neutral-50'
                }`}
              >
                <span>Meus Contratos & Escrow</span>
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Actions, Registration & Session */}
        <div className="flex items-center gap-2">
          {/* If NOT Logged In: Show Clear Login & Cadastro CTA */}
          {!isLoggedIn ? (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-950" />
              <span>Entrar / Cadastrar</span>
            </button>
          ) : (
            <>
              {/* Profile Badge (Role Indicator) - Replaces arbitrary switchRole */}
              <div
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                  isCompany
                    ? 'border-amber-300 bg-amber-50/90 text-amber-900'
                    : 'border-emerald-300 bg-emerald-50/90 text-emerald-900'
                }`}
              >
                {isCompany ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Área da Empresa</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Área do Freelancer</span>
                  </>
                )}
              </div>

              {/* Quick Register button appropriate for role */}
              <div className="hidden sm:flex items-center gap-1.5">
                {isCompany ? (
                  <button
                    onClick={onOpenRegisterCompany}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    + Nova Empresa
                  </button>
                ) : (
                  <button
                    onClick={onOpenRegisterFreelancer}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    + Novo Freela
                  </button>
                )}
              </div>

              {/* Multi-Device Live Sync & Cache Repository Indicator */}
              {onOpenDeviceCacheModal && (
                <button
                  type="button"
                  onClick={onOpenDeviceCacheModal}
                  title="Gerenciar Dados, Cookies e Dispositivos Conectados em Tempo Real"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Smartphone className="w-3.5 h-3.5 text-sky-700" />
                  <span className="hidden sm:inline">
                    {onlineDeviceCount} {onlineDeviceCount === 1 ? 'Aparelho' : 'Aparelhos'}
                  </span>
                </button>
              )}

              {/* PWA Install Button */}
              <PWAInstallButton variant="header" />

              {/* Profile & Wallet */}
              <button
                onClick={onOpenLogin}
                title="Clique para alternar perfil ou acessar outra conta"
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

              {/* Logout button */}
              <button
                onClick={logout}
                title="Encerrar Sessão e Voltar para Página Inicial de Cadastro"
                className="p-2 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip - STRICTLY SEGREGATED BY ROLE */}
      {isLoggedIn && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-3 py-2 flex items-center justify-between text-xs overflow-x-auto gap-2">
          {isCompany ? (
            /* Mobile Empresa Tabs */
            <>
              <button
                onClick={() => handleNavClick('empresa')}
                className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
                  currentTab === 'empresa' ? 'bg-amber-100 text-amber-950 font-bold' : 'text-neutral-600'
                }`}
              >
                Buscar Freelancers
              </button>
              <button
                onClick={() => handleNavClick('mural')}
                className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 font-medium ${
                  currentTab === 'mural' ? 'bg-amber-100 text-amber-950 font-bold' : 'text-neutral-600'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-600" /> Mural
              </button>
              <button
                onClick={() => handleNavClick('contratos')}
                className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
                  currentTab === 'contratos' ? 'bg-amber-100 text-amber-950 font-bold' : 'text-neutral-600'
                }`}
              >
                Contratos Escrow
              </button>
            </>
          ) : (
            /* Mobile Freelancer Tabs */
            <>
              <button
                onClick={() => handleNavClick('freelancer')}
                className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
                  currentTab === 'freelancer' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'text-neutral-600'
                }`}
              >
                Meu Painel / Check-in
              </button>
              <button
                onClick={() => handleNavClick('mural')}
                className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 font-medium ${
                  currentTab === 'mural' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'text-neutral-600'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-600" /> Mural
              </button>
              <button
                onClick={() => handleNavClick('contratos')}
                className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
                  currentTab === 'contratos' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'text-neutral-600'
                }`}
              >
                Meus Contratos
              </button>
            </>
          )}

          <div className="shrink-0">
            <PWAInstallButton variant="header" />
          </div>
        </div>
      )}
    </header>
  );
};
