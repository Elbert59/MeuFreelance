import React from 'react';
import { Freelancer } from '../types';
import { Star, ShieldCheck, MapPin, Clock, CheckCircle2 } from 'lucide-react';

interface FreelancerCardProps {
  freelancer: Freelancer;
  onSelect: (freelancer: Freelancer) => void;
  onHireDirect: (freelancer: Freelancer) => void;
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({
  freelancer,
  onSelect,
  onHireDirect,
}) => {
  const initials = freelancer.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <div className="group rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs">
      {/* Header with Photo/Avatar + Rating */}
      <div className="p-5">
        <div className="flex items-start gap-3.5 mb-3.5">
          {/* Avatar representation with gastronomy badge */}
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border border-neutral-200 shadow-inner ${
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
            {freelancer.verified && (
              <div
                title="Profissional Verificado (Documentação & Antecedentes Checados)"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Name & Rating */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-base font-bold text-neutral-900 truncate group-hover:text-amber-700 transition-colors">
                {freelancer.name}
              </h3>
              {freelancer.immediateAvailable && (
                <span className="shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Disponível Hoje
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-neutral-600 truncate mt-0.5">
              {freelancer.role}
            </p>

            {/* Rating Score & Gigs */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{freelancer.rating.toFixed(2)}</span>
              </div>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-500 text-[11px]">
                {freelancer.completedGigs} diárias concluídas
              </span>
            </div>
          </div>
        </div>

        {/* Specialty highlight */}
        <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-200/80 mb-3.5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-800/80">
            Especialidade Principal
          </p>
          <p className="text-xs font-medium text-amber-950 mt-0.5 leading-snug">
            {freelancer.specialty}
          </p>
        </div>

        {/* Location & Experience */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-3.5">
          <div className="flex items-center gap-1 truncate max-w-[190px]">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{freelancer.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{freelancer.experienceYears} anos exp.</span>
          </div>
        </div>

        {/* Skills & Gear badges */}
        <div className="flex flex-wrap gap-1.5">
          {freelancer.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="text-[11px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70"
            >
              {skill}
            </span>
          ))}
          {freelancer.skills.length > 3 && (
            <span className="text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200/50">
              +{freelancer.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer with Daily Rate and Contract Action */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">
            Preço da Diária
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-neutral-900 font-mono tabular-nums">
              R$ {freelancer.dailyRate}
            </span>
            <span className="text-[11px] text-neutral-500">/turno</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 mt-0.5 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Cofre Escrow Garantido</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(freelancer)}
            className="px-2.5 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg border border-neutral-200 bg-white transition-colors"
          >
            Perfil
          </button>

          <button
            onClick={() => onHireDirect(freelancer)}
            className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Contratar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
