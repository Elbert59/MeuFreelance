import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CategoryId } from '../types';
import { User, X, Check, ShieldCheck, Sparkles, Wrench, AlertCircle, Loader2 } from 'lucide-react';

interface RegisterFreelancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

const DEFAULT_SKILLS = [
  'Faca Yanagiba Própria',
  'Desmanche de Pescados',
  'Normas ANVISA / APPCC',
  'Atendimento Fine Dining',
  'Abertura de Vinhos',
  'Coquetelaria Autoral',
  'Parrilla e Controle de Ponto',
  'Sous-Chef / Praça Quente',
  'Agilidade no Rush',
];

const DEFAULT_GEAR = [
  'Jogo de Facas Japonesas',
  'Avental e Dólmã Higienizada',
  'Saca-rolhas duas fases',
  'Kit Coqueteleira Boston',
  'Termômetro Digital Culinário',
  'Pedras de Amolação 1000/6000',
];

export const RegisterFreelancerModal: React.FC<RegisterFreelancerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerFreelancer } = useAuth();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('cozinha-oriental');
  const [role, setRole] = useState('Sushiman Especialista');
  const [specialty, setSpecialty] = useState('Sashimi, Nigiris Clássicos e Uramakis');
  const [dailyRate, setDailyRate] = useState<number>(320);
  const [location, setLocation] = useState('Maringá · Zona 07');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Faca Yanagiba Própria',
    'Desmanche de Pescados',
    'Normas ANVISA / APPCC',
  ]);
  const [selectedGear, setSelectedGear] = useState<string[]>([
    'Jogo de Facas Japonesas',
    'Avental e Dólmã Higienizada',
  ]);
  const [certificationsText, setCertificationsText] = useState('Boas Práticas de Manipulação de Alimentos ANVISA');
  const [bio, setBio] = useState('Profissional pontual, experiente em cozinhas de alto movimento. Postura discreta e respeito aos insumos.');
  const [pixKey, setPixKey] = useState('');
  const [phone, setPhone] = useState('(44) 99123-4567');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleGear = (gear: string) => {
    if (selectedGear.includes(gear)) {
      setSelectedGear(selectedGear.filter((g) => g !== gear));
    } else {
      setSelectedGear([...selectedGear, gear]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim() || !role.trim() || !pixKey.trim()) {
      setError('Por favor, preencha os campos obrigatórios (incluindo Chave Pix para recebimento).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const certs = certificationsText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);

      await registerFreelancer({
        name: name.trim(),
        identifier: identifier.trim(),
        categoryId,
        role: role.trim(),
        specialty: specialty.trim(),
        dailyRate: Number(dailyRate),
        location: location.trim(),
        experienceYears: Number(experienceYears),
        skills: selectedSkills,
        gear: selectedGear,
        certifications: certs.length ? certs : ['Boas Práticas ANVISA'],
        bio: bio.trim(),
        availableDays: ['Quinta', 'Sexta', 'Sábado', 'Domingo'],
        phone: phone.trim(),
        email: email.trim(),
        pixKey: pixKey.trim(),
      });

      onSuccess(name.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar profissional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Cadastro de Profissional Freelancer (Gastronomia)
              </h2>
              <p className="text-xs text-neutral-500">
                Receba convites de diárias em Maringá com garantia de pagamento via Escrow
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gabriel Tanaka"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                CPF ou MEI *
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="000.000.000-00 ou MEI"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Specialty & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Especialidade Principal *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as CategoryId)}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="cozinha-oriental">Cozinha Oriental (Sushiman)</option>
                <option value="salao-atendimento">Salão e Atendimento (Garçom)</option>
                <option value="bar-bebidas">Bar e Mixologia (Bartender)</option>
                <option value="parrilla-churrasco">Parrilla & Carnes (Parrillero)</option>
                <option value="cozinha-quente">Cozinha Geral & Linha (Chef/Sous)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Cargo / Título Profissional *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Sushiman Pleno, Chefe de Salão"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Valor da Diária (R$) *
              </label>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                min={150}
                max={900}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Especialidade de Destaque
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Sashimi & Desmanche de Salmão, Vinhos"
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Anos de Exp.
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  min={1}
                  max={30}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Bairro em Maringá
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Maringá · Zona 07"
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Pix Key for Instant Escrow Payout */}
          <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dados para Liquidação Instantânea via Pix</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Chave Pix (CPF, Celular, E-mail ou Aleatória) *
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="pix@seuemail.com ou (44) 99999-9999"
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  WhatsApp para Alinhamento de Turno
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(44) 99123-4567"
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-600">
              O pagamento retido no cofre da empresa é transferido automaticamente para essa chave assim que você fizer o check-out.
            </p>
          </div>

          {/* Skills Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Habilidades Técnicas (clique para selecionar):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-white'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Own Gear Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              Equipamento Próprio que Leva aos Turnos:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_GEAR.map((gear) => {
                const isSelected = selectedGear.includes(gear);
                return (
                  <button
                    key={gear}
                    type="button"
                    onClick={() => toggleGear(gear)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-white'
                    }`}
                  >
                    {gear}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Mini Apresentação Profissional
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando perfil profissional...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Finalizar Cadastro e Começar a Receber Diárias</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
