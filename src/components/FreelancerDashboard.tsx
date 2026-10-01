import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RatingModal } from './RatingModal';
import { ContractChatModal } from './ContractChatModal';
import { CheckInModal } from './CheckInModal';
import { ServiceContractModal } from './ServiceContractModal';
import { calculateShiftCompliance } from '../utils/security';
import {
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  Loader2,
  ChevronRight,
  Star,
  Check,
  MessageSquare,
  Flame,
  FastForward,
  RotateCcw,
  Sparkles,
  Lock,
  FileText,
} from 'lucide-react';

interface FreelancerDashboardProps {
  contracts: Contract[];
  onContractUpdated: (updated: Contract) => void;
  onRefresh: () => void;
  onNavigateToMural?: () => void;
}

export const FreelancerDashboard: React.FC<FreelancerDashboardProps> = ({
  contracts,
  onContractUpdated,
  onNavigateToMural,
}) => {
  const { session, availableFreelancers, loginAsFreelancer } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedContractForRating, setSelectedContractForRating] = useState<Contract | null>(null);
  const [chatContract, setChatContract] = useState<Contract | null>(null);
  const [checkInModalContract, setCheckInModalContract] = useState<Contract | null>(null);
  const [viewingContractDoc, setViewingContractDoc] = useState<Contract | null>(null);
  const [ticker, setTicker] = useState(0);

  // Update ticker every second for real-time shift countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find the freelancer profile
  const currentFreelancer =
    availableFreelancers.find((f) => f.id === session.id) || availableFreelancers[0];

  // Contracts relevant to this freelancer
  const freelancerContracts = contracts.filter(
    (c) => c.freelancerId === currentFreelancer.id || session.role === 'FREELANCER'
  );

  // Next active scheduled shift
  const activeShift =
    freelancerContracts.find((c) => c.status === 'CHECKIN_REALIZADO') ||
    freelancerContracts.find((c) => c.status === 'PAGO_E_RETIDO') ||
    freelancerContracts[0];

  // Compliance metrics for active shift
  const activeShiftMinMinutes = activeShift?.minShiftDurationMinutes || 360;
  const activeShiftCompliance = calculateShiftCompliance(
    activeShift?.checkInAt,
    activeShiftMinMinutes
  );

  // Totals
  const totalEarned = freelancerContracts
    .filter((c) => c.status === 'VALOR_LIBERADO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  const pendingEscrow = freelancerContracts
    .filter((c) => c.status === 'PAGO_E_RETIDO' || c.status === 'CHECKIN_REALIZADO' || c.status === 'CONCLUIDO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  // Testing helpers to simulate shift time progression
  const handleFastForward = async (contract: Contract, hoursToAdd: number) => {
    setLoadingAction(`ff-${contract.id}`);
    try {
      const currentCheckIn = new Date(contract.checkInAt || Date.now()).getTime();
      const newCheckIn = new Date(currentCheckIn - hoursToAdd * 60 * 60 * 1000).toISOString();
      const updated = await api.updateContract({
        contractId: contract.id,
        checkInAt: newCheckIn,
      });
      onContractUpdated(updated);
    } catch (e) {
      console.error('Fast-forward error', e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompleteHours = async (contract: Contract) => {
    setLoadingAction(`complete-${contract.id}`);
    try {
      const minMinutes = contract.minShiftDurationMinutes || 360;
      const newCheckIn = new Date(Date.now() - (minMinutes + 5) * 60 * 1000).toISOString();
      const updated = await api.updateContract({
        contractId: contract.id,
        checkInAt: newCheckIn,
      });
      onContractUpdated(updated);
    } catch (e) {
      console.error('Complete hours error', e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetCheckIn = async (contract: Contract) => {
    setLoadingAction(`reset-${contract.id}`);
    try {
      const newCheckIn = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const updated = await api.updateContract({
        contractId: contract.id,
        checkInAt: newCheckIn,
      });
      onContractUpdated(updated);
    } catch (e) {
      console.error('Reset checkin error', e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Profile Header & Quick stats */}
      <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-2xl flex items-center justify-center shadow-xs">
              {currentFreelancer.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">
                  {currentFreelancer.name}
                </h1>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Perfil Verificado
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentFreelancer.role} · {currentFreelancer.location}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1 text-amber-700 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{currentFreelancer.rating.toFixed(2)}</span>
                  <span className="text-neutral-400 font-normal">({currentFreelancer.completedGigs} diárias)</span>
                </div>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-600">
                  Diária Base: <strong className="text-neutral-900 font-mono">R$ {currentFreelancer.dailyRate}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick switcher to test other freelancers */}
          <div className="flex items-center gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
            <span className="text-xs text-neutral-500 pl-2">Simular outro profissional:</span>
            <select
              value={currentFreelancer.id}
              onChange={(e) => loginAsFreelancer(e.target.value)}
              className="text-xs bg-white border border-neutral-300 text-neutral-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {availableFreelancers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.role.split('&')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-100">
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <span className="text-xs text-amber-900 block font-medium">
              Pagamentos Retidos no Cofre (Garantidos)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-800 font-mono tabular-nums">
                R$ {pendingEscrow.toFixed(2)}
              </span>
              <span className="text-[11px] text-amber-700/80">em custódia</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-xs text-emerald-900 block font-medium">
              Valores Já Liberados (Recebidos)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-800 font-mono tabular-nums">
                R$ {totalEarned.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-700/80">via Pix B2B</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <span className="text-xs text-neutral-600 block font-medium">
              Taxa de Pontualidade & Cumprimento
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-neutral-900 font-mono tabular-nums">
                99.4%
              </span>
              <span className="text-[11px] text-neutral-500">Excelente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus: Próxima Diária Agendada com Check-in / Check-out */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Próxima Diária Agendada
            </h2>
            <p className="text-xs text-neutral-500">
              Gerencie seu expediente, realize o check-in presencial e libere o pagamento garantido
            </p>
          </div>
        </div>

        {activeShift ? (
          <div className="rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-sm relative overflow-hidden">
            {/* Visual Escrow Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-500">{activeShift.id}</span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs font-semibold text-neutral-800">{activeShift.date}</span>
              </div>

              {/* Status pill with real-time feedback */}
              <div className="flex items-center gap-2">
                {activeShift.status === 'PAGO_E_RETIDO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    PAGO_E_RETIDO (Escrow Garantido · Aguardando Check-in)
                  </span>
                )}

                {activeShift.status === 'CHECKIN_REALIZADO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-300 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    CHECKIN_REALIZADO (Expediente em Andamento · Antifraude Ativo)
                  </span>
                )}

                {activeShift.status === 'CONCLUIDO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-300 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    CONCLUIDO (Jornada Cumprida · Aguardando Inspeção da Empresa)
                  </span>
                )}

                {activeShift.status === 'VALOR_LIBERADO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    VALOR_LIBERADO (Pagamento Pix Liquidado)
                  </span>
                )}
              </div>
            </div>

            {/* Restaurant & Venue details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-amber-700 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {activeShift.companyName}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono">
                        CNPJ: {activeShift.companyCnpj}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setViewingContractDoc(activeShift)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Ver Contrato de Prestação de Serviços (Freelance)"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Ver Contrato</span>
                    </button>

                    <button
                      onClick={() => setChatContract(activeShift)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Chat Turno</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900 block">Endereço de Apresentação:</span>
                    <span>{activeShift.venueAddress}</span>
                  </div>
                </div>

                {activeShift.notes && (
                  <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <strong className="text-neutral-800 block mb-0.5">Instruções do Estabelecimento:</strong>
                    <span>{activeShift.notes}</span>
                  </div>
                )}
              </div>

              {/* Shift hours, Escrow amount, and Geo verification */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Horário Previsto:
                    </span>
                    <span className="font-bold text-neutral-900 font-mono">{activeShift.shiftHours}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Valor Líquido da Diária:
                    </span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      R$ {activeShift.dailyRate.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500 flex items-center justify-between">
                    <span>Cofre Escrow Garantido:</span>
                    <span className="text-emerald-700 font-medium">100% Coberto pela ChefMatch</span>
                  </div>
                </div>

                {/* Geolocation check simulation notice */}
                <div className="flex items-center gap-2 text-[11px] text-neutral-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    GPS Integrado: Maringá, PR (Raio de validação no restaurante: 100m)
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON & SHIFT ENGINE SECTION */}
            <div className="pt-4 border-t border-neutral-100">
              {activeShift.status === 'PAGO_E_RETIDO' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Diária Pronta para Início:</strong> Ao chegar ao estabelecimento, confirme sua presença física para registrar o início oficial da sua diária.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => setCheckInModalContract(activeShift)}
                      disabled={loadingAction === `checkin-${activeShift.id}`}
                      className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-extrabold text-base transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Iniciar Diária de Trabalho</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[11px] text-neutral-500 text-center sm:text-left sm:max-w-xs">
                      Validação presencial com GPS integrado. O cronômetro oficial do turno inicia imediatamente após a sua confirmação.
                    </p>
                  </div>
                </div>
              )}

              {activeShift.status === 'CHECKIN_REALIZADO' && (
                <div className="space-y-4">
                  {/* Real-time Shift Progress Tracker */}
                  <div className="p-4 rounded-2xl bg-neutral-900 text-white shadow-inner space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono">
                          Monitor de Diária em Andamento
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-neutral-400">Início:</span>
                        <span className="text-amber-400 font-bold">
                          {new Date(activeShift.checkInAt || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-neutral-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Tempo Trabalhado:
                          <strong className="text-white font-mono text-sm ml-1">
                            {activeShiftCompliance.formattedElapsed}
                          </strong>
                        </span>
                        <span className="font-mono text-neutral-300">
                          Meta Prevista: <strong>{Math.floor(activeShiftMinMinutes / 60)}h {activeShiftMinMinutes % 60 > 0 ? `${activeShiftMinMinutes % 60}min` : ''}</strong>
                        </span>
                      </div>

                      <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            activeShiftCompliance.isCompleted
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : 'bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500'
                          }`}
                          style={{ width: `${activeShiftCompliance.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-neutral-400">
                          {activeShiftCompliance.progressPercent}% do turno concluído
                        </span>
                        {!activeShiftCompliance.isCompleted ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Faltam aprox. {activeShiftCompliance.remainingMinutes} min para o término previsto
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Horário Previsto Cumprido!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status notification badge */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        activeShiftCompliance.isCompleted
                          ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                          : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {activeShiftCompliance.isCompleted ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="text-[11px]">
                          {activeShiftCompliance.isCompleted
                            ? 'Horário previsto cumprido com sucesso. Avise o gerente para inspecionar o posto e finalizar a diária.'
                            : 'Diária em andamento normal. O encerramento oficial é realizado exclusivamente pelo gerente.'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700 shrink-0 text-emerald-400">
                        Cofre Garantido
                      </span>
                    </div>

                    {/* Fast-Forward Simulator Toolbar for Testing Clock */}
                    <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Simulador de Relógio (Ambiente de Demonstração):
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleFastForward(activeShift, 1)}
                          disabled={loadingAction === `ff-${activeShift.id}`}
                          className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Avançar 1 hora no relógio"
                        >
                          <FastForward className="w-3 h-3 text-amber-400" />
                          <span>+1 Hora</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFastForward(activeShift, 3)}
                          disabled={loadingAction === `ff-${activeShift.id}`}
                          className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Avançar 3 horas no relógio"
                        >
                          <FastForward className="w-3 h-3 text-amber-400" />
                          <span>+3 Horas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCompleteHours(activeShift)}
                          disabled={loadingAction === `complete-${activeShift.id}`}
                          className="px-2.5 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-[10px] font-black text-white transition-colors flex items-center gap-1 cursor-pointer"
                          title="Completar todo o expediente para simulação"
                        >
                          <Check className="w-3 h-3 text-emerald-300 stroke-[3]" />
                          <span>Simular Término (100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetCheckIn(activeShift)}
                          disabled={loadingAction === `reset-${activeShift.id}`}
                          className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Resetar relógio de teste"
                        >
                          <RotateCcw className="w-3 h-3 text-neutral-400" />
                          <span>Resetar (5min)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manager-Only Finalization Notice Banner (Freelancer cannot finalize) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border border-amber-200 text-xs text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Apenas o Gerente pode Finalizar a Diária</span>
                      </div>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        Para garantir a segurança do contrato e a integridade da escala, o encerramento do turno é homologado <strong>exclusivamente pelo gerente do restaurante ({activeShift.companyName})</strong>. Ao concluir seu serviço, avise a liderança para vistoriar seu posto e finalizar a diária no painel da empresa.
                      </p>
                      <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pagamento de R$ {activeShift.dailyRate.toFixed(2)} garantido no Escrow · Liberação imediata via Pix após homologação do gerente.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setChatContract(activeShift)}
                      className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-neutral-950" />
                      <span>Avisar Gerente via Chat</span>
                    </button>
                  </div>
                </div>
              )}

              {activeShift.status === 'CONCLUIDO' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-sky-950">
                          Expediente Concluído com Sucesso! (Status: {activeShift.shiftComplianceStatus || 'CONCLUIDO_NO_HORARIO'})
                        </h4>
                        <p className="text-xs text-sky-800 mt-0.5">
                          O restaurante <strong>{activeShift.companyName}</strong> foi notificado para validar o término do turno e autorizar a liberação dos <strong>R$ {activeShift.dailyRate.toFixed(2)}</strong> retidos no cofre Escrow.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-900 bg-white px-3 py-1.5 rounded-lg border border-sky-300">
                        Cofre Garantido: R$ {activeShift.dailyRate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeShift.status === 'VALOR_LIBERADO' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">
                          Valor de R$ {activeShift.dailyRate.toFixed(2)} Liberado via Pix!
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          O valor garantido em custódia foi repassado com sucesso para sua chave Pix cadastrada após a aprovação do contratante.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedContractForRating(activeShift)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-neutral-950" />
                      <span>{activeShift.freelancerReview ? 'Ver Avaliação Enviada' : 'Avaliar o Restaurante'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl border border-neutral-200 bg-white text-center space-y-4 shadow-xs">
            <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-900">Nenhuma diária agendada no momento</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Você pode aceitar diárias urgentes no Mural de Vagas ou aguardar convites diretos de restaurantes de Maringá.
            </p>
            {onNavigateToMural && (
              <button
                onClick={onNavigateToMural}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Flame className="w-4 h-4 fill-neutral-950" />
                <span>Explorar Mural de Diárias Urgentes</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* History of shifts */}
      <section>
        <h3 className="text-base font-bold text-neutral-900 mb-3">
          Histórico Recente de Diárias
        </h3>

        <div className="space-y-3">
          {freelancerContracts.map((contract) => (
            <div
              key={contract.id}
              className="p-4 rounded-xl border border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-amber-700 font-bold">{contract.id}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs text-neutral-600">{contract.date}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs text-neutral-500">{contract.shiftHours}</span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 mt-1">{contract.companyName}</h4>
                <p className="text-xs text-neutral-500">{contract.venueAddress}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-emerald-700 block">
                    R$ {contract.dailyRate.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    {contract.status}
                  </span>
                </div>

                <button
                  onClick={() => setViewingContractDoc(contract)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                  title="Ver Contrato de Prestação de Serviços (Freelance)"
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                </button>

                <button
                  onClick={() => setChatContract(contract)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                  title="Abrir Chat do Contrato"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                </button>

                <button
                  onClick={() => setSelectedContractForRating(contract)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-xs cursor-pointer"
                >
                  {contract.freelancerReview ? 'Ver Avaliação' : 'Avaliar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* View Signed Service Contract Modal */}
      {viewingContractDoc && (
        <ServiceContractModal
          isOpen={!!viewingContractDoc}
          contract={viewingContractDoc}
          onClose={() => setViewingContractDoc(null)}
        />
      )}

      {/* Rating Modal */}
      {selectedContractForRating && (
        <RatingModal
          contract={selectedContractForRating}
          type="freelancer"
          onClose={() => setSelectedContractForRating(null)}
          onSubmitted={(updated) => {
            onContractUpdated(updated);
            setSelectedContractForRating(null);
          }}
        />
      )}

      {/* Check-In Modal with Geofencing */}
      {checkInModalContract && (
        <CheckInModal
          isOpen={!!checkInModalContract}
          contract={checkInModalContract}
          onClose={() => setCheckInModalContract(null)}
          onSuccess={(updated) => {
            onContractUpdated(updated);
            setCheckInModalContract(null);
          }}
        />
      )}

      {/* Chat Modal */}
      {chatContract && (
        <ContractChatModal
          contract={chatContract}
          onClose={() => setChatContract(null)}
        />
      )}
    </div>
  );
};
