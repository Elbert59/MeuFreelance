import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, User, X, Check, PlusCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterCompany: () => void;
  onOpenRegisterFreelancer: () => void;
  isDismissible?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterCompany,
  onOpenRegisterFreelancer,
  isDismissible = true,
}) => {
  const { session, allCompanies, availableFreelancers, loginAsCompany, loginAsFreelancer, isLoggedIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'EMPRESA' | 'FREELANCER'>(session.role);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isDismissible) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Sessão & Cadastro B2B
                </h2>
                {!isLoggedIn && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Obrigatório
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                {!isLoggedIn
                  ? 'Identifique-se para liberar a busca de profissionais e diárias'
                  : 'Alterne entre contas ou cadastre sua empresa / perfil'}
              </p>
            </div>
          </div>
          {isDismissible ? (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200">
              <span>🔒 Restrito</span>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {!isLoggedIn && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-900">
                  Acesso Protegido ao Marketplace B2B
                </strong>
                Para proteger os dados de contato, especialidades e histórico dos freelancers de gastronomia em Maringá, crie uma conta ou selecione um perfil de teste abaixo.
              </div>
            </div>
          )}

          {/* Quick Registration CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenRegisterCompany();
              }}
              className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/70 text-left transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Building2 className="w-5 h-5 text-amber-700" />
                <PlusCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-amber-900">
                + Cadastrar Nova Empresa
              </h4>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Restaurante, Sushibar ou Buffet com CNPJ
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenRegisterFreelancer();
              }}
              className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 text-left transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <User className="w-5 h-5 text-emerald-700" />
                <PlusCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-emerald-900">
                + Cadastrar Novo Freelancer
              </h4>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Sushiman, Garçom, Bartender ou Chef
              </p>
            </button>
          </div>

          {/* Role selector for existing accounts */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                Ou acesse uma conta de teste:
              </span>
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
                <button
                  onClick={() => setSelectedRole('EMPRESA')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedRole === 'EMPRESA'
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Empresas ({allCompanies.length})
                </button>
                <button
                  onClick={() => setSelectedRole('FREELANCER')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedRole === 'FREELANCER'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Freelancers ({availableFreelancers.length})
                </button>
              </div>
            </div>

            {/* List of accounts */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedRole === 'EMPRESA'
                ? allCompanies.map((comp) => {
                    const isCurrent = session.id === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => {
                          loginAsCompany(comp.id);
                          onClose();
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                          isCurrent
                            ? 'border-amber-400 bg-amber-50 shadow-xs'
                            : 'border-neutral-200 bg-neutral-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{comp.avatar}</span>
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{comp.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              CNPJ: {comp.identifier} · Saldo R$ {comp.walletBalance}
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500 group-hover:text-neutral-900 flex items-center gap-1">
                            Acessar <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })
                : availableFreelancers.map((freela) => {
                    const isCurrent = session.id === freela.id;
                    return (
                      <button
                        key={freela.id}
                        onClick={() => {
                          loginAsFreelancer(freela.id);
                          onClose();
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                          isCurrent
                            ? 'border-emerald-400 bg-emerald-50 shadow-xs'
                            : 'border-neutral-200 bg-neutral-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              freela.avatarFallbackColor.includes('rose')
                                ? 'bg-rose-100 text-rose-800'
                                : freela.avatarFallbackColor.includes('amber')
                                ? 'bg-amber-100 text-amber-800'
                                : freela.avatarFallbackColor.includes('violet')
                                ? 'bg-violet-100 text-violet-800'
                                : freela.avatarFallbackColor.includes('orange')
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {freela.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{freela.name}</p>
                            <p className="text-[10px] text-neutral-500">
                              {freela.role} · R$ {freela.dailyRate}/diária
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500 group-hover:text-neutral-900 flex items-center gap-1">
                            Acessar <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Sessão persistida no navegador
            </span>
            {isDismissible ? (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Fechar
              </button>
            ) : (
              <span className="text-[11px] text-amber-700 font-medium">
                Escolha uma conta para entrar
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
