import React from 'react';
import { Freelancer } from '../types';
import { Star, ShieldCheck, MapPin, Clock, Award, CheckCircle2 } from 'lucide-react';

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
  // Initials generator
  const initials = freelancer.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <div className="group rounded-xl border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Header with Photo/Avatar + Rating Uber Style */}
      <div className="p-5">
        <div className="flex items-start gap-3.5 mb-3.5">
          {/* Avatar representation with gastronomy badge */}
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border border-neutral-700/60 shadow-inner ${freelancer.avatarFallbackColor}`}
            >
              {initials}
            </div>
            {freelancer.verified && (
              <div
                title="Profissional Verificado (Documentação & Antecedentes Checados)"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center border-2 border-neutral-900 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Name & Uber-style Rating */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-base font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                {freelancer.name}
              </h3>
              {freelancer.immediateAvailable && (
                <span className="shrink-0 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  Disponível Hoje
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-neutral-300 truncate mt-0.5">
              {freelancer.role}
            </p>

            {/* Uber-style Rating Score & Gigs */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <div className="flex items-center gap-1 bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded font-bold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{freelancer.rating.toFixed(2)}</span>
              </div>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400 text-[11px]">
                {freelancer.completedGigs} diárias concluídas
              </span>
            </div>
          </div>
        </div>

        {/* Specialty highlight */}
        <div className="bg-neutral-950/70 rounded-lg p-2.5 border border-neutral-800/80 mb-3.5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Especialidade Principal
          </p>
          <p className="text-xs font-medium text-amber-200 mt-0.5 leading-snug">
            {freelancer.specialty}
          </p>
        </div>

        {/* Location & Experience */}
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-3.5">
          <div className="flex items-center gap-1 truncate max-w-[190px]">
            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="truncate">{freelancer.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>{freelancer.experienceYears} anos exp.</span>
          </div>
        </div>

        {/* Skills & Gear badges */}
        <div className="flex flex-wrap gap-1.5">
          {freelancer.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="text-[11px] text-neutral-300 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50"
            >
              {skill}
            </span>
          ))}
          {freelancer.skills.length > 3 && (
            <span className="text-[11px] text-neutral-400 bg-neutral-800/40 px-1.5 py-0.5 rounded">
              +{freelancer.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer with Daily Rate and Contract Action */}
      <div className="p-4 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
            Preço da Diária
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-white font-mono tabular-nums">
              R$ {freelancer.dailyRate}
            </span>
            <span className="text-[11px] text-neutral-400">/turno</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>Cofre Escrow Garantido</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(freelancer)}
            className="px-2.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors"
          >
            Perfil
          </button>

          <button
            onClick={() => onHireDirect(freelancer)}
            className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Contratar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
