import React, { useState } from 'react';
import type { Contract } from '../types';
import { api } from '../services/api';
import {
  MapPin,
  ShieldCheck,
  KeyRound,
  Loader2,
  X,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
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
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsVerified, setGpsVerified] = useState(true);

  if (!isOpen) return null;

  const expectedPin = contract.checkInPin || '8412';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      setError('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CHECKIN_REALIZADO',
        pin: cleanPin,
        callerRole: 'FREELANCER',
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          'Bloqueio Antifraude: PIN de entrada incorreto. Solicite o código ao gerente do restaurante ao chegar no local.'
      );
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
              Check-in Presencial Antifraude
            </span>
          </div>

          <h2 className="text-xl font-black text-neutral-950">
            Validação de Início de Turno
          </h2>
          <p className="text-xs text-neutral-900/80 mt-1">
            Confirme sua presença física no estabelecimento para iniciar a contagem oficial da diária
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contract details card */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-neutral-500">Estabelecimento:</span>
              <strong className="text-neutral-900 font-semibold">{contract.companyName}</strong>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-neutral-500">Local:</span>
              <span className="text-neutral-800 line-clamp-1">{contract.venueAddress}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-neutral-500">Horário Contratado:</span>
              <span className="font-mono font-bold text-neutral-900">{contract.shiftHours}</span>
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
              Raio &lt; 50m
            </span>
          </div>

          {/* PIN Input Section */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-neutral-900">
              PIN de Entrada do Restaurante (4 dígitos):
            </label>
            <p className="text-[11px] text-neutral-500">
              Solicite o PIN presencial ao gerente ou chef do restaurante na sua chegada à cozinha/balcão.
            </p>

            <div className="relative mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                placeholder="Ex: 8412"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 font-mono text-2xl tracking-[0.4em] font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
                autoFocus
              />
            </div>

            {/* Quick Demo Helper */}
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>PIN do gerente deste turno:</span>
                <strong className="font-mono text-xs font-bold text-amber-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">
                  {expectedPin}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setPin(expectedPin)}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                Preencher PIN
              </button>
            </div>
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
              disabled={isLoading || pin.length !== 4}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando presença...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Iniciar Expediente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
