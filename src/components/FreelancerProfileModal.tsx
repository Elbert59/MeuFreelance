import React from 'react';
import { Freelancer } from '../types';
import {
  X,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Wrench,
  Award,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Perfil Profissional
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Hero Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-neutral-200">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm shrink-0 ${
                freelancer.avatarFallbackColor.includes('rose')
                  ? 'bg-rose-100 text-rose-800'
                  : freelancer.avatarFallbackColor.includes('amber')
                  ? 'bg-amber-100 text-amber-800'
                  : freelancer.avatarFallbackColor.includes('violet')
                  ? 'bg-violet-100 text-violet-800'
                  : freelancer.avatarFallbackColor.includes('orange')
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-neutral-900 truncate">
                  {freelancer.name}
                </h3>
                {freelancer.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Identidade & MEI Validados
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-amber-700 mt-0.5">
                {freelancer.role}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
                <div className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{freelancer.rating.toFixed(2)}</span>
                  <span className="font-normal text-neutral-400">
                    ({freelancer.completedGigs} diárias concluídas)
                  </span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{freelancer.location}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{freelancer.experienceYears} anos de carreira</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Apresentação Profissional
            </h4>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              {freelancer.bio}
            </p>
          </div>

          {/* Specialty & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Habilidades Técnicas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded border border-neutral-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                Equipamento Próprio que Leva ao Turno
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.gear.map((gear, i) => (
                  <span
                    key={i}
                    className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded border border-neutral-200"
                  >
                    {gear}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications & ANVISA */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Certificações & Cursos Comprovados
            </h4>
            <div className="space-y-1.5">
              {freelancer.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Dias Disponíveis na Semana
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {freelancer.availableDays.map((day, i) => (
                <span
                  key={i}
                  className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200 font-medium"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Price & Booking CTA */}
        <div className="p-4 px-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Preço da Diária Integral
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-neutral-900 font-mono">
                R$ {freelancer.dailyRate}
              </span>
              <span className="text-xs text-neutral-500">/turno</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantia de Pagamento Retido no Cofre</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors bg-white"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                onClose();
                onHire(freelancer);
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
            >
              Contratar Este Profissional
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
