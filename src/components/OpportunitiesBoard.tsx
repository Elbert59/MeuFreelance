import React, { useState } from 'react';
import { ShiftOpportunity, Freelancer, Contract } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Flame,
  Clock,
  MapPin,
  ShieldCheck,
  Building2,
  Plus,
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface OpportunitiesBoardProps {
  opportunities: ShiftOpportunity[];
  onOpportunityCreated: (opp: ShiftOpportunity) => void;
  onShiftAccepted: (contract: Contract) => void;
}

export const OpportunitiesBoard: React.FC<OpportunitiesBoardProps> = ({
  opportunities,
  onOpportunityCreated,
  onShiftAccepted,
}) => {
  const { session, role, availableFreelancers } = useAuth();
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [loadingOppId, setLoadingOppId] = useState<string | null>(null);

  // New Opp Form State
  const [roleTitle, setRoleTitle] = useState('Sushiman para Cobertura de Folga');
  const [description, setDescription] = useState('Precisamos de profissional experiente em sushi bar para turno noturno movimentado.');
  const [date, setDate] = useState('Hoje (Turno Noturno)');
  const [shiftHours, setShiftHours] = useState('18:00 - 00:00');
  const [venueAddress, setVenueAddress] = useState(session.location || 'Av. Prudente de Morais, 820 · Maringá - PR');
  const [dailyRate, setDailyRate] = useState(350);
  const [requiredSkillInput, setRequiredSkillInput] = useState('Faca Yanagiba Própria, Higiene ANVISA, Agilidade');
  const [isUrgent, setIsUrgent] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPost(true);
    try {
      const skills = requiredSkillInput.split(',').map((s) => s.trim()).filter(Boolean);
      const escrowFee = Math.round(dailyRate * 0.08);

      const created = await api.createOpportunity({
        companyId: session.id,
        companyName: session.name,
        companyCnpj: session.identifier,
        categoryId: 'cozinha-oriental',
        roleTitle,
        description,
        date,
        shiftHours,
        venueAddress,
        dailyRate,
        escrowTotal: dailyRate + escrowFee,
        requiredSkills: skills,
        slotsTotal: 1,
        urgent: isUrgent,
      });

      onOpportunityCreated(created);
      setIsPostingModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPost(false);
    }
  };

  const handleAcceptShift = async (opp: ShiftOpportunity) => {
    setLoadingOppId(opp.id);
    try {
      const currentFreelancer =
        availableFreelancers.find((f) => f.id === session.id) || availableFreelancers[0];

      const contract = await api.applyToOpportunity(opp.id, currentFreelancer);
      onShiftAccepted(contract);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOppId(null);
    }
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full mb-2 border border-amber-300">
            <Flame className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
            <span>Mural de Diárias & Chamadas de Emergência</span>
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900">
            Vagas Urgentes para Turnos de Hoje em Maringá
          </h2>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Restaurantes publicam necessidades imediatas e o valor da diária já entra automaticamente protegido pelo cofre da plataforma. Freelancers podem aceitar com 1 clique.
          </p>
        </div>

        {role === 'EMPRESA' && (
          <button
            onClick={() => setIsPostingModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Diária Urgente</span>
          </button>
        )}
      </div>

      {/* Grid of Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all shadow-xs ${
              opp.status === 'PREENCHIDA'
                ? 'border-neutral-200 bg-neutral-50 opacity-60'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-500">{opp.id}</span>
                  {opp.urgent && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-rose-500 text-rose-500" /> Urgente Hoje
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                    opp.status === 'ABERTA'
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-neutral-500 bg-neutral-100 border-neutral-200'
                  }`}
                >
                  {opp.status}
                </span>
              </div>

              {/* Title & Restaurant */}
              <h3 className="text-base font-bold text-neutral-900 leading-snug">
                {opp.roleTitle}
              </h3>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-amber-800 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{opp.companyName}</span>
              </div>

              <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                {opp.description}
              </p>

              {/* Shift info */}
              <div className="my-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{opp.date} · {opp.shiftHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{opp.venueAddress}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {opp.requiredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  Valor da Diária
                </span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  R$ {opp.dailyRate.toFixed(2)}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Escrow Garantido</span>
                </div>
              </div>

              {opp.status === 'ABERTA' ? (
                role === 'FREELANCER' ? (
                  <button
                    onClick={() => handleAcceptShift(opp)}
                    disabled={loadingOppId === opp.id}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {loadingOppId === opp.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>Aceitar Diária</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-neutral-500 italic">
                    Visível para Freelancers
                  </span>
                )
              ) : (
                <span className="text-xs text-neutral-400 font-semibold">
                  Preenchida
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post Urgent Shift Modal (For Company) */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-neutral-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-600 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Publicar Diária Urgente</h3>
                  <p className="text-xs text-neutral-500">Notifique profissionais disponíveis em Maringá</p>
                </div>
              </div>
              <button
                onClick={() => setIsPostingModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostOpportunity} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Título da Diária / Cargo *
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição da Demanda
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Data do Turno
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Horário do Turno
                  </label>
                  <input
                    type="text"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Valor da Diária (R$) *
                  </label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    min={180}
                    className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Urgência
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-700 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Destacar como Urgente Hoje</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Habilidades / Requisitos (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={requiredSkillInput}
                  onChange={(e) => setRequiredSkillInput(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingPost}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {loadingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publicar no Mural com Depósito em Escrow</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
