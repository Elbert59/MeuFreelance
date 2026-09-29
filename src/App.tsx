import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Freelancer, Contract, CategoryId, ShiftOpportunity } from './types';
import { api } from './services/api';
import { Header, AppTab } from './components/Header';
import { CategoryGrid } from './components/CategoryGrid';
import { FreelancerCard } from './components/FreelancerCard';
import { FreelancerProfileModal } from './components/FreelancerProfileModal';
import { HireModal } from './components/HireModal';
import { FreelancerDashboard } from './components/FreelancerDashboard';
import { EscrowContractsView } from './components/EscrowContractsView';
import { OpportunitiesBoard } from './components/OpportunitiesBoard';
import { LoginModal } from './components/LoginModal';
import { RegisterCompanyModal } from './components/RegisterCompanyModal';
import { RegisterFreelancerModal } from './components/RegisterFreelancerModal';
import { NextjsArchitectureView } from './components/NextjsArchitectureView';
import {
  Search,
  MapPin,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  UserPlus,
  Flame,
} from 'lucide-react';

function AppContent() {
  const { session, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<AppTab>(
    role === 'FREELANCER' ? 'freelancer' : 'empresa'
  );

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<ShiftOpportunity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedFreelancerForProfile, setSelectedFreelancerForProfile] = useState<Freelancer | null>(null);
  const [selectedFreelancerForHire, setSelectedFreelancerForHire] = useState<Freelancer | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterCompanyOpen, setIsRegisterCompanyOpen] = useState(false);
  const [isRegisterFreelancerOpen, setIsRegisterFreelancerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync tab with role if switched via header
  useEffect(() => {
    if (role === 'FREELANCER' && currentTab === 'empresa') {
      setCurrentTab('freelancer');
    } else if (role === 'EMPRESA' && currentTab === 'freelancer') {
      setCurrentTab('empresa');
    }
  }, [role]);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [freelas, ctrs, opps] = await Promise.all([
        api.getFreelancers(),
        api.getContracts(),
        api.getOpportunities(),
      ]);
      setFreelancers(freelas);
      setContracts(ctrs);
      setOpportunities(opps);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleContractCreated = (newContract: Contract) => {
    setContracts((prev) => [newContract, ...prev]);
    showToast(`Contrato ${newContract.id} criado com sucesso! R$ ${newContract.totalAmount.toFixed(2)} retido em Escrow.`);
    setTimeout(() => {
      setCurrentTab('contratos');
    }, 600);
  };

  const handleContractUpdated = (updatedContract: Contract) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );

    if (updatedContract.status === 'CHECKIN_REALIZADO') {
      showToast(`Check-in validado! Expediente de ${updatedContract.freelancerName} iniciado.`);
    } else if (updatedContract.status === 'VALOR_LIBERADO') {
      showToast(`Turno finalizado! Valor de R$ ${updatedContract.dailyRate.toFixed(2)} liberado via Pix.`);
    } else if (updatedContract.companyReview || updatedContract.freelancerReview) {
      showToast(`Avaliação estilo Uber registrada com sucesso!`);
    }
  };

  const handleOpportunityCreated = (newOpp: ShiftOpportunity) => {
    setOpportunities((prev) => [newOpp, ...prev]);
    showToast(`Diária urgente "${newOpp.roleTitle}" publicada no mural com sucesso!`);
  };

  const handleShiftAccepted = (contract: Contract) => {
    setContracts((prev) => [contract, ...prev]);
    showToast(`Parabéns! Você aceitou a diária de ${contract.companyName}. R$ ${contract.dailyRate} retido no cofre.`);
    setCurrentTab('freelancer');
  };

  const handleCompanyRegistered = async (name: string) => {
    await loadData();
    showToast(`Empresa "${name}" cadastrada com sucesso! Limite B2B ativado.`);
    setCurrentTab('empresa');
  };

  const handleFreelancerRegistered = async (name: string) => {
    await loadData();
    showToast(`Profissional "${name}" cadastrado! Você já pode receber diárias.`);
    setCurrentTab('freelancer');
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    freelancers.forEach((f) => {
      counts[f.categoryId] = (counts[f.categoryId] || 0) + 1;
    });
    return counts;
  }, [freelancers]);

  // Filtered freelancers
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      const matchesCategory =
        selectedCategory === 'all' || f.categoryId === selectedCategory;

      const matchesSearch =
        searchQuery === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLocation =
        selectedLocation === 'all' ||
        f.location.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesCategory && matchesSearch && matchesLocation;
    });
  }, [freelancers, selectedCategory, searchQuery, selectedLocation]);

  const pendingEscrowTotal = contracts
    .filter((c) => c.status === 'PAGO_E_RETIDO')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md p-4 rounded-xl border border-amber-500/50 bg-neutral-900/95 shadow-2xl text-white flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-300 block mb-0.5">Notificação ChefMatch</span>
            <p className="text-neutral-200">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Contract (3 Zones) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenRegisterCompany={() => setIsRegisterCompanyOpen(true)}
        onOpenRegisterFreelancer={() => setIsRegisterFreelancerOpen(true)}
        pendingEscrowTotal={pendingEscrowTotal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: EMPRESA (Marketplace B2B estilo iFood) */}
        {currentTab === 'empresa' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero / B2B Search Banner */}
            <div className="relative rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8 overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pagamento Retido em Escrow (Cofre Seguro)</span>
                  </span>
                  <button
                    onClick={() => setCurrentTab('mural')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5 fill-rose-400" />
                    <span>{opportunities.filter(o => o.status === 'ABERTA').length} Diárias Urgentes no Mural →</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Contrate Sushimen, Garçons e Chefs de Cozinha em Maringá
                </h1>

                <p className="text-sm sm:text-base text-neutral-300 mt-2 leading-relaxed">
                  Sem risco de falta ou atraso: o valor fica guardado com a plataforma e só é creditado ao profissional após a realização do check-out.
                </p>

                {/* Search & Location Bar */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 bg-neutral-950/90 p-2 rounded-xl border border-neutral-800">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por cargo, especialidade (ex: Sushiman, Bartender, Faca Yanagiba)..."
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-44">
                      <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="all">Todas as Regiões</option>
                        <option value="Zona 01">Zona 01 / Centro</option>
                        <option value="Zona 07">Zona 07 / UEM</option>
                        <option value="Gleba Palhano">Zona 03 / Palhano</option>
                        <option value="Vila Operária">Vila Operária</option>
                      </select>
                    </div>

                    {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedLocation('all');
                        }}
                        title="Limpar Filtros"
                        className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative accent lines */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            </div>

            {/* iFood-Style Visual Categories */}
            <CategoryGrid
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              freelancerCountsByCat={categoryCounts}
            />

            {/* Freelancers List Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Profissionais Disponíveis</span>
                    <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                      {filteredFreelancers.length} encontrados
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Avaliações verificadas de outros donos de restaurantes de Maringá e região
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% com Antecedentes & MEI Checados
                  </span>
                </div>
              </div>

              {/* Freelancers Grid */}
              {loading ? (
                <div className="p-16 text-center text-sm text-neutral-400">
                  Carregando banco de freelancers da gastronomia...
                </div>
              ) : filteredFreelancers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
                  <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
                  <h3 className="text-base font-bold text-white">Nenhum profissional com esses filtros</h3>
                  <p className="text-xs text-neutral-400">Tente buscar por outro termo ou limpe a categoria selecionada.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs"
                  >
                    Restaurar Lista Completa
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFreelancers.map((freelancer) => (
                    <FreelancerCard
                      key={freelancer.id}
                      freelancer={freelancer}
                      onSelect={(f) => setSelectedFreelancerForProfile(f)}
                      onHireDirect={(f) => setSelectedFreelancerForHire(f)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: MURAL DE DIÁRIAS URGENTES */}
        {currentTab === 'mural' && (
          <OpportunitiesBoard
            opportunities={opportunities}
            onOpportunityCreated={handleOpportunityCreated}
            onShiftAccepted={handleShiftAccepted}
          />
        )}

        {/* VIEW 3: FREELANCER (Painel de Gestão, Check-in e Check-out) */}
        {currentTab === 'freelancer' && (
          <FreelancerDashboard
            contracts={contracts}
            onContractUpdated={handleContractUpdated}
            onRefresh={loadData}
            onNavigateToMural={() => setCurrentTab('mural')}
          />
        )}

        {/* VIEW 4: CONTRATOS & ESCROW (Cofre da Plataforma) */}
        {currentTab === 'contratos' && (
          <EscrowContractsView
            contracts={contracts}
            onContractUpdated={handleContractUpdated}
            onSelectTab={setCurrentTab}
          />
        )}

        {/* VIEW 5: NEXT.JS ARCHITECTURE & SOURCE CODE */}
        {currentTab === 'docs' && <NextjsArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-300">ChefMatch B2B</span>
            <span>·</span>
            <span>Marketplace de Diárias Gastronômicas com Escrow</span>
            <span>·</span>
            <span>Maringá - PR</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRegisterCompanyOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Cadastrar Empresa
            </button>
            <span>·</span>
            <button
              onClick={() => setIsRegisterFreelancerOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Cadastrar Freelancer
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('docs')}
              className="hover:text-amber-400 transition-colors"
            >
              Arquitetura Next.js
            </button>
          </div>
        </div>
      </footer>

      {/* Profile Details Modal */}
      {selectedFreelancerForProfile && (
        <FreelancerProfileModal
          freelancer={selectedFreelancerForProfile}
          onClose={() => setSelectedFreelancerForProfile(null)}
          onHire={(f) => setSelectedFreelancerForHire(f)}
        />
      )}

      {/* Hire Modal with Escrow Lock */}
      {selectedFreelancerForHire && (
        <HireModal
          freelancer={selectedFreelancerForHire}
          onClose={() => setSelectedFreelancerForHire(null)}
          onContractCreated={handleContractCreated}
        />
      )}

      {/* Login / Switch Session Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegisterCompany={() => setIsRegisterCompanyOpen(true)}
        onOpenRegisterFreelancer={() => setIsRegisterFreelancerOpen(true)}
      />

      {/* Register Company Modal */}
      <RegisterCompanyModal
        isOpen={isRegisterCompanyOpen}
        onClose={() => setIsRegisterCompanyOpen(false)}
        onSuccess={handleCompanyRegistered}
      />

      {/* Register Freelancer Modal */}
      <RegisterFreelancerModal
        isOpen={isRegisterFreelancerOpen}
        onClose={() => setIsRegisterFreelancerOpen(false)}
        onSuccess={handleFreelancerRegistered}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
