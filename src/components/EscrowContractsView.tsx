import React, { useState } from 'react';
import { Contract, ContractStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RatingModal } from './RatingModal';
import { ContractChatModal } from './ContractChatModal';
import { ServiceContractModal } from './ServiceContractModal';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Star,
  Lock,
  ArrowRight,
  MessageSquare,
  KeyRound,
  Sparkles,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface EscrowContractsViewProps {
  contracts: Contract[];
  onContractUpdated: (updated: Contract) => void;
  onSelectTab: (tab: any) => void;
  onOpenSecurityModal?: () => void;
}

export const EscrowContractsView: React.FC<EscrowContractsViewProps> = ({
  contracts,
  onContractUpdated,
  onSelectTab,
  onOpenSecurityModal,
}) => {
  const { session } = useAuth();
  const [selectedForReview, setSelectedForReview] = useState<Contract | null>(null);
  const [chatContract, setChatContract] = useState<Contract | null>(null);
  const [viewingContractDoc, setViewingContractDoc] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const filteredContracts = contracts.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const handleManagerCheckIn = async (contract: Contract) => {
    setLoadingAction(`checkin-${contract.id}`);
    setActionError(null);
    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CHECKIN_REALIZADO',
        callerRole: 'EMPRESA',
      });
      onContractUpdated(updated);
    } catch (err: any) {
      setActionError({ id: contract.id, message: err?.message || 'Erro ao validar presença do freelancer' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManagerCheckOut = async (contract: Contract) => {
    setLoadingAction(`checkout-${contract.id}`);
    setActionError(null);
    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CONCLUIDO',
        managerApprovedOut: true,
        callerRole: 'EMPRESA',
      });
      onContractUpdated(updated);
    } catch (err: any) {
      setActionError({ id: contract.id, message: err?.message || 'Erro ao encerrar turno' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManagerReleaseFunds = async (contract: Contract) => {
    setLoadingAction(`release-${contract.id}`);
    setActionError(null);
    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'VALOR_LIBERADO',
        callerRole: 'EMPRESA',
      });
      onContractUpdated(updated);
      setSelectedForReview(updated);
    } catch (err: any) {
      setActionError({ id: contract.id, message: err?.message || 'Erro ao liberar pagamento' });
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'PAGO_E_RETIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3 text-amber-600" />
            PAGO_E_RETIDO (Escrow Seguro)
          </span>
        );
      case 'CHECKIN_REALIZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-300 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-sky-600 animate-spin" />
            CHECKIN_REALIZADO
          </span>
        );
      case 'CONCLUIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-300 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            CONCLUIDO
          </span>
        );
      case 'VALOR_LIBERADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VALOR_LIBERADO (Pix Concluído)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">
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
      <div className="p-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              Cofre de Garantia B2B (Escrow Inteligente)
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              O modelo de escrow elimina o risco para ambas as partes: a <strong>empresa</strong> tem a certeza de que o valor só é repassado se o profissional comparecer e cumprir o turno; o <strong>freelancer</strong> tem a tranquilidade de trabalhar sabendo que o valor já está 100% depositado e garantido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg whitespace-nowrap transition-colors shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Pilares de Segurança</span>
            </button>
          )}

          {session.role === 'EMPRESA' ? (
            <button
              onClick={() => onSelectTab('empresa')}
              className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg whitespace-nowrap transition-colors shadow-xs"
            >
              + Contratar Nova Diária
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('mural')}
              className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg whitespace-nowrap transition-colors shadow-xs"
            >
              Ver Diárias Disponíveis
            </button>
          )}
        </div>
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
                ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-neutral-200 bg-white space-y-2">
            <p className="text-sm font-semibold text-neutral-700">Nenhum contrato encontrado para este filtro.</p>
            <p className="text-xs text-neutral-400">Contrate um freelancer para ver o contrato no cofre.</p>
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="p-5 sm:p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all space-y-5 shadow-xs"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center font-mono font-bold text-amber-700 text-xs border border-neutral-200">
                    CTR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 font-mono">{contract.id}</h3>
                      <span className="text-neutral-300">·</span>
                      <span className="text-xs text-neutral-600">{contract.date}</span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Horário do Turno: <strong className="text-neutral-800">{contract.shiftHours}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(contract.status)}
                </div>
              </div>

              {/* Escrow Progress Bar (Visual Pipeline) */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Esteira do Escrow & Turno
                </p>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 1)
                        ? 'border-amber-300 bg-amber-100 text-amber-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-400'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">1. Cofre</span>
                    <span>Pago & Retido</span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 2)
                        ? 'border-sky-300 bg-sky-100 text-sky-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-400'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">2. Presença</span>
                    <span>Check-in Feito</span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 3)
                        ? 'border-indigo-300 bg-indigo-100 text-indigo-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-400'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75">3. Fim Turno</span>
                    <span>Check-out</span>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-2 rounded-lg border ${
                      getStepActive(contract.status, 4)
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-400'
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
                <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <span className="text-neutral-500">Profissional:</span>
                    <strong className="text-neutral-900">{contract.freelancerName}</strong>
                    <span className="text-neutral-500 font-mono">({contract.freelancerRole})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-500">Contratante:</span>
                    <strong className="text-neutral-900">{contract.companyName}</strong>
                    <span className="text-neutral-500 font-mono">({contract.companyCnpj})</span>
                  </div>
                  <div className="text-neutral-500 pt-1 border-t border-neutral-200">
                    Local: <span className="text-neutral-800">{contract.venueAddress}</span>
                  </div>
                </div>

                {/* Right: Escrow financials */}
                <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Diária Líquida Profissional:</span>
                    <span className="font-mono text-neutral-900 font-bold">R$ {contract.dailyRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Taxa de Custódia & Garantia Escrow:</span>
                    <span className="font-mono text-neutral-600">R$ {contract.escrowFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-200 text-sm font-bold">
                    <span className="text-neutral-700">Total Depositado no Cofre:</span>
                    <span className="font-mono text-amber-700">R$ {contract.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Cryptographic Audit Receipt */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custódia Blindada ChefMatch</span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-neutral-500 font-normal">Liberação condicionada a check-in e check-out presenciais</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-600">
                  <span className="text-neutral-400">Hash de Custódia:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900 font-bold tracking-wider select-all shadow-2xs">
                    {contract.escrowHash || `ESCROW-${contract.id.slice(4)}`}
                  </span>
                </div>
              </div>

              {/* Reviews Summary if exists */}
              {(contract.companyReview || contract.freelancerReview) && (
                <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 text-xs">
                  {contract.companyReview && (
                    <div className="flex-1 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                      <span className="text-neutral-600 block font-semibold mb-1">
                        Avaliação da Empresa:
                      </span>
                      <div className="flex items-center gap-1 text-amber-600 font-bold mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{contract.companyReview.rating} estrelas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contract.companyReview.tags.map((t, i) => (
                          <span key={i} className="text-[10px] bg-white border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      {contract.companyReview.comment && (
                        <p className="text-neutral-600 italic text-[11px] mt-1">
                          "{contract.companyReview.comment}"
                        </p>
                      )}
                    </div>
                  )}

                  {contract.freelancerReview && (
                    <div className="flex-1 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                      <span className="text-neutral-600 block font-semibold mb-1">
                        Avaliação do Freelancer:
                      </span>
                      <div className="flex items-center gap-1 text-amber-600 font-bold mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{contract.freelancerReview.rating} estrelas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contract.freelancerReview.tags.map((t, i) => (
                          <span key={i} className="text-[10px] bg-white border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      {contract.freelancerReview.comment && (
                        <p className="text-neutral-600 italic text-[11px] mt-1">
                          "{contract.freelancerReview.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Error if any */}
              {actionError && actionError.id === contract.id && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError.message}</span>
                </div>
              )}

              {/* Manager Anti-Fraud & Shift Controls for Empresa */}
              {session.role === 'EMPRESA' && (
                <div className="pt-2 border-t border-neutral-100">
                  {contract.status === 'PAGO_E_RETIDO' && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <KeyRound className="w-4 h-4 text-amber-700" />
                          <span>PIN de Entrada do Restaurante (Check-in Presencial):</span>
                          <span className="font-mono text-base font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                            {contract.checkInPin || '8412'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Informe este código de 4 dígitos ao profissional na sua apresentação física à cozinha/balcão.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManagerCheckIn(contract)}
                        disabled={loadingAction === `checkin-${contract.id}`}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === `checkin-${contract.id}` ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Validando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar Presença no Local</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {contract.status === 'CHECKIN_REALIZADO' && (
                    <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-sky-950">
                          <KeyRound className="w-4 h-4 text-sky-700" />
                          <span>PIN de Saída / Liberação do Gerente:</span>
                          <span className="font-mono text-base font-black text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-300">
                            {contract.checkOutPin || '5930'}
                          </span>
                        </div>
                        <p className="text-[11px] text-sky-800">
                          Expediente em andamento desde às {new Date(contract.checkInAt || Date.now()).toLocaleTimeString()}. Forneça o PIN de saída ao término do turno ou para autorizar dispensa antecipada.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManagerCheckOut(contract)}
                        disabled={loadingAction === `checkout-${contract.id}`}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === `checkout-${contract.id}` ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Encerrando...</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Encerrar Expediente como Gerente</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {contract.status === 'CONCLUIDO' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-emerald-950 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Turno Concluído pelo Freelancer ({contract.shiftComplianceStatus || 'CONCLUIDO_NO_HORARIO'})</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          {contract.workedMinutes ? `${contract.workedMinutes} minutos trabalhados.` : 'Horário cumprido.'} Inspecione a entrega do posto de trabalho e autorize o repasse do Pix garantido.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManagerReleaseFunds(contract)}
                        disabled={loadingAction === `release-${contract.id}`}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === `release-${contract.id}` ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Transferindo Pix...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Inspecionar & Liberar Pix (R$ {contract.dailyRate.toFixed(2)})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-neutral-400">
                  Criado em: {new Date(contract.createdAt).toLocaleDateString()} às {new Date(contract.createdAt).toLocaleTimeString()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingContractDoc(contract)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Ver Contrato de Prestação de Serviços (Freelance)"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Ver Contrato & Termos</span>
                  </button>

                  <button
                    onClick={() => setChatContract(contract)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Alinhar no Chat</span>
                  </button>

                  {contract.status === 'VALOR_LIBERADO' && !contract.companyReview && session.role === 'EMPRESA' && (
                    <button
                      onClick={() => setSelectedForReview(contract)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-neutral-950" />
                      <span>Avaliar Profissional (Uber)</span>
                    </button>
                  )}

                  {contract.status === 'PAGO_E_RETIDO' && session.role === 'FREELANCER' && (
                    <button
                      onClick={() => onSelectTab('freelancer')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Fazer Check-in no Meu Painel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Signed Service Contract Modal */}
      {viewingContractDoc && (
        <ServiceContractModal
          isOpen={!!viewingContractDoc}
          contract={viewingContractDoc}
          onClose={() => setViewingContractDoc(null)}
        />
      )}

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
