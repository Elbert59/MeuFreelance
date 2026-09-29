import React, { useState } from 'react';
import { Contract, ContractStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RatingModal } from './RatingModal';
import { ContractChatModal } from './ContractChatModal';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Star,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface EscrowContractsViewProps {
  contracts: Contract[];
  onContractUpdated: (updated: Contract) => void;
  onSelectTab: (tab: any) => void;
}

export const EscrowContractsView: React.FC<EscrowContractsViewProps> = ({
  contracts,
  onContractUpdated,
  onSelectTab,
}) => {
  const { session } = useAuth();
  const [selectedForReview, setSelectedForReview] = useState<Contract | null>(null);
  const [chatContract, setChatContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredContracts = contracts.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'PAGO_E_RETIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3 text-amber-400" />
            PAGO_E_RETIDO (Escrow Seguro)
          </span>
        );
      case 'CHECKIN_REALIZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-950/80 border border-sky-500/50 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-sky-400 animate-spin" />
            CHECKIN_REALIZADO
          </span>
        );
      case 'CONCLUIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/50 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            CONCLUIDO
          </span>
        );
      case 'VALOR_LIBERADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            VALOR_LIBERADO (Pix Concluído)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getStepActive = (currentStatus: ContractStatus, stepIndex: number) => {
    const order: ContractStatus[] = [
      'AGUARDANDO',
      'PAGO_E_RETIDO',
      'CHECKIN_REALIZADO',
      'CONCLUIDO',
      'VALOR_LIBERADO',
    ];
    const currentIndex = order.indexOf(currentStatus);
    return currentIndex >= stepIndex;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Escrow Explained Banner */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Cofre de Garantia B2B (Escrow Inteligente)
            </h2>
            <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              O modelo de escrow elimina o risco para ambas as partes: a <strong>empresa</strong> tem a certeza de que o valor só é repassado se o profissional comparecer e cumprir o turno; o <strong>freelancer</strong> tem a tranquilidade de trabalhar sabendo que o valor já está 100% depositado e garantido.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('empresa')}
          className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg whitespace-nowrap transition-colors"
        >
          + Contratar Nova Diária
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Todos os Contratos' },
          { id: 'PAGO_E_RETIDO', label: 'Retidos no Cofre (Ativos)' },
          { id: 'CHECKIN_REALIZADO', label: 'Turnos em Andamento' },
          { id: 'VALOR_LIBERADO', label: 'Valores Liberados / Concluídos' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
              filterStatus === f.id
                ? 'bg-neutral-800 text-white border-neutral-600 font-semibold shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2">
            <p className="text-sm font-semibold text-neutral-300">Nenhum contrato encontrado para este filtro.</p>
            <p className="text-xs text-neutral-500">Contrate um freelancer para ver o contrato no cofre.</p>
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="p-5 sm:p-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 transition-all space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center font-mono font-bold text-amber-400 text-xs">
                    CTR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-mono">{contract.id}</h3>
                      <span className="text-neutral-500">·</span>
                      <span className="text-xs text-neutral-400">{contract.date}</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Horário do Turno: <strong className="text-neutral-200">{contract.shiftHours}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(contract.status)}
                </div>
              </div>

              {/* Escrow Progress Bar (Visual Pipeline) */}
              <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800/80">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Esteira do Escrow & Turno
                </p>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 1)
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">1. Cofre</span>
                    <span>Pago & Retido</span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 2)
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-300 font-bold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">2. Presença</span>
                    <span>Check-in Feito</span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 3)
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-bold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">3. Fim Turno</span>
                    <span>Check-out</span>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 4)
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">4. Liquidação</span>
                    <span>Pix Liberado</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Left: Parties */}
                <div className="space-y-2 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="text-neutral-400">Profissional:</span>
                    <strong className="text-white">{contract.freelancerName}</strong>
                    <span className="text-neutral-500 font-mono">({contract.freelancerRole})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400">Contratante:</span>
                    <strong className="text-white">{contract.companyName}</strong>
                    <span className="text-neutral-500 font-mono">({contract.companyCnpj})</span>
                  </div>
                  <div className="text-neutral-400 pt-1 border-t border-neutral-800/80">
                    Local: <span className="text-neutral-300">{contract.venueAddress}</span>
                  </div>
                </div>

                {/* Right: Escrow financials */}
                <div className="space-y-2 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Diária Líquida Profissional:</span>
                    <span className="font-mono text-white font-bold">R$ {contract.dailyRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Taxa de Custódia & Garantia Escrow:</span>
                    <span className="font-mono text-neutral-300">R$ {contract.escrowFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-800/80 text-sm font-bold">
                    <span className="text-neutral-200">Total Depositado no Cofre:</span>
                    <span className="font-mono text-amber-400">R$ {contract.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Reviews Summary if exists */}
              {(contract.companyReview || contract.freelancerReview) && (
                <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row gap-3 text-xs">
                  {contract.companyReview && (
                    <div className="flex-1 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-400 block font-semibold mb-1">
                        Avaliação da Empresa:
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{contract.companyReview.rating} estrelas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contract.companyReview.tags.map((t, i) => (
                          <span key={i} className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      {contract.companyReview.comment && (
                        <p className="text-neutral-400 italic text-[11px] mt-1">
                          "{contract.companyReview.comment}"
                        </p>
                      )}
                    </div>
                  )}

                  {contract.freelancerReview && (
                    <div className="flex-1 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-400 block font-semibold mb-1">
                        Avaliação do Freelancer:
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{contract.freelancerReview.rating} estrelas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contract.freelancerReview.tags.map((t, i) => (
                          <span key={i} className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      {contract.freelancerReview.comment && (
                        <p className="text-neutral-400 italic text-[11px] mt-1">
                          "{contract.freelancerReview.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-neutral-500">
                  Criado em: {new Date(contract.createdAt).toLocaleDateString()} às {new Date(contract.createdAt).toLocaleTimeString()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatContract(contract)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Alinhar no Chat</span>
                  </button>

                  {contract.status === 'VALOR_LIBERADO' && !contract.companyReview && (
                    <button
                      onClick={() => setSelectedForReview(contract)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 fill-neutral-950" />
                      <span>Avaliar Profissional (Uber)</span>
                    </button>
                  )}

                  {contract.status === 'PAGO_E_RETIDO' && (
                    <button
                      onClick={() => onSelectTab('freelancer')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <span>Simular Check-in no Painel do Freela</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedForReview && (
        <RatingModal
          contract={selectedForReview}
          type="company"
          onClose={() => setSelectedForReview(null)}
          onSubmitted={(updated) => {
            onContractUpdated(updated);
            setSelectedForReview(null);
          }}
        />
      )}

      {chatContract && (
        <ContractChatModal
          contract={chatContract}
          onClose={() => setChatContract(null)}
        />
      )}
    </div>
  );
};
