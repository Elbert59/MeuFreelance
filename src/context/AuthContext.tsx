import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserSession, Freelancer } from '../types';
import { api, RegisterCompanyPayload, RegisterFreelancerPayload } from '../services/api';
import { MOCK_COMPANIES, FREELANCERS } from '../data/mockData';

interface AuthContextType {
  role: Role;
  session: UserSession;
  loginAsCompany: (companyId?: string) => void;
  loginAsFreelancer: (freelancerId?: string) => void;
  switchRole: () => void;
  registerCompany: (payload: RegisterCompanyPayload) => Promise<UserSession>;
  registerFreelancer: (payload: RegisterFreelancerPayload) => Promise<Freelancer>;
  allCompanies: UserSession[];
  availableFreelancers: Freelancer[];
  isLoggedIn: boolean;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const STORAGE_AUTH_KEY = 'chefmatch_auth_session_v2';
const AUTH_STATUS_KEY = 'chefmatch_is_authenticated_v2';
const defaultCompany = MOCK_COMPANIES[0];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STATUS_KEY);
      return storedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [session, setSession] = useState<UserSession>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read auth session from storage', e);
    }
    return defaultCompany;
  });

  const [allCompanies, setAllCompanies] = useState<UserSession[]>([...MOCK_COMPANIES]);
  const [availableFreelancers, setAvailableFreelancers] = useState<Freelancer[]>([...FREELANCERS]);

  // Load dynamically registered companies and freelancers
  const refreshUsers = async () => {
    try {
      const [comps, freelas] = await Promise.all([
        api.getCompanies(),
        api.getFreelancers(),
      ]);
      setAllCompanies(comps);
      setAvailableFreelancers(freelas);
    } catch (e) {
      console.error('Failed to refresh users', e);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save auth session to storage', e);
    }
  }, [session]);

  const loginAsCompany = (companyId?: string) => {
    const selected = allCompanies.find((c) => c.id === companyId) || allCompanies[0] || defaultCompany;
    setSession(selected);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(selected));
    } catch (e) {
      console.error('Failed to persist auth status', e);
    }
  };

  const loginAsFreelancer = (freelancerId?: string) => {
    const target = availableFreelancers.find((f) => f.id === freelancerId) || availableFreelancers[0] || FREELANCERS[0];
    const newSession: UserSession = {
      role: 'FREELANCER',
      id: target.id,
      name: target.name,
      identifier: 'MEI / CPF Verificado',
      avatar: target.categoryId === 'cozinha-oriental' ? '🍣' : target.categoryId === 'bar-bebidas' ? '🍸' : '👨‍🍳',
      location: target.location,
      walletBalance: 1680,
    };
    setSession(newSession);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.error('Failed to persist auth status', e);
    }
  };

  const switchRole = () => {
    if (session.role === 'EMPRESA') {
      const freela = availableFreelancers[0] || FREELANCERS[0];
      loginAsFreelancer(freela.id);
    } else {
      const comp = allCompanies[0] || defaultCompany;
      loginAsCompany(comp.id);
    }
  };

  const registerCompany = async (payload: RegisterCompanyPayload): Promise<UserSession> => {
    const newCompany = await api.registerCompany(payload);
    setAllCompanies((prev) => [newCompany, ...prev]);
    setSession(newCompany);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(newCompany));
    } catch (e) {
      console.error('Failed to persist auth status', e);
    }
    return newCompany;
  };

  const registerFreelancer = async (payload: RegisterFreelancerPayload): Promise<Freelancer> => {
    const newFreelancer = await api.registerFreelancer(payload);
    setAvailableFreelancers((prev) => [newFreelancer, ...prev]);

    const newSession: UserSession = {
      role: 'FREELANCER',
      id: newFreelancer.id,
      name: newFreelancer.name,
      identifier: payload.identifier || 'MEI Verificado',
      avatar: newFreelancer.categoryId === 'cozinha-oriental' ? '🍣' : '👨‍🍳',
      location: newFreelancer.location,
      walletBalance: 0,
      phone: payload.phone,
      email: payload.email,
      pixKey: payload.pixKey,
    };
    setSession(newSession);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.error('Failed to persist auth status', e);
    }
    return newFreelancer;
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.setItem(AUTH_STATUS_KEY, 'false');
    } catch (e) {
      console.error('Failed to save logout state', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role: session.role,
        session,
        loginAsCompany,
        loginAsFreelancer,
        switchRole,
        registerCompany,
        registerFreelancer,
        allCompanies,
        availableFreelancers,
        isLoggedIn,
        logout,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
