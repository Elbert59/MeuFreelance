import React, { useState, useEffect } from 'react';
import type { Contract } from '../types';
import { api } from '../services/api';
import { generateDiariaQrToken, renderQrCodeDataUrl, generatePairingCode } from '../utils/qrcode';
import { RealtimeHub } from '../utils/deviceRepository';
import {
  QrCode,
  ShieldCheck,
  Clock,
  Building2,
  X,
  CheckCircle2,
  Sparkles,
  MapPin,
  DollarSign,
  ScanLine,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Radio,
} from 'lucide-react';

interface FreelancerQrModalProps {
  isOpen: boolean;
  contract: Contract;
  type: 'CHECKIN' | 'CHECKOUT';
  onClose: () => void;
  onSuccess: (updated: Contract) => void;
}

export const FreelancerQrModal: React.FC<FreelancerQrModalProps> = ({
  isOpen,
  contract,
  type,
  onClose,
  onSuccess,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [isScannedSuccessfully, setIsScannedSuccessfully] = useState(false);

  // Play audio chime on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  };

  // Generate QR Token and Data URL on open
  useEffect(() => {
    if (!isOpen) {
      setQrDataUrl(null);
      setIsScannedSuccessfully(false);
      return;
    }

    const code = generatePairingCode(contract.id);
    setPairingCode(code);

    const token = generateDiariaQrToken(contract.id, type, contract.freelancerId);
    setQrToken(token);

    renderQrCodeDataUrl(token, {
      width: 340,
      darkColor: '#0f172a',
      lightColor: '#ffffff',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error rendering QR code', err));
  }, [isOpen, contract.id, contract.freelancerId, type]);

  // Real-Time SSE listener: catches manager's scan instantly across separate devices!
  useEffect(() => {
    if (!isOpen || isScannedSuccessfully) return;

    const unsubscribe = RealtimeHub.subscribe((eventName, payload) => {
      if (eventName === 'qr_scanned' || eventName === 'contract_updated') {
        const payloadContractId = payload.contractId || payload.id || payload.contract?.id;
        if (payloadContractId === contract.id) {
          playBeep();
          setIsScannedSuccessfully(true);
          const freshContract = payload.contract || payload;
          setTimeout(() => {
            onSuccess(freshContract);
            onClose();
          }, 1500);
        }
      }
    });

    // Fallback silent poll every 2.5s in case SSE is blocked by proxy
    const interval = setInterval(async () => {
      try {
        const fresh = await api.getContractById(contract.id);
        if (fresh) {
          if (type === 'CHECKIN' && fresh.status === 'CHECKIN_REALIZADO') {
            playBeep();
            setIsScannedSuccessfully(true);
            setTimeout(() => {
              onSuccess(fresh);
              onClose();
            }, 1500);
          } else if (type === 'CHECKOUT' && (fresh.status === 'CONCLUIDO' || fresh.status === 'VALOR_LIBERADO')) {
            playBeep();
            setIsScannedSuccessfully(true);
            setTimeout(() => {
              onSuccess(fresh);
              onClose();
            }, 1500);
          }
        }
      } catch {}
    }, 2500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen, contract.id, type, isScannedSuccessfully, onSuccess, onClose]);

  if (!isOpen) return null;

  const isCheckIn = type === 'CHECKIN';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode || contract.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Demo simulator button: allows testing the manager's scan in 1 click
  const handleSimulateManagerScan = async () => {
    setIsSimulatingScan(true);
    try {
      const response = await api.scanQrCode({
        qrToken: qrToken,
        callerRole: 'EMPRESA',
      });
      playBeep();
      setIsScannedSuccessfully(true);
      setTimeout(() => {
        onSuccess(response.contract);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Erro ao simular leitura do QR code.');
    } finally {
      setIsSimulatingScan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900">
        {/* Header */}
        <div
          className={`relative px-6 pt-6 pb-5 text-neutral-950 ${
            isCheckIn
              ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600'
              : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white'
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
              isCheckIn ? 'bg-black/10 hover:bg-black/20 text-neutral-950' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${
                isCheckIn ? 'bg-neutral-950 text-amber-300' : 'bg-white text-emerald-900'
              }`}
            >
              <QrCode className="w-3 h-3" />
              {isCheckIn ? 'QR Code de Início de Diária' : 'QR Code de Encerramento'}
            </span>
          </div>

          <h2 className={`text-xl font-black ${isCheckIn ? 'text-neutral-950' : 'text-white'}`}>
            {isCheckIn ? 'Apresente este QR Code ao Gerente' : 'Apresente para Finalizar o Turno'}
          </h2>
          <p className={`text-xs mt-1 leading-relaxed ${isCheckIn ? 'text-neutral-900/80' : 'text-emerald-50'}`}>
            {isCheckIn
              ? 'O gerente do restaurante irá escanear este código com o aplicativo para validar sua presença e iniciar a diária.'
              : 'O gerente irá escanear este código para homologar o cumprimento do expediente e liberar o pagamento via Pix.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Success Screen after scan */}
          {isScannedSuccessfully ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-emerald-950">
                  {isCheckIn ? 'Presença Validada pelo Gerente!' : 'Diária Finalizada com Sucesso!'}
                </h3>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                  {isCheckIn
                    ? 'O QR Code foi escaneado e sua diária já está oficialmente em andamento. Bom trabalho!'
                    : `O expediente foi homologado pelo gerente. O valor de R$ ${contract.dailyRate.toFixed(
                        2
                      )} foi aprovado no cofre Escrow.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code Graphic Box with Scanner Line Animation */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                {qrDataUrl ? (
                  <div className="relative p-2 bg-white rounded-xl shadow-md border border-neutral-200">
                    <img
                      src={qrDataUrl}
                      alt="QR Code da Diária"
                      className="w-56 h-56 object-contain rounded-lg"
                    />

                    {/* Animated laser scanning line */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-sm shadow-amber-500 animate-pulse pointer-events-none top-1/2 -translate-y-1/2" />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      <ScanLine className="w-32 h-32 text-amber-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-neutral-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-xs font-medium">Gerando QR Code seguro...</span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Aguardando leitura pelo gerente do estabelecimento...</span>
                </div>
              </div>

              {/* Manual Pairing Code for Cross-Device Resiliency */}
              <div className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                    Código para Digitação Manual no outro aparelho:
                  </span>
                  <span className="font-mono font-black text-sm text-neutral-900 tracking-wider">
                    {pairingCode || contract.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {/* Info details */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                    Restaurante:
                  </span>
                  <strong className="text-neutral-900 font-semibold">{contract.companyName}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    Horário:
                  </span>
                  <span className="font-mono font-bold text-neutral-900">{contract.shiftHours}</span>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-neutral-600 flex items-center gap-1.5 font-semibold">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Valor Garantido:
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700 text-base">
                    R$ {contract.dailyRate.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Simulator Action for Seamless Previewing */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="space-y-0.5 text-left w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Teste Rápido (Mesmo Navegador):
                  </span>
                  <p className="text-[10px] text-amber-800">
                    Clique abaixo para simular o gerente escaneando este código na hora.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateManagerScan}
                  disabled={isSimulatingScan}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {isSimulatingScan ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando leitura...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>{isCheckIn ? 'Simular Leitura do Gerente' : 'Simular Leitura de Saída'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Fechar / Apresentar Mais Tarde
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
