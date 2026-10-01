import React, { useState } from 'react';
import type { Contract } from '../types';
import { api } from '../services/api';
import { calculateShiftCompliance } from '../utils/security';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Loader2,
  X,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface CheckOutModalProps {
  isOpen: boolean;
  contract: Contract;
  onClose: () => void;
  onSuccess: (updated: Contract) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('Dispensa autorizada pelo gerente (baixo movimento)');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const minDurationMinutes = contract.minShiftDurationMinutes || 360;
  const compliance = calculateShiftCompliance(contract.checkInAt, minDurationMinutes);
  const expectedPin = contract.checkOutPin || '5930';

  const isEarlyExit = !compliance.isCompleted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      setError('O PIN do gerente deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    const finalReason = reason === 'Outro' ? customReason.trim() : reason;
    if (isEarlyExit && !finalReason) {
      setError('A justificativa de saída antecipada é obrigatória para liberação.');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        status: 'CONCLUIDO',
        pin: cleanPin,
        earlyExitReason: isEarlyExit ? finalReason : undefined,
        callerRole: 'FREELANCER',
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          'Bloqueio Antifraude: PIN de saída incorreto ou autorização recusada pelo restaurante.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div
          className={`relative px-6 pt-6 pb-5 text-white ${
            isEarlyExit
              ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900'
              : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 font-mono ${
                isEarlyExit
                  ? 'bg-rose-950 text-rose-200 border border-rose-400/50'
                  : 'bg-emerald-950 text-emerald-200 border border-emerald-400/50'
              }`}
            >
              {isEarlyExit ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                  Alerta Antifraude · Saída Antecipada
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Jornada Integral Cumprida
                </>
              )}
            </span>
          </div>

          <h2 className="text-xl font-black">
            {isEarlyExit ? 'Tentativa de Saída Antecipada' : 'Finalização de Expediente'}
          </h2>
          <p className="text-xs text-white/90 mt-1">
            {isEarlyExit
              ? 'O encerramento do contrato antes do término oficial da jornada exige PIN de liberação do gerente'
              : 'Parabéns pelo cumprimento integral da jornada de trabalho contratada!'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Shift Time Audit Card */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-3 ${
              isEarlyExit
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-600" />
                Tempo de Expediente Cumprido:
              </span>
              <span className="font-mono font-black text-sm">
                {compliance.formattedElapsed} de {Math.floor(minDurationMinutes / 60)}h{' '}
                {minDurationMinutes % 60 > 0 ? `${minDurationMinutes % 60}min` : ''}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isEarlyExit ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${compliance.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] mt-1 text-neutral-600 font-mono">
                <span>{compliance.progressPercent}% da jornada concluída</span>
                {isEarlyExit && (
                  <span className="text-rose-700 font-bold">
                    Faltam {compliance.remainingMinutes} min
                  </span>
                )}
              </div>
            </div>

            {isEarlyExit && (
              <div className="p-2.5 rounded-xl bg-white/80 border border-rose-200 text-[11px] text-rose-900 space-y-1">
                <strong className="block font-bold">Por que o check-out foi bloqueado?</strong>
                <p>
                  A plataforma ChefMatch bloqueia o encerramento unilateral prematuro para proteger o restaurante contra abandono de posto de trabalho durante o horário de pico.
                </p>
              </div>
            )}
          </div>

          {/* Restaurant details */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="text-neutral-500 block text-[10px]">Contratante:</span>
                <strong className="text-neutral-900">{contract.companyName}</strong>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-neutral-500 block">Valor da Diária:</span>
              <span className="font-bold text-emerald-700">R$ {contract.dailyRate.toFixed(2)}</span>
            </div>
          </div>

          {/* Early Exit Justification (Mandatory if early) */}
          {isEarlyExit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-600" />
                Motivo da Saída Antecipada (Obrigatório para Auditoria):
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Dispensa autorizada pelo gerente (baixo movimento)">
                  Dispensa autorizada pelo gerente (baixo movimento no restaurante)
                </option>
                <option value="Emergência médica / saúde pessoal comprovada">
                  Emergência médica / saúde pessoal comprovada
                </option>
                <option value="Interrupção de força / problemas estruturais no local">
                  Interrupção de energia / caso fortuito no estabelecimento
                </option>
                <option value="Outro">Outro motivo específico...</option>
              </select>

              {reason === 'Outro' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva detalhadamente o motivo..."
                  className="w-full mt-2 p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  maxLength={150}
                />
              )}
            </div>
          )}

          {/* PIN Input Section */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-neutral-900">
              PIN de Saída / Liberação do Gerente (4 dígitos):
            </label>
            <p className="text-[11px] text-neutral-500">
              {isEarlyExit
                ? 'Solicite o PIN de liberação de emergência ao gerente para comprovar a autorização de saída.'
                : 'Solicite o PIN de encerramento ao gerente do restaurante ao entregar o posto de trabalho.'}
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
                placeholder="Ex: 5930"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 font-mono text-2xl tracking-[0.4em] font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
                autoFocus
              />
            </div>

            {/* Quick Demo Helper */}
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>PIN de saída do gerente deste turno:</span>
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
              Voltar ao Expediente
            </button>

            <button
              type="submit"
              disabled={isLoading || pin.length !== 4}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isEarlyExit
                  ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando saída...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isEarlyExit ? 'Registrar Saída Autorizada' : 'Concluir Expediente'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
