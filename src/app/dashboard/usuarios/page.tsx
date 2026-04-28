"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth, papelLabel, papelColor, type Papel } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, Crown, Shield, User as UserIcon, Loader2, ShieldAlert,
  UserCog, UserPlus, Trash2, Search, Mail, Building2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PAPEIS: { value: Papel; label: string; icon: any; color: string }[] = [
  { value: 'admin_total', label: 'Admin Total', icon: Crown, color: 'text-purple-600' },
  { value: 'admin_master', label: 'Admin Master', icon: Shield, color: 'text-indigo-600' },
  { value: 'usuario_master', label: 'Usuário Master', icon: Shield, color: 'text-blue-600' },
  { value: 'usuario', label: 'Usuário', icon: UserIcon, color: 'text-emerald-600' },
];

const PAPEL_ICONS = {
  admin_total: Crown,
  admin_master: Shield,
  usuario_master: Shield,
  usuario: UserIcon,
};

const novoUsuarioDefault = { nome: '', email: '', cargo: '', departamento: '', papel: 'usuario' as Papel };

export default function UsuariosPage() {
  const { usuario, impersonate, isImpersonating } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog de novo usuário
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState(novoUsuarioDefault);
  const [savingUser, setSavingUser] = useState(false);

  // Delete em progresso
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = () => {
    if (!usuario) return;
    fetch(`/api/users?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`)
      .then(r => r.json())
      .then(u => {
        setUsers(Array.isArray(u) ? u : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const canManageRoles = usuario?.papel === 'admin_total' || usuario?.papel === 'admin_master';
  const canManageUsers = usuario?.papel === 'admin_total' || usuario?.papel === 'admin_master' || usuario?.papel === 'usuario_master';
  const canAssignProjects = usuario?.papel === 'admin_total' || usuario?.papel === 'admin_master' || usuario?.papel === 'usuario_master';
  // Reabilitado apenas para admin_total nesta fase de preparação Azure DEV
  const canImpersonate = usuario?.papel === 'admin_total' && !isImpersonating;

  // Lista filtrada por departamento (base para os cards e para a busca)
  const departmentUsers = useMemo(() => {
    let list = users;
    // Admin Master e Usuário Master veem apenas usuários do seu departamento
    if (usuario?.papel !== 'admin_total') {
      list = list.filter(u => u.departamento === usuario?.departamento);
    }
    return list;
  }, [users, usuario]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return departmentUsers;
    const q = search.toLowerCase();
    return departmentUsers.filter(u =>
      u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [departmentUsers, search]);

  const handleImpersonate = (target: any) => {
    setImpersonatingId(target.id);
    setTimeout(() => {
      impersonate({ 
        id: target.id, 
        nome: target.nome, 
        email: target.email, 
        cargo: target.cargo, 
        avatar: target.avatar, 
        papel: target.papel, 
        departamento: target.departamento,
        projetosAtribuidos: target.projetosAtribuidos 
      });
      toast.success(`Visualizando como ${target.nome}.`);
      router.push('/dashboard');
      setImpersonatingId(null);
    }, 500);
  };

  const handleChangePapel = async (userId: string, novoPapel: Papel) => {
    if (userId === usuario?.id) { toast.error("Você não pode alterar seu próprio papel."); return; }
    
    // Regra Hierárquica: Não pode alterar alguém de nível superior ou igual ao seu (exceto Admin Total)
    const hierarchy = { 'admin_total': 4, 'admin_master': 3, 'usuario_master': 2, 'usuario': 1 };
    const myLevel = hierarchy[usuario?.papel as Papel] || 0;
    
    const targetUser = users.find(u => u.id === userId);
    const currentTargetLevel = hierarchy[targetUser?.papel as Papel] || 0;
    const targetLevel = hierarchy[novoPapel] || 0;
    
    if (myLevel < 4) {
      if (currentTargetLevel >= myLevel) {
        toast.error("Você não tem permissão para alterar um usuário de nível igual ou superior.");
        return;
      }
      if (targetLevel > myLevel) {
        toast.error("Você não tem permissão para atribuir um papel superior ao seu.");
        return;
      }
    }
    setEditingId(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userId, 
          action: 'update_papel', 
          papel: novoPapel,
          requesterPapel: usuario?.papel
        }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, papel: novoPapel } : u));
        toast.success(`Papel atualizado para ${papelLabel[novoPapel]}.`);
      }
    } catch { toast.error("Falha ao atualizar papel."); }
    setEditingId(null);
  };

  const handleAddUsuario = async () => {
    // Forçar departamento se não for Admin Total
    const finalDepto = usuario?.papel === 'admin_total' ? novoUsuario.departamento : usuario?.departamento;
    
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.cargo || !finalDepto) {
      toast.error("Preencha todos os campos.");
      return;
    }

    const payload = { ...novoUsuario, departamento: finalDepto };

    setSavingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => [...prev, data]);
      setNovoUsuario(novoUsuarioDefault);
      setDialogOpen(false);
      toast.success(`Usuário ${data.nome} adicionado ao sistema.`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar usuário.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleRemoveUsuario = async (userId: string, nome: string) => {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erro ao remover usuário.");
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`${nome} foi removido do sistema.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!canAssignProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-500" />
            Painel de Usuários
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie colaboradores, papéis e atribuições do sistema GPI.
          </p>
        </div>

        {canManageUsers && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm">
                <UserPlus className="h-4 w-4" />
                Adicionar Usuário
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Adicionar Colaborador
                </DialogTitle>
                <DialogDescription>
                  Pesquise um colaborador da rede corporativa DETRAN-SP por nome ou e-mail e inclua-o no sistema GPI.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> Nome Completo</Label>
                  <Input
                    placeholder="Ex: João da Silva"
                    value={novoUsuario.nome}
                    onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> E-mail Corporativo</Label>
                  <Input
                    placeholder="joao.silva@detran.sp.gov.br"
                    type="email"
                    value={novoUsuario.email}
                    onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Cargo</Label>
                  <Input
                    placeholder="Ex: Analista de Sistemas"
                    value={novoUsuario.cargo}
                    onChange={e => setNovoUsuario({ ...novoUsuario, cargo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Departamento (Diretoria)</Label>
                  {usuario?.papel === 'admin_total' ? (
                    <Select value={novoUsuario.departamento} onValueChange={val => setNovoUsuario({ ...novoUsuario, departamento: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a Diretoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diretoria de Tecnologia da Informação">TI</SelectItem>
                        <SelectItem value="Diretoria de Fiscalização de Trânsito">Fiscalização</SelectItem>
                        <SelectItem value="Diretoria de Veículos Automotores">Veículos</SelectItem>
                        <SelectItem value="Diretoria Administrativa">Administrativa</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-500 font-medium">
                      {usuario?.departamento}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select value={novoUsuario.papel} onValueChange={val => setNovoUsuario({ ...novoUsuario, papel: val as Papel })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPEIS.filter(p => {
                        if (usuario?.papel === 'admin_total') return true;
                        if (usuario?.papel === 'admin_master') return p.value !== 'admin_total';
                        if (usuario?.papel === 'usuario_master') return p.value === 'usuario';
                        return false;
                      }).map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleAddUsuario}
                  disabled={savingUser}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  {savingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Adicionar
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 grid-cols-3">
        {PAPEIS.map(p => {
          const Icon = p.icon;
          const count = departmentUsers.filter(u => u.papel === p.value).length;
          return (
            <Card key={p.value} className="shadow-sm">
              <CardContent className="pt-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{count}</p>
                  <p className="text-xs text-slate-500">{p.label}{count !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.length === 0 && (
            <p className="text-center text-slate-400 py-10">Nenhum colaborador encontrado.</p>
          )}
          {filteredUsers.map(u => {
            const PapelIcon = PAPEL_ICONS[u.papel as keyof typeof PAPEL_ICONS] || UserIcon;
            const isSelf = u.id === usuario?.id;
            const isEditing = editingId === u.id;
            const isDeleting = deletingId === u.id;

            return (
              <Card key={u.id} className={`shadow-sm transition-all ${isSelf ? 'border-blue-300 dark:border-blue-700' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 border-2 border-slate-200 dark:border-slate-700">
                          <AvatarImage src={u.avatar} alt={u.nome} />
                          <AvatarFallback>{u.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${u.papel === 'admin_total' ? 'bg-purple-500' : u.papel === 'admin_master' ? 'bg-indigo-500' : u.papel === 'usuario_master' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                          <PapelIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{u.nome}</p>
                          {isSelf && <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 shrink-0">Você</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{u.departamento}</p>
                        <p className="text-xs text-slate-400">{u.cargo}</p>
                      </div>
                    </div>

                    {/* Botão Impersonar */}
                    {canImpersonate && !isSelf && (
                      <div className="shrink-0">
                        <button
                          onClick={() => handleImpersonate(u)}
                          disabled={!!impersonatingId}
                          title={`Visualizar sistema como ${u.nome}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 transition-all disabled:opacity-50"
                        >
                          {impersonatingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCog className="h-3.5 w-3.5" />}
                          Impersonar
                        </button>
                      </div>
                    )}

                    {/* Papel */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <p className="text-xs text-slate-400 font-medium">Papel</p>
                      {(() => {
                        const hierarchy = { 'admin_total': 4, 'admin_master': 3, 'usuario_master': 2, 'usuario': 1 };
                        const myLevel = hierarchy[usuario?.papel as Papel] || 0;
                        const targetLevel = hierarchy[u.papel as Papel] || 0;
                        
                        const canEditThisUser = !isSelf && (myLevel === 4 || myLevel > targetLevel);

                        if (canManageRoles && canEditThisUser) {
                          return (
                            <div className="flex gap-1">
                              {PAPEIS.filter(p => {
                                const pLevel = hierarchy[p.value] || 0;
                                if (myLevel === 4) return true;
                                return pLevel <= myLevel && p.value !== 'admin_total';
                              }).map(p => {
                                const Icon = p.icon;
                                const active = u.papel === p.value;
                                return (
                                  <button
                                    key={p.value}
                                    onClick={() => handleChangePapel(u.id, p.value)}
                                    disabled={isEditing}
                                    title={p.label}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all ${active ? papelColor[p.value] + ' border-current' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {p.label}
                                  </button>
                                );
                              })}
                              {isEditing && <Loader2 className="h-4 w-4 animate-spin text-blue-500 self-center ml-1" />}
                            </div>
                          );
                        }
                        return (
                          <Badge variant="outline" className={`text-xs ${papelColor[u.papel as keyof typeof papelColor]}`}>
                            <PapelIcon className="h-3 w-3 mr-1" />
                            {papelLabel[u.papel as keyof typeof papelLabel]}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Botão Remover */}
                    {canManageUsers && !isSelf && (() => {
                      const myPapel = usuario?.papel;
                      const targetPapel = u.papel;
                      let allowed = false;

                      if (myPapel === 'admin_total') allowed = true;
                      else if (myPapel === 'admin_master') allowed = targetPapel !== 'admin_total';
                      else if (myPapel === 'usuario_master') allowed = targetPapel === 'usuario';

                      if (!allowed) return null;

                      return (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={isDeleting}
                              title="Remover usuário do sistema"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 transition-all disabled:opacity-50 shrink-0"
                            >
                              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              Remover
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover {u.nome}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Este colaborador será <strong>removido de todos os projetos</strong> e sua conta será excluída do sistema GPI. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                                onClick={() => handleRemoveUsuario(u.id, u.nome)}
                              >
                                Sim, remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
