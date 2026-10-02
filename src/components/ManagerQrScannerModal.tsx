import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import type { Contract } from '../types';
import { api } from '../services/api';
import { parseDiariaQrToken, generateDiariaQrToken } from '../utils/qrcode';
import { DeviceManager } from '../utils/deviceRepository';
import {
  Camera,
  ScanLine,
  X,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  Building2,
  Clock,
  DollarSign,
  User,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Keyboard,
  ListCheck,
  Smartphone,
} from 'lucide-react';

interface ManagerQrScannerModalProps {
  isOpen: boolean;
  contracts: Contract[];
  targetContract?: Contract | null;
  onClose: () => void;
  onContractUpdated: (updated: Contract) => void;
}

export const ManagerQrScannerModal: React.FC<ManagerQrScannerModalProps> = ({
  isOpen,
  contracts,
  targetContract,
  onClose,
  onContractUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'quick'>('camera');
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    contract: Contract;
    type: 'CHECKIN' | 'CHECKOUT';
    timestamp: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Play audio chime on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  };

  // Start Camera Stream when modal is open and on camera tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      if (!isOpen) {
        setScannedResult(null);
        setErrorMsg(null);
        setManualCodeInput('');
      }
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmera não suportada ou bloqueada pelo navegador neste dispositivo.');
        setActiveTab('manual');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('[Scanner] Camera access error or restricted:', err);
      setCameraError('Câmera não disponível ou permissão negada. Utilize a digitação manual de código abaixo.');
      setHasCamera(false);
      setActiveTab('manual');
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setHasCamera(false);
  };

  // Frame processing loop using jsQR
  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleScannedData(code.data);
          return; // Stop scanning once detected
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  };

  // Authoritative Process of Scanned QR Code
  const handleScannedData = async (rawData: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Call Authoritative Multi-Device Scan API
      const result = await api.scanQrCode({
        qrToken: rawData.trim(),
        callerRole: 'EMPRESA',
        managerDeviceId: DeviceManager.getDeviceId(),
      });

      playBeep();
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

      onContractUpdated(result.contract);
      setScannedResult({
        contract: result.contract,
        type: result.type,
        timestamp: Date.now(),
      });
      stopCamera();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Código ou token inválido para validação da diária.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleScannedData(manualCodeInput.trim());
  };

  // Image Upload Scanner
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleScannedData(code.data);
          } else {
            setErrorMsg('Não foi possível identificar um QR Code válido na imagem enviada.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Contracts eligible for scanning
  const actionableContracts = targetContract
    ? [targetContract]
    : contracts.filter((c) => c.status === 'PAGO_E_RETIDO' || c.status === 'CHECKIN_REALIZADO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Scanner do Gerente · Live Sync
            </span>
          </div>

          <h2 className="text-xl font-black text-white">
            Escanear QR Code do Freelancer
          </h2>
          <p className="text-xs text-neutral-300 mt-1">
            Validação presencial conectada com o aparelho do freelancer em tempo real.
          </p>

          {/* Navigation Tabs */}
          {!scannedResult && (
            <div className="flex gap-1 mt-4 p-1 bg-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Câmera ao Vivo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                Digitar Código
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quick')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'quick'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <ListCheck className="w-3.5 h-3.5" />
                Contratos ({actionableContracts.length})
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Success Screen */}
          {scannedResult ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[11px] font-bold uppercase inline-block">
                  {scannedResult.type === 'CHECKIN' ? 'Início de Turno Homologado' : 'Expediente Finalizado com Sucesso'}
                </span>
                <h3 className="text-lg font-black text-neutral-900">
                  {scannedResult.type === 'CHECKIN'
                    ? `Presença de ${scannedResult.contract.freelancerName} Confirmada!`
                    : `Diária de ${scannedResult.contract.freelancerName} Concluída!`}
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                  {scannedResult.type === 'CHECKIN'
                    ? 'O turno começou oficialmente e o aparelho do freelancer já foi atualizado em tempo real.'
                    : `O expediente foi encerrado pelo gerente. O valor de R$ ${scannedResult.contract.dailyRate.toFixed(
                        2
                      )} está disponível para liberação via Pix.`}
                </p>
              </div>

              {/* Scanned Contract Summary */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    Profissional:
                  </span>
                  <strong className="text-neutral-900">{scannedResult.contract.freelancerName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Horário:
                  </span>
                  <span className="font-mono font-bold text-neutral-900">{scannedResult.contract.shiftHours}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Valor Garantido em Escrow:
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    R$ {scannedResult.contract.dailyRate.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Concluir & Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong>Falha na Leitura:</strong> {errorMsg}
                  </div>
                </div>
              )}

              {/* TAB 1: LIVE CAMERA */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-neutral-950 border-2 border-neutral-800 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Reticle Scanner Overlay */}
                    <div className="relative z-10 w-48 h-48 border-2 border-amber-400/80 rounded-2xl flex items-center justify-center pointer-events-none">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-sm" />

                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce opacity-80" />
                    </div>

                    {isProcessing && (
                      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                        <span className="text-xs font-bold">Validando token no servidor...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <label className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Carregar Foto do QR Code
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: MANUAL CODE ENTRY */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    <strong>Validação Manual Resiliente:</strong> Digite ou cole o código que aparece abaixo do QR code na tela do freelancer (ex: <span className="font-mono font-bold">CTR-2026-xxx</span> ou <span className="font-mono font-bold">TE-8492</span>).
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Código ou Token do Contrato:
                    </label>
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      placeholder="Ex: TE-8492 ou CTR-2026-101"
                      className="w-full px-4 py-3 text-sm font-mono rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !manualCodeInput.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Confirmar Homologação
                  </button>
                </form>
              )}

              {/* TAB 3: QUICK CONTRACT SELECT */}
              {activeTab === 'quick' && (
                <div className="space-y-3 py-1">
                  <p className="text-xs text-neutral-600">
                    Clique no contrato do profissional presente para homologar a entrada ou saída diretamente:
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {actionableContracts.map((c) => {
                      const isCheckIn = c.status === 'PAGO_E_RETIDO';
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-amber-50/50 transition-colors text-xs"
                        >
                          <div>
                            <div className="font-bold text-neutral-900">{c.freelancerName}</div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {c.id} · {c.shiftHours}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleScannedData(c.id)}
                            disabled={isProcessing}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCheckIn
                                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            }`}
                          >
                            {isCheckIn ? 'Validar Entrada' : 'Encerrar Saída'}
                          </button>
                        </div>
                      );
                    })}

                    {actionableContracts.length === 0 && (
                      <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
                        Nenhum contrato aguardando entrada ou saída no momento.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
