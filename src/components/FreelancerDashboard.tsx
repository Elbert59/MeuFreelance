import React, { useState } from 'react';
import { Contract } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RatingModal } from './RatingModal';
import { ContractChatModal } from './ContractChatModal';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  Sparkles,
  Loader2,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  MessageSquare,
  Flame,
  Wallet,
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
  const [geoConfirmed, setGeoConfirmed] = useState<boolean>(false);

  // Find the freelancer profile
  const currentFreelancer =
    availableFreelancers.find((f) => f.id === session.id) || availableFreelancers[0];

  // Contracts relevant to this freelancer
  const freelancerContracts = contracts.filter(
    (c) => c.freelancerId === currentFreelancer.id || session.role === 'FREELANCER'
  );

  // Next active scheduled shift (priority: CHECKIN_REALIZADO -> PAGO_E_RETIDO -> newest)
  const activeShift =
    freelancerContracts.find((c) => c.status === 'CHECKIN_REALIZADO') ||
    freelancerContracts.find((c) => c.status === 'PAGO_E_RETIDO') ||
    freelancerContracts[0];

  // Totals
  const totalEarned = freelancerContracts
    .filter((c) => c.status === 'VALOR_LIBERADO' || c.status === 'CONCLUIDO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  const pendingEscrow = freelancerContracts
    .filter((c) => c.status === 'PAGO_E_RETIDO' || c.status === 'CHECKIN_REALIZADO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  // Check-in action (Iniciar Expediente)
  const handleCheckIn = async (contract: Contract) => {
    setLoadingAction(`checkin-${contract.id}`);
    setGeoConfirmed(true);

    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CHECKIN_REALIZADO',
      });
      onContractUpdated(updated);
    } catch (err) {
      console.error('Check-in error', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Check-out action (Finalizar Expediente & Liberar Pagamento)
  const handleCheckOut = async (contract: Contract) => {
    setLoadingAction(`checkout-${contract.id}`);

    try {
      // Step 1: Update status to CONCLUIDO
      const completed = await api.updateContract({
        contractId: contract.id,
        status: 'CONCLUIDO',
      });

      // Step 2: Auto-trigger VALOR_LIBERADO immediately in MVP simulation
      setTimeout(async () => {
        const released = await api.updateContract({
          contractId: contract.id,
          status: 'VALOR_LIBERADO',
        });
        onContractUpdated(released);
        setSelectedContractForRating(released);
      }, 500);

      onContractUpdated(completed);
    } catch (err) {
      console.error('Check-out error', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Profile Header & Quick stats */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-2xl flex items-center justify-center shadow-inner">
              {currentFreelancer.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {currentFreelancer.name}
                </h1>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Perfil Verificado
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentFreelancer.role} · {currentFreelancer.location}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{currentFreelancer.rating.toFixed(2)}</span>
                  <span className="text-neutral-500 font-normal">({currentFreelancer.completedGigs} diárias)</span>
                </div>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-300">
                  Diária Base: <strong className="text-white font-mono">R$ {currentFreelancer.dailyRate}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick switcher to test other freelancers */}
          <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
            <span className="text-xs text-neutral-400 pl-2">Simular outro profissional:</span>
            <select
              value={currentFreelancer.id}
              onChange={(e) => loginAsFreelancer(e.target.value)}
              className="text-xs bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-800">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 block font-medium">
              Pagamentos Retidos no Cofre (Garantidos)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                R$ {pendingEscrow.toFixed(2)}
              </span>
              <span className="text-[11px] text-amber-500/80">em custódia</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 block font-medium">
              Valores Já Liberados (Recebidos)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                R$ {totalEarned.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-500/80">via Pix B2B</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 block font-medium">
              Taxa de Pontualidade & Cumprimento
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono tabular-nums">
                99.4%
              </span>
              <span className="text-[11px] text-neutral-400">Excelente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus: Próxima Diária Agendada com Check-in / Check-out */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Próxima Diária Agendada
            </h2>
            <p className="text-xs text-neutral-400">
              Gerencie seu expediente, realize o check-in presencial e libere o pagamento garantido
            </p>
          </div>
        </div>

        {activeShift ? (
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl relative overflow-hidden">
            {/* Visual Escrow Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">{activeShift.id}</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs font-semibold text-neutral-200">{activeShift.date}</span>
              </div>

              {/* Status pill with real-time feedback */}
              <div className="flex items-center gap-2">
                {activeShift.status === 'PAGO_E_RETIDO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-600/60 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    PAGO_E_RETIDO (Escrow Garantido)
                  </span>
                )}

                {activeShift.status === 'CHECKIN_REALIZADO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-950/80 border border-sky-600/60 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    CHECKIN_REALIZADO (Expediente em Andamento)
                  </span>
                )}

                {(activeShift.status === 'CONCLUIDO' || activeShift.status === 'VALOR_LIBERADO') && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/60 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    VALOR_LIBERADO (Pagamento Disponível)
                  </span>
                )}
              </div>
            </div>

            {/* Restaurant & Venue details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {activeShift.companyName}
                      </h3>
                      <p className="text-xs text-neutral-400 font-mono">
                        CNPJ: {activeShift.companyCnpj}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatContract(activeShift)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chat Turno</span>
                  </button>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-neutral-300 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Endereço de Apresentação:</span>
                    <span>{activeShift.venueAddress}</span>
                  </div>
                </div>

                {activeShift.notes && (
                  <div className="text-xs text-neutral-400 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
                    <strong className="text-neutral-300 block mb-0.5">Instruções do Estabelecimento:</strong>
                    <span>{activeShift.notes}</span>
                  </div>
                )}
              </div>

              {/* Shift hours, Escrow amount, and Geo verification */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Horário Previsto:
                    </span>
                    <span className="font-bold text-white font-mono">{activeShift.shiftHours}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Valor Líquido da Diária:
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      R$ {activeShift.dailyRate.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Cofre Escrow Garantido:</span>
                    <span className="text-emerald-300 font-medium">100% Coberto pela ChefMatch</span>
                  </div>
                </div>

                {/* Geolocation check simulation notice */}
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-950/80 px-3 py-2 rounded-lg border border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    GPS Integrado: Maringá, PR (Raio de validação no restaurante: 100m)
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON SECTION - The core MVP check-in / check-out flow */}
            <div className="pt-4 border-t border-neutral-800">
              {activeShift.status === 'PAGO_E_RETIDO' && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleCheckIn(activeShift)}
                    disabled={loadingAction === `checkin-${activeShift.id}`}
                    className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-extrabold text-base transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {loadingAction === `checkin-${activeShift.id}` ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Validando presença e geolocalização...</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5" />
                        <span>Fazer Check-in (Iniciar Expediente)</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center sm:text-left sm:max-w-xs">
                    Ao fazer o check-in, o restaurante é notificado e o cronômetro do seu turno começa a rodar.
                  </p>
                </div>
              )}

              {activeShift.status === 'CHECKIN_REALIZADO' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/50 flex items-center justify-between text-xs text-sky-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
                      Check-in realizado às {new Date(activeShift.checkInAt || Date.now()).toLocaleTimeString()}!
                    </span>
                    <span className="font-mono text-white">Expediente em Curso</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => handleCheckOut(activeShift)}
                      disabled={loadingAction === `checkout-${activeShift.id}`}
                      className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-extrabold text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingAction === `checkout-${activeShift.id}` ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Finalizando turno e liberando pagamento...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>Fazer Check-out (Finalizar Expediente)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-neutral-400 text-center sm:text-left sm:max-w-xs">
                      O check-out finaliza o contrato e <strong>libera imediatamente os R$ {activeShift.dailyRate.toFixed(2)}</strong> retidos no cofre.
                    </p>
                  </div>
                </div>
              )}

              {(activeShift.status === 'CONCLUIDO' || activeShift.status === 'VALOR_LIBERADO') && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Expediente Concluído & Valor de R$ {activeShift.dailyRate.toFixed(2)} Liberado!
                        </h4>
                        <p className="text-xs text-neutral-300">
                          O valor retido no cofre da plataforma já foi repassado com sucesso para sua chave Pix cadastrada.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedContractForRating(activeShift)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
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
          <div className="p-12 rounded-2xl border border-neutral-800 bg-neutral-900/50 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhuma diária agendada no momento</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Você pode aceitar diárias urgentes no Mural de Vagas ou aguardar convites diretos de restaurantes de Maringá.
            </p>
            {onNavigateToMural && (
              <button
                onClick={onNavigateToMural}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
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
        <h3 className="text-base font-bold text-white mb-3">
          Histórico Recente de Diárias
        </h3>

        <div className="space-y-3">
          {freelancerContracts.map((contract) => (
            <div
              key={contract.id}
              className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">{contract.id}</span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-xs text-neutral-300">{contract.date}</span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-xs text-neutral-400">{contract.shiftHours}</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{contract.companyName}</h4>
                <p className="text-xs text-neutral-400">{contract.venueAddress}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-emerald-400 block">
                    R$ {contract.dailyRate.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                    {contract.status}
                  </span>
                </div>

                <button
                  onClick={() => setChatContract(contract)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                  title="Abrir Chat do Contrato"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedContractForRating(contract)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors"
                >
                  {contract.freelancerReview ? 'Ver Avaliação' : 'Avaliar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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
