import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import type { Contract } from '../types';
import { api } from '../services/api';
import { parseDiariaQrToken, generateDiariaQrToken } from '../utils/qrcode';
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
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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
    } catch (e) {
      // Audio not supported or blocked
    }
  };

  // Start Camera Stream when modal is open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmera não suportada neste navegador.');
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
      console.warn('Camera access error or restricted:', err);
      setCameraError(
        'Acesso à câmera bloqueado ou não disponível. Use a detecção direta ou envio de foto abaixo.'
      );
      setHasCamera(false);
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

  // Process Scanned QR Code
  const handleScannedData = async (rawData: string) => {
    if (isProcessing) return;

    const parsed = parseDiariaQrToken(rawData);
    if (!parsed) {
      setErrorMsg('QR Code não reconhecido ou formato inválido para a plataforma ChefMatch.');
      return;
    }

    // Find the referenced contract
    const foundContract = contracts.find((c) => c.id === parsed.contractId) || targetContract;
    if (!foundContract) {
      setErrorMsg(`Contrato de diária ID #${parsed.contractId} não encontrado no restaurante.`);
      return;
    }

    playBeep();
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let updated: Contract;
      if (parsed.type === 'CHECKIN') {
        updated = await api.updateContract({
          contractId: foundContract.id,
          status: 'CHECKIN_REALIZADO',
          callerRole: 'EMPRESA',
          startQrToken: rawData,
        });
      } else {
        updated = await api.updateContract({
          contractId: foundContract.id,
          status: 'CONCLUIDO',
          callerRole: 'EMPRESA',
          endQrToken: rawData,
          managerApprovedOut: true,
        });
      }

      onContractUpdated(updated);
      setScannedResult({
        contract: updated,
        type: parsed.type,
        timestamp: Date.now(),
      });
      stopCamera();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar leitura do QR code.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Auto-Scan Simulation (Essential for preview environments)
  const handleDirectScanContract = async (c: Contract) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const type = c.status === 'PAGO_E_RETIDO' ? 'CHECKIN' : 'CHECKOUT';
      const syntheticToken = generateDiariaQrToken(c.id, type, c.freelancerId);
      await handleScannedData(syntheticToken);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar leitura.');
    } finally {
      setIsProcessing(false);
    }
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
              Scanner do Gerente
            </span>
          </div>

          <h2 className="text-xl font-black text-white">
            Escanear QR Code do Freelancer
          </h2>
          <p className="text-xs text-neutral-300 mt-1">
            Aponte a câmera para o QR Code no celular do profissional para iniciar ou finalizar o turno com validação presencial.
          </p>
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
                    ? 'O horário começou a contar oficialmente. O profissional está registrado no posto de trabalho.'
                    : `O expediente foi encerrado. O valor de R$ ${scannedResult.contract.dailyRate.toFixed(
                        2
                      )} está pronto para liberação no Escrow.`}
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
                    Valor Escrow:
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
              {/* Live Camera Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-neutral-950 aspect-video flex items-center justify-center border border-neutral-800 shadow-inner">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${hasCamera ? 'block' : 'hidden'}`}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle / Viewfinder Overlay */}
                {hasCamera && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="relative w-48 h-48 border-2 border-amber-400 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 shadow-md animate-pulse top-1/2 -translate-y-1/2" />
                      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white" />
                    </div>
                  </div>
                )}

                {!hasCamera && (
                  <div className="p-6 text-center text-neutral-400 space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-neutral-500" />
                    <p className="text-xs max-w-xs leading-relaxed">
                      {cameraError || 'Iniciando câmera...'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar Reconectar Câmera</span>
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-bold">Validando QR Code...</span>
                  </div>
                )}
              </div>

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Alternative 1: Direct 1-Click Scan from Active Freelancers */}
              {actionableContracts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    Diárias Prontas para Leitura Direta (1 Clique):
                  </span>

                  <div className="space-y-2">
                    {actionableContracts.map((c) => {
                      const isCheckIn = c.status === 'PAGO_E_RETIDO';
                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100/90 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <strong className="text-neutral-900 text-sm">{c.freelancerName}</strong>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isCheckIn
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-sky-50 text-sky-900 border-sky-300'
                                }`}
                              >
                                {isCheckIn ? 'Aguardando Início' : 'Em Andamento'}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 font-mono">
                              Turno: {c.shiftHours} · R$ {c.dailyRate.toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDirectScanContract(c)}
                            disabled={isProcessing}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 ${
                              isCheckIn
                                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>{isCheckIn ? 'Escanear Início' : 'Escanear Saída'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alternative 2: Upload QR Photo */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span className="text-[11px]">Também aceita foto da tela:</span>
                <label className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carregar Foto do QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
