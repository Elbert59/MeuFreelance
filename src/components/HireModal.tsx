import React, { useState } from 'react';
import { Freelancer, Contract } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Lock,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface HireModalProps {
  freelancer: Freelancer | null;
  onClose: () => void;
  onContractCreated: (contract: Contract) => void;
}

export const HireModal: React.FC<HireModalProps> = ({
  freelancer,
  onClose,
  onContractCreated,
}) => {
  const { session } = useAuth();
  const [shiftDate, setShiftDate] = useState('Hoje (28/09/2026)');
  const [shiftHours, setShiftHours] = useState('17:30 - 23:45 (Turno Noturno / Rush)');
  const [venueAddress, setVenueAddress] = useState(session.location || 'Av. Prudente de Morais, 820 · Zona 07, Maringá - PR');
  const [notes, setNotes] = useState('Por favor, trazer facas próprias e avental. Chegada 15min antes para alinhamento.');
  const [loading, setLoading] = useState(false);
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!freelancer) return null;

  const escrowFee = Math.round(freelancer.dailyRate * 0.08);
  const totalAmount = freelancer.dailyRate + escrowFee;

  const handlePayAndReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await api.createContract({
        freelancerId: freelancer.id,
        companyId: session.id,
        companyName: session.name,
        companyCnpj: session.identifier,
        date: shiftDate,
        shiftHours,
        venueAddress,
        dailyRate: freelancer.dailyRate,
        notes,
      });

      setCreatedContract(contract);
      onContractCreated(contract);
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar pagamento retido em cofre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Contratação com Pagamento Retido (Escrow)
              </h2>
              <p className="text-xs text-neutral-400">
                Garantia mútua entre Restaurante e Freelancer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen after Escrow Deposit */}
        {createdContract ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 mb-4 animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 mb-2">
              Status: PAGO_E_RETIDO
            </span>

            <h3 className="text-xl font-extrabold text-white">
              Pagamento retido no cofre da plataforma!
            </h3>
            <p className="text-sm text-neutral-300 mt-2 max-w-md">
              O profissional <strong className="text-white">{freelancer.name}</strong> está confirmado para o turno. O valor fica guardado com segurança e só é liberado após o check-out do profissional.
            </p>

            {/* Escrow Certificate Card */}
            <div className="w-full bg-neutral-950 rounded-xl border border-neutral-800 p-4 my-6 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-500">ID DO CONTRATO:</span>
                <span className="text-amber-400 font-bold">{createdContract.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">EMPRESA CONTRATANTE:</span>
                <span className="text-neutral-200">{session.name} ({session.identifier})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">PROFISSIONAL:</span>
                <span className="text-neutral-200">{freelancer.name} ({freelancer.role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">DATA & TURNO:</span>
                <span className="text-neutral-200">{createdContract.date} · {createdContract.shiftHours}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-800 pt-2 text-sm">
                <span className="text-neutral-400 font-sans font-medium">VALOR TOTAL EM CUSTÓDIA:</span>
                <span className="text-emerald-400 font-bold">R$ {createdContract.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
              >
                Ver Contratos no Painel
              </button>
            </div>
          </div>
        ) : (
          /* Booking / Reservation Form */
          <form onSubmit={handlePayAndReserve} className="p-6 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Freelancer Overview */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-base ${freelancer.avatarFallbackColor}`}
              >
                {freelancer.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {freelancer.name}
                </h4>
                <p className="text-xs text-neutral-400 truncate">{freelancer.role}</p>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  ★ {freelancer.rating.toFixed(2)} ({freelancer.completedGigs} diárias)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Diária</span>
                <span className="text-base font-bold text-white font-mono">
                  R$ {freelancer.dailyRate}
                </span>
              </div>
            </div>

            {/* Shift Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  Data da Diária
                </label>
                <select
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Hoje (28/09/2026)">Hoje (Turno Noturno)</option>
                  <option value="Amanhã (29/09/2026)">Amanhã (Terça-feira)</option>
                  <option value="Próxima Sexta (02/10/2026)">Sexta-feira (Pico de Movimento)</option>
                  <option value="Próximo Sábado (03/10/2026)">Sábado (Casa Cheia)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  Horário do Turno
                </label>
                <select
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="17:30 - 23:45 (Turno Noturno / Rush)">
                    17:30 - 23:45 (Turno Noturno / Rush)
                  </option>
                  <option value="10:30 - 16:30 (Turno Almoço / Buffet)">
                    10:30 - 16:30 (Turno Almoço / Buffet)
                  </option>
                  <option value="19:00 - 02:00 (Evento / Madrugada)">
                    19:00 - 02:00 (Evento / Madrugada)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                Endereço do Estabelecimento (Maringá)
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Endereço completo em Maringá"
                className="w-full text-xs rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                Instruções de Chegada e Vestimenta
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Escrow Explanation & Fee Breakdown */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-300">
                    Como funciona o Cofre Escrow da Plataforma?
                  </h5>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                    Você faz o pagamento agora. O valor <strong>fica retido com segurança</strong> na conta gráfica da ChefMatch. O freelancer só tem o valor transferido após a conclusão do expediente e validação do check-out. Se o profissional não comparecer, o valor é 100% estornado.
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-800/80 pt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Diária integral do profissional ({shiftHours.split(' ')[0]}):</span>
                  <span className="font-mono text-neutral-200">R$ {freelancer.dailyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Taxa de custódia e garantia Escrow (8%):</span>
                  <span className="font-mono text-neutral-200">R$ {escrowFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-neutral-800">
                  <span>Total a depositar no cofre:</span>
                  <span className="font-mono text-amber-400 text-sm">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay and Reserve CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Retendo pagamento no cofre seguro...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pagar e Reservar (R$ {totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-neutral-500 mt-2">
                Transação B2B protegida com emissão automática de nota fiscal e garantia de comparecimento.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
