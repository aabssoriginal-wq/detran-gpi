"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, papelLabel, papelColor, type SessaoUsuario } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Crown, Shield, User as UserIcon, Loader2, ChevronRight } from "lucide-react";

const PAPEL_ICONS = {
  admin_total: Crown,
  admin_master: Shield,
  usuario_master: Shield,
  usuario: UserIcon,
};

export default function LoginPage() {
  const { login, usuario } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      router.replace("/dashboard");
      return;
    }
    fetch("/api/users")
      .then(res => res.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [usuario, router]);

  const handleSelect = (u: any) => {
    setSelecting(u.id);
    setTimeout(() => {
      const sessao: SessaoUsuario = {
        id: u.id,
        nome: u.nome,
        email: u.email,
        cargo: u.cargo,
        avatar: u.avatar,
        papel: u.papel,
        departamento: u.departamento, // Novo
        projetosAtribuidos: u.projetosAtribuidos,
      };
      login(sessao);
      window.location.href = "/dashboard";
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Painel lateral azul */}
      <div className="hidden md:flex flex-col flex-1 bg-blue-700 dark:bg-blue-900 text-white p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
        <div className="relative z-10 flex items-center gap-3">
          <FolderKanban className="h-10 w-10" />
          <span className="text-3xl font-bold tracking-tight">GPI</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Gerenciamento de Projetos e Iniciativas - DETRAN-SP
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Governança, visibilidade e inteligência artificial aplicadas à gestão estratégica do portfólio corporativo por Diretoria.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-blue-200">
            <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 flex items-center gap-1.5"><Crown className="h-3.5 w-3.5" /> Admin Total</span>
            <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Admin Master</span>
            <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> Usuário</span>
          </div>
        </div>
      </div>

      {/* Seletor de usuário */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="md:hidden flex items-center justify-center gap-2 mb-6 text-blue-600">
              <FolderKanban className="h-8 w-8" />
              <span className="text-2xl font-bold">GPI</span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 21">
                <path fill="#f35325" d="M0 0h10v10H0z"/>
                <path fill="#81bc06" d="M11 0h10v10H11z"/>
                <path fill="#05a6f0" d="M0 11h10v10H0z"/>
                <path fill="#ffba08" d="M11 11h10v10H11z"/>
              </svg>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Acesso Corporativo</h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200 mb-2">
              Ambiente DEV - Manual Auth
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Selecione seu perfil para validação no Azure</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaboradores Detran-SP</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => {
                  const PapelIcon = PAPEL_ICONS[u.papel as keyof typeof PAPEL_ICONS] || UserIcon;
                  const isSelecting = selecting === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      disabled={!!selecting}
                      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-left disabled:opacity-60"
                    >
                      <div className="relative shrink-0">
                        <img src={u.avatar} alt={u.nome} className="h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition-colors" />
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${u.papel === 'admin_total' ? 'bg-purple-500' : u.papel === 'admin_master' ? 'bg-indigo-500' : u.papel === 'usuario_master' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                          <PapelIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{u.nome}</p>
                        <div className="flex flex-col mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium truncate">{u.cargo}</span>
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight truncate">{u.departamento}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase whitespace-nowrap px-1.5 h-4.5 border-current ${papelColor[u.papel as keyof typeof papelColor]}`}>
                          {papelLabel[u.papel as keyof typeof papelLabel]}
                        </Badge>
                        {isSelecting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-slate-400">Acesso restrito a colaboradores autorizados do DETRAN-SP</p>
        </div>
      </div>
    </div>
  );
}
