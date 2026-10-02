import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  ShieldCheck,
  Building2,
  User,
  PlusCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Flame,
  Wallet,
} from 'lucide-react';

interface B2BAuthGatewayProps {
  onOpenLogin: () => void;
  onOpenRegisterCompany: () => void;
  onOpenRegisterFreelancer: () => void;
  onOpenSecurityModal: () => void;
}

export const B2BAuthGateway: React.FC<B2BAuthGatewayProps> = ({
  onOpenLogin,
  onOpenRegisterCompany,
  onOpenRegisterFreelancer,
  onOpenSecurityModal,
}) => {
  const { allCompanies, availableFreelancers, loginAsCompany, loginAsFreelancer } = useAuth();
  const [selectedDemoRole, setSelectedDemoRole] = useState<'EMPRESA' | 'FREELANCER'>('EMPRESA');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Barrier Banner */}
      <div className="relative rounded-3xl border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/30 p-6 sm:p-10 overflow-hidden shadow-lg">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Security Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Acesso Restrito B2B · Autenticação Obrigatória</span>
            </span>
            <button
              onClick={onOpenSecurityModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conhecer Garantia Escrow →</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Plataforma B2B de Freelancers da Gastronomia em Maringá
          </h1>

          <p className="text-sm sm:text-base text-neutral-700 mt-3 leading-relaxed">
            A consulta a <strong>Sushimen, Garçons, Bartenders e Chefs de Cozinha</strong>, especialidades culinárias e contratação direta é <strong>exclusiva para usuários autenticados</strong>. Inicie sua sessão ou cadastre-se para desbloquear a plataforma.
          </p>

          {/* Quick CTA buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Lock className="w-4 h-4 text-neutral-950" />
              <span>Abrir Janela de Sessão & Cadastro</span>
            </button>
            <button
              onClick={onOpenRegisterCompany}
              className="px-4 py-3 rounded-xl bg-white border border-neutral-300 hover:border-amber-400 text-neutral-900 font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Cadastrar Empresa</span>
            </button>
            <button
              onClick={onOpenRegisterFreelancer}
              className="px-4 py-3 rounded-xl bg-white border border-neutral-300 hover:border-emerald-400 text-neutral-900 font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Cadastrar Freelancer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentication & Registration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Create Account Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Crie sua Conta em Menos de 1 Minuto</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Escolha o perfil adequado para começar a operar na plataforma
            </p>

            <div className="space-y-3">
              {/* Option 1: Company */}
              <div
                onClick={onOpenRegisterCompany}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Cadastrar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Para Restaurantes & Bares (CNPJ)
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Encontre freelancers qualificados, publique diárias urgentes e pague com segurança retida em garantia.
                </p>
              </div>

              {/* Option 2: Freelancer */}
              <div
                onClick={onOpenRegisterFreelancer}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Cadastrar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Para Profissionais da Gastronomia
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Sushiman, Garçom, Cozinheiro ou Bartender: receba diárias com pagamento garantido via Pix pós-turno.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Trust Highlights */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Garantias da Plataforma
            </h4>
            <div className="space-y-2 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Cofre Escrow Blindado:</strong> o valor só é liberado após o check-out validado.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Verificação Rigorosa:</strong> checagem de MEI, CPF e antecedentes criminais.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Avaliações do Turno:</strong> histórico transparente de pontualidade e postura.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Instant 1-Click Access with Demo / Existing Accounts */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Entrar com Conta Existente ou Demonstração
                </h2>
                <p className="text-xs text-neutral-500">
                  Selecione qualquer perfil abaixo para acessar o painel imediatamente em 1 clique
                </p>
              </div>

              {/* Toggle Demo Role */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs shrink-0">
                <button
                  onClick={() => setSelectedDemoRole('EMPRESA')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedDemoRole === 'EMPRESA'
                      ? 'bg-amber-500 text-neutral-950 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Empresas ({allCompanies.length})
                </button>
                <button
                  onClick={() => setSelectedDemoRole('FREELANCER')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedDemoRole === 'FREELANCER'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Freelancers ({availableFreelancers.length})
                </button>
              </div>
            </div>

            {/* List of accounts to click & enter immediately */}
            <div className="py-4 space-y-2.5 flex-1 max-h-[460px] overflow-y-auto pr-1">
              {selectedDemoRole === 'EMPRESA' ? (
                allCompanies.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => loginAsCompany(comp.id)}
                    className="w-full p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-amber-50/70 hover:border-amber-300 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-1.5 bg-white rounded-lg border border-neutral-200 shadow-xs">
                        {comp.avatar}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900">
                            {comp.name}
                          </p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                            Restaurante
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          CNPJ: {comp.identifier} · Saldo B2B: R$ {comp.walletBalance}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform shrink-0">
                      <span>Acessar Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))
              ) : (
                availableFreelancers.map((freela) => (
                  <button
                    key={freela.id}
                    onClick={() => loginAsFreelancer(freela.id)}
                    className="w-full p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-emerald-50/70 hover:border-emerald-300 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                          freela.avatarFallbackColor.includes('rose')
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : freela.avatarFallbackColor.includes('amber')
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : freela.avatarFallbackColor.includes('violet')
                            ? 'bg-violet-100 text-violet-800 border border-violet-200'
                            : freela.avatarFallbackColor.includes('orange')
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {freela.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900">
                            {freela.name}
                          </p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ★ {freela.rating} ({freela.completedGigs} diárias)
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {freela.role} · {freela.location} · <strong>R$ {freela.dailyRate}/diária</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0">
                      <span>Acessar Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Bottom Help */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ao entrar, sua sessão será lembrada com segurança</span>
              </span>
              <button
                onClick={onOpenLogin}
                className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
              >
                Ver Opções Completas →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
