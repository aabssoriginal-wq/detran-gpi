"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { signOut } from "next-auth/react";

export type Papel = 'admin_total' | 'admin_master' | 'usuario_master' | 'usuario';

export interface SessaoUsuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar: string;
  papel: Papel;
  departamento: string;
  projetosAtribuidos: number[];
}

interface AuthContextType {
  usuario: SessaoUsuario | null;
  originalUsuario: SessaoUsuario | null;
  isImpersonating: boolean;
  login: (usuario: SessaoUsuario) => void;
  logout: () => void;
  impersonate: (target: SessaoUsuario) => void;
  stopImpersonating: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  originalUsuario: null,
  isImpersonating: false,
  login: () => {},
  logout: () => {},
  impersonate: () => {},
  stopImpersonating: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(null);
  const [originalUsuario, setOriginalUsuario] = useState<SessaoUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gpi_session');
      if (saved) setUsuario(JSON.parse(saved));
      const savedOriginal = localStorage.getItem('gpi_original_session');
      if (savedOriginal) setOriginalUsuario(JSON.parse(savedOriginal));
    } catch (e) {}
    setIsLoading(false);
  }, []);

  const login = (u: SessaoUsuario) => {
    setUsuario(u);
    localStorage.setItem('gpi_session', JSON.stringify(u));
  };


  const logout = () => {
    setUsuario(null);
    setOriginalUsuario(null);
    localStorage.removeItem('gpi_session');
    localStorage.removeItem('gpi_original_session');
    signOut({ redirect: false });
  };

  const impersonate = (target: SessaoUsuario) => {
    // Guarda o usuário atual como "original"
    if (usuario) {
      setOriginalUsuario(usuario);
      localStorage.setItem('gpi_original_session', JSON.stringify(usuario));
    }
    setUsuario(target);
    localStorage.setItem('gpi_session', JSON.stringify(target));
  };

  const stopImpersonating = () => {
    if (originalUsuario) {
      setUsuario(originalUsuario);
      localStorage.setItem('gpi_session', JSON.stringify(originalUsuario));
    }
    setOriginalUsuario(null);
    localStorage.removeItem('gpi_original_session');
  };

  const isImpersonating = !!originalUsuario;

  return (
    <AuthContext.Provider value={{ usuario, originalUsuario, isImpersonating, login, logout, impersonate, stopImpersonating, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const papelLabel: Record<Papel, string> = {
  admin_total: 'Admin Total',
  admin_master: 'Admin Master',
  usuario_master: 'Usuário Master',
  usuario: 'Usuário',
};

export const papelColor: Record<Papel, string> = {
  admin_total: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400',
  admin_master: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400',
  usuario_master: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  usuario: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
};

