"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, BotMessageSquare, Settings, Users, Crown, Shield, LayoutList, History, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuth();

  const papel = usuario?.papel;
  const isAdmin = papel === 'admin_total' || papel === 'admin_master';
  const isMaster = isAdmin || papel === 'usuario_master';
  const canSeeUsers = isMaster;
  const canSeeIA = isMaster;

  const navItems = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Projetos", href: "/dashboard/projetos", icon: FolderKanban, show: true },
    { name: "Super Gantt", href: "/dashboard/super-gantt", icon: LayoutList, show: isMaster },
    { name: "Console IA", href: "/dashboard/ia-console", icon: BotMessageSquare, show: isMaster },
    { name: "Guia do Sistema", href: "/dashboard/guia", icon: BookOpen, show: true },
    { name: "Usuários", href: "/dashboard/usuarios", icon: Users, show: canSeeUsers },
    { name: "Auditoria Total", href: "/dashboard/auditoria", icon: History, show: isAdmin },
  ].filter(i => i.show);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <img 
          src="https://www.detran.sp.gov.br/702a783633529610cd8381ac4f5c7b5b.iix" 
          alt="Logo Detran SP" 
          className="h-7 object-contain dark:brightness-0 dark:invert" 
        />
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <span className="font-black text-lg tracking-tighter text-blue-900 dark:text-blue-400">GPI</span>
        <span className="text-[9px] font-bold text-blue-500/50 italic px-1 bg-blue-50 dark:bg-blue-900/20 rounded ml-auto">v1.1.0</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Perfil do usuário logado */}
      {usuario && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-2">
            <img src={usuario.avatar} alt={usuario.nome} className="h-8 w-8 rounded-full border border-slate-200" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{usuario.nome}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                {papel === 'admin_total' && <Crown className="h-3 w-3 text-purple-500" />}
                {papel === 'admin_master' && <Shield className="h-3 w-3 text-indigo-500" />}
                {papel === 'admin_total' ? 'Admin Total' : papel === 'admin_master' ? 'Admin Master' : papel === 'usuario_master' ? 'Usuário Master' : 'Usuário'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/config"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 transition-all duration-200"
          >
            <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Configurações
          </Link>
        </div>
      )}
    </aside>
  );
}
