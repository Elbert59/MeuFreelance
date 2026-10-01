import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 border border-amber-600 px-3.5 py-2 text-xs font-semibold text-neutral-950 shadow-lg animate-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 text-neutral-950" />
      <span>Modo Offline — Dados em cache ativos para consulta.</span>
    </div>
  );
};
