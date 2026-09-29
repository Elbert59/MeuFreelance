import React from 'react';
import { Category, CategoryId } from '../types';
import { CATEGORIES } from '../data/mockData';
import { Fish, Users, Wine, Flame, ChefHat, Sparkles } from 'lucide-react';

interface CategoryGridProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (catId: CategoryId | 'all') => void;
  freelancerCountsByCat: Record<string, number>;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
  freelancerCountsByCat,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Fish':
        return <Fish className="w-6 h-6 text-rose-400" />;
      case 'Users':
        return <Users className="w-6 h-6 text-amber-400" />;
      case 'Wine':
        return <Wine className="w-6 h-6 text-violet-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-orange-400" />;
      case 'ChefHat':
      default:
        return <ChefHat className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <section className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Especialidades em Alta na Gastronomia
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Selecione uma categoria para filtrar profissionais prontos para o turno de hoje
          </p>
        </div>

        <button
          onClick={() => onSelectCategory('all')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
              : 'border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Ver Todas as Especialidades
        </button>
      </div>

      {/* Large visual category cards (iFood style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {CATEGORIES.map((cat: Category) => {
          const isSelected = selectedCategory === cat.id;
          const count = freelancerCountsByCat[cat.id] ?? cat.freelancerCount;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
              className={`group relative text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[160px] ${
                isSelected
                  ? 'border-amber-400 bg-neutral-900 ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/30'
                  : 'border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 to-neutral-950 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              {/* Subtle category accent backdrop glow */}
              <div
                className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none ${
                  cat.id === 'cozinha-oriental'
                    ? 'bg-rose-500'
                    : cat.id === 'salao-atendimento'
                    ? 'bg-amber-500'
                    : cat.id === 'bar-bebidas'
                    ? 'bg-violet-500'
                    : cat.id === 'parrilla-churrasco'
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                }`}
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-400/50'
                        : 'bg-neutral-950 border-neutral-800 group-hover:border-neutral-700'
                    }`}
                  >
                    {getIcon(cat.iconName)}
                  </div>

                  <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800">
                    {count} disponíveis
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {cat.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                  {cat.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/60 mt-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-300 group-hover:text-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {cat.badge}
                </span>
                <span className="text-xs text-neutral-500 group-hover:text-neutral-300 font-mono">
                  →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
