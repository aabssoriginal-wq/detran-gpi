"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { 
  FolderKanban, Plus, Search, Filter, Trash2, 
  RefreshCcw, AlertTriangle, Loader2, Star 
} from "lucide-react";

export default function ProjetosPage() {
  const { usuario } = useAuth();
  const [projetosRaw, setProjetosRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("ativos");
  
  // Estado para Criação de Projeto
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState({ nome: "", responsavel: "", dataInicio: "", dataFim: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [usuariosSistema, setUsuariosSistema] = useState<any[]>([]);

  const isMaster = usuario?.papel === 'usuario_master' || usuario?.papel === 'admin_master' || usuario?.papel === 'admin_total';
  const isAdmin = usuario?.papel === 'admin_master' || usuario?.papel === 'admin_total';

  const formatarDataDisplay = (dataIso?: string) => {
    if (!dataIso || dataIso === "") return "";
    const [year, month, day] = dataIso.split("-");
    if (!day || !month || !year) return "";
    return `${day}/${month}/${year}`;
  };

  const loadProjetos = () => {
    if (!usuario) return;
    setLoading(true);
    fetch(`/api/projects?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setProjetosRaw([]);
          setLoading(false);
          return;
        }
        setProjetosRaw(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handlePermanentDelete = async (id: number, nome: string) => {
    if (!window.confirm(`ATENÇÃO: Deseja excluir PERMANENTEMENTE o projeto "${nome}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'permanently_delete', 
          user: usuario?.nome,
          papel: usuario?.papel
        })
      });
      if (res.ok) {
        toast.success("Projeto excluído permanentemente!");
        loadProjetos();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao excluir permanentemente.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    }
  };

  const handleRestore = async (id: number) => {
    const just = window.prompt("Justifique a restauração do projeto:");
    if (!just) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'restore', 
          justificativa: just,
          user: usuario?.nome,
          papel: usuario?.papel
        })
      });
      if (res.ok) {
        toast.success("Projeto restaurado!");
        loadProjetos();
      }
    } catch (e) {
      toast.error("Erro ao restaurar projeto.");
    }
  };

  const loadUsuarios = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsuariosSistema(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadProjetos();
    loadUsuarios();
  }, [usuario]);

  const handleCreate = async () => {
    if (!novoProjeto.nome.trim()) {
      alert("O nome do projeto é obrigatório.");
      return;
    }
    if (!usuario) return;
    
    const respValue = novoProjeto.responsavel.trim();
    const userFound = usuariosSistema.find(u => 
      u.nome.toLowerCase() === respValue.toLowerCase() || 
      u.email.toLowerCase() === respValue.toLowerCase()
    );

    if (!userFound) {
      alert("Erro: O Responsável Principal deve ser selecionado da lista de usuários cadastrados.");
      return;
    }

    const projetoParaEnviar = {
      ...novoProjeto,
      responsavel: userFound.nome,
      departamento: userFound.departamento
    };

    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projetoParaEnviar)
      });
      if (res.ok) {
        setIsCreateDialogOpen(false);
        setNovoProjeto({ nome: "", responsavel: "", dataInicio: "", dataFim: "" });
        loadProjetos();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar projeto");
      }
    } catch (e) {
      alert("Falha na rede ou comunicação com o servidor.");
    } finally {
      setIsCreating(false);
    }
  };

  const filtrarProjetos = (excluidos: boolean) => {
    let filtered = projetosRaw.filter((p: any) => !!p.excluido === excluidos);
    if (usuario?.papel === 'usuario') {
      const nomeNormalizado = usuario.nome.trim().toLowerCase();
      filtered = filtered.filter((p: any) => 
        (usuario.projetosAtribuidos?.some((pid: any) => String(pid) === String(p.id))) ||
        (p.responsavel && p.responsavel.trim().toLowerCase() === nomeNormalizado)
      );
    }
    return filtered;
  };

  const ativos = filtrarProjetos(false);
  const excluidos = filtrarProjetos(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-blue-500" />
            Gestão de Projetos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Acesse as baselines, gráficos de Gantt e justifique atrasos.
          </p>
        </div>
        {isMaster && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex gap-2 shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Nova Iniciativa
          </Button>
        )}
      </div>

      <Tabs defaultValue="ativos" onValueChange={setAbaAtiva} className="w-full">
        <div className="flex justify-between items-end mb-4">
          <TabsList className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-1">
            <TabsTrigger value="ativos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
              Ativos ({ativos.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="excluidos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                Lixeira ({excluidos.length})
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder="Buscar..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="ativos" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    {isMaster && <TableHead className="text-center w-[60px]">Fav</TableHead>}
                    <TableHead className="w-[280px]">Nome do Projeto</TableHead>
                    <TableHead>Diretoria</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Início</TableHead>
                    <TableHead className="text-center">Fim</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center h-32"><Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" /></TableCell></TableRow>
                  ) : ativos.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center h-32 text-slate-500">Nenhum projeto ativo.</TableCell></TableRow>
                  ) : (
                    ativos.map((projeto) => (
                      <TableRow key={projeto.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        {isMaster && (
                          <TableCell className="text-center">
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                const res = await fetch(`/api/projects/${projeto.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'toggle_favorite', user: usuario?.nome })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setProjetosRaw(prev => prev.map((p: any) => p.id === updated.id ? { ...p, favoritos: updated.favoritos } : p));
                                }
                              }}
                              className={`p-1 rounded-full transition-all ${projeto.favoritos?.includes(usuario?.nome) ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                            >
                              <Star className={`h-4 w-4 ${projeto.favoritos?.includes(usuario?.nome) ? 'fill-current' : ''}`} />
                            </button>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/projetos/${projeto.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                            {projeto.nome}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            {projeto.departamento?.replace("Diretoria de ", "")}
                          </Badge>
                        </TableCell>
                        <TableCell>{projeto.responsavel}</TableCell>
                        <TableCell className="text-center text-xs text-slate-500">{formatarDataDisplay(projeto.baselineData?.inicio)}</TableCell>
                        <TableCell className="text-center text-xs text-slate-500">{formatarDataDisplay(projeto.baselineData?.fim)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400">
                            {projeto.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{projeto.progress}%</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/projetos/${projeto.id}`} className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            Detalhes
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="excluidos" className="mt-0">
            <Card className="border-rose-100 dark:border-rose-900/30">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-rose-50/50 dark:bg-rose-950/20">
                    <TableRow>
                      <TableHead className="w-[280px]">Nome do Projeto</TableHead>
                      <TableHead>Diretoria</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-center">Excluído por</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-32"><Loader2 className="h-6 w-6 animate-spin text-rose-500 mx-auto" /></TableCell></TableRow>
                    ) : excluidos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-32 text-slate-500">Lixeira vazia.</TableCell></TableRow>
                    ) : (
                      excluidos.map((projeto) => {
                        const lastLog = [...(projeto.logs || [])].find(l => l.acao === "Excluído");
                        return (
                          <TableRow key={projeto.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10">
                            <TableCell className="font-medium text-slate-500 italic line-through">
                              {projeto.nome}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs">
                              {projeto.departamento?.replace("Diretoria de ", "")}
                            </TableCell>
                            <TableCell className="text-slate-400">{projeto.responsavel}</TableCell>
                            <TableCell className="text-center text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-rose-600">{lastLog?.user || "Sincronização"}</span>
                                <span className="text-slate-400">{lastLog?.data}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                          onClick={() => handleRestore(projeto.id)}
                                        >
                                          <RefreshCcw className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                    <TooltipContent>Restaurar Projeto</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {isAdmin && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                            onClick={() => handlePermanentDelete(projeto.id, projeto.nome)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        }
                                      />
                                      <TooltipContent>Excluir Permanentemente</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Criação de Projeto */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Iniciativa</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos para iniciar o novo projeto no portfólio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Projeto</Label>
              <Input 
                id="nome" 
                placeholder="Ex: Migração de Dados" 
                value={novoProjeto.nome}
                onChange={e => setNovoProjeto({...novoProjeto, nome: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="depto">Departamento (Diretoria)</Label>
              <Input 
                id="depto" 
                value={usuario?.departamento || "Diretoria de Tecnologia da Informação"} 
                disabled
                className="bg-slate-50 text-slate-500"
              />
              <p className="text-[10px] text-slate-400">O projeto será vinculado à sua diretoria atual.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resp">Responsável Principal</Label>
              <div className="relative">
                <Input 
                  id="resp" 
                  list="usuarios-sugeridos"
                  placeholder="Selecione o gestor..." 
                  value={novoProjeto.responsavel}
                  onChange={e => setNovoProjeto({...novoProjeto, responsavel: e.target.value})}
                />
                <datalist id="usuarios-sugeridos">
                  {usuariosSistema.map(u => (
                    <option key={u.id} value={u.nome}>{u.email} ({u.departamento})</option>
                  ))}
                </datalist>
              </div>
              <p className="text-[10px] text-slate-500 italic">O responsável deve ser um usuário cadastrado.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dIni">Início (Opcional)</Label>
                <Input 
                  id="dIni" 
                  type="date"
                  value={novoProjeto.dataInicio}
                  onChange={e => setNovoProjeto({...novoProjeto, dataInicio: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dFim">Fim (Opcional)</Label>
                <Input 
                  id="dFim" 
                  type="date"
                  value={novoProjeto.dataFim}
                  onChange={e => setNovoProjeto({...novoProjeto, dataFim: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !novoProjeto.nome}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Iniciativa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

