import React, { useState } from 'react';
import type { ShiftOpportunity, Contract, Freelancer, UserSession } from '../types';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  X,
  Printer,
  Building2,
  User,
  Clock,
  MapPin,
  Lock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ServiceContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If accepting a new opportunity:
  opportunity?: ShiftOpportunity | null;
  freelancer?: Freelancer | UserSession | null;
  onConfirmAccept?: () => Promise<void> | void;
  // If viewing an already accepted/signed contract:
  contract?: Contract | null;
}

export const ServiceContractModal: React.FC<ServiceContractModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  freelancer,
  onConfirmAccept,
  contract,
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Resolve Contract Parties and Specifics
  const companyName =
    contract?.companyName || opportunity?.companyName || 'Izakaya Matsu Gastronomia';
  const companyCnpj =
    contract?.companyCnpj || opportunity?.companyCnpj || '18.492.302/0001-44';
  const venueAddress =
    contract?.venueAddress ||
    opportunity?.venueAddress ||
    'Av. Prudente de Morais, 820 · Zona 07, Maringá - PR';

  const freelancerName =
    contract?.freelancerName || freelancer?.name || 'Profissional Freelancer';
  const freelancerCpf =
    (freelancer as any)?.identifier ||
    (freelancer as any)?.cpf ||
    '048.291.849-12';
  const freelancerAddress =
    (freelancer as any)?.location ||
    (freelancer as any)?.address ||
    'Maringá · PR';

  const roleTitle =
    contract?.freelancerRole ||
    opportunity?.roleTitle ||
    (freelancer as any)?.role ||
    'Cozinheiro Especialista';
  const dateFormatted = contract?.date || opportunity?.date || 'Hoje (Turno Noturno)';
  const shiftHours = contract?.shiftHours || opportunity?.shiftHours || '18:00 - 00:00';
  const dailyRate = contract?.dailyRate || opportunity?.dailyRate || 350;

  // Legal Date Formatting for Maringá - PR
  const now = new Date();
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const signatureCityDate = `Maringá - PR, ${day} de ${month} de ${year}`;

  const isViewOnly = !!contract && !opportunity;

  const handleSignAndConfirm = async () => {
    if (!hasAgreed && !isViewOnly) return;
    setIsSubmitting(true);
    try {
      if (onConfirmAccept) {
        await onConfirmAccept();
      }
      onClose();
    } catch (err) {
      console.error('Error signing contract', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-300 overflow-hidden max-h-[92vh] flex flex-col text-neutral-900">
        {/* Top Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Contrato de Prestação de Serviços (Freelance)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {isViewOnly ? 'Assinado Digitalmente' : 'Aceite Obrigatório'}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Garantia jurídica e integridade mútua entre Contratante e Contratado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Imprimir Contrato"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Legal Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif bg-neutral-50/40 selection:bg-amber-100">
          {/* Document Header & Title */}
          <div className="text-center pb-4 border-b border-neutral-200">
            <span className="text-[10px] font-sans font-bold tracking-widest text-neutral-500 uppercase block mb-1">
              Plataforma B2B TurnoExtra · Segurança Jurídica & Escrow
            </span>
            <h1 className="text-base sm:text-lg font-black text-neutral-900 uppercase font-sans tracking-wide">
              CONTRATO DE PRESTAÇÃO DE SERVIÇOS (FREELANCE)
            </h1>
          </div>

          {/* Qualification of Parties */}
          <div className="space-y-3 font-sans text-xs bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <p>
              <strong className="text-neutral-950">CONTRATANTE:</strong>{' '}
              <span className="font-semibold text-neutral-900">{companyName}</span>, inscrita no CNPJ nº{' '}
              <span className="font-mono font-bold text-neutral-900">{companyCnpj}</span>, com sede em{' '}
              <span className="font-semibold text-neutral-900">{venueAddress}</span>, neste ato representada por{' '}
              <strong className="text-neutral-950">Elbert</strong>.
            </p>

            <p>
              <strong className="text-neutral-950">CONTRATADO(A):</strong>{' '}
              <span className="font-semibold text-neutral-900">{freelancerName}</span>, inscrito(a) no CPF/CNPJ nº{' '}
              <span className="font-mono font-bold text-neutral-900">{freelancerCpf}</span>, residente e domiciliado(a) em{' '}
              <span className="font-semibold text-neutral-900">{freelancerAddress}</span>.
            </p>
          </div>

          <p className="italic text-neutral-600 font-sans text-xs">
            As partes acima qualificadas celebram o presente Contrato de Prestação de Serviços, que se regerá pelas seguintes cláusulas:
          </p>

          {/* Clauses */}
          <div className="space-y-4">
            {/* Cláusula 1ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 1ª – Do Objeto
              </h3>
              <p className="text-justify text-neutral-700">
                O(A) <strong className="text-neutral-900">CONTRATADO(A)</strong> compromete-se a prestar ao(à){' '}
                <strong className="text-neutral-900">CONTRATANTE</strong> os serviços especializados de:{' '}
                <span className="font-semibold text-neutral-950 underline decoration-amber-400 underline-offset-2">
                  {roleTitle}
                </span>
                {opportunity?.description ? ` (${opportunity.description})` : ''}, com aplicação de boas práticas de manipulação, pontualidade e excelência gastronômica.
              </p>
            </div>

            {/* Cláusula 2ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 2ª – Dos Prazos e Escala de Trabalho
              </h3>
              <p className="text-justify text-neutral-700">
                A execução dos serviços ocorrerá no seguinte formato de tempo/entrega:{' '}
                <strong className="text-neutral-900">Escala presencial para a data: {dateFormatted}</strong>, com jornada estipulada no horário:{' '}
                <strong className="font-mono text-neutral-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                  {shiftHours}
                </strong>
                , no estabelecimento situado em {venueAddress}.
              </p>
            </div>

            {/* Cláusula 3ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 3ª – Da Remuneração e Pagamento
              </h3>
              <p className="text-justify text-neutral-700">
                Pelos serviços prestados, o(a) <strong className="text-neutral-900">CONTRATANTE</strong> pagará ao(à){' '}
                <strong className="text-neutral-900">CONTRATADO(A)</strong> o valor líquido de{' '}
                <strong className="font-mono text-emerald-800 text-sm bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                  R$ {dailyRate.toFixed(2)}
                </strong>{' '}
                por diária de trabalho.
              </p>
              <p className="text-justify text-neutral-600 pl-4 border-l-2 border-neutral-300 text-xs italic mt-1">
                <strong>Parágrafo único:</strong> O valor pactuado já se encontra retido e custodiado preventivamente no Cofre Escrow da TurnoExtra, sendo a transferência liberada via Pix ao(à) CONTRATADO(A) logo após o término do turno, cumprimento da jornada contratada e conferência presencial de encerramento pelo contratante.
              </p>
            </div>

            {/* Cláusula 4ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 4ª – Da Inexistência de Vínculo Empregatício
              </h3>
              <p className="text-justify text-neutral-700">
                Fica expressamente acordado que este contrato é de natureza estritamente civil, não havendo qualquer subordinação jurídica, exclusividade ou vínculo empregatício (CLT) entre as partes. O(A) CONTRATADO(A) possui total autonomia técnica e operacional na execução dos serviços.
              </p>
            </div>

            {/* Cláusula 5ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 5ª – Da Confidencialidade e Propriedade
              </h3>
              <p className="text-justify text-neutral-700">
                O(A) CONTRATADO(A) obriga-se a manter em absoluto sigilo todas as informações, dados, códigos, receitas ou estratégias de negócios do(a) CONTRATANTE a que tiver acesso. Todos os direitos de propriedade intelectual e materiais desenvolvidos durante a vigência deste contrato pertencerão exclusivamente ao(à) CONTRATANTE.
              </p>
            </div>

            {/* Cláusula 6ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 6ª – Da Rescisão
              </h3>
              <p className="text-justify text-neutral-700">
                Este contrato poderá ser rescindido a qualquer momento por qualquer uma das partes, mediante aviso prévio de 5 (cinco) dias ou caso fortuito devidamente justificado. Em caso de rescisão, o(a) CONTRATANTE efetuará o pagamento proporcional aos serviços já efetivamente realizados até a data do encerramento.
              </p>
            </div>

            {/* Cláusula 7ª */}
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-neutral-950 text-xs sm:text-sm">
                Cláusula 7ª – Do Foro
              </h3>
              <p className="text-justify text-neutral-700">
                Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da Comarca de Maringá, Estado do Paraná, renunciando a qualquer outro, por mais privilegiado que seja.
              </p>
            </div>
          </div>

          {/* Footer closing statement */}
          <div className="pt-4 border-t border-neutral-200 text-center space-y-2">
            <p className="italic text-neutral-700">
              E, por estarem de inteiro e comum acordo, assinam este contrato em 02 (duas) vias de igual teor.
            </p>
            <p className="font-sans font-bold text-neutral-900 text-xs">
              {signatureCityDate}.
            </p>
          </div>

          {/* Signatures block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 font-sans text-xs">
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-white text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 mx-auto flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4 text-amber-700" />
              </div>
              <span className="font-bold text-neutral-950 block">CONTRATANTE</span>
              <p className="text-neutral-800">{companyName} - Elbert</p>
              <span className="text-[10px] text-neutral-500 font-mono block">CNPJ: {companyCnpj}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle2 className="w-3 h-3" /> Assinado Digitalmente
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 bg-white text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 mx-auto flex items-center justify-center font-bold">
                <User className="w-4 h-4 text-emerald-700" />
              </div>
              <span className="font-bold text-neutral-950 block">CONTRATADO(A)</span>
              <p className="text-neutral-800">{freelancerName}</p>
              <span className="text-[10px] text-neutral-500 font-mono block">CPF/MEI: {freelancerCpf}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle2 className="w-3 h-3" /> {isViewOnly ? 'Assinado Digitalmente' : 'Aceite Pendente'}
              </span>
            </div>
          </div>

          {/* Electronic Audit Stamp */}
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 text-[10px] font-mono text-neutral-600 flex flex-wrap items-center justify-between gap-2">
            <span>
              Certificado Eletrônico B2B TurnoExtra · Validade Jurídica MP 2.200-2/2001
            </span>
            <span className="font-bold text-neutral-800">
              HASH: {contract?.escrowHash || `ESCROW-${Math.floor(1000 + Math.random() * 9000)}-SHA256`}
            </span>
          </div>
        </div>

        {/* Footer Actions / Acceptance Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-neutral-200 shrink-0 space-y-3">
          {!isViewOnly ? (
            <>
              {/* Mandatory Acceptance Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-neutral-700 leading-tight group-hover:text-neutral-900">
                  Declaro que li, compreendi e concordo integralmente com todas as cláusulas do{' '}
                  <strong className="text-neutral-950">Contrato de Prestação de Serviços (Freelance)</strong> e me comprometo com o cumprimento da escala em Maringá - PR.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Recusar e Voltar
                </button>

                <button
                  type="button"
                  onClick={handleSignAndConfirm}
                  disabled={!hasAgreed || isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Formalizando contrato...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Assinar Digitalmente & Aceitar Diária</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Contrato vigente formalizado com sucesso.</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
