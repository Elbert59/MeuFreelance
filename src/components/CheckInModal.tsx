import React, { useState } from 'react';
import type { Contract } from '../types';
import { api } from '../services/api';
import {
  MapPin,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  DollarSign,
  Info,
} from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  contract: Contract;
  onClose: () => void;
  onSuccess: (updated: Contract) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CHECKIN_REALIZADO',
        callerRole: 'FREELANCER',
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar início da diária. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-neutral-950">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/10 hover:bg-neutral-950/20 text-neutral-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-950 text-amber-300 font-mono text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Check-in Presencial
            </span>
          </div>

          <h2 className="text-xl font-black text-neutral-950">
            Iniciar Diária de Trabalho
          </h2>
          <p className="text-xs text-neutral-900/80 mt-1">
            Confirme o início do seu expediente no estabelecimento para ativar o cronômetro oficial da diária.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contract details card */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                Restaurante:
              </span>
              <strong className="text-neutral-900 font-semibold">{contract.companyName}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                Local:
              </span>
              <span className="text-neutral-800 line-clamp-1 max-w-[200px] text-right font-medium">
                {contract.venueAddress}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                Escala Prevista:
              </span>
              <span className="font-mono font-bold text-neutral-900">{contract.shiftHours}</span>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-neutral-600 flex items-center gap-1.5 font-semibold">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Valor da Diária (Escrow):
              </span>
              <span className="font-mono font-extrabold text-emerald-700 text-base">
                R$ {contract.dailyRate.toFixed(2)}
              </span>
            </div>
          </div>

          {/* GPS Geofencing verification */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-950 font-medium">
                GPS de Presença Validado (Maringá, PR)
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              Presencial &lt; 50m
            </span>
          </div>

          {/* Manager finalization notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Regra de Encerramento da Diária:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Você está iniciando sua diária agora. Ao término do expediente, <strong>apenas o gerente do estabelecimento</strong> tem a permissão de finalizar e homologar o turno para liberar o pagamento garantido via Pix.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando diária...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Iniciar Diária Agora</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
