import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, X, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { validateCNPJ } from '../utils/security';

interface RegisterCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

export const RegisterCompanyModal: React.FC<RegisterCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerCompany } = useAuth();
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('Restaurante Japonês / Sushibar');
  const [location, setLocation] = useState('Av. Prudente de Morais, 950 · Zona 07, Maringá - PR');
  const [responsibleName, setResponsibleName] = useState('');
  const [phone, setPhone] = useState('(44) 99872-3310');
  const [email, setEmail] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('🏮');
  const [initialDeposit, setInitialDeposit] = useState(4000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cnpj.trim() || !email.trim()) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    if (!validateCNPJ(cnpj)) {
      setError('O CNPJ informado possui dígitos verificadores inválidos na Receita Federal.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerCompany({
        name: name.trim(),
        cnpj: cnpj.trim(),
        segment,
        location: location.trim(),
        responsibleName: responsibleName.trim() || 'Gerente Operacional',
        phone: phone.trim(),
        email: email.trim(),
        avatarIcon,
        initialDeposit,
      });

      onSuccess(name.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar empresa.');
    } finally {
      setLoading(false);
    }
  };

  const icons = ['🏮', '🍷', '🥩', '🍸', '🍕', '🍱', '🍔', '☕', '🧁', '🍽️'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Cadastro de Restaurante / Empresa (CNPJ)
              </h2>
              <p className="text-xs text-neutral-500">
                Contrate profissionais com segurança de pagamento retido em Escrow
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Segment & Icon */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                Ícone do Restaurante
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setAvatarIcon(ic)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                      avatarIcon === ic
                        ? 'bg-amber-100 border-2 border-amber-500 shadow-xs'
                        : 'border border-neutral-200 bg-white hover:bg-neutral-100'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome Fantasia do Restaurante *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Izakaya Maringá, Parrilla Gourmet"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  CNPJ da Empresa *
                </label>
                {cnpj.trim() && (
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-1 ${
                      validateCNPJ(cnpj) ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {validateCNPJ(cnpj) ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        CNPJ Verificado
                      </>
                    ) : (
                      'Dígito verificador inválido'
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="18.492.302/0001-44"
                className={`w-full text-xs rounded-lg border px-3 py-2 text-neutral-900 focus:outline-none font-mono ${
                  cnpj && !validateCNPJ(cnpj)
                    ? 'border-amber-300 bg-amber-50/30 focus:border-amber-500'
                    : cnpj && validateCNPJ(cnpj)
                    ? 'border-emerald-300 bg-emerald-50/20 focus:border-emerald-500'
                    : 'border-neutral-300 bg-white focus:border-amber-500'
                }`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Segmento Culinário
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
              >
                <option value="Restaurante Japonês / Sushibar">Restaurante Japonês / Sushibar</option>
                <option value="Bistrô & Alta Gastronomia">Bistrô & Alta Gastronomia</option>
                <option value="Steakhouse & Parrilla de Carnes">Steakhouse & Parrilla de Carnes</option>
                <option value="Bar de Coquetelaria & Pub">Bar de Coquetelaria & Pub</option>
                <option value="Pizzaria & Trattoria Italiana">Pizzaria & Trattoria Italiana</option>
                <option value="Buffet & Eventos Sociais">Buffet & Eventos Sociais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome do Gerente / Responsável
              </label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex: Carlos Mendonça"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Endereço Físico do Restaurante (Maringá e Região) *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Rua / Av., Número, Bairro/Zona, Maringá - PR"
              className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com.br"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                WhatsApp / Telefone para Contato
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(44) 99999-9999"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Initial Wallet Balance Explanation */}
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900">
                Crédito Inicial B2B para Testes de Diárias:
              </span>
              <span className="font-bold text-neutral-900 font-mono">
                R$ {initialDeposit.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Limite pré-aprovado para você poder reservar sushimen e garçons imediatamente via Escrow.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando empresa e ativando cofre...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Finalizar Cadastro e Acessar como Empresa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
