import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed and running standalone, do not display
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General prompt or info
      setShowIOSModal(true);
    }
  };

  const iosModal = showIOSModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-sm shadow-xs">
              CM
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Instalar ChefMatch</h3>
              <p className="text-[11px] text-neutral-500">Usar como aplicativo no celular</p>
            </div>
          </div>
          <button
            onClick={() => setShowIOSModal(false)}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs text-neutral-700">
          <p className="text-neutral-600">
            Adicione o <strong>ChefMatch B2B</strong> à tela de início do seu celular para acesso instantâneo às diárias, check-in por GPS e notificações:
          </p>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                1
              </div>
              <p>
                No Safari do iPhone ou Chrome do Android, toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-amber-700 mx-0.5" /> ou no menu de 3 pontos.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                2
              </div>
              <p>
                Role para baixo e selecione a opção <strong>&quot;Adicionar à Tela de Início&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-700 mx-0.5" />.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                3
              </div>
              <p>
                Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito para finalizar.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
            ✓ Funciona sem ocupar espaço na memória.<br />
            ✓ Acesso rápido para restaurantes e freelancers em campo.
          </div>
        </div>

        <button
          onClick={() => setShowIOSModal(false)}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-xs"
        >
          Entendido, fechar
        </button>
      </div>
    </div>
  );

  if (variant === 'banner') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <span>Instale o ChefMatch no seu Celular (PWA)</span>
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">App Mobile</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-600">
                Check-in de turno com geolocalização e contratos na ponta dos dedos.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar no Celular</span>
          </button>
        </div>
        {iosModal}
      </>
    );
  }

  // Header compact button
  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar App no Celular"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-xs border border-amber-400 ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-neutral-950" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>
      {iosModal}
    </>
  );
};
