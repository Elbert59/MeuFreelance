import React from 'react';
import { Freelancer } from '../types';
import {
  X,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Wrench,
  Calendar,
} from 'lucide-react';

interface FreelancerProfileModalProps {
  freelancer: Freelancer | null;
  onClose: () => void;
  onHire: (freelancer: Freelancer) => void;
}

export const FreelancerProfileModal: React.FC<FreelancerProfileModalProps> = ({
  freelancer,
  onClose,
  onHire,
}) => {
  if (!freelancer) return null;

  const initials = freelancer.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
              Perfil Profissional
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Hero Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-neutral-800">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xl shrink-0 ${freelancer.avatarFallbackColor}`}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white truncate">
                  {freelancer.name}
                </h3>
                {freelancer.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Identidade & MEI Validados
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-amber-300 mt-0.5">
                {freelancer.role}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-400">
                <div className="flex items-center gap-1 font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{freelancer.rating.toFixed(2)}</span>
                  <span className="font-normal text-neutral-500">
                    ({freelancer.completedGigs} diárias concluídas)
                  </span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{freelancer.location}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{freelancer.experienceYears} anos de carreira</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Apresentação Profissional
            </h4>
            <p className="text-sm text-neutral-200 leading-relaxed bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
              {freelancer.bio}
            </p>
          </div>

          {/* Specialty & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Habilidades Técnicas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-neutral-800/80 text-neutral-200 px-2.5 py-1 rounded border border-neutral-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Equipamento Próprio que Leva ao Turno
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.gear.map((gear, i) => (
                  <span
                    key={i}
                    className="text-xs bg-neutral-800/80 text-neutral-200 px-2.5 py-1 rounded border border-neutral-700/60"
                  >
                    {gear}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications & ANVISA */}
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Certificações & Cursos Comprovados
            </h4>
            <div className="space-y-1.5">
              {freelancer.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Dias Disponíveis na Semana
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {freelancer.availableDays.map((day, i) => (
                <span
                  key={i}
                  className="text-xs bg-neutral-900 text-amber-300 px-2.5 py-1 rounded border border-neutral-700 font-medium"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Price & Booking CTA */}
        <div className="p-4 px-6 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Preço da Diária Integral
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white font-mono">
                R$ {freelancer.dailyRate}
              </span>
              <span className="text-xs text-neutral-400">/turno</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garantia de Pagamento Retido no Cofre</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                onClose();
                onHire(freelancer);
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              Contratar Este Profissional
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
