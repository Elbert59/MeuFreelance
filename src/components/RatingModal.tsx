import React, { useState } from 'react';
import { Contract, ContractReview } from '../types';
import { api } from '../services/api';
import { Star, CheckCircle, X, Loader2, ThumbsUp } from 'lucide-react';

interface RatingModalProps {
  contract: Contract;
  type: 'freelancer' | 'company'; // who is submitting the review
  onClose: () => void;
  onSubmitted: (updatedContract: Contract) => void;
}

const FREELANCER_TAGS_FOR_COMPANY = [
  'Ambiente Organizado',
  'Pagamento Pontual',
  'Equipe Acolhedora',
  'Estrutura Impecável',
  'Alimentação Fornecida',
  'Comunicação Clara',
  'Respeito aos Horários',
];

const COMPANY_TAGS_FOR_FREELANCER = [
  'Super Pontual',
  'Técnica Refinada',
  'Cozinha Limpa / Higiene',
  'Agilidade no Rush',
  'Excelente Postura',
  'Equipamento Próprio',
  'Trabalho em Equipe',
];

export const RatingModal: React.FC<RatingModalProps> = ({
  contract,
  type,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const isFreelancerReviewing = type === 'freelancer';
  const targetName = isFreelancerReviewing ? contract.companyName : contract.freelancerName;
  const targetRoleOrCnpj = isFreelancerReviewing ? contract.companyCnpj : contract.freelancerRole;
  const availableTags = isFreelancerReviewing
    ? FREELANCER_TAGS_FOR_COMPANY
    : COMPANY_TAGS_FOR_FREELANCER;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Excelente · Superou as expectativas';
      case 4:
        return 'Muito Bom · Atendeu muito bem';
      case 3:
        return 'Bom · Atendimento satisfatório';
      case 2:
        return 'Regular · Pontos a melhorar';
      case 1:
        return 'Ruim · Não recomendo';
      default:
        return 'Selecione sua nota';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const reviewData: ContractReview = {
      rating,
      tags: selectedTags,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = await api.updateContract({
        contractId: contract.id,
        review: {
          type: isFreelancerReviewing ? 'freelancer' : 'company',
          data: reviewData,
        },
      });

      setSuccess(true);
      onSubmitted(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden text-neutral-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Avaliação do Turno (Estilo Uber)
              </h2>
              <p className="text-xs text-neutral-500">
                {isFreelancerReviewing ? 'Como foi trabalhar neste restaurante?' : 'Como foi o desempenho do profissional?'}
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

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-300 mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Avaliação registrada com sucesso!
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Obrigado por fortalecer a reputação e confiança do ecossistema gastronômico de Maringá.
            </p>
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Target info */}
            <div className="text-center pb-2 border-b border-neutral-200">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                {isFreelancerReviewing ? 'Avaliando Restaurante / Empresa' : 'Avaliando Profissional'}
              </p>
              <h4 className="text-lg font-bold text-neutral-900 mt-0.5">{targetName}</h4>
              <p className="text-xs text-neutral-500">{targetRoleOrCnpj}</p>
            </div>

            {/* Interactive Stars */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          active
                            ? 'fill-amber-500 text-amber-500 drop-shadow-xs'
                            : 'text-neutral-300 hover:text-neutral-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-amber-800 font-mono">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* Quick Tags */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-neutral-400" />
                Tags Rápidas (Selecione os destaques do turno)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Comentário Opcional
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi o turno, pontualidade, ritmo da cozinha e comunicação..."
                rows={3}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                Avaliar depois
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 font-bold text-xs text-neutral-950 transition-colors shadow-xs flex items-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Enviar Avaliação</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
