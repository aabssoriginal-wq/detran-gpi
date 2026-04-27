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
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { usuario, logout, isImpersonating, stopImpersonating, originalUsuario } = useAuth();

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
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </header>
    </div>
  );
}
