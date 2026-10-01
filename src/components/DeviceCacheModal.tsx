import React, { useState, useEffect } from 'react';
import {
  CookieRepository,
  DeviceCacheRepository,
  DeviceManager,
  DeviceInfo,
} from '../utils/deviceRepository';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone,
  Laptop,
  Cookie,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  X,
  ShieldCheck,
  Server,
  Sparkles,
  ArrowRightLeft,
  Users,
} from 'lucide-react';

interface DeviceCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineCount?: number;
}

export const DeviceCacheModal: React.FC<DeviceCacheModalProps> = ({
  isOpen,
  onClose,
  onlineCount = 1,
}) => {
  const { session, role, loginAsCompany, loginAsFreelancer } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => DeviceManager.getLocalDeviceInfo());
  const [deviceNameInput, setDeviceNameInput] = useState(deviceInfo.deviceName);
  const [activeCookies, setActiveCookies] = useState<Record<string, string>>({});
  const [cacheStats, setCacheStats] = useState({ contracts: 0, opportunities: 0, lastSync: '' });
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    const info = DeviceManager.getLocalDeviceInfo();
    setDeviceInfo(info);
    setDeviceNameInput(info.deviceName);
    setActiveCookies(CookieRepository.getAll());

    const cache = DeviceCacheRepository.getLocalCache();
    setCacheStats({
      contracts: (cache.contracts || []).length,
      opportunities: (cache.opportunities || []).length,
      lastSync: cache.lastSyncedAt || new Date().toISOString(),
    });

    try {
      const devRes = await api.getDevices();
      setConnectedDevices(devRes.devices || []);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDeviceName = () => {
    if (!deviceNameInput.trim()) return;
    DeviceManager.setDeviceName(deviceNameInput.trim());
    const updated = DeviceManager.saveLocalDeviceInfo({ deviceName: deviceNameInput.trim() });
    setDeviceInfo(updated);
    DeviceManager.handshake(updated);
    showToast('Nome deste aparelho salvo com sucesso!');
  };

  const handleRoleToggle = (targetRole: 'EMPRESA' | 'FREELANCER') => {
    DeviceManager.setDeviceRole(targetRole);
    const updated = DeviceManager.saveLocalDeviceInfo({ role: targetRole });
    setDeviceInfo(updated);
    DeviceManager.handshake(updated);

    if (targetRole === 'FREELANCER') {
      loginAsFreelancer();
    } else {
      loginAsCompany();
    }
    showToast(`Aparelho configurado como ${targetRole === 'FREELANCER' ? 'Profissional' : 'Restaurante / Gerente'}!`);
  };

  const handleSyncCache = async () => {
    setIsSyncing(true);
    try {
      await DeviceCacheRepository.syncWithServer(deviceInfo.deviceId);
      await loadData();
      showToast('Cache e cookies sincronizados com o servidor!');
    } catch (e: any) {
      showToast(e?.message || 'Falha ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('Deseja limpar o cache local deste aparelho? Os dados serão atualizados do servidor.')) {
      DeviceCacheRepository.clearAll(deviceInfo.deviceId);
      loadData();
      showToast('Cache do dispositivo redefinido!');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceInfo.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast('ID do Aparelho copiado!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Repositório de Dados & Cache do Dispositivo</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Sessão exclusiva deste aparelho · Cookies persistentes · Cache offline · Multi-dispositivos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-amber-500 text-neutral-950 text-xs font-bold px-4 py-2 text-center animate-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-neutral-900">
          {/* Section 1: This Device Profile */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-600" />
                Identidade Deste Aparelho
              </span>
              <button
                onClick={handleCopyId}
                className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 font-mono bg-white px-2 py-1 rounded-lg border border-neutral-200 cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[140px]">{deviceInfo.deviceId}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Nome Personalizado deste Aparelho:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deviceNameInput}
                    onChange={(e) => setDeviceNameInput(e.target.value)}
                    placeholder="Ex: Celular Freelancer ou PC Gerente"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleSaveDeviceName}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Papel Ativo Neste Aparelho:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRoleToggle('FREELANCER')}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === 'FREELANCER'
                        ? 'bg-amber-500 text-neutral-950 border-amber-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    👨‍🍳 Freelancer
                  </button>
                  <button
                    onClick={() => handleRoleToggle('EMPRESA')}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === 'EMPRESA'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    🏢 Gerente / B2B
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Active Devices Running Simultaneously */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-700 animate-pulse" />
                <h4 className="text-sm font-bold text-sky-950">Aparelhos Conectados em Tempo Real</h4>
              </div>
              <span className="text-xs font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                {connectedDevices.length || 1} online
              </span>
            </div>

            <p className="text-xs text-sky-800 leading-relaxed">
              O backend em JavaScript sincroniza ações simultâneas instantaneamente (SSE Stream). Ao gerar o QR Code em um aparelho e escanear no outro, ambos atualizam em milissegundos sem necessidade de recarregar a página.
            </p>

            <div className="space-y-2 mt-2">
              {connectedDevices.length > 0 ? (
                connectedDevices.map((dev, idx) => (
                  <div
                    key={dev.deviceId || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-sky-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <div>
                        <span className="font-bold text-neutral-900">
                          {dev.deviceId === deviceInfo.deviceId ? `${dev.deviceName || 'Este Aparelho'} (Você)` : dev.deviceName || 'Outro Dispositivo'}
                        </span>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                          <span>Modo: {dev.role === 'FREELANCER' ? 'Profissional' : 'Restaurante'}</span>
                          <span>·</span>
                          <span className="font-mono">{dev.deviceId.slice(0, 14)}...</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Conectado
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-white rounded-xl text-center text-xs text-neutral-500">
                  Apenas este aparelho registrado no momento. Abra a URL em outro aparelho para testar a sincronização!
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Cookie Repository */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Cookie className="w-4 h-4 text-amber-700" />
                Repositório de Cookies Deste Dispositivo
              </span>
              <span className="text-[11px] font-bold text-amber-800">
                {Object.keys(activeCookies).length} cookies ativos
              </span>
            </div>

            <p className="text-xs text-amber-800">
              Cookies armazenados localmente no navegador deste dispositivo para manter sua identidade e segurança:
            </p>

            <div className="bg-white rounded-xl p-3 border border-amber-200 font-mono text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
              {Object.keys(activeCookies).length > 0 ? (
                Object.entries(activeCookies).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-0.5 border-b border-neutral-100 last:border-0">
                    <span className="text-amber-900 font-bold">{k}:</span>
                    <span className="text-neutral-600 truncate max-w-[280px]">{v}</span>
                  </div>
                ))
              ) : (
                <span className="text-neutral-400">Nenhum cookie detectado.</span>
              )}
            </div>
          </div>

          {/* Section 4: Local & Server Cache (Cash Storage) */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-neutral-700" />
                Repositório de Cache Local & Nuvem (Cash Storage)
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {new Date(cacheStats.lastSync).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center">
                <div className="text-lg font-bold text-neutral-900">{cacheStats.contracts}</div>
                <div className="text-[11px] text-neutral-500">Contratos em Cache</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center">
                <div className="text-lg font-bold text-neutral-900">{cacheStats.opportunities}</div>
                <div className="text-[11px] text-neutral-500">Vagas em Cache</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center col-span-2 sm:col-span-1">
                <div className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ativo
                </div>
                <div className="text-[11px] text-neutral-500">Modo Offline PWA</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Cache Local
              </button>
              <button
                onClick={handleSyncCache}
                disabled={isSyncing}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora com Servidor'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Sincronização Segura SHA256 & SSE
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
