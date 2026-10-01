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
  Loader2,
  ChevronRight,
  Star,
  Check,
  MessageSquare,
  Flame,
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

  // Totals
  const totalEarned = freelancerContracts
    .filter((c) => c.status === 'VALOR_LIBERADO' || c.status === 'CONCLUIDO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  const pendingEscrow = freelancerContracts
    .filter((c) => c.status === 'PAGO_E_RETIDO' || c.status === 'CHECKIN_REALIZADO')
    .reduce((acc, curr) => acc + curr.dailyRate, 0);

  const handleCheckIn = async (contract: Contract) => {
    setLoadingAction(`checkin-${contract.id}`);
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

  const handleCheckOut = async (contract: Contract) => {
    setLoadingAction(`checkout-${contract.id}`);
    try {
      const completed = await api.updateContract({
        contractId: contract.id,
        status: 'CONCLUIDO',
      });

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
                    PAGO_E_RETIDO (Escrow Garantido)
                  </span>
                )}

                {activeShift.status === 'CHECKIN_REALIZADO' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-300 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    CHECKIN_REALIZADO (Expediente em Andamento)
                  </span>
                )}

                {(activeShift.status === 'CONCLUIDO' || activeShift.status === 'VALOR_LIBERADO') && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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

                  <button
                    onClick={() => setChatContract(activeShift)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chat Turno</span>
                  </button>
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

            {/* ACTION BUTTON SECTION */}
            <div className="pt-4 border-t border-neutral-100">
              {activeShift.status === 'PAGO_E_RETIDO' && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleCheckIn(activeShift)}
                    disabled={loadingAction === `checkin-${activeShift.id}`}
                    className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-extrabold text-base transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 group cursor-pointer"
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
                  <p className="text-[11px] text-neutral-500 text-center sm:text-left sm:max-w-xs">
                    Ao fazer o check-in, o restaurante é notificado e o cronômetro do seu turno começa a rodar.
                  </p>
                </div>
              )}

              {activeShift.status === 'CHECKIN_REALIZADO' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-900">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-4 h-4 text-sky-600 animate-pulse" />
                      Check-in realizado às {new Date(activeShift.checkInAt || Date.now()).toLocaleTimeString()}!
                    </span>
                    <span className="font-mono text-sky-950 font-bold">Expediente em Curso</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => handleCheckOut(activeShift)}
                      disabled={loadingAction === `checkout-${activeShift.id}`}
                      className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
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
                    <p className="text-[11px] text-neutral-500 text-center sm:text-left sm:max-w-xs">
                      O check-out finaliza o contrato e <strong>libera imediatamente os R$ {activeShift.dailyRate.toFixed(2)}</strong> retidos no cofre.
                    </p>
                  </div>
                </div>
              )}

              {(activeShift.status === 'CONCLUIDO' || activeShift.status === 'VALOR_LIBERADO') && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">
                          Expediente Concluído & Valor de R$ {activeShift.dailyRate.toFixed(2)} Liberado!
                        </h4>
                        <p className="text-xs text-emerald-800">
                          O valor retido no cofre da plataforma já foi repassado com sucesso para sua chave Pix cadastrada.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedContractForRating(activeShift)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
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
                  onClick={() => setChatContract(contract)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                  title="Abrir Chat do Contrato"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                </button>

                <button
                  onClick={() => setSelectedContractForRating(contract)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-xs"
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
