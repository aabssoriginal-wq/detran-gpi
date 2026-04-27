"use client";

import { ReactNode, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/context/AuthContext";
import { UserCog, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isImpersonating, originalUsuario, usuario, stopImpersonating, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.replace("/");
    }
  }, [isLoading, usuario, router]);

  if (isLoading || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Banner de Impersonação */}
        {isImpersonating && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium z-50 shrink-0">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 shrink-0" />
              <span>
                Você está visualizando como <strong>{usuario?.nome}</strong> ({usuario?.papel === 'admin_total' ? 'Admin Total' : usuario?.papel === 'admin_master' ? 'Admin Master' : usuario?.papel === 'usuario_master' ? 'Usuário Master' : 'Usuário'}) — Modo de Teste Ativo
              </span>
            </div>
            <button
              onClick={stopImpersonating}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors shrink-0 ml-4"
            >
              <X className="h-3.5 w-3.5" />
              Encerrar e voltar como {originalUsuario?.nome}
            </button>
          </div>
        )}
        <Header />
        <main className="flex-1 p-6 md:p-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
