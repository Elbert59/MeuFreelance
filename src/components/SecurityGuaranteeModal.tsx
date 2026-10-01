import React from 'react';
import {
  ShieldCheck,
  Lock,
  MapPin,
  FileCheck2,
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Hash,
} from 'lucide-react';

interface SecurityGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuaranteeModal: React.FC<SecurityGuaranteeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-neutral-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>Central de Segurança & Garantia B2B</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Escrow Blindado
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Como a ChefMatch protege empresas e freelancers contra fraudes e prejuízos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-700 leading-relaxed">
          {/* Banner de Resumo */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-950 text-sm mb-1">
                Zero Risco Financeiro: O Modelo Escrow
              </h3>
              <p className="text-amber-900 text-xs">
                Nem a empresa arrisca pagar adiantado para quem não comparecer, nem o profissional trabalha com medo de calote no fim da noite. O valor da diária fica retido sob custódia neutral da plataforma até o término formal do turno.
              </p>
            </div>
          </div>

          {/* 5 Pilares de Segurança */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pilar 1 */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <span>1. Custódia Financeira Automática</span>
              </div>
              <p className="text-neutral-600 text-[11px]">
                Ao reservar uma diária, o restaurante autoriza a retenção. O saldo é isolado e fica protegido. A liberação via Pix é acionada unicamente após o check-out confirmado.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span>2. Check-in Antifraude por GPS</span>
              </div>
              <p className="text-neutral-600 text-[11px]">
                O expediente só inicia quando o profissional clica em &quot;Check-in&quot; dentro do raio operacional do estabelecimento contratante, prevenindo registros fraudulentos à distância.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <span>3. Validação Cadastral CNPJ / MEI</span>
              </div>
              <p className="text-neutral-600 text-[11px]">
                Algoritmo de validação em tempo real com dígitos verificadores da Receita Federal. Certificações ANVISA de manipulação de alimentos são vinculadas ao perfil do trabalhador.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Hash className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <span>4. Trilha de Auditoria Criptográfica</span>
              </div>
              <p className="text-neutral-600 text-[11px]">
                Cada contrato recebe um hash único SHA-256 e uma trilha temporal indelével com cada evento: depósito, check-in, término e liquidação bancária.
              </p>
            </div>
          </div>

          {/* Proteção contra No-Show & LGPD */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Garantias Operacionais & LGPD</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 block">Reembolso 100% em Caso de No-Show:</strong>
                  Se o profissional não comparecer ao turno, a quantia retida é estornada integralmente para o saldo da empresa sem taxas.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 block">Privacidade e Dados (LGPD):</strong>
                  Documentos pessoais e chaves Pix são transmitidos criptografados e acessados exclusivamente para fins de quitação contratual.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            ChefMatch Security Core v1.2 · Proteção Ativa
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
