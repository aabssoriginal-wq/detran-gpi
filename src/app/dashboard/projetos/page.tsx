"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ProjetosPage() {
  const { usuario } = useAuth();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para Criação de Projeto
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState({ nome: "", responsavel: "", dataInicio: "", dataFim: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [usuariosSistema, setUsuariosSistema] = useState<any[]>([]);

  const isMaster = usuario?.papel === 'usuario_master' || usuario?.papel === 'admin_master' || usuario?.papel === 'admin_total';

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
          setProjetos([]);
          setLoading(false);
          return;
        }
        let filtered = data.filter((p: any) => !p.excluido);
        // Usuário Comum vê apenas seus projetos atribuídos (dentro do seu depto)
        if (usuario.papel === 'usuario') {
          filtered = filtered.filter((p: any) => usuario.projetosAtribuidos?.includes(p.id));
        }
        setProjetos(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
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
    if (!novoProjeto.nome.trim()) return;
    if (!usuario) return;
    
    // Validação Obrigatória: Responsável deve existir no sistema
    const respValue = novoProjeto.responsavel.trim();
    const userFound = usuariosSistema.find(u => 
      u.nome.toLowerCase() === respValue.toLowerCase() || 
      u.email.toLowerCase() === respValue.toLowerCase()
    );

    if (!userFound) {
      alert("Erro: O Responsável Principal deve ser um usuário cadastrado no sistema. Por favor, selecione um da lista.");
      return;
    }

    // Normaliza para o nome oficial do usuário
    const projetoParaEnviar = {
      ...novoProjeto,
      responsavel: userFound.nome,
      departamento: usuario.departamento || "Diretoria de Tecnologia da Informação" // Fallback robusto
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
      alert("Falha na rede");
    } finally {
      setIsCreating(false);
    }
  };

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
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex gap-2">
            <Plus className="h-4 w-4" /> Nova Iniciativa
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle>Portfólio Ativo</CardTitle>
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input placeholder="Buscar projetos..." className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                <TableHead className="w-[280px]">Nome do Projeto</TableHead>
                <TableHead>Diretoria</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : projetos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                    Nenhum projeto registrado.
                  </TableCell>
                </TableRow>
              ) : (
                projetos.map((projeto) => (
                  <TableRow key={projeto.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/projetos/${projeto.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                        {projeto.nome}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        {projeto.departamento?.replace("Diretoria de ", "")}
                      </Badge>
                    </TableCell>
                    <TableCell>{projeto.responsavel || "Não Definido"}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatarDataDisplay(projeto.baselineData?.fim)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        projeto.status === "concluído" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" :
                        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400"
                      }>
                        {projeto.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{projeto.progress}%</TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href={`/dashboard/projetos/${projeto.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
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

