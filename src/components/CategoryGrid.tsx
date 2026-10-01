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
        return <Fish className="w-5 h-5 text-rose-600" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-600" />;
      case 'Wine':
        return <Wine className="w-5 h-5 text-violet-600" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'ChefHat':
      default:
        return <ChefHat className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <section className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Especialidades em Alta na Gastronomia
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Selecione uma categoria para filtrar profissionais prontos para o turno de hoje
          </p>
        </div>

        <button
          onClick={() => onSelectCategory('all')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-xs'
              : 'border-neutral-200 bg-white text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50'
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
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/40 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md hover:bg-neutral-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-white border-amber-300 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 group-hover:border-neutral-300'
                    }`}
                  >
                    {getIcon(cat.iconName)}
                  </div>

                  <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/80">
                    {count} disponíveis
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors leading-snug">
                  {cat.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                  {cat.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 mt-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-600 group-hover:text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {cat.badge}
                </span>
                <span className="text-xs text-neutral-400 group-hover:text-neutral-700 font-mono">
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
