import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, User, X, Check, PlusCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterCompany: () => void;
  onOpenRegisterFreelancer: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterCompany,
  onOpenRegisterFreelancer,
}) => {
  const { session, allCompanies, availableFreelancers, loginAsCompany, loginAsFreelancer } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'EMPRESA' | 'FREELANCER'>(session.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div>
            <h2 className="text-base font-bold text-white">
              Sessão & Cadastro B2B
            </h2>
            <p className="text-xs text-neutral-400">
              Alterne entre contas ou cadastre sua empresa / perfil
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Registration CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenRegisterCompany();
              }}
              className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <PlusCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-amber-300">
                + Cadastrar Nova Empresa
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Restaurante, Sushibar ou Buffet com CNPJ
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenRegisterFreelancer();
              }}
              className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <User className="w-5 h-5 text-emerald-400" />
                <PlusCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xs font-bold text-emerald-300">
                + Cadastrar Novo Freelancer
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Sushiman, Garçom, Bartender ou Chef
              </p>
            </button>
          </div>

          {/* Role selector for existing accounts */}
          <div className="pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                Ou acesse uma conta de teste:
              </span>
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                <button
                  onClick={() => setSelectedRole('EMPRESA')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedRole === 'EMPRESA'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Empresas ({allCompanies.length})
                </button>
                <button
                  onClick={() => setSelectedRole('FREELANCER')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedRole === 'FREELANCER'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
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
                            ? 'border-amber-400/60 bg-amber-500/10'
                            : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{comp.avatar}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{comp.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              CNPJ: {comp.identifier} · Saldo R$ {comp.walletBalance}
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 group-hover:text-white flex items-center gap-1">
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
                            ? 'border-emerald-400/60 bg-emerald-500/10'
                            : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${freela.avatarFallbackColor}`}
                          >
                            {freela.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{freela.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              {freela.role} · R$ {freela.dailyRate}/diária
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 group-hover:text-white flex items-center gap-1">
                            Acessar <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sessão persistida no navegador
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
