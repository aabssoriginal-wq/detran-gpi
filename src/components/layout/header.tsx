"use client";

import { Bell, Menu, Search, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, papelLabel, papelColor } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, UserPlus, LogOut } from "lucide-react";

export default function Header() {
  const { usuario, logout, isImpersonating, impersonate, stopImpersonating, originalUsuario } = useAuth();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const isAdminTotal = usuario?.papel === "admin_total";

  useEffect(() => {
    if (isSwitchModalOpen && isAdminTotal) {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => setAvailableUsers(data))
        .catch(err => console.error(err));
    }
  }, [isSwitchModalOpen, isAdminTotal]);

  const handleSwitchUser = (target: any) => {
    impersonate(target);
    setIsSwitchModalOpen(false);
    // Recarregar a página para garantir que todos os contextos e hooks de busca sejam resetados
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-20">
      {isImpersonating && (
        <div className="bg-amber-500 text-white py-1.5 px-6 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            MODO DE TESTE: Visualizando como {usuario?.nome} (Original: {originalUsuario?.nome})
          </div>
          <button 
            onClick={stopImpersonating}
            className="bg-white text-amber-600 px-3 py-1 rounded-full hover:bg-amber-50 transition-colors shadow-sm text-[10px]"
          >
            Voltar ao meu Perfil
          </button>
        </div>
      )}
      <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
        <div className="hidden md:flex items-center relative">
          <Search className="h-4 w-4 absolute left-3 text-slate-400" />
          <Input 
            placeholder="Buscar projetos..." 
            className="pl-9 w-64 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus-visible:ring-indigo-500 h-9" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          <span className="sr-only">Notificações</span>
        </Button>

        {usuario && (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <Avatar className="h-9 w-9">
                <AvatarImage src={usuario.avatar} alt={usuario.nome} />
                <AvatarFallback>{usuario.nome.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{usuario.nome}</p>
                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                      {usuario.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Configurações
                </DropdownMenuItem>
                {isAdminTotal && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setIsSwitchModalOpen(true)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Trocar Usuário (Teste)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </header>

      {/* Modal de Troca de Usuário (Impersonate) */}
      <Dialog open={isSwitchModalOpen} onOpenChange={setIsSwitchModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-xl font-bold">Modo Impersonar</DialogTitle>
            <DialogDescription>
              Selecione um perfil para visualizar o sistema com as permissões daquele usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSwitchUser(u)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group text-left"
              >
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback>{u.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{u.nome}</p>
                  <p className="text-[11px] text-slate-500 truncate">{u.cargo}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={`text-[9px] uppercase px-1.5 h-4.5 border-current ${papelColor[u.papel as keyof typeof papelColor]}`}>
                    {papelLabel[u.papel as keyof typeof papelLabel]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
